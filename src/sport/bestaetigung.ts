import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import type { Endpoint, Payload, PayloadRequest, Where } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import { hasRole } from '@/access/roles'
import { emailAktiv, mailHtml, mailSenden } from '@/auth/mail'
import { getServerSideURL } from '@/utilities/getURL'
import { gleich, schluessel } from '@/utilities/schluessel'
import { istJson } from '@/utilities/istJson'

/**
 * „Passt noch?“ – Trainingszeiten und Infos eines Teams bestätigen.
 * - Wird automatisch gesetzt, wenn jemand die Trainingszeiten ändert (Hook in Angebote).
 * - Knopf „✓ Alles noch aktuell“ in der Verwaltung beim Team.
 * - Alle 3 Monate eine E-Mail an die Verantwortlichen mit einem Link pro Team (gilt 30 Tage, ohne Anmeldung).
 *   Der Link öffnet eine Seite mit Knopf – erst der Klick bestätigt (E-Mail-Programme, die Links vorab öffnen,
 *   bestätigen also nichts).
 * Gespeichert wird direkt in der Datenbank, ohne „Zuletzt geändert“ zu verschieben.
 */
export const ERINNERN_NACH_TAGEN = 90
export const VERALTET_NACH_TAGEN = 365
const LINK_TAGE = 30
const TEAM_ROLLEN = ['uebungsleitung', 'teamredaktion']

type Konto = { id: number; name?: string | null; email: string; roles?: string[] | null; mailBenachrichtigung?: boolean | null; freigegeben?: boolean | null; testkonto?: boolean | null }
type Team = { id: number; title: string; slug?: string | null; aktiv?: boolean | null; leitung?: (number | { id: number })[] | null; zeiten?: { tag?: string | null; von?: string | null; bis?: string | null; ort?: string | null }[] | null }

const idVon = (v: number | { id: number }) => (typeof v === 'object' ? v.id : v)

/* ---------- Signierter Link ---------- */

const sig = (teil: string) => crypto.createHmac('sha256', schluessel('bestaetigung')).update(`team-bestaetigen:${teil}`).digest('base64url').slice(0, 32)

export function bestaetigungsToken(teamId: number, kontoId: number, ablauf = Date.now() + LINK_TAGE * 86400000) {
  const teil = `${teamId.toString(36)}.${kontoId.toString(36)}.${Math.floor(ablauf / 1000).toString(36)}`
  return `${teil}.${sig(teil)}`
}

export type TokenErgebnis = { teamId: number; kontoId: number } | 'ungueltig' | 'abgelaufen'
export function tokenPruefen(t: unknown): TokenErgebnis {
  if (typeof t !== 'string' || t.length > 120 || !/^[0-9a-z]{1,8}\.[0-9a-z]{1,8}\.[0-9a-z]{1,8}\.[A-Za-z0-9_-]{32}$/.test(t)) return 'ungueltig'
  const [a, b, c, s] = t.split('.') as [string, string, string, string]
  if (!gleich(s, sig(`${a}.${b}.${c}`))) return 'ungueltig'
  if (parseInt(c, 36) * 1000 < Date.now()) return 'abgelaufen'
  return { teamId: parseInt(a, 36), kontoId: parseInt(b, 36) }
}

/* ---------- Speichern ---------- */

// Nie die E-Mail-Adresse speichern – „bestätigt von“ sehen auch andere Verwaltungs-Konten
export const nameVon = (u: { name?: string | null } | null | undefined) => (u?.name?.trim() || 'Konto ohne Namen').slice(0, 120)

/**
 * Setzt „Zuletzt bestätigt“ – ohne „Zuletzt geändert“ zu verschieben; baut die Website neu auf.
 * Wurde das Team gerade erst (vor weniger als 10 Minuten) bestätigt, passiert nichts – so lässt sich mit einem
 * Link oder Knopf kein ständiger Neuaufbau der Website auslösen.
 */
export async function bestaetigtSetzen(payload: Payload, teamId: number, von: string): Promise<{ am: string; von: string }> {
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows?: { bestaetigt_am?: string | Date; bestaetigt_von?: string | null }[] }> } }).drizzle
  const am = new Date().toISOString()
  const r = await db.execute(
    sql`update "angebote" set "bestaetigt_am" = ${am}, "bestaetigt_von" = ${von}
        where "id" = ${teamId} and ("bestaetigt_am" is null or "bestaetigt_am" < now() - interval '10 minutes') returning "bestaetigt_am"`,
  )
  if (!r.rows?.length) {
    // Schon kurz zuvor bestätigt: den gespeicherten Stand zurückgeben (auch die Person, die es war)
    const jetzt = (await db.execute(sql`select "bestaetigt_am", "bestaetigt_von" from "angebote" where "id" = ${teamId}`)).rows?.[0]
    return { am: jetzt?.bestaetigt_am ? new Date(jetzt.bestaetigt_am).toISOString() : am, von: jetzt?.bestaetigt_von || von }
  }
  try {
    revalidatePath('/', 'layout')
  } catch {
    // außerhalb von Next.js (Skripte) nichts neu aufzubauen
  }
  return { am, von }
}

