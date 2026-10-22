import { sql } from '@payloadcms/db-postgres'
import type { AuthStrategy, Endpoint, Field, PayloadRequest } from 'payload'
import { JWTAuthentication } from 'payload'
import QRCode from 'qrcode'

import { mailHtml, mailSenden } from './mail'

import { decrypt, encrypt } from '../utilities/crypto'
import { testkontenErlaubt } from './testkonten'
import { codePasst, hashCode, neueWiederherstellungscodes, neuesGeheimnis, otpauthUri, pruefeCode } from './totp'

/**
 * Zwei-Faktor-Anmeldung (Authenticator-App) für alle Rollen außer „Mitglied“.
 *
 * Funktionsweise: Nach dem Passwort-Login ist die Sitzung zunächst nur auf
 * Mitglieds-Niveau. Erst wenn für genau diese Sitzung ein gültiger Code
 * eingegeben wurde, gelten die echten Rollen. Dadurch greifen alle
 * bestehenden Zugriffsregeln automatisch – ohne Sonderfälle im Code.
 *
 * Lokal zum Entwickeln abschaltbar mit ZWEI_FAKTOR=aus in der .env – auf der Live-Website nie
 * (dort startet die Website mit diesem Eintrag gar nicht, siehe utilities/startpruefung.ts).
 */
const AUS = () => process.env.ZWEI_FAKTOR === 'aus' && process.env.NODE_ENV !== 'production'
const SITZUNG_MS = 8 * 60 * 60 * 1000 // entspricht der Token-Laufzeit

type Sitzung = { sid: string; bis: string }
type ZfUser = {
  id: number
  email?: string
  roles?: string[] | null
  _sid?: string
  zweiFaktorAktiv?: boolean | null
  zweiFaktorGeheimnis?: string | null
  zweiFaktorCodes?: string[] | null
  zweiFaktorSitzungen?: Sitzung[] | null
  zweiFaktorLetzterSchritt?: number | null
  _rollen?: string[]
  zusatzrechte?: Record<string, unknown> | null
  _zusatzrechte?: Record<string, unknown> | null
  _zweiFaktorOffen?: boolean
  testkonto?: boolean | null
}

/** Verwaltungs-Zugang: jede Rolle außer „Mitglied“ – oder mindestens ein Einzelrecht (Zusatzrechte der Person) */
const istPersonal = (roles?: string[] | null, zusatz?: Record<string, unknown> | null) =>
  (roles ?? []).some((r) => r !== 'mitglied') || Object.values(zusatz ?? {}).some((v) => v === true)

/** Felder, die nie über die API sichtbar oder änderbar sind */
const geheim = { read: () => false, create: () => false, update: () => false }

export const zweiFaktorFelder: Field[] = [
  {
    name: 'zweiFaktorAktiv',
    label: 'Zwei-Faktor-Anmeldung eingerichtet',
    type: 'checkbox',
    defaultValue: false,
    access: {
      create: () => false,
      // Nur Admins dürfen zurücksetzen (Haken entfernen), z. B. bei verlorenem Handy – aber nie von Hand setzen:
      // ohne Geheimnis wäre das Konto danach ausgesperrt (Audit 2026-10 F-7). Gesetzt wird er nur beim Einrichten.
      update: ({ req, siblingData, doc }) =>
        Boolean((req.user as ZfUser | null)?.roles?.includes('admin')) && ((siblingData as { zweiFaktorAktiv?: unknown } | undefined)?.zweiFaktorAktiv !== true || (doc as { zweiFaktorAktiv?: unknown } | undefined)?.zweiFaktorAktiv === true),
    },
    admin: {
      position: 'sidebar',
      description: 'Haken entfernen setzt die Zwei-Faktor-Anmeldung zurück. Die Person richtet sie beim nächsten Login neu ein.',
    },
  },
  { name: 'zweiFaktorGeheimnis', type: 'text', access: geheim, admin: { hidden: true } },
  { name: 'zweiFaktorCodes', type: 'json', access: geheim, admin: { hidden: true } },
  { name: 'zweiFaktorSitzungen', type: 'json', access: geheim, admin: { hidden: true } },
  { name: 'zweiFaktorLetzterSchritt', type: 'number', access: geheim, admin: { hidden: true } },
  // Fehlversuche in der Datenbank (überstehen einen Neustart)
  { name: 'zweiFaktorFehler', type: 'number', access: geheim, admin: { hidden: true } },
  { name: 'zweiFaktorFehlerSeit', type: 'date', access: geheim, admin: { hidden: true } },
  // Beginn einer laufenden Einrichtung – solange darf niemand ein neues Geheimnis anfordern
  { name: 'zweiFaktorEinrichtungSeit', type: 'date', access: geheim, admin: { hidden: true } },
]

