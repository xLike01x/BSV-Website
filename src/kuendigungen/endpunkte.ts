import type { Endpoint, Payload, PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { istMitgliedOderMehr } from '@/access/roles'
import { emailAktiv, mailHtml, mailSenden } from '@/auth/mail'
import { ratenGrenze } from '@/hooks/spamSchutz'
import { istGueltig } from '@/mitgliedschaften/Mitgliedschaften'
import {
  fehlerAntwort,
  idAus,
  jsonVon,
  nurJson,
  posteingangAendern,
  posteingangVermerken,
} from '@/posteingang/endpunkte'
import { rollenBenachrichtigen } from '@/sport/teamMail'
import { berlinDatum, deutschesDatum, tagAlsIso } from '@/utilities/berlinDatum'

import { kuendigungBearbeiter } from './Kuendigungsdokumente'
import { quartalsende } from './quartal'
import {
  type KuendigungEntscheidung,
  type KuendigungStatus,
  OFFEN_ODER_GUELTIG,
  STATUS_LABEL,
} from './texte'

export const MAX_DATEI = 10 * 1024 * 1024
const MAX_GRUND = 500
/** Muss jede Anfrage aus dem Mitgliederbereich mitschicken – fremde Websites können ihn ohne Rückfrage des Browsers nicht setzen */
export const KOPF = 'x-bsv-kuendigung'

type Mitgliedschaft = {
  id: number
  vorname: string
  nachname: string
  mitgliedsnummer?: string | null
  art?: string | null
  geburtsdatum?: string | null
  konto?: number | { id: number } | null
  aktiv?: boolean | null
  austritt?: string | null
  deletedAt?: string | null
}
const idVon = (v: unknown) =>
  v && typeof v === 'object' ? ((v as { id?: number }).id ?? null) : ((v as number | null) ?? null)
const name = (m: Mitgliedschaft) => `${m.vorname} ${m.nachname}`.trim()

/** Dateiart am Inhalt erkennen (nicht an Endung oder Angabe des Browsers) */
export function dateiart(
  b: Buffer,
): 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length < 12) return null
  if (b.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return 'image/webp'
  return null
}
const ENDUNG: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Mitgliedschaften, die mit diesem Konto verknüpft sind, noch gültig sind und keine laufende Kündigung haben */
export async function kuendbare(payload: Payload, kontoId: number) {
  const r = await payload.find({
    collection: 'mitgliedschaften',
    where: { konto: { equals: kontoId } },
    limit: 30,
    depth: 0,
    sort: 'eintritt',
    overrideAccess: true,
  })
  const docs = (r.docs as unknown as Mitgliedschaft[]).filter((m) => !m.deletedAt && istGueltig(m))
  if (!docs.length) return { kuendbar: [] as Mitgliedschaft[], gekuendigt: new Set<number>() }
  const laufend = await payload.find({
    collection: 'kuendigungen',
    where: {
      and: [
        { mitgliedschaften: { in: docs.map((d) => d.id) } },
        { status: { in: OFFEN_ODER_GUELTIG } },
      ],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
    select: { mitgliedschaften: true },
  })
  const gekuendigt = new Set<number>(
    laufend.docs.flatMap((k) =>
      ((k as { mitgliedschaften?: unknown[] }).mitgliedschaften ?? [])
        .map(idVon)
        .filter((x): x is number => typeof x === 'number'),
    ),
  )
  return { kuendbar: docs.filter((d) => !gekuendigt.has(d.id) && !d.austritt), gekuendigt }
}

/** Läuft für dieses Konto schon eine Einreichung? (Doppelklick / zwei Tabs – die Website läuft als eine Instanz) */
const laufend = new Set<number>()

const antwort = (daten: unknown, status = 200) =>
  Response.json(daten, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * POST /api/kuendigungen/einreichen (multipart): unterschriebenes Kündigungsschreiben hochladen.
 * Prüft: angemeldet und freigeschaltet, Mitgliedschaften gehören zum Konto, keine laufende Kündigung,
 * Datei ist wirklich PDF/JPG/PNG/WebP und höchstens 10 MB. Das Wirksamkeitsdatum rechnet der Server aus.
 */
const einreichen: Endpoint = {
  path: '/einreichen',
  method: 'post',
  handler: async (req) => {
    const user = req.user as {
      id: number
      email?: string
      name?: string | null
      _zweiFaktorOffen?: boolean
    } | null
    if (!user) return antwort({ fehler: 'Bitte anmelden.' }, 401)
    if (user._zweiFaktorOffen || !istMitgliedOderMehr(user))
      return antwort({ fehler: 'Dein Konto ist noch nicht freigeschaltet.' }, 403)
    if (req.headers.get(KOPF) !== '1') return antwort({ fehler: 'Ungültige Anfrage.' }, 400)
    if (
      !String(req.headers.get('content-type') ?? '')
        .toLowerCase()
        .startsWith('multipart/form-data')
    )
      return antwort({ fehler: 'Ungültige Anfrage.' }, 415)
    if (Number(req.headers.get('content-length') || 0) > MAX_DATEI + 64 * 1024)
      return antwort({ fehler: 'Die Datei ist zu groß (höchstens 10 MB).' }, 413)
    try {
      ratenGrenze(req, 'kuendigung', 10, 200)
    } catch {
      return antwort({ fehler: 'Zu viele Versuche – bitte später noch einmal.' }, 429)
    }
    try {
      await addDataAndFileToRequest(req)
    } catch {
      return antwort({ fehler: 'Die Datei konnte nicht gelesen werden.' }, 400)
    }
    const daten = (req.data ?? {}) as {
      mitgliedschaften?: unknown
      grund?: unknown
      unterschrieben?: unknown
    }
    const datei = req.file as { data?: Buffer; size?: number; name?: string } | undefined
    if (daten.unterschrieben !== true)
      return antwort(
        { fehler: 'Bitte bestätige, dass das Kündigungsschreiben unterschrieben ist.' },
        400,
      )
    const ids = Array.isArray(daten.mitgliedschaften)
      ? [...new Set(daten.mitgliedschaften.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
      : []
    if (!ids.length || ids.length > 20)
      return antwort({ fehler: 'Bitte auswählen, welche Mitgliedschaft du kündigst.' }, 400)
    const grund = typeof daten.grund === 'string' ? daten.grund.trim() : ''
    if (grund.length > MAX_GRUND)
      return antwort({ fehler: 'Der Grund ist zu lang (höchstens 500 Zeichen).' }, 400)
    if (!datei?.data || !datei.size)
      return antwort({ fehler: 'Bitte das unterschriebene Kündigungsschreiben hochladen.' }, 400)
    if (datei.size > MAX_DATEI || datei.data.length > MAX_DATEI)
      return antwort({ fehler: 'Die Datei ist zu groß (höchstens 10 MB).' }, 413)
    const art = dateiart(datei.data)
    if (!art)
      return antwort({ fehler: 'Bitte ein Foto (JPG, PNG, WebP) oder ein PDF hochladen.' }, 400)

    if (laufend.has(user.id))
      return antwort(
        { fehler: 'Deine Kündigung wird gerade gespeichert – bitte einen Moment warten.' },
        409,
      )
    laufend.add(user.id)
    try {
      return await speichern(req, user, ids, grund, datei.data, art)
    } finally {
      laufend.delete(user.id)
    }
  },
}

async function speichern(
  req: PayloadRequest,
  user: { id: number; email?: string; name?: string | null },
  ids: number[],
  grund: string,
  inhalt: Buffer,
  art: NonNullable<ReturnType<typeof dateiart>>,
) {
  const { kuendbar, gekuendigt } = await kuendbare(req.payload, user.id)
  if (ids.some((id) => gekuendigt.has(id)))
    return antwort({ fehler: 'Für diese Mitgliedschaft liegt schon eine Kündigung vor.' }, 409)
  const gewaehlt = ids.map((id) => kuendbar.find((m) => m.id === id))
  // Fremde, unbekannte oder schon beendete Mitgliedschaften: gleiche Antwort (nichts verraten)
  if (gewaehlt.some((m) => !m))
    return antwort({ fehler: 'Diese Mitgliedschaft kannst du nicht kündigen.' }, 403)
  const personen = gewaehlt as Mitgliedschaft[]

  const jetzt = new Date()
  const wirksam = quartalsende(jetzt)
  let dokumentId: number | null = null
  try {
    const dok = await req.payload.create({
      collection: 'kuendigungsdokumente',
      data: { hochgeladenVon: user.id },
      file: {
        data: inhalt,
        mimetype: art,
        name: `kuendigung-${berlinDatum(jetzt)}.${ENDUNG[art]}`,
        size: inhalt.length,
      },
      overrideAccess: true,
      req,
    })
    dokumentId = dok.id as number
    const k = await req.payload.create({
      collection: 'kuendigungen',
      data: {
        status: 'neu',
        mitgliedschaften: personen.map((p) => p.id),
        namen: personen
          .map((p) => `${name(p)}${p.mitgliedsnummer ? ` (Nr. ${p.mitgliedsnummer})` : ''}`)
          .join(', '),
        konto: user.id,
        vorname: (user.name ?? '').split(' ')[0] || null,
        email: user.email ?? '',
        eingangAm: jetzt.toISOString(),
        wirksamZum: tagAlsIso(wirksam),
        grund: grund || null,
        dokument: dokumentId,
      } as never,
      overrideAccess: true,
      req,
    })
    await eingangMelden(req, {
      an: user.email ?? '',
      vorname: (user.name ?? '').split(' ')[0] || '',
      namen: personen.map(name),
      wirksam,
      id: k.id as number,
    })
    return antwort({ ok: true, wirksamZum: wirksam })
  } catch (e) {
    // Nichts halb Fertiges liegen lassen
    if (dokumentId)
      await req.payload
        .delete({ collection: 'kuendigungsdokumente', id: dokumentId, overrideAccess: true, req })
        .catch(() => null)
    req.payload.logger.error({ err: e }, 'Kündigung einreichen fehlgeschlagen')
    return antwort({ fehler: 'Das hat nicht geklappt. Bitte noch einmal versuchen.' }, 500)
  }
}

/** Eingangsbestätigung an das Mitglied und kurze Nachricht an die Kasse (ohne Namen – die stehen nur in der Verwaltung) */
async function eingangMelden(
  req: PayloadRequest,
  k: { an: string; vorname: string; namen: string[]; wirksam: string; id: number },
) {
  const datum = deutschesDatum(k.wirksam)
  if (k.an) {
    const absaetze = [
      `wir haben deine Kündigung für ${k.namen.join(', ')} erhalten (Eingang: ${deutschesDatum(berlinDatum(new Date()))}).`,
      `Laut Satzung wirkt sie zum Ende des Quartals – also zum ${datum}. Die Kasse prüft das Schreiben; danach bekommst du eine Bestätigung.`,
      'Den Stand siehst du jederzeit im Mitgliederbereich unter „Mein BSV“.',
    ]
    await mailSenden(req.payload, {
      an: k.an,
      betreff: 'Deine Kündigung ist eingegangen',
      text: `Hallo ${k.vorname},\n\n${absaetze.join('\n\n')}\n\nSportliche Grüße\nBSV 1919 e.V.`,
      html: mailHtml({ titel: `Hallo ${k.vorname},`, absaetze }),
    }).catch((e) =>
      req.payload.logger.error({ err: e }, 'Eingangsbestätigung Kündigung fehlgeschlagen'),
    )
  }
  await rollenBenachrichtigen(req, {
    rollen: ['kasse'],
    betreff: 'Neue Kündigung über die Website',
    titel: 'Neue Kündigung',
    absaetze: [
      `Über den Mitgliederbereich ist eine Kündigung eingegangen (wirksam zum ${datum}).`,
      'Das unterschriebene Schreiben findest du in der Verwaltung unter Posteingang → Kündigungen. Dort bestätigst du sie mit einem Klick.',
    ],
    pfad: `/admin/collections/kuendigungen/${k.id}`,
    grund: 'du die Rolle „Kasse“ hast',
  }).catch((e) =>
    req.payload.logger.error({ err: e }, 'Benachrichtigung neue Kündigung fehlgeschlagen'),
  )
}

/** POST /api/kuendigungen/:id/zurueckziehen – nur die eigene Kündigung und nur, solange sie noch nicht bearbeitet ist */
const zurueckziehen: Endpoint = {
  path: '/:id/zurueckziehen',
  method: 'post',
  handler: async (req) => {
    const user = req.user as { id: number } | null
    if (!user) return antwort({ fehler: 'Bitte anmelden.' }, 401)
    if (req.headers.get(KOPF) !== '1') return antwort({ fehler: 'Ungültige Anfrage.' }, 400)
    const id = idAus(req)
    const k = id
      ? ((await req.payload
          .findByID({ collection: 'kuendigungen', id, depth: 0, overrideAccess: true, req })
          .catch(() => null)) as { konto?: unknown; status?: KuendigungStatus } | null)
      : null
    if (!k || idVon(k.konto) !== user.id)
      return antwort({ fehler: 'Diese Kündigung gibt es nicht.' }, 404)
    if (k.status !== 'neu')
      return antwort(
        { fehler: 'Die Kündigung wird schon bearbeitet. Bitte wende dich an die Kasse.' },
        409,
      )
    await req.payload.update({
      collection: 'kuendigungen',
      id: id!,
      // Der Verlauf-Eintrag „Status: Eingegangen → Zurückgezogen“ (mit Namen des Kontos) entsteht automatisch
      data: { status: 'zurueckgezogen' } as never,
      overrideAccess: true,
      req,
    })
    return antwort({ ok: true })
  },
}

/** Erlaubte Übergänge: Bestätigt ist endgültig (nur noch „Im DFBnet ausgetragen“) */
const ERLAUBT: Record<KuendigungStatus, KuendigungEntscheidung[]> = {
  neu: ['bestaetigt', 'rueckfrage', 'abgelehnt'],
  rueckfrage: ['bestaetigt', 'rueckfrage', 'abgelehnt'],
  bestaetigt: ['erledigt'],
  erledigt: [],
  abgelehnt: [],
  zurueckgezogen: [],
}

/** Mitgliedschaften zum Quartalsende beenden: „Gültig bis“ setzen; ist der Tag schon vorbei, gleich „nicht gültig“ */
export async function austrittVormerken(
  payload: Payload,
  k: { mitgliedschaften?: unknown[]; wirksamZum?: string | null },
  req?: PayloadRequest,
) {
  const wirksam = berlinDatum(String(k.wirksamZum))
  const vorbei = wirksam < berlinDatum(new Date())
  for (const mid of (k.mitgliedschaften ?? [])
    .map(idVon)
    .filter((x): x is number => typeof x === 'number')) {
    await payload.update({
      collection: 'mitgliedschaften',
      id: mid,
      data: { austritt: tagAlsIso(wirksam), ...(vorbei ? { aktiv: false } : {}) } as never,
      overrideAccess: true,
      req,
    })
  }
  return vorbei
}

/** POST /api/kuendigungen/:id/entscheidung – Kasse: bestätigen, nachfragen, ablehnen oder „Im DFBnet ausgetragen“ */
const entscheidung: Endpoint = {
  path: '/:id/entscheidung',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return antwort({ fehler: 'Bitte anmelden.' }, 401)
    if (!kuendigungBearbeiter(req.user))
      return antwort({ fehler: 'Diesen Eintrag darfst du nicht bearbeiten.' }, 403)
    const id = idAus(req)
    if (!id) return antwort({ fehler: 'Kündigung nicht gefunden.' }, 404)
    const body = await jsonVon<{
      status?: unknown
      mail?: { betreff?: unknown; text?: unknown } | null
    }>(req)
    if (!body) return nurJson()
    const status = (['bestaetigt', 'rueckfrage', 'abgelehnt', 'erledigt'] as const).find(
      (s) => s === body.status,
    )
    if (!status) return antwort({ fehler: 'Unbekannter Status.' }, 400)
    const mail =
      body.mail && status !== 'erledigt'
        ? {
            betreff:
              typeof body.mail.betreff === 'string'
                ? body.mail.betreff.replace(/[\r\n]+/g, ' ').trim()
                : '',
            text: typeof body.mail.text === 'string' ? body.mail.text.trim() : '',
          }
        : null
    if (mail && (!mail.betreff || !mail.text))
      return antwort({ fehler: 'Bitte Betreff und Text der E-Mail ausfüllen.' }, 400)
    if (mail && (mail.betreff.length > 200 || mail.text.length > 5000))
      return antwort({ fehler: 'Die E-Mail ist zu lang.' }, 400)
    try {
      if (mail) ratenGrenze(req, `kuendigungmail:${req.user.id}`, 20, 20)
      const doc = await posteingangAendern(req, 'kuendigungen', id, (vorher) => {
        const v = (vorher.status as KuendigungStatus) ?? 'neu'
        if (!ERLAUBT[v].includes(status))
          throw Object.assign(
            new Error(
              `Die Kündigung steht auf „${STATUS_LABEL[v]}“ – „${STATUS_LABEL[status]}“ ist jetzt nicht möglich.`,
            ),
            { status: 400 },
          )
        return {
          status,
          ...(status === 'bestaetigt' ? { bestaetigtAm: new Date().toISOString() } : {}),
        }
      })
      if (status === 'bestaetigt') {
        const vorbei = await austrittVormerken(req.payload, doc as never, req)
        if (vorbei)
          await req.payload.update({
            collection: 'kuendigungen',
            id,
            data: { wirksamGeworden: true } as never,
            overrideAccess: true,
            req,
            context: { bsvPosteingang: true },
          })
        await posteingangVermerken(req, 'kuendigungen', id, () => ({}), {
          text: `„Gültig bis“ der Mitgliedschaft auf ${deutschesDatum(berlinDatum(String(doc.wirksamZum)))} gesetzt${vorbei ? ' – der Tag ist schon vorbei, die Mitgliedschaft ist beendet' : ''}`,
          art: 'status',
        })
      }
      let versand: 'gesendet' | 'nicht-eingerichtet' | 'fehler' | null = null
      if (mail) {
        try {
          const ok = await mailSenden(req.payload, {
            an: String(doc.email ?? ''),
            betreff: mail.betreff,
            text: mail.text,
            html: mailHtml({ titel: mail.betreff, absaetze: mail.text.split(/\n{2,}/) }),
            antwortAn: (req.user as { email?: string }).email,
          })
          versand = ok ? 'gesendet' : 'nicht-eingerichtet'
        } catch (e) {
          req.payload.logger.error({ err: e }, 'Antwort-Mail zur Kündigung fehlgeschlagen')
          versand = 'fehler'
        }
        await posteingangVermerken(req, 'kuendigungen', id, () => ({}), {
          text:
            versand === 'gesendet'
              ? `E-Mail „${mail.betreff}“ an das Mitglied gesendet${emailAktiv() ? '' : ' (E-Mail-Versand nicht eingerichtet – nur im Server-Protokoll)'}`
              : versand === 'nicht-eingerichtet'
                ? 'E-Mail nicht gesendet: Versand ist noch nicht eingerichtet'
                : 'E-Mail konnte nicht gesendet werden',
          art: 'status',
        })
      }
      return antwort({ ok: true, status, versand })
    } catch (e) {
      if ((e as { status?: number }).status === 429)
        return antwort({ fehler: (e as Error).message }, 429)
      return fehlerAntwort(e, req)
    }
  },
}

export const kuendigungEndpunkte: Endpoint[] = [einreichen, zurueckziehen, entscheidung]

/**
 * Tägliche Aufgabe: Bestätigte Kündigungen, deren Quartalsende vorbei ist, wirksam machen –
 * Mitgliedschaft auf „nicht gültig“ (Ausweis zeigt „nicht gültig“). Holt auch verpasste Tage nach.
 */
export async function kuendigungenWirksam(payload: Payload) {
  const heute = berlinDatum(new Date())
  const r = await payload.find({
    collection: 'kuendigungen',
    where: {
      and: [
        { status: { in: ['bestaetigt', 'erledigt'] } },
        { wirksamGeworden: { not_equals: true } },
        { wirksamZum: { less_than: tagAlsIso(heute) } },
      ],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  let n = 0
  for (const k of r.docs as unknown as {
    id: number
    mitgliedschaften?: unknown[]
    wirksamZum?: string
    verlauf?: unknown[]
  }[]) {
    if (berlinDatum(String(k.wirksamZum)) >= heute) continue
    await austrittVormerken(payload, k)
    await payload.update({
      collection: 'kuendigungen',
      id: k.id,
      data: {
        wirksamGeworden: true,
        verlauf: [
          ...(k.verlauf ?? []),
          {
            text: 'Kündigung wirksam – Mitgliedschaft beendet, der Ausweis zeigt „nicht gültig“',
            vonName: 'Automatisch',
            am: new Date().toISOString(),
            art: 'status',
          },
        ],
      } as never,
      overrideAccess: true,
    })
    n++
  }
  if (n) payload.logger.info(`Kündigungen: ${n} wirksam geworden (Mitgliedschaft beendet)`)
  return n
}
