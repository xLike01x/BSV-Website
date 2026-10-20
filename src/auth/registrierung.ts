import crypto from 'crypto'
import type { Endpoint, PayloadRequest, Where } from 'payload'

import { hatRecht } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'
import { ratenGrenze } from '@/hooks/spamSchutz'
import { getServerSideURL } from '@/utilities/getURL'

import { loesungPruefen, neueAufgabe } from './botschutz'
import { emailAktiv, mailHtml, mailSenden } from './mail'

/**
 * Selbst-Registrierung für Mitglieder:
 * 1. Konto mit E-Mail + Passwort anlegen (Bot-Schutz: Rechenaufgabe, Zeitfalle, Honeypot, Begrenzung pro Adresse)
 * 2. Bestätigungs-E-Mail – erst danach ist Anmelden möglich und das Konto erscheint unter „Registrierungen“
 * 3. Admin/Kasse gibt frei und ordnet Teams & Kurse zu (die Wünsche aus der Registrierung sind vorausgewählt)
 */
const json = (body: unknown, status = 200) => Response.json(body, { status })
const prod = () => process.env.NODE_ENV === 'production'
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
const LINK_STUNDEN = 48
const MAX_WUENSCHE = 12

type Konto = { id: number; name?: string; email: string; roles?: string[] | null; freigegeben?: boolean | null; registriertUeber?: string | null; emailBestaetigt?: boolean | null }

/** Selbst registriert, aber E-Mail noch nicht bestätigt */
export const unbestaetigt = (u: Partial<Konto>) => u.registriertUeber === 'email' && !u.emailBestaetigt

/** Wartet auf Freigabe und hat die E-Mail bestätigt (ältere Konten ohne „registriert über E-Mail“ zählen auch) */
export const WARTEND: Where = {
  and: [
    { freigegeben: { equals: false } },
    { or: [{ emailBestaetigt: { equals: true } }, { registriertUeber: { exists: false } }, { registriertUeber: { not_equals: 'email' } }] },
  ],
}

/** Bei einer frischen Installation darf sich niemand von außen als Erstes registrieren (das erste Konto wird Web-Admin) */
const eingerichtet = async (req: PayloadRequest) => (await req.payload.count({ collection: 'users', overrideAccess: true })).totalDocs > 0

/** Admin, Kasse oder Einzelrecht „Registrierungen freigeben“ */
export const darfRegistrierungen = (user: unknown) => hasRole(user as never, 'admin', 'kasse') || hatRecht(user, 'registrierungen')
const darfFreigeben = (req: PayloadRequest) => darfRegistrierungen(req.user)

const vonDerWebsite = (req: PayloadRequest) => {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) return false
  const herkunft = req.headers.get('origin')
  return !(prod() && herkunft && herkunft !== new URL(getServerSideURL()).origin)
}

const begrenzt = (req: PayloadRequest, schluessel: string, max: number) => {
  try {
    ratenGrenze(req, schluessel, max)
    return false
  } catch {
    return true
  }
}

const hallo = (name?: string) => (name ? `Hallo ${name},` : 'Hallo,')

/** Neuen Bestätigungslink erzeugen (in der Datenbank steht nur der Fingerabdruck, nie der Link selbst) */
async function linkErzeugen(req: PayloadRequest, id: number) {
  const token = crypto.randomBytes(32).toString('base64url')
  await req.payload.db.updateOne({
    collection: 'users',
    id,
    data: { bestaetigungHash: sha(token), bestaetigungBis: new Date(Date.now() + LINK_STUNDEN * 3600000).toISOString() } as never,
    req,
    returning: false,
  })
  return `${getServerSideURL()}/registrieren/bestaetigen?t=${token}`
}

async function bestaetigungSenden(req: PayloadRequest, u: { id: number; name?: string; email: string }) {
  const link = await linkErzeugen(req, u.id)
  const absaetze = [hallo(u.name), 'schön, dass du dich auf der Website des BSV 1919 registriert hast. Bitte bestätige noch kurz deine E-Mail-Adresse:']
  const fuss = `Der Link gilt ${LINK_STUNDEN} Stunden. Danach prüft die Verwaltung deine Mitgliedschaft und schaltet dich frei. Du hast dich nicht registriert? Dann ignoriere diese E-Mail einfach – ohne Bestätigung wird das Konto nach ein paar Tagen automatisch gelöscht.`
  await mailSenden(req.payload, {
    an: u.email,
    betreff: 'Bitte bestätige deine E-Mail-Adresse – BSV 1919',
    text: `${absaetze.join('\n\n')}\n\n${link}\n\n${fuss}`,
    html: mailHtml({ titel: 'E-Mail bestätigen', absaetze, knopf: 'E-Mail-Adresse bestätigen', link, fuss }),
  })
}