const entferneGeheimes = (u: ZfUser) => {
  delete u.zweiFaktorGeheimnis
  delete u.zweiFaktorCodes
  delete u.zweiFaktorSitzungen
  delete u.zweiFaktorLetzterSchritt
  delete (u as Record<string, unknown>).zweiFaktorFehler
  delete (u as Record<string, unknown>).zweiFaktorFehlerSeit
  delete (u as Record<string, unknown>).zweiFaktorEinrichtungSeit
}

/** Läuft vor dem Standard-Login-Token-Check und stuft unbestätigte Sitzungen herab. */
export const zweiFaktorStrategie: AuthStrategy = {
  name: 'bsv-zwei-faktor',
  authenticate: async (args) => {
    // Im Zweifel geschlossen: Wirft irgendetwas hier, gibt es KEINEN Benutzer (sonst würde Payloads
    // eingebaute Token-Prüfung danach den Nutzer mit vollen Rollen anmelden).
    let res: Awaited<ReturnType<typeof JWTAuthentication>>
    try {
      res = await JWTAuthentication({ ...args, strategyName: 'local-jwt' })
    } catch {
      return { user: null }
    }
    const u = res.user as unknown as ZfUser | null
    if (!u) return res
    u._rollen = [...(u.roles ?? [])]
    u._zusatzrechte = { ...(u.zusatzrechte ?? {}) }
    try {
      // Testkonten (nur lokal) brauchen keinen zweiten Faktor
      const testOhne2fa = Boolean(u.testkonto) && testkontenErlaubt(args.headers)
      if (!AUS() && !testOhne2fa && istPersonal(u.roles, u.zusatzrechte)) {
        const jetzt = Date.now()
        const sitzungen = Array.isArray(u.zweiFaktorSitzungen) ? u.zweiFaktorSitzungen : []
        const ok = Boolean(u._sid && sitzungen.some((s) => s?.sid === u._sid && new Date(s.bis).getTime() > jetzt))
        if (!ok) {
          // Ohne bestätigten Code: angemeldet, aber ohne jede Rolle – auch der Mitgliederbereich öffnet sich erst nach dem Code
          u.roles = []
          u.zusatzrechte = {}
          u._zweiFaktorOffen = true
        }
      }
      // Selbst registriert und noch nicht freigegeben: angemeldet, aber ohne Rechte (auch kein Mitgliederbereich)
      if ((u as { freigegeben?: boolean | null }).freigegeben === false) {
        u.roles = []
        u.zusatzrechte = {}
        ;(u as { _wartetAufFreigabe?: boolean })._wartetAufFreigabe = true
      }
    } catch {
      // Im Zweifel geschlossen: lieber gar keine Rechte als Verwaltung ohne zweiten Faktor
      u.roles = []
      u.zusatzrechte = {}
      u._zweiFaktorOffen = true
    }
    entferneGeheimes(u)
    return res
  },
}

