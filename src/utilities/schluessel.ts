import crypto from 'crypto'

/**
 * Eigene Schlüssel je Zweck, abgeleitet aus ENCRYPTION_KEY (HKDF-SHA256).
 * Kein Rückfall auf andere Werte: Fehlt der Schlüssel, bricht die Funktion ab, statt mit einem
 * leeren oder fremden Schlüssel weiterzurechnen (Audit F-28).
 * Der AES-Schlüssel für IBANs (utilities/crypto.ts) bleibt unverändert, sonst wären gespeicherte IBANs unlesbar.
 */
export type Zweck = 'ausweis' | 'wiederherstellung' | 'botschutz' | 'sicherung'

export const basisSchluessel = (): string => {
  const k = process.env.ENCRYPTION_KEY
  if (!k || k.length < 32) throw new Error('ENCRYPTION_KEY fehlt oder ist zu kurz (mind. 32 Zeichen) – siehe .env.example')
  return k
}

const cache = new Map<string, Buffer>()
export const schluessel = (zweck: Zweck): Buffer => {
  const basis = basisSchluessel()
  const id = `${zweck}|${basis.length}|${basis.slice(0, 4)}`
  let k = cache.get(id)
  if (!k) {
    k = Buffer.from(crypto.hkdfSync('sha256', basis, 'bsv-1919', `bsv:${zweck}`, 32))
    cache.set(id, k)
  }
  return k
}