async function schonVorhandenSenden(req: PayloadRequest, email: string) {
  const link = `${getServerSideURL()}/login`
  const absaetze = ['Hallo,', 'gerade wollte sich jemand mit deiner E-Mail-Adresse auf der Website des BSV 1919 registrieren. Du hast aber schon ein Konto.', 'Passwort vergessen? Auf der Anmeldeseite auf „Passwort vergessen?“ klicken.']
  const fuss = 'Das warst du nicht? Dann kannst du diese E-Mail ignorieren – an deinem Konto hat sich nichts geändert.'
  await mailSenden(req.payload, {
    an: email,
    betreff: 'Du hast schon ein Konto – BSV 1919',
    text: `${absaetze.join('\n\n')}\n\nZur Anmeldung: ${link}\n\n${fuss}`,
    html: mailHtml({ titel: 'Du hast schon ein Konto', absaetze, knopf: 'Zur Anmeldung', link, fuss }),
  })
}

/** Pro E-Mail-Adresse höchstens alle 5 Minuten eine weitere Mail (Schutz davor, fremde Postfächer zuzumüllen) */
const zuletztGesendet = new Map<string, number>()
const darfSenden = (email: string) => {
  const jetzt = Date.now()
  if (jetzt - (zuletztGesendet.get(email) ?? 0) < 5 * 60000) return false
  zuletztGesendet.set(email, jetzt)
  if (zuletztGesendet.size > 5000) for (const [k, t] of zuletztGesendet) if (jetzt - t > 5 * 60000) zuletztGesendet.delete(k)
  return true
}