// --- Fehlversuche begrenzen (pro Benutzer, in der Datenbank) ---
// Jeder Versuch wird VOR der Prüfung atomar gezählt (eine SQL-Anweisung), damit viele gleichzeitige Anfragen
// die Sperre nicht umgehen und ein Neustart sie nicht zurücksetzt. Ein richtiger Code setzt den Zähler zurück.
type Db = { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } }
const db = (req: PayloadRequest) => (req.payload.db as unknown as Db).drizzle
const MAX_FEHLER = 5
/** true = Versuch erlaubt (und gezählt), false = gesperrt */
const versuchReservieren = async (req: PayloadRequest, id: number): Promise<boolean> => {
  const r = await db(req).execute(sql`
    update users set
      zwei_faktor_fehler = case when zwei_faktor_fehler_seit is null or zwei_faktor_fehler_seit < now() - interval '10 minutes' then 1 else coalesce(zwei_faktor_fehler, 0) + 1 end,
      zwei_faktor_fehler_seit = case when zwei_faktor_fehler_seit is null or zwei_faktor_fehler_seit < now() - interval '10 minutes' then now() else zwei_faktor_fehler_seit end
    where id = ${id} and not (coalesce(zwei_faktor_fehler, 0) >= ${MAX_FEHLER} and zwei_faktor_fehler_seit >= now() - interval '10 minutes')
    returning id`)
  return r.rows.length > 0
}
const versuchFreigeben = async (req: PayloadRequest, id: number) => {
  await db(req).execute(sql`update users set zwei_faktor_fehler = 0, zwei_faktor_fehler_seit = null where id = ${id}`)
}
/** Zeitschritt atomar verbrauchen: derselbe Code geht nur einmal durch – auch bei gleichzeitigen Anfragen */
const schrittVerbrauchen = async (req: PayloadRequest, id: number, schritt: number) => {
  const r = await db(req).execute(sql`update users set zwei_faktor_letzter_schritt = ${schritt} where id = ${id} and (zwei_faktor_letzter_schritt is null or zwei_faktor_letzter_schritt < ${schritt}) returning id`)
  return r.rows.length > 0
}
/** Wiederherstellungscode atomar entfernen (nur wenn die Liste seit dem Lesen unverändert ist) */
const codeVerbrauchen = async (req: PayloadRequest, id: number, vorher: string[], rest: string[]) => {
  const r = await db(req).execute(sql`update users set zwei_faktor_codes = ${JSON.stringify(rest)}::jsonb where id = ${id} and zwei_faktor_codes = ${JSON.stringify(vorher)}::jsonb returning id`)
  return r.rows.length > 0
}
const EINRICHTUNG_MS = 15 * 60 * 1000

const json = (body: unknown, status = 200) => Response.json(body, { status })

/** Benutzer inkl. der geheimen Felder laden (nur serverseitig) */
const ladeVoll = async (req: PayloadRequest): Promise<ZfUser | null> => {
  const u = req.user as ZfUser | null
  if (!u) return null
  const voll = (await req.payload.findByID({ collection: 'users', id: u.id, depth: 0, overrideAccess: true, req })) as unknown as ZfUser
  voll._sid = u._sid
  voll._rollen = u._rollen
  return voll
}

const sitzungFreischalten = async (req: PayloadRequest, u: ZfUser, extra: Record<string, unknown> = {}) => {
  const jetzt = Date.now()
  const sitzungen = (u.zweiFaktorSitzungen ?? []).filter((s) => new Date(s.bis).getTime() > jetzt && s.sid !== u._sid)
  sitzungen.push({ sid: u._sid!, bis: new Date(jetzt + SITZUNG_MS).toISOString() })
  await req.payload.update({
    collection: 'users',
    id: u.id,
    data: { zweiFaktorSitzungen: sitzungen.slice(-20), ...extra } as never,
    overrideAccess: true,
    context: { zweiFaktorIntern: true },
    req,
  })
}

