import crypto from 'crypto'

import { basisSchluesselAlt } from './schluessel'

/**
 * Feldverschlüsselung für sensible Daten (z. B. IBAN) mit AES-256-GCM.
 * Der Schlüssel kommt aus ENCRYPTION_KEY (.env) und liegt nie in der Datenbank.
 * Ohne Schlüssel sind gespeicherte Werte in einem Datenbank-Backup nicht lesbar.
 */
const PREFIX = 'enc:v1:'

/** AES-Schlüssel aus einem Basisschlüssel (bewusst unverändert: SHA-256 des Rohschlüssels) */
export const feldSchluessel = (basis: string): Buffer => crypto.createHash('sha256').update(basis).digest()

const getKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_KEY fehlt oder ist zu kurz (mind. 32 Zeichen) – siehe .env.example')
  }
  return feldSchluessel(secret)
}

export const isEncrypted = (value: unknown): boolean => typeof value === 'string' && value.startsWith(PREFIX)

export const encryptMit = (plain: string, key: Buffer): string => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Wirft, wenn der Schlüssel nicht passt (GCM-Prüfsumme) */
export const decryptMit = (value: string, key: Buffer): string => {
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const data = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export const encrypt = (plain: string): string => {
  if (!plain || isEncrypted(plain)) return plain
  return encryptMit(plain, getKey())
}

/** Entschlüsselt mit ENCRYPTION_KEY – während eines Schlüsselwechsels notfalls mit ENCRYPTION_KEY_ALT */
export const decrypt = (value: string): string => {
  if (!isEncrypted(value)) return value
  try {
    return decryptMit(value, getKey())
  } catch (e) {
    const alt = basisSchluesselAlt()
    if (!alt) throw e
    return decryptMit(value, feldSchluessel(alt))
  }
}

/** IBAN-Prüfsumme nach ISO 13616 (Modulo 97). */
export { isValidIBAN } from './iban'

export const maskIBAN = (iban: string): string => {
  const clean = iban.replace(/\s+/g, '')
  return clean.length > 8 ? `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}` : '••••'
}