/**
 * Frühere Versionen haben bei Konten ohne Namen die E-Mail-Adresse als „bestätigt von“ gespeichert. Solche Reste
 * (auch aus eingespielten Sicherungen) ersetzt der tägliche Lauf – die Adresse gehört nicht an diese Stelle.
 */
export async function alteAdressenEntfernen(payload: Payload) {
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle
  await db.execute(sql`update "angebote" set "bestaetigt_von" = 'Konto ohne Namen' where "bestaetigt_von" like '%@%'`)
}

/** Darf die angemeldete Person dieses Team bearbeiten? (dieselbe Regel wie beim Speichern, inkl. „nur eigene Teams“) */
async function darfTeamAendern(req: PayloadRequest, id: number) {
  const regel = req.payload.collections.angebote?.config.access?.update
  const ergebnis = regel ? await regel({ req, id, data: {} } as never) : false
  if (ergebnis === true) return true
  if (ergebnis && typeof ergebnis === 'object') {
    const n = await req.payload.count({ collection: 'angebote', where: { and: [{ id: { equals: id } }, ergebnis as Where] }, overrideAccess: true, req })
    return n.totalDocs > 0
  }
  return false
}

/** POST /api/angebote/:id/bestaetigen – Knopf „✓ Alles noch aktuell“ in der Verwaltung */
export const bestaetigenEndpunkt: Endpoint = {
  path: '/:id/bestaetigen',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    if (!istJson(req)) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 415 })
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 })
    if (!(await darfTeamAendern(req, id))) return Response.json({ fehler: 'Dieses Team darfst du nicht bearbeiten.' }, { status: 403 })
    return Response.json(await bestaetigtSetzen(req.payload, id, nameVon(req.user as never)))
  },
}

/** Prüft einen Link aus der E-Mail und liefert Team und Person – nur wenn die Person das Team noch betreut */
export async function linkAufloesen(payload: Payload, t: unknown): Promise<{ team: Team; konto: Konto } | 'ungueltig' | 'abgelaufen' | 'nicht-mehr'> {
  const e = tokenPruefen(t)
  if (typeof e === 'string') return e
  const team = (await payload.findByID({ collection: 'angebote', id: e.teamId, depth: 0, overrideAccess: true }).catch(() => null)) as Team | null
  const konto = (await payload.findByID({ collection: 'users', id: e.kontoId, depth: 0, overrideAccess: true }).catch(() => null)) as Konto | null
  if (!team || !konto) return 'nicht-mehr'
  const betreut = (team.leitung ?? []).map(idVon).includes(konto.id)
  const rolle = (konto.roles ?? []).some((r) => [...TEAM_ROLLEN, 'admin', 'redaktion'].includes(r))
  if (!betreut || !rolle || konto.freigegeben === false) return 'nicht-mehr'
  return { team, konto }
}

/** POST /api/angebote/bestaetigen-link – „✓ Ja, passt noch“ auf der Seite aus der E-Mail (ohne Anmeldung, mit Link) */
export const bestaetigenLinkEndpunkt: Endpoint = {
  path: '/bestaetigen-link',
  method: 'post',
  handler: async (req) => {
    if (!istJson(req)) return Response.json({ fehler: 'ungueltig' }, { status: 415 })
    const body = (await req.json?.().catch(() => null)) as { t?: unknown } | null
    const r = await linkAufloesen(req.payload, body?.t)
    if (typeof r === 'string') return Response.json({ fehler: r }, { status: r === 'abgelaufen' ? 410 : 400 })
    const { am } = await bestaetigtSetzen(req.payload, r.team.id, nameVon(r.konto))
    return Response.json({ am, team: r.team.title })
  },
}

/* ---------- Erinnerung alle 3 Monate ---------- */

const zeitenText = (z: Team['zeiten']) =>
  (z ?? [])
    .filter((x) => x.tag)
    .map((x) => `${x.tag} ${x.von ?? ''}${x.bis ? `–${x.bis}` : ''}${x.ort ? `, ${x.ort}` : ''}`.trim())
    .join('\n') || 'Keine Trainingszeiten eingetragen'

/**
 * Täglich: Teams, deren Angaben seit 90 Tagen niemand bestätigt hat und die seit 90 Tagen keine Erinnerung bekommen
 * haben → eine E-Mail je verantwortlicher Person (alle ihre Teams in einer Mail). Nie an Testkonten, nie an Personen,
 * die E-Mail-Benachrichtigungen abbestellt haben.
 */
