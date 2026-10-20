import type { Endpoint, PayloadRequest, Where } from 'payload'

import { hasRole } from '@/access/roles'
import { emailAktiv, mailHtml, mailSenden } from '@/auth/mail'
import { ratenGrenze } from '@/hooks/spamSchutz'
import { fehlerAntwort, idAus, posteingangAendern } from '@/posteingang/endpunkte'
import { type Entscheidung, MITGLIEDSART_LABEL } from './texte'

const ENTSCHEIDUNGEN: Entscheidung[] = ['aufgenommen', 'rueckfrage', 'abgelehnt']
const kasse = (req: PayloadRequest) => Boolean(req.user) && hasRole(req.user as never, 'admin', 'kasse')

/** Status setzen und optional die Antwort-Mail an die Adresse aus dem Antrag schicken */
const entscheidung: Endpoint = {
  path: '/:id/entscheidung',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    if (!kasse(req)) return Response.json({ fehler: 'Diesen Eintrag darfst du nicht bearbeiten.' }, { status: 403 })
    const id = idAus(req)
    if (!id) return Response.json({ fehler: 'Antrag nicht gefunden.' }, { status: 404 })
    const body = (await req.json?.().catch(() => ({}))) as { status?: unknown; mail?: { betreff?: unknown; text?: unknown } | null }
    const status = ENTSCHEIDUNGEN.find((s) => s === body?.status)
    if (!status) return Response.json({ fehler: 'Unbekannter Status.' }, { status: 400 })
    const mail = body?.mail
      ? { betreff: typeof body.mail.betreff === 'string' ? body.mail.betreff.replace(/[\r\n]+/g, ' ').trim() : '', text: typeof body.mail.text === 'string' ? body.mail.text.trim() : '' }
      : null
    if (mail && (!mail.betreff || !mail.text)) return Response.json({ fehler: 'Bitte Betreff und Text der E-Mail ausfüllen.' }, { status: 400 })
    if (mail && (mail.betreff.length > 200 || mail.text.length > 5000)) return Response.json({ fehler: 'Die E-Mail ist zu lang.' }, { status: 400 })
    try {
      if (mail) ratenGrenze(req, `antragmail:${req.user.id}`, 30)
      // 1) Status ändern (Payload prüft die Rechte; „Aufgenommen“ legt die Mitgliedschaft an)
      const doc = await posteingangAendern(req, 'mitgliedsantraege', id, () => ({ status }))
      // 2) Mail – Empfänger ist immer die Adresse aus dem Antrag, nie eine mitgeschickte
      let versand: 'gesendet' | 'nicht-eingerichtet' | 'fehler' | null = null
      if (mail) {
        const an = String(doc.email ?? '')
        try {
          const ok = await mailSenden(req.payload, {
            an,
            betreff: mail.betreff,
            text: mail.text,
            html: mailHtml({ titel: mail.betreff, absaetze: mail.text.split(/\n{2,}/) }),
            antwortAn: (req.user as { email?: string }).email,
          })
          versand = ok ? 'gesendet' : 'nicht-eingerichtet'
        } catch (e) {
          req.payload.logger.error({ err: e }, 'Antwort-Mail zum Mitgliedsantrag fehlgeschlagen')
          versand = 'fehler'
        }
        const vermerk =
          versand === 'gesendet'
            ? `E-Mail „${mail.betreff}“ an die Antragsteller/in gesendet${emailAktiv() ? '' : ' (nur Anzeige im Server-Fenster)'}`
            : versand === 'nicht-eingerichtet'
              ? 'E-Mail nicht gesendet: Versand ist noch nicht eingerichtet'
              : 'E-Mail konnte nicht gesendet werden'
        await posteingangAendern(req, 'mitgliedsantraege', id, () => ({}), { text: vermerk, art: 'status' })
      }
      return Response.json({ ok: true, status, versand })
    } catch (e) {
      if ((e as { status?: number }).status === 429) return Response.json({ fehler: (e as Error).message }, { status: 429 })
      return fehlerAntwort(e)
    }
  },
}

const ohneZeit = (iso: unknown) => (typeof iso === 'string' ? iso.slice(0, 10) : '')

