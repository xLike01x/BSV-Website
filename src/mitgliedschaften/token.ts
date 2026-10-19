import crypto from 'crypto'

const schluessel = () => process.env.ENCRYPTION_KEY || process.env.PAYLOAD_SECRET || ''

/** Prüf-Code für den QR-Code auf dem Ausweis: Nummer + Signatur (nicht fälschbar, nicht erratbar) */
export const ausweisToken = (id: number) => {
  const sig = crypto.createHmac('sha256', schluessel()).update(`ausweis:${id}`).digest('base64url').slice(0, 22)
  return `${id.toString(36)}.${sig}`
}

export const ausweisTokenPruefen = (token: string): number | null => {
  const [teil, sig] = token.split('.')
  if (!teil || !sig || !/^[0-9a-z]{1,10}$/.test(teil)) return null
  const id = parseInt(teil, 36)
  const soll = ausweisToken(id).split('.')[1]!
  if (sig.length !== soll.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(soll))) return null
  return id
}
