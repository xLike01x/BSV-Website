import crypto from 'crypto'
import type { CollectionAfterErrorHook, CollectionBeforeChangeHook, CollectionBeforeOperationHook, Field, PayloadRequest } from 'payload'
import { APIError, AuthenticationError, LockedAuth } from 'payload'

import { anschluss, ratenGrenze } from '@/hooks/spamSchutz'
import { clientIp } from '@/utilities/clientIp'

import { MAX_LAENGE, MIN_LAENGE, passwortFehler, passwortRegeln } from './passwortRegeln'

/**
 * Passwort-Regeln und Login-Bremse für Benutzerkonten (Audit F-08, F-09):
 * - Regeln aus passwortRegeln.ts (10–200 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen, keine häufigen Passwörter,
 *   keine Reihen, nicht Name/E-Mail) – überall (Registrierung, Zurücksetzen, Ändern, Anlegen durch die Verwaltung)
 * - Eigenes Passwort ändern nur mit dem aktuellen Passwort (sonst reicht eine fremde, offene Sitzung zur Übernahme)
 * - Anmelden: höchstens 20 Versuche je Anschluss (IPv6: je /64-Netz) und 600 für alle in 10 Minuten
 * - Sperre je Konto UND Anschluss: 5 Fehlversuche von einem Anschluss sperren nur diesen Anschluss für dieses Konto
 *   10 Minuten – wer von fremden Anschlüssen rät, sperrt den echten Inhaber nicht aus. Zusätzlich sperrt Payload
 *   das Konto ganz nach 100 Fehlversuchen von überall (Schutz gegen verteiltes Raten, siehe Users → maxLoginAttempts)
 * - Anmelden mit unbekannter E-Mail oder gesperrtem Konto dauert genauso lange und meldet dasselbe wie ein falsches
 *   Passwort (verrät nicht, wer ein Konto hat – siehe anmeldeFehlerEinheitlich)
 */

const pbkdf2 = (pw: string, salt: string, it: number, len: number) =>
  new Promise<Buffer>((ok, fehler) => crypto.pbkdf2(pw, salt, it, len, 'sha256', (e, b) => (e ? fehler(e) : ok(b))))

/** Gleiche Parameter wie Payload (aktuell: pbkdf2-sha256-v1, 600.000 Runden; ältere Hashes: 25.000 Runden) */
export async function passwortStimmt(pw: string, hash?: string | null, salt?: string | null): Promise<boolean> {
  if (!hash || !salt) return false
  const neu = hash.startsWith('pbkdf2-sha256-v1:')
  const soll = Buffer.from(neu ? hash.slice('pbkdf2-sha256-v1:'.length) : hash, 'hex')
  const ist = await pbkdf2(pw, salt, neu ? 600000 : 25000, neu ? 32 : 512)
  return ist.length === soll.length && crypto.timingSafeEqual(ist, soll)
}

type Konto = { name?: string | null; email?: string | null }

/**
 * Konto zu einem NOCH GÜLTIGEN Link aus „Passwort vergessen“ (wer ihn hat, ist die Person selbst).
 * Bei abgelaufenen/benutzten Links nichts verraten.
 */
async function kontoZumLink(req: PayloadRequest, token: unknown): Promise<Konto> {
  if (typeof token !== 'string' || !token) return {}
  const k = (await req.payload.db
    .findOne({ collection: 'users', where: { and: [{ resetPasswordToken: { equals: token } }, { resetPasswordExpiration: { greater_than: new Date().toISOString() } }] }, req })
    .catch(() => null)) as Konto | null
  return k ?? {}
}

const passwortPruefen = (pw: unknown, konto: Konto, testkontenAnlage: boolean) => {
  if (typeof pw !== 'string') return
  // Anlage der Testkonten (nur lokal, nur aus dem Server-Code, festes Testpasswort): nur Länge und Zeichenarten
  const fehler = testkontenAnlage
    ? passwortRegeln(pw).some((r) => !r.ok)
      ? `Das Passwort braucht ${MIN_LAENGE} bis ${MAX_LAENGE} Zeichen mit Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.`
      : null
    : passwortFehler(pw, konto)
  if (fehler) throw new APIError(fehler, 400)
}

