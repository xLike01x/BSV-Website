import crypto from 'crypto'
import type { CollectionBeforeOperationHook, Field, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { ratenGrenze } from '@/hooks/spamSchutz'

import { MAX_LAENGE, MIN_LAENGE, passwortFehler, passwortRegeln } from './passwortRegeln'

/**
 * Passwort-Regeln und Login-Bremse für Benutzerkonten (Audit F-08, F-09):
 * - Regeln aus passwortRegeln.ts (10–200 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen, keine häufigen Passwörter,
 *   keine Reihen, nicht Name/E-Mail) – überall (Registrierung, Zurücksetzen, Ändern, Anlegen durch die Verwaltung)
 * - Eigenes Passwort ändern nur mit dem aktuellen Passwort (sonst reicht eine fremde, offene Sitzung zur Übernahme)
 * - Anmelden: höchstens 20 Versuche je Adresse und 300 für alle in 10 Minuten (zusätzlich zur Kontosperre nach 5 Fehlversuchen)
 * - Anmelden mit unbekannter E-Mail dauert genauso lange wie mit falschem Passwort (verrät nicht, wer ein Konto hat)
 */

const pbkdf2 = (pw: string, salt: string, it: number, len: number) =>
  new Promise<Buffer>((ok, fehler) => crypto.pbkdf2(pw, salt, it, len, 'sha256', (e, b) => (e ? fehler(e) : ok(b))))

/** Gleiche Parameter wie Payload (aktuell: pbkdf2-sha256-v1, 600.000 Runden; ältere Hashes: 25.000 Runden) */
async function passwortStimmt(pw: string, hash?: string | null, salt?: string | null): Promise<boolean> {
  if (!hash || !salt) return false
  const neu = hash.startsWith('pbkdf2-sha256-v1:')
  const soll = Buffer.from(neu ? hash.slice('pbkdf2-sha256-v1:'.length) : hash, 'hex')
  const ist = await pbkdf2(pw, salt, neu ? 600000 : 25000, neu ? 32 : 512)
  return ist.length === soll.length && crypto.timingSafeEqual(ist, soll)
}

type Konto = { name?: string | null; email?: string | null }

/** Name und E-Mail der Person, deren Passwort gesetzt wird (für „nicht den eigenen Namen“) */
async function kontoZumPasswort(req: PayloadRequest, operation: string, a: { data?: Record<string, unknown>; id?: unknown }): Promise<Konto> {
  const d = (a.data ?? {}) as Konto
  if (operation === 'create' || (operation === 'update' && a.id == null)) return d
  const where: Where = operation === 'resetPassword' ? { resetPasswordToken: { equals: String(a.data?.token ?? '') } } : { id: { equals: a.id } }
  const vorhanden = (await req.payload.db.findOne({ collection: 'users', where, req }).catch(() => null)) as Konto | null
  return { name: d.name ?? vorhanden?.name, email: d.email ?? vorhanden?.email }
}

const passwortPruefen = (pw: unknown, konto: Konto, testkontenAnlage: boolean) => {
  if (typeof pw !== 'string') return
  // Anlage der Testkonten (nur lokal, nur aus dem Server-Code, festes Testpasswort): nur Länge und Zeichenarten
  const fehler = testkontenAnlage
    ? pw.length < MIN_LAENGE || pw.length > MAX_LAENGE || passwortRegeln(pw).some((r) => !r.ok)
      ? `Das Passwort braucht ${MIN_LAENGE} bis ${MAX_LAENGE} Zeichen mit Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.`
      : null
    : passwortFehler(pw, konto)
  if (fehler) throw new APIError(fehler, 400)
}

const eigenesKonto = (req: PayloadRequest, id: unknown) => req.user && id != null && String(id) === String(req.user.id)

export const passwortUndLogin: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  const a = args as { data?: Record<string, unknown>; id?: unknown }
  if (operation === 'login' && req.headers) {
    ratenGrenze(req, 'login', 20, 300)
    const email = String(a.data?.email ?? '').toLowerCase().trim()
    const pw = String(a.data?.password ?? '')
    const vorhanden = email ? await req.payload.db.findOne({ collection: 'users', where: { email: { equals: email } }, req }) : null
    // Unbekannte E-Mail: einmal „umsonst“ rechnen, damit die Antwort nicht schneller kommt
    if (!vorhanden) await pbkdf2(pw || 'x', crypto.randomBytes(32).toString('hex'), 600000, 32)
  }
  if (operation === 'forgotPassword' && req.headers) ratenGrenze(req, 'passwort-vergessen', 5, 50)
  if ((operation === 'create' || operation === 'update' || operation === 'resetPassword') && typeof a.data?.password === 'string') {
    passwortPruefen(a.data.password, await kontoZumPasswort(req, operation, a), req.context?.bsvTestkonto === true)
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

/** Feld „Aktuelles Passwort“ – erscheint nur beim Ändern des eigenen Passworts, wird nie gespeichert */
export const aktuellesPasswortFeld: Field = {
  name: 'aktuellesPasswort',
  type: 'text',
  virtual: true,
  admin: { components: { Field: '@/components/Admin/AktuellesPasswort' } },
}