export const zweiFaktorEndpunkte: Endpoint[] = [
  {
    path: '/zwei-faktor/status',
    method: 'get',
    handler: async (req) => {
      const u = req.user as ZfUser | null
      if (!u) return json({ angemeldet: false })
      const rollen = u._rollen ?? u.roles ?? []
      return json({
        angemeldet: true,
        personal: istPersonal(rollen, u._zusatzrechte ?? u.zusatzrechte),
        eingerichtet: Boolean(u.zweiFaktorAktiv),
        offen: Boolean(u._zweiFaktorOffen),
        abgeschaltet: AUS() || (Boolean(u.testkonto) && testkontenErlaubt(req.headers)),
      })
    },
  },
  {
    // Schritt 1 der Einrichtung: neues Geheimnis + QR-Code
    path: '/zwei-faktor/einrichten',
    method: 'post',
    handler: async (req) => {
      const u = await ladeVoll(req)
      if (!u || !u._sid) return json({ fehler: 'Bitte zuerst anmelden.' }, 401)
      if (!istPersonal(u._rollen ?? u.roles, u._zusatzrechte ?? u.zusatzrechte)) return json({ fehler: 'Nur für Zugänge zur Verwaltung nötig.' }, 400)
      if (u.zweiFaktorAktiv) return json({ fehler: 'Die Zwei-Faktor-Anmeldung ist bereits eingerichtet.' }, 400)
      // Läuft schon eine Einrichtung (z. B. in einem anderen Fenster)? Dann kein neues Geheimnis – sonst könnte jemand
      // mit dem Passwort die Einrichtung des echten Inhabers überschreiben.
      const seit = (u as { zweiFaktorEinrichtungSeit?: string | null }).zweiFaktorEinrichtungSeit
      if (u.zweiFaktorGeheimnis && seit && Date.now() - new Date(seit).getTime() < EINRICHTUNG_MS) {
        return json({ fehler: 'Die Einrichtung wurde gerade schon gestartet (z. B. in einem anderen Fenster). Bitte dort abschließen oder in 15 Minuten neu beginnen.' }, 409)
      }
      const geheimnis = neuesGeheimnis()
      await req.payload.update({
        collection: 'users',
        id: u.id,
        data: { zweiFaktorGeheimnis: encrypt(geheimnis), zweiFaktorEinrichtungSeit: new Date().toISOString() } as never,
        overrideAccess: true,
        context: { zweiFaktorIntern: true },
        req,
      })
      const uri = otpauthUri(geheimnis, u.email ?? `Benutzer ${u.id}`)
      const qr = await QRCode.toDataURL(uri, { margin: 1, width: 240, color: { dark: '#1D1D1F', light: '#FFFFFF' } })
      return json({ qr, geheimnis: geheimnis.replace(/(.{4})/g, '$1 ').trim() })
    },
  },
  {
    // Schritt 2 der Einrichtung: ersten Code bestätigen, Wiederherstellungscodes ausgeben
    path: '/zwei-faktor/bestaetigen',
    method: 'post',
    handler: async (req) => {
      const u = await ladeVoll(req)
      if (!u || !u._sid) return json({ fehler: 'Bitte zuerst anmelden.' }, 401)
      if (u.zweiFaktorAktiv) return json({ fehler: 'Bereits eingerichtet.' }, 400)
      if (!(await versuchReservieren(req, u.id))) return json({ fehler: 'Zu viele Fehlversuche. Bitte in 10 Minuten erneut versuchen.' }, 429)
      const body = (await req.json?.().catch(() => ({}))) as { code?: string }
      const geheimnis = u.zweiFaktorGeheimnis ? decrypt(u.zweiFaktorGeheimnis) : null
      const schritt = geheimnis ? pruefeCode(geheimnis, String(body?.code ?? '')) : null
      if (!schritt || !(await schrittVerbrauchen(req, u.id, schritt))) return json({ fehler: 'Der Code stimmt nicht. Bitte den aktuellen Code aus der App eingeben.' }, 400)
      await versuchFreigeben(req, u.id)
      const codes = neueWiederherstellungscodes()
      await sitzungFreischalten(req, u, { zweiFaktorAktiv: true, zweiFaktorCodes: codes.map(hashCode), zweiFaktorEinrichtungSeit: null })
      // Zur Sicherheit Bescheid geben – falls das jemand anderes war, merkt es der echte Inhaber sofort
      if (u.email) {
        const absaetze = [
          `Für dein Konto wurde am ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} die Zwei-Faktor-Anmeldung eingerichtet.`,
          'Warst du das? Dann ist alles in Ordnung.',
          'Warst du das NICHT, melde dich bitte sofort beim Vorstand bzw. einem Admin – dann hat jemand dein Passwort.',
        ]
        await mailSenden(req.payload, { an: u.email, betreff: 'Zwei-Faktor-Anmeldung eingerichtet – BSV 1919', text: absaetze.join('\n\n'), html: mailHtml({ titel: 'Zwei-Faktor-Anmeldung eingerichtet', absaetze }) }).catch(() => {})
      }
      return json({ ok: true, wiederherstellungscodes: codes })
    },
  },
  {
    // Bei jeder Anmeldung: Code aus der App oder Wiederherstellungscode
    path: '/zwei-faktor/pruefen',
    method: 'post',
    handler: async (req) => {
      const u = await ladeVoll(req)
      if (!u || !u._sid) return json({ fehler: 'Bitte zuerst anmelden.' }, 401)
      if (!u.zweiFaktorAktiv || !u.zweiFaktorGeheimnis) return json({ fehler: 'Noch nicht eingerichtet.' }, 400)
      if (!(await versuchReservieren(req, u.id))) return json({ fehler: 'Zu viele Fehlversuche. Bitte in 10 Minuten erneut versuchen.' }, 429)
      const body = (await req.json?.().catch(() => ({}))) as { code?: string }
      const eingabe = String(body?.code ?? '').trim()

      if (/^\d{6}$/.test(eingabe.replace(/\s/g, ''))) {
        const schritt = pruefeCode(decrypt(u.zweiFaktorGeheimnis), eingabe, u.zweiFaktorLetzterSchritt ?? 0)
        if (schritt && (await schrittVerbrauchen(req, u.id, schritt))) {
          await versuchFreigeben(req, u.id)
          await sitzungFreischalten(req, u)
          return json({ ok: true })
        }
      } else {
        const codes = u.zweiFaktorCodes ?? []
        const h = codes.find((c) => codePasst(eingabe, c))
        const rest = codes.filter((c) => c !== h)
        if (h && (await codeVerbrauchen(req, u.id, codes, rest))) {
          await versuchFreigeben(req, u.id)
          await sitzungFreischalten(req, u)
          return json({ ok: true, verbleibend: rest.length })
        }
      }
      return json({ fehler: 'Der Code stimmt nicht.' }, 400)
    },
  },
]

