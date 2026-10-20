import crypto from 'crypto'

/**
 * Feldverschlüsselung für sensible Daten (z. B. IBAN) mit AES-256-GCM.
 * Der Schlüssel kommt aus ENCRYPTION_KEY (.env) und liegt nie in der Datenbank.
 * Ohne Schlüssel sind gespeicherte Werte in einem Datenbank-Backup nicht lesbar.
 */
const PREFIX = 'enc:v1:'

const getKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_KEY fehlt oder ist zu kurz (mind. 32 Zeichen) – siehe .env.example')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

export const isEncrypted = (value: unknown): boolean => typeof value === 'string' && value.startsWith(PREFIX)

export const encrypt = (plain: string): string => {
  if (!plain || isEncrypted(plain)) return plain
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

export const decrypt = (value: string): string => {
  if (!isEncrypted(value)) return value
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const data = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/** IBAN-Prüfsumme nach ISO 13616 (Modulo 97). */
export { isValidIBAN } from './iban'

export const maskIBAN = (iban: string): string => {
  const clean = iban.replace(/\s+/g, '')
  return clean.length > 8 ? `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}` : '••••'
}
