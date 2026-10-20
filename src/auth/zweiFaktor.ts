import type { AuthStrategy, Endpoint, Field, PayloadRequest } from 'payload'
import { JWTAuthentication } from 'payload'
import QRCode from 'qrcode'

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
      // Nur Admins dürfen zurücksetzen (Haken entfernen), z. B. bei verlorenem Handy
      update: ({ req }) => Boolean((req.user as ZfUser | null)?.roles?.includes('admin')),
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
]

const entferneGeheimes = (u: ZfUser) => {
  delete u.zweiFaktorGeheimnis
  delete u.zweiFaktorCodes
  delete u.zweiFaktorSitzungen
  delete u.zweiFaktorLetzterSchritt
}

/** Läuft vor dem Standard-Login-Token-Check und stuft unbestätigte Sitzungen herab. */
export const zweiFaktorStrategie: AuthStrategy = {
  name: 'bsv-zwei-faktor',
  authenticate: async (args) => {
    const res = await JWTAuthentication({ ...args, strategyName: 'local-jwt' })
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

// --- Fehlversuche begrenzen (pro Benutzer, im Arbeitsspeicher) ---
// Jeder Versuch wird VOR der Prüfung gezählt (ohne await dazwischen), damit viele gleichzeitige
// Anfragen die Sperre nicht umgehen. Ein richtiger Code gibt seinen Versuch wieder frei.
const fehlversuche = new Map<number, number[]>()
const aktuelle = (id: number) => (fehlversuche.get(id) ?? []).filter((t) => Date.now() - t < 10 * 60 * 1000)
/** Gibt einen Zeitstempel zurück, wenn ein Versuch erlaubt ist – sonst null (gesperrt) */
const versuchReservieren = (id: number): number | null => {
  const liste = aktuelle(id)
  if (liste.length >= 5) return null
  const t = Date.now() + Math.random()
  fehlversuche.set(id, [...liste, t])
  return t
}
const versuchFreigeben = (id: number, t: number) => fehlversuche.set(id, aktuelle(id).filter((x) => x !== t))

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
      const geheimnis = neuesGeheimnis()
      await req.payload.update({
        collection: 'users',
        id: u.id,
        data: { zweiFaktorGeheimnis: encrypt(geheimnis) } as never,
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
      const versuch = versuchReservieren(u.id)
      if (versuch === null) return json({ fehler: 'Zu viele Fehlversuche. Bitte in 10 Minuten erneut versuchen.' }, 429)
      const body = (await req.json?.().catch(() => ({}))) as { code?: string }
      const geheimnis = u.zweiFaktorGeheimnis ? decrypt(u.zweiFaktorGeheimnis) : null
      const schritt = geheimnis ? pruefeCode(geheimnis, String(body?.code ?? '')) : null
      if (!schritt) return json({ fehler: 'Der Code stimmt nicht. Bitte den aktuellen Code aus der App eingeben.' }, 400)
      versuchFreigeben(u.id, versuch)
      const codes = neueWiederherstellungscodes()
      await sitzungFreischalten(req, u, { zweiFaktorAktiv: true, zweiFaktorCodes: codes.map(hashCode), zweiFaktorLetzterSchritt: schritt })
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
      const versuch = versuchReservieren(u.id)
      if (versuch === null) return json({ fehler: 'Zu viele Fehlversuche. Bitte in 10 Minuten erneut versuchen.' }, 429)
      const body = (await req.json?.().catch(() => ({}))) as { code?: string }
      const eingabe = String(body?.code ?? '').trim()

      if (/^\d{6}$/.test(eingabe.replace(/\s/g, ''))) {
        const schritt = pruefeCode(decrypt(u.zweiFaktorGeheimnis), eingabe, u.zweiFaktorLetzterSchritt ?? 0)
        if (schritt) {
          versuchFreigeben(u.id, versuch)
          await sitzungFreischalten(req, u, { zweiFaktorLetzterSchritt: schritt })
          return json({ ok: true })
        }
      } else {
        const codes = u.zweiFaktorCodes ?? []
        const h = codes.find((c) => codePasst(eingabe, c))
        if (h) {
          versuchFreigeben(u.id, versuch)
          const rest = codes.filter((c) => c !== h)
          await sitzungFreischalten(req, u, { zweiFaktorCodes: rest })
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
      data: { zweiFaktorGeheimnis: null, zweiFaktorCodes: null, zweiFaktorSitzungen: null, zweiFaktorLetzterSchritt: null } as never,
      overrideAccess: true,
      context: { zweiFaktorIntern: true },
      req,
    })
  }
  return doc
}