/** Nur existierende Teams/Kurse übernehmen */
async function gueltigeAngebote(req: PayloadRequest, roh: unknown): Promise<number[]> {
  const ids = [...new Set((Array.isArray(roh) ? roh : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50)
  if (!ids.length) return []
  const r = await req.payload.find({ collection: 'angebote', where: { id: { in: ids } }, limit: 50, depth: 0, overrideAccess: true, select: { title: true } as never })
  return (r.docs as unknown as { id: number }[]).map((d) => d.id)
}

const GENERISCH = { ok: true }

export const registrierungEndpunkte: Endpoint[] = [
  {
    // Rechenaufgabe für den unsichtbaren Bot-Schutz
    path: '/registrieren/aufgabe',
    method: 'get',
    handler: async () => Response.json(neueAufgabe(), { headers: { 'Cache-Control': 'no-store' } }),
  },
  {
    // Registrierung mit E-Mail und Passwort → Bestätigungs-E-Mail
    path: '/registrieren',
    method: 'post',
    handler: async (req) => {
      if (!vonDerWebsite(req)) return json({ fehler: 'Ungültige Anfrage.' }, 400)
      if (prod() && !emailAktiv()) return json({ fehler: 'Die Registrierung ist noch nicht freigeschaltet. Bitte melde dich bei der Geschäftsstelle.' }, 503)
      const body = (await req.json?.().catch(() => ({}))) as {
        name?: string
        email?: string
        passwort?: string
        datenschutz?: boolean
        website?: string
        angebote?: unknown
        botschutz?: { salz?: string; ziel?: string; signatur?: string; zahl?: number }
      }
      if (body.website) return json({ fehler: 'Die Anfrage konnte nicht verarbeitet werden.' }, 400)
      if (begrenzt(req, 'registrieren', 5)) return json({ fehler: 'Zu viele Versuche. Bitte in ein paar Minuten erneut probieren.' }, 429)
      const name = String(body.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 120)
      const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200)
      const passwort = String(body.passwort ?? '')
      if (name.length < 2) return json({ fehler: 'Bitte gib deinen Namen ein.' }, 400)
      // Kein Link im Namen – der Name steht in der Bestätigungs-E-Mail (sonst Spam über fremde Postfächer)
      if (/https?:|www\.|\.[a-z]{2,}\/|[<>]/i.test(name)) return json({ fehler: 'Bitte gib nur deinen Vor- und Nachnamen ein.' }, 400)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ fehler: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, 400)
      if (passwort.length < 10 || passwort.length > 200) return json({ fehler: 'Das Passwort braucht mindestens 10 Zeichen.' }, 400)
      if (!body.datenschutz) return json({ fehler: 'Bitte bestätige die Datenschutzhinweise.' }, 400)
      const botFehler = loesungPruefen(body.botschutz)
      if (botFehler) return json({ fehler: botFehler, neueAufgabe: true }, 400)
      if (!(await eingerichtet(req))) return json({ fehler: 'Die Website ist noch nicht eingerichtet.' }, 403)

      const vorhanden = (await req.payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as unknown as Konto | undefined
      if (vorhanden) {
        const nurMitglied = !(vorhanden.roles ?? []).some((r) => r !== 'mitglied')
        if (unbestaetigt(vorhanden) && vorhanden.freigegeben === false && nurMitglied) {
          if (!darfSenden(email)) return json({ fehler: 'Wir haben dir gerade schon eine E-Mail geschickt. Bitte schau in dein Postfach (auch im Spam-Ordner) oder versuche es in 5 Minuten erneut.' }, 429)
          // Nie bestätigte Registrierung: NICHT ersetzen (sonst könnte jemand Fremdes Name und Passwort des
          // wartenden Kontos austauschen) – nur den Bestätigungslink an die Adresse erneut schicken.
          // Wer sich beim Passwort vertippt hatte: nach der Bestätigung „Passwort vergessen?“ nutzen.
          zuletztGesendet.set(email, Date.now())
          await bestaetigungSenden(req, { id: vorhanden.id as number, name: (vorhanden as { name?: string }).name ?? name, email }).catch((e) => req.payload.logger.error(e))
          return json(GENERISCH, 201)
        } else {
          // Gleiche Antwort wie bei Erfolg – verrät nicht, ob es die Adresse schon gibt
          if (darfSenden(email)) await schonVorhandenSenden(req, email).catch((e) => req.payload.logger.error(e))
          return json(GENERISCH, 201)
        }
      }

      const wuensche = (await gueltigeAngebote(req, body.angebote)).slice(0, MAX_WUENSCHE)
      const neu = await req.payload.create({
        collection: 'users',
        data: { name, email, password: passwort, roles: ['mitglied'], freigegeben: false, wunschAngebote: wuensche } as never,
        overrideAccess: true,
        req,
      })
      await req.payload.db.updateOne({ collection: 'users', id: neu.id, data: { registriertUeber: 'email', emailBestaetigt: false } as never, req, returning: false })
      try {
        zuletztGesendet.set(email, Date.now())
        await bestaetigungSenden(req, { id: neu.id as number, name, email })
      } catch (e) {
        req.payload.logger.error(e)
        await req.payload.delete({ collection: 'users', id: neu.id, overrideAccess: true, req }).catch(() => null)
        zuletztGesendet.delete(email)
        return json({ fehler: 'Die Bestätigungs-E-Mail konnte gerade nicht verschickt werden. Bitte später erneut versuchen.' }, 502)
      }
      return json(GENERISCH, 201)
    },
  },
  {
    // Link aus der Bestätigungs-E-Mail
    path: '/registrieren/bestaetigen',
    method: 'post',
    handler: async (req) => {
      if (!vonDerWebsite(req)) return json({ fehler: 'Ungültige Anfrage.' }, 400)
      if (begrenzt(req, 'bestaetigen', 20)) return json({ fehler: 'zu-viele' }, 429)
      const body = (await req.json?.().catch(() => ({}))) as { t?: string }
      const t = String(body.t ?? '')
      if (!/^[\w-]{40,60}$/.test(t)) return json({ fehler: 'ungueltig' }, 400)
      const u = (await req.payload.find({ collection: 'users', where: { bestaetigungHash: { equals: sha(t) } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true })).docs[0] as unknown as
        | (Konto & { bestaetigungBis?: string | null })
        | undefined
      if (!u) return json({ fehler: 'ungueltig' }, 400)
      if (!u.bestaetigungBis || new Date(u.bestaetigungBis) < new Date()) return json({ fehler: 'abgelaufen' }, 400)
      await req.payload.db.updateOne({ collection: 'users', id: u.id, data: { emailBestaetigt: true, bestaetigungHash: null, bestaetigungBis: null } as never, req, returning: false })
      return json({ ok: true, freigegeben: u.freigegeben !== false })
    },
  },
  {
    // Bestätigungs-E-Mail erneut senden – antwortet immer gleich
    path: '/registrieren/erneut',
    method: 'post',
    handler: async (req) => {
      if (!vonDerWebsite(req)) return json({ fehler: 'Ungültige Anfrage.' }, 400)
      if (begrenzt(req, 'erneut', 5)) return json({ fehler: 'Zu viele Versuche. Bitte in ein paar Minuten erneut probieren.' }, 429)
      const body = (await req.json?.().catch(() => ({}))) as { email?: string }
      const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200)
      if (!email) return json(GENERISCH)
      const u = (await req.payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as unknown as Konto | undefined
      if (u && unbestaetigt(u) && darfSenden(email)) await bestaetigungSenden(req, u).catch((e) => req.payload.logger.error(e))
      return json(GENERISCH)
    },
  },
  {
    // Für die Verwaltung: Anzahl wartender (bestätigter) Registrierungen
    path: '/registrierungen',
    method: 'get',
    handler: async (req) => {
      if (!darfFreigeben(req)) return json({ fehler: 'Keine Berechtigung.' }, 403)
      const r = await req.payload.count({ collection: 'users', where: WARTEND, overrideAccess: true })
      return json({ anzahl: r.totalDocs })
    },
  },
  {
    // Freigeben (mit Teams & Kursen) oder ablehnen (löscht das Konto)
    path: '/freigabe',
    method: 'post',
    handler: async (req) => {
      if (!darfFreigeben(req)) return json({ fehler: 'Keine Berechtigung.' }, 403)
      if (!vonDerWebsite(req)) return json({ fehler: 'Ungültige Anfrage.' }, 400)
      const body = (await req.json?.().catch(() => ({}))) as { id?: number; aktion?: 'freigeben' | 'ablehnen'; angebote?: unknown }
      const id = Number(body.id)
      const u = id ? ((await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as Konto | null) : null
      // Nur selbst registrierte, bestätigte, noch wartende Konten – nie Personal-Konten
      if (!u || u.freigegeben !== false || unbestaetigt(u) || (u.roles ?? []).some((r) => r !== 'mitglied')) return json({ fehler: 'Diese Registrierung gibt es nicht (mehr).' }, 404)
      if (body.aktion === 'freigeben') {
        const angebote = await gueltigeAngebote(req, body.angebote)
        await req.payload.update({ collection: 'users', id, data: { freigegeben: true, angebote, wunschAngebote: [] } as never, overrideAccess: true, context: { zweiFaktorIntern: true }, req })
        // Mitgliedschaften mit gleicher E-Mail (noch ohne Konto) verknüpfen → Ausweis erscheint
        const r = await req.payload.update({ collection: 'mitgliedschaften', where: { and: [{ email: { equals: u.email.toLowerCase() } }, { konto: { exists: false } }] }, data: { konto: id } as never, overrideAccess: true, req })
        const link = `${getServerSideURL()}/mitglieder`
        const absaetze = [hallo(u.name), 'dein Konto auf der Website des BSV 1919 ist freigeschaltet. Ab jetzt siehst du im Mitgliederbereich Kursausfälle, Termine und Downloads.']
        await mailSenden(req.payload, {
          an: u.email,
          betreff: 'Dein Zugang ist freigeschaltet – BSV 1919',
          text: `${absaetze.join('\n\n')}\n\nZum Mitgliederbereich: ${link}`,
          html: mailHtml({ titel: 'Du bist freigeschaltet', absaetze, knopf: 'Zum Mitgliederbereich', link }),
        }).catch((e) => req.payload.logger.error(e))
        return json({ ok: true, ausweise: r.docs.length })
      }
      if (body.aktion === 'ablehnen') {
        await req.payload.delete({ collection: 'users', id, overrideAccess: true, req })
        return json({ ok: true })
      }
      return json({ fehler: 'Unbekannte Aktion.' }, 400)
    },
  },
]