const eigenesKonto = (req: PayloadRequest, id: unknown) => req.user && id != null && String(id) === String(req.user.id)

// --- Sperre je Konto und Anschluss (im Arbeitsspeicher; die Website läuft als genau eine Instanz) ---
const FEHL_FENSTER_MS = 10 * 60 * 1000
const FEHL_MAX = 5
const fehlversuche = new Map<string, number[]>()
const fehlSchluessel = (req: Pick<PayloadRequest, 'headers'>, email: string) => {
  const ip = clientIp(req.headers)
  return `${ip === 'unbekannt' ? ip : anschluss(ip)}|${email}`
}
const emailAus = (v: unknown) => String(v ?? '').toLowerCase().trim().slice(0, 200)
const offeneFehlversuche = (schluessel: string) => {
  const jetzt = Date.now()
  const liste = (fehlversuche.get(schluessel) ?? []).filter((t) => jetzt - t < FEHL_FENSTER_MS)
  if (liste.length) fehlversuche.set(schluessel, liste)
  else fehlversuche.delete(schluessel)
  return liste
}
const fehlversuchMerken = (req: PayloadRequest) => {
  const email = emailAus((req.data as { email?: unknown } | undefined)?.email)
  if (!email || !req.headers) return
  const s = fehlSchluessel(req, email)
  fehlversuche.set(s, [...offeneFehlversuche(s), Date.now()])
  if (fehlversuche.size > 20000) for (const k of [...fehlversuche.keys()]) offeneFehlversuche(k)
}
/** Nach erfolgreicher Anmeldung bzw. neuem Passwort: Fehlversuche dieses Kontos von DIESEM Anschluss vergessen
 *  (andere Anschlüsse bleiben gesperrt – sonst bekäme ein Angreifer nach jeder Anmeldung des Inhabers neue Versuche) */
const fehlversucheVergessen = (req: PayloadRequest, email: unknown) => {
  const e = emailAus(email)
  if (e && req.headers) fehlversuche.delete(fehlSchluessel(req, e))
}
export const anmeldungGeklappt = ({ req, user }: { req: PayloadRequest; user: { email?: string | null } }) => {
  fehlversucheVergessen(req, user?.email)
}
export const passwortNeuGesetzt = ({ operation, req, result }: { operation: string; req: PayloadRequest; result: unknown }) => {
  if (operation === 'resetPassword') fehlversucheVergessen(req, (result as { user?: { email?: string } } | null)?.user?.email)
  return result
}

