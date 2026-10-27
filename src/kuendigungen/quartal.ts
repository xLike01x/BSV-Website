import { berlinDatum } from '@/utilities/berlinDatum'

const zwei = (n: number) => String(n).padStart(2, '0')

/**
 * Satzung: Eine Kündigung wirkt zum Ende des Quartals, in dem sie beim Verein eingeht (keine weitere Frist).
 * Maßgeblich ist der Kalendertag in Deutschland: Eingang am 31.12. um 23:59 Uhr → wirksam zum 31.12.,
 * Eingang am 01.01. → wirksam zum 31.03.
 * @returns letzter Tag des Quartals als „JJJJ-MM-TT“
 */
export function quartalsende(eingang: Date = new Date()): string {
  const [jahr, monat] = berlinDatum(eingang).split('-').map(Number) as [number, number]
  const letzterMonat = Math.ceil(monat / 3) * 3
  // Tag 0 des Folgemonats = letzter Tag dieses Monats
  const letzterTag = new Date(Date.UTC(jahr, letzterMonat, 0)).getUTCDate()
  return `${jahr}-${zwei(letzterMonat)}-${zwei(letzterTag)}`
}

/** Tag, an dem die Person nicht mehr Mitglied ist (Tag nach dem Quartalsende) */
export function ersterTagDanach(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
