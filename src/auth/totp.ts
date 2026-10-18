import crypto from 'crypto'

/**
 * TOTP nach RFC 6238 (30-Sekunden-Takt, 6 Stellen, SHA-1) – kompatibel mit
 * Google Authenticator, Microsoft Authenticator, Apple Passwörter, 1Password usw.
 */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const neuesGeheimnis = (bytes = 20): string => {
  const buf = crypto.randomBytes(bytes)
  let bits = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)]
  return out
}

const base32Decode = (s: string): Buffer => {
  const clean = s.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase()
  let bits = ''
  for (const c of clean) {
    const v = B32.indexOf(c)
    if (v < 0) throw new Error('Ungültiges Base32')
    bits += v.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

const hotp = (secret: Buffer, counter: number): string => {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = crypto.createHmac('sha1', secret).update(msg).digest()
  const off = h[h.length - 1]! & 0xf
  const code = ((h[off]! & 0x7f) << 24) | (h[off + 1]! << 16) | (h[off + 2]! << 8) | h[off + 3]!
  return String(code % 1_000_000).padStart(6, '0')
}

export const zeitschritt = (t = Date.now()) => Math.floor(t / 1000 / 30)

/**
 * Prüft einen Code mit ±1 Zeitschritt Toleranz (Uhren gehen nicht immer genau).
 * Gibt den getroffenen Zeitschritt zurück (für Schutz gegen Wiederverwendung) oder null.
 */
export const pruefeCode = (geheimnis: string, code: string, nichtVor = 0): number | null => {
  const c = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(c)) return null
  const key = base32Decode(geheimnis)
  const jetzt = zeitschritt()
  for (const d of [0, -1, 1]) {
    const schritt = jetzt + d
    if (schritt <= nichtVor) continue
    const erwartet = hotp(key, schritt)
    if (crypto.timingSafeEqual(Buffer.from(erwartet), Buffer.from(c))) return schritt
  }
  return null
}

export const otpauthUri = (geheimnis: string, konto: string, aussteller = 'BSV 1919') =>
  `otpauth://totp/${encodeURIComponent(aussteller)}:${encodeURIComponent(konto)}?secret=${geheimnis}&issuer=${encodeURIComponent(aussteller)}&algorithm=SHA1&digits=6&period=30`

/** Wiederherstellungscodes im Format ABCD-EFGH (ohne verwechselbare Zeichen) */
export const neueWiederherstellungscodes = (anzahl = 10): string[] => {
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: anzahl }, () => {
    const b = crypto.randomBytes(8)
    const s = Array.from(b, (x) => zeichen[x % zeichen.length]).join('')
    return `${s.slice(0, 4)}-${s.slice(4)}`
  })
}

const normal = (code: string) => code.replace(/[\s-]/g, '').toUpperCase()
/** Wiederherstellungscode speichern: HMAC mit Server-Schlüssel (ein Datenbank-Auszug allein reicht nicht zum Durchprobieren) */
export const hashCode = (code: string) => {
  const schluessel = process.env.ENCRYPTION_KEY || process.env.PAYLOAD_SECRET || ''
  return 'h1:' + crypto.createHmac('sha256', schluessel).update(normal(code)).digest('hex')
}
/** Prüft gegen neues (h1:) und altes Format (reines SHA-256) – zeitkonstant */
export const codePasst = (eingabe: string, gespeichert: string) => {
  const soll = gespeichert.startsWith('h1:') ? hashCode(eingabe) : crypto.createHash('sha256').update(normal(eingabe)).digest('hex')
  const a = Buffer.from(soll)
  const b = Buffer.from(gespeichert)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