/** Admin entfernt den Haken → alles zurücksetzen */
export const zweiFaktorZuruecksetzen = async ({
  doc,
  previousDoc,
  req,
  context,
}: {
  doc: ZfUser
  previousDoc?: ZfUser
  req: PayloadRequest
  context: Record<string, unknown>
}) => {
  if (context.zweiFaktorIntern) return doc
  if (previousDoc?.zweiFaktorAktiv && !doc.zweiFaktorAktiv) {
    await req.payload.update({
      collection: 'users',
      id: doc.id,
      data: { zweiFaktorGeheimnis: null, zweiFaktorCodes: null, zweiFaktorSitzungen: null, zweiFaktorLetzterSchritt: null, zweiFaktorFehler: null, zweiFaktorFehlerSeit: null, zweiFaktorEinrichtungSeit: null } as never,
      overrideAccess: true,
      context: { zweiFaktorIntern: true },
      req,
    })
  }
  return doc
}

/**
 * /api/users/me: Ohne bestätigten Code die herabgestuften Rollen zeigen (nicht die echten) –
 * wer nur das Passwort kennt, soll nicht erfahren, welche Rechte das Konto hätte (Audit I-01).
 */
/** Für Feldrechte: echte Rollen/Rechte nur mit bestätigtem zweiten Faktor lesbar (Audit 2026-10 F-4) */
export const ohneOffenenZweitenFaktor = ({ req }: { req: PayloadRequest }) => !(req.user as ZfUser | null)?._zweiFaktorOffen

/**
 * Antwort auf Anmeldung und „Passwort zurücksetzen“: Für Verwaltungskonten ist der zweite Faktor direkt danach noch offen
 * (neue Sitzung) – deshalb auch hier keine echten Rollen zeigen.
 */
export const loginHerabgestuft = ({ operation, req, result }: { operation: string; req: PayloadRequest; result: unknown }) => {
  // Auch „Passwort zurücksetzen“ meldet an und antwortet mit dem Konto – der zweite Faktor ist dort ebenso offen
  if (operation !== 'login' && operation !== 'resetPassword') return result
  const r = result as { user?: ZfUser & { teamsVerantwortlich?: unknown } } | null
  const u = r?.user
  if (u && !AUS() && !(Boolean(u.testkonto) && testkontenErlaubt(req.headers)) && istPersonal(u.roles, u.zusatzrechte)) {
    u.roles = []
    u.zusatzrechte = {}
    u.teamsVerantwortlich = []
  }
  return result
}

export const meHerabgestuft = ({ req, response }: { req: PayloadRequest; response: unknown }) => {
  const u = req.user as ZfUser | null
  const r = response as { user?: { roles?: string[]; zusatzrechte?: unknown } } | null
  if (u?._zweiFaktorOffen && r?.user) {
    r.user.roles = []
    r.user.zusatzrechte = {}
  }
  return response
}
