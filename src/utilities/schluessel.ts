import crypto from 'crypto'

/**
 * Eigene Schlüssel je Zweck, abgeleitet aus ENCRYPTION_KEY (HKDF-SHA256).
 * Kein Rückfall auf andere Werte: Fehlt der Schlüssel, bricht die Funktion ab, statt mit einem
 * leeren oder fremden Schlüssel weiterzurechnen (Audit F-28).
 * Der AES-Schlüssel für IBANs (utilities/crypto.ts) bleibt unverändert, sonst wären gespeicherte IBANs unlesbar.
 *
 * Schlüsselwechsel (pnpm schluessel:wechseln): Während des Übergangs steht der vorherige Schlüssel in
 * ENCRYPTION_KEY_ALT. Er wird NUR zum Lesen und Prüfen alter Werte benutzt (IBAN, Sicherungen, Ausweis-QR,
 * Wiederherstellungscodes; nicht für den Bot-Schutz) – verschlüsselt und signiert wird immer mit ENCRYPTION_KEY.
 */
export type Zweck = 'ausweis' | 'wiederherstellung' | 'botschutz' | 'sicherung' | 'bestaetigung'

export const basisSchluessel = (): string => {
  const k = process.env.ENCRYPTION_KEY
  if (!k || k.length < 32) throw new Error('ENCRYPTION_KEY fehlt oder ist zu kurz (mind. 32 Zeichen) – siehe .env.example')
  return k
}

/** Vorheriger Schlüssel während eines Schlüsselwechsels – null, wenn keiner gesetzt (oder ungültig: meldet die Startprüfung) */
export const basisSchluesselAlt = (): string | null => {
  const k = process.env.ENCRYPTION_KEY_ALT
  if (!k || k.length < 32 || k === process.env.ENCRYPTION_KEY) return null
  return k
}

const cache = new Map<string, Buffer>()
const ableiten = (basis: string, zweck: Zweck): Buffer => {
  // Cache-Schlüssel aus dem Hash des ganzen Schlüssels – zwei Schlüssel dürfen sich nie einen Eintrag teilen
  const id = `${zweck}|${crypto.createHash('sha256').update(basis).digest('hex')}`
  let k = cache.get(id)
  if (!k) {
    k = Buffer.from(crypto.hkdfSync('sha256', basis, 'bsv-1919', `bsv:${zweck}`, 32))
    cache.set(id, k)
  }
  return k
}

export const schluessel = (zweck: Zweck): Buffer => ableiten(basisSchluessel(), zweck)

/** Derselbe Zweck-Schlüssel aus ENCRYPTION_KEY_ALT – nur zum Prüfen/Lesen alter Werte */
export const schluesselAlt = (zweck: Zweck): Buffer | null => {
  const b = basisSchluesselAlt()
  return b ? ableiten(b, zweck) : null
}

/** Zeitkonstanter Vergleich zweier Zeichenketten (unterschiedliche Länge oder kein Text: false) */
export const gleich = (a: unknown, b: unknown): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}