/** Prüfhilfe: doppelte Anträge, bestehende Mitgliedschaften, aktueller Beitrag – nur mit den Rechten der Person */
const pruefung: Endpoint = {
  path: '/:id/pruefung',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    const id = idAus(req)
    if (!id) return Response.json({ fehler: 'Antrag nicht gefunden.' }, { status: 404 })
    try {
      const a = (await req.payload.findByID({ collection: 'mitgliedsantraege', id, depth: 0, overrideAccess: false, user: req.user, req })) as unknown as Record<string, string>
      const gleichePerson: Where = { and: [{ nachname: { equals: a.nachname } }, { geburtsdatum: { greater_than_equal: `${ohneZeit(a.geburtsdatum)}T00:00:00.000Z` } }, { geburtsdatum: { less_than_equal: `${ohneZeit(a.geburtsdatum)}T23:59:59.999Z` } }] }
      const [antraege, mitglieder, ausAntrag, verein] = await Promise.all([
        req.payload.find({
          collection: 'mitgliedsantraege',
          where: { and: [{ id: { not_equals: id } }, { or: [{ email: { equals: a.email } }, gleichePerson] }] },
          limit: 5,
          depth: 0,
          sort: '-createdAt',
          overrideAccess: false,
          user: req.user,
          req,
          select: { vorname: true, nachname: true, status: true, createdAt: true },
        }),
        req.payload
          .find({
            collection: 'mitgliedschaften',
            where: { and: [{ or: [{ antrag: { exists: false } }, { antrag: { not_equals: id } }] }, gleichePerson] },
            limit: 5,
            depth: 0,
            overrideAccess: false,
            user: req.user,
            req,
            select: { vorname: true, nachname: true, aktiv: true, mitgliedsnummer: true },
          })
          .catch(() => ({ docs: [] })),
        req.payload.count({ collection: 'mitgliedschaften', where: { antrag: { equals: id } }, overrideAccess: false, user: req.user, req }).catch(() => ({ totalDocs: 0 })),
        req.payload.findGlobal({ slug: 'verein', depth: 0, req }).catch(() => null),
      ])
      const beitrag = ((verein as { beitraege?: { key?: string; quartal?: number }[] } | null)?.beitraege ?? []).find((b) => b.key === a.mitgliedsart)?.quartal ?? null
      return Response.json({
        antraege: antraege.docs.map((d) => ({ id: d.id, name: `${d.vorname} ${d.nachname}`, status: d.status, am: d.createdAt })),
        mitgliedschaften: (mitglieder.docs as { id: number; vorname?: string; nachname?: string; aktiv?: boolean; mitgliedsnummer?: string }[]).map((d) => ({
          id: d.id,
          name: `${d.vorname ?? ''} ${d.nachname ?? ''}`.trim(),
          aktiv: d.aktiv !== false,
          nummer: d.mitgliedsnummer ?? null,
        })),
        ausweise: ausAntrag.totalDocs,
        beitragAktuell: beitrag,
        mailAktiv: emailAktiv() || process.env.NODE_ENV !== 'production',
      })
    } catch (e) {
      return fehlerAntwort(e)
    }
  },
}

/* ------------------------------------------------------------------ */
// Export für die Kasse (CSV ohne Bankdaten)

const SPALTEN = ['Antrag-Nr.', 'Rolle', 'Nachname', 'Vorname', 'Geburtsdatum', 'Straße', 'PLZ', 'Ort', 'E-Mail', 'Telefon', 'Mitgliedsart', 'Beitrag pro Quartal (€)', 'Gewünschte Teams', 'Foto-Einwilligung', 'Antrag vom', 'Aufgenommen am']

const deDatum = (iso: unknown) => {
  if (typeof iso !== 'string' || !iso) return ''
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(iso))
}

