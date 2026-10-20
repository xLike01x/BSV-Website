import crypto from 'crypto'

import { gleich, schluessel, schluesselAlt } from '@/utilities/schluessel'

const signatur = (id: number, k: Buffer) => crypto.createHmac('sha256', k).update(`ausweis:${id}`).digest('base64url').slice(0, 22)

/** Prüf-Code für den QR-Code auf dem Ausweis: Nummer + Signatur (nicht fälschbar, nicht erratbar) */
export const ausweisToken = (id: number) => `${id.toString(36)}.${signatur(id, schluessel('ausweis'))}`

export const ausweisTokenPruefen = (token: string): number | null => {
  const [teil, sig] = token.split('.')
  if (!teil || !sig || !/^[0-9a-z]{1,10}$/.test(teil)) return null
  const id = parseInt(teil, 36)
  if (gleich(sig, signatur(id, schluessel('ausweis')))) return id
  // Während eines Schlüsselwechsels gelten gedruckte Ausweise mit dem alten Schlüssel weiter
  const alt = schluesselAlt('ausweis')
  return alt && gleich(sig, signatur(id, alt)) ? id : null
}