/**
 * Automatische Mails (Erinnerungen, Monatsbericht) nur von der echten Live-Website: nicht beim Entwickeln am PC,
 * nicht von der Generalprobe (BSV_ERINNERUNGEN=aus) und nicht ohne eingerichteten E-Mail-Versand.
 */
export const automatischeMailsAn = () => {
  const url = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return process.env.NODE_ENV === 'production' && emailAktiv() && process.env.BSV_ERINNERUNGEN !== 'aus' && url.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(url)
}

export async function erinnerungenVerschicken(payload: Payload): Promise<number> {
  // Sonst nichts als „erinnert“ merken – die Erinnerung käme dann erst in 90 Tagen
  if (!automatischeMailsAn()) return 0
  const grenze = new Date(Date.now() - ERINNERN_NACH_TAGEN * 86400000).toISOString()
  const faellig = (
    await payload.find({
      collection: 'angebote',
      where: {
        and: [
          { aktiv: { not_equals: false } },
          { leitung: { exists: true } },
          { or: [{ bestaetigtAm: { exists: false } }, { bestaetigtAm: { less_than: grenze } }] },
          { or: [{ erinnertAm: { exists: false } }, { erinnertAm: { less_than: grenze } }] },
        ],
      } as never,
      limit: 500,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
  ).docs as unknown as Team[]
  if (!faellig.length) return 0
  const kontoIds = [...new Set(faellig.flatMap((t) => (t.leitung ?? []).map(idVon)))]
  const konten = (await payload.find({ collection: 'users', where: { id: { in: kontoIds } }, limit: 1000, pagination: false, depth: 0, overrideAccess: true })).docs as unknown as Konto[]
  const empfaenger = konten.filter((k) => !k.testkonto && k.freigegeben !== false && k.mailBenachrichtigung !== false && hasRole(k as never, 'uebungsleitung', 'teamredaktion'))
  const basis = getServerSideURL()
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle
  let mails = 0
  const erinnert = new Set<number>()
  for (const k of empfaenger) {
    const teams = faellig.filter((t) => (t.leitung ?? []).map(idVon).includes(k.id))
    if (!teams.length) continue
    const hallo = k.name ? `Hallo ${k.name.split(' ')[0]},` : 'Hallo,'
    const absaetze = [
      hallo,
      teams.length === 1
        ? `stimmen die Angaben zu „${teams[0]!.title}“ auf der Website noch? Ein Klick genügt – oder du änderst kurz, was nicht mehr passt.`
        : `stimmen die Angaben zu deinen ${teams.length} Teams auf der Website noch? Ein Klick je Team genügt – oder du änderst kurz, was nicht mehr passt.`,
    ]
    const liste = teams.map((t) => ({ titel: t.title, text: zeitenText(t.zeiten), knopf: 'Prüfen und bestätigen', link: `${basis}/team-bestaetigen?t=${bestaetigungsToken(t.id, k.id)}` }))
    const fuss =
      'Die Links gelten 30 Tage und funktionieren ohne Anmeldung. Ändern: in der Verwaltung unter Sport → „Teams & Kurse“ beim Team (danach gilt es automatisch als bestätigt). Du bekommst diese E-Mail, weil du für diese Teams eingetragen bist. Abbestellen: in der Verwaltung oben rechts → „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“ entfernen.'
    const ok = await mailSenden(payload, {
      an: k.email,
      betreff: teams.length === 1 ? `Passt noch? ${teams[0]!.title} auf der BSV-Website` : 'Passt noch? Deine Teams auf der BSV-Website',
      text: `${absaetze.join('\n\n')}\n\n${liste.map((l) => `${l.titel}\n${l.text}\n${l.link}`).join('\n\n')}\n\n${fuss}`,
      html: mailHtml({ titel: 'Passt noch?', absaetze, liste, fuss }),
    }).catch((e) => {
      payload.logger.error({ err: e }, '„Passt noch?“-Mail fehlgeschlagen')
      return false
    })
    if (ok) {
      mails++
      for (const t of teams) erinnert.add(t.id)
    }
  }
  // Teams ohne erreichbare Verantwortliche ebenfalls als „erinnert“ merken – sonst würde jeden Tag neu gesucht.
  // Sie tauchen im Monatsbericht für die Admins auf. Ist eine Mail fehlgeschlagen, wird es morgen erneut versucht.
  const erreichbar = new Set(faellig.filter((t) => empfaenger.some((k) => (t.leitung ?? []).map(idVon).includes(k.id))).map((t) => t.id))
  for (const t of faellig) if (!erreichbar.has(t.id)) erinnert.add(t.id)
  const jetzt = new Date().toISOString()
  for (const id of erinnert) await db.execute(sql`update "angebote" set "erinnert_am" = ${jetzt} where "id" = ${id}`)
  if (mails) payload.logger.info(`„Passt noch?“: ${mails} E-Mails an Trainer verschickt (${faellig.length} Teams)`)
  return mails
}