/** Ein Feld für Excel: in Anführungszeichen, und nie als Formel ausführbar (CSV-Injection) */
export const csvFeld = (v: unknown) => {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

type Antrag = {
  id: number
  vorname: string
  nachname: string
  geburtsdatum?: string
  strasse?: string
  plz?: string
  ort?: string
  email?: string
  telefon?: string
  mitgliedsart?: string
  beitragQuartal?: number | null
  angebote?: ({ title?: string } | number)[] | null
  fotoEinwilligung?: boolean | null
  familienmitglieder?: { vorname?: string; nachname?: string; geburtsdatum?: string }[] | null
  createdAt?: string
  aufgenommenAm?: string | null
  updatedAt?: string
}

export function csvZeilen(antraege: Antrag[]): string {
  const zeilen: string[] = [SPALTEN.map(csvFeld).join(';')]
  for (const a of antraege) {
    const teams = (a.angebote ?? []).map((t) => (typeof t === 'object' ? t.title : '')).filter(Boolean).join(', ')
    const gemeinsam = [a.strasse, a.plz, a.ort, a.email, a.telefon, MITGLIEDSART_LABEL[a.mitgliedsart ?? ''] ?? a.mitgliedsart]
    const beitrag = a.beitragQuartal != null ? String(a.beitragQuartal).replace('.', ',') : ''
    const daten = [a.fotoEinwilligung ? 'ja' : 'nein', deDatum(a.createdAt), deDatum(a.aufgenommenAm ?? a.updatedAt)]
    zeilen.push([a.id, 'Antragsteller/in', a.nachname, a.vorname, deDatum(a.geburtsdatum), ...gemeinsam, beitrag, teams, ...daten].map(csvFeld).join(';'))
    if (a.mitgliedsart === 'familie')
      for (const f of a.familienmitglieder ?? []) {
        zeilen.push([a.id, 'Familienmitglied', f.nachname || a.nachname, f.vorname, deDatum(f.geburtsdatum), ...gemeinsam, '', '', ...daten].map(csvFeld).join(';'))
      }
  }
  // BOM, damit Excel Umlaute richtig anzeigt
  return '﻿' + zeilen.join('\r\n') + '\r\n'
}

const exportEndpunkt: Endpoint = {
  path: '/export',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    if (!kasse(req)) return Response.json({ fehler: 'Nur Kasse und Admins dürfen exportieren.' }, { status: 403 })
    const body = (await req.json?.().catch(() => ({}))) as { alle?: unknown }
    const alle = body?.alle === true
    try {
      ratenGrenze(req, `antragexport:${req.user.id}`, 20)
      const r = await req.payload.find({
        collection: 'mitgliedsantraege',
        where: { and: [{ status: { equals: 'aufgenommen' } }, ...(alle ? [] : [{ exportiertAm: { exists: false } }])] },
        sort: 'createdAt',
        limit: 2000,
        depth: 1,
        overrideAccess: false,
        user: req.user,
        req,
        // Bankdaten werden gar nicht erst gelesen
        select: {
          vorname: true,
          nachname: true,
          geburtsdatum: true,
          strasse: true,
          plz: true,
          ort: true,
          email: true,
          telefon: true,
          mitgliedsart: true,
          beitragQuartal: true,
          angebote: true,
          fotoEinwilligung: true,
          familienmitglieder: true,
          createdAt: true,
          updatedAt: true,
          aufgenommenAm: true,
          exportiertAm: true,
        },
      })
      const antraege = r.docs as unknown as (Antrag & { exportiertAm?: string | null })[]
      const csv = csvZeilen(antraege)
      // Als exportiert markieren und im Verlauf vermerken (nur Anträge, die noch nicht markiert waren)
      const jetzt = new Date().toISOString()
      for (const a of antraege.filter((x) => !x.exportiertAm)) {
        await posteingangAendern(req, 'mitgliedsantraege', a.id, () => ({ exportiertAm: jetzt }), { text: 'Für die Kasse exportiert', art: 'status' })
      }
      if (alle) for (const a of antraege.filter((x) => x.exportiertAm)) await posteingangAendern(req, 'mitgliedsantraege', a.id, () => ({}), { text: 'Erneut exportiert', art: 'status' })
      req.payload.logger.info(`Mitgliedsanträge exportiert: ${antraege.length} Anträge (Konto ${req.user.id})`)
      const datei = `mitgliedsantraege-${jetzt.slice(0, 10)}${alle ? '-alle' : ''}.csv`
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${datei}"`,
          'Cache-Control': 'no-store',
          'X-Anzahl': String(antraege.length),
        },
      })
    } catch (e) {
      if ((e as { status?: number }).status === 429) return Response.json({ fehler: (e as Error).message }, { status: 429 })
      return fehlerAntwort(e)
    }
  },
}

export const antragEndpunkte: Endpoint[] = [entscheidung, pruefung, exportEndpunkt]