export const passwortUndLogin: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  const a = args as { data?: Record<string, unknown>; id?: unknown }
  // Kein Passwort aus Zahlen/Listen (sonst Absturz bzw. stilles Ignorieren)
  if ((operation === 'create' || operation === 'update' || operation === 'resetPassword') && a.data && 'password' in a.data && a.data.password != null && typeof a.data.password !== 'string')
    throw new APIError('Ungültiges Passwort.', 400)
  // Passwörter nur einzeln ändern – ein Sammel-Update (per where) umginge „aktuelles Passwort“
  if (operation === 'update' && a.id == null && typeof a.data?.password === 'string' && req.user) throw new APIError('Passwörter bitte nur einzeln ändern.', 400)
  if (operation === 'login' && req.headers) {
    ratenGrenze(req, 'login', 20, 600)
    const email = emailAus(a.data?.email)
    const pw = String(a.data?.password ?? '')
    const vorhanden = (email ? await req.payload.db.findOne({ collection: 'users', where: { email: { equals: email } }, req }) : null) as { lockUntil?: string | null } | null
    // Unbekannte E-Mail oder gesperrtes Konto: einmal „umsonst“ rechnen – Payload bricht dort ohne Passwortprüfung ab,
    // die Antwort käme sonst schneller und verriete, dass es das Konto gibt
    const gesperrt = Boolean(vorhanden?.lockUntil && new Date(vorhanden.lockUntil) > new Date())
    // Dieser Anschluss hat für diese E-Mail schon 5 Fehlversuche: abweisen – mit gleicher Rechenzeit und Meldung wie ein
    // falsches Passwort, und unabhängig davon, ob es das Konto gibt
    const anschlussGesperrt = Boolean(email) && offeneFehlversuche(fehlSchluessel(req, email)).length >= FEHL_MAX
    if (!vorhanden || gesperrt || anschlussGesperrt) await pbkdf2(pw || 'x', crypto.randomBytes(32).toString('hex'), 600000, 32)
    if (anschlussGesperrt) throw new APIError(ANMELDEFEHLER, 401)
  }
  if (operation === 'forgotPassword' && req.headers) ratenGrenze(req, 'passwort-vergessen', 5, 50)
  // Hier läuft die Prüfung VOR der Rechteprüfung von Payload – deshalb ohne Daten fremder Konten (sonst ließen sich
  // Namen erraten). Name/E-Mail beim Ändern prüft passwortNichtPersoenlich (nach der Rechteprüfung).
  if ((operation === 'create' || operation === 'update' || operation === 'resetPassword') && typeof a.data?.password === 'string') {
    const konto: Konto = operation === 'create' ? (a.data as Konto) : operation === 'resetPassword' ? await kontoZumLink(req, a.data.token) : {}
    passwortPruefen(a.data.password, konto, req.context?.bsvTestkonto === true)
  }
  if (operation === 'update' && typeof a.data?.password === 'string' && eigenesKonto(req, a.id)) {
    const aktuell = String(a.data.aktuellesPasswort ?? '')
    const ich = (await req.payload.db.findOne({ collection: 'users', where: { id: { equals: req.user!.id } }, req })) as { hash?: string; salt?: string } | null
    if (!aktuell || !(await passwortStimmt(aktuell, ich?.hash, ich?.salt))) {
      throw new APIError('Bitte zum Ändern dein aktuelles Passwort eingeben (Feld „Aktuelles Passwort“).', 400)
    }
  }
  if (a.data && 'aktuellesPasswort' in a.data) delete a.data.aktuellesPasswort
  return args
}

/** Beim Ändern: Passwort darf Name/E-Mail des Kontos nicht enthalten – erst nach der Rechteprüfung (beforeChange) */
export const passwortNichtPersoenlich: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || typeof data?.password !== 'string' || req.context?.bsvTestkonto === true) return data
  const fehler = passwortFehler(data.password, { name: data.name ?? originalDoc?.name, email: data.email ?? originalDoc?.email })
  if (fehler) throw new APIError(fehler, 400)
  return data
}

/** Feld „Aktuelles Passwort“ – erscheint nur beim Ändern des eigenen Passworts, wird nie gespeichert */
export const aktuellesPasswortFeld: Field = {
  name: 'aktuellesPasswort',
  type: 'text',
  virtual: true,
  admin: { components: { Field: '@/components/Admin/AktuellesPasswort' } },
}

/** Gleiche Meldung für „falsches Passwort“, „unbekannte E-Mail“ und „Konto gesperrt“ (sonst verrät die Sperre, dass es das Konto gibt) */
export const ANMELDEFEHLER = 'E-Mail oder Passwort stimmen nicht. Nach 5 Fehlversuchen ist die Anmeldung für 10 Minuten gesperrt.'
export const anmeldeFehlerEinheitlich: CollectionAfterErrorHook = ({ error, req }) => {
  // instanceof statt Klassenname (der kann im Produktions-Build verkürzt sein)
  if (error instanceof LockedAuth || error instanceof AuthenticationError) {
    // Falsches Passwort, unbekannte E-Mail oder gesperrtes Konto: für Konto + Anschluss zählen
    fehlversuchMerken(req)
    return { response: { errors: [{ message: ANMELDEFEHLER }] }, status: 401 }
  }
}
