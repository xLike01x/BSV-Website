import type { Where } from 'payload'

import type { Termine } from '@/payload-types'

/**
 * Wiederkehrende Termine: Aus einem Termin mit „Wiederholung“ werden die einzelnen Vorkommen berechnet.
 * Gerechnet wird in deutscher Zeit – „jeden Dienstag 19 Uhr“ bleibt auch nach der Zeitumstellung 19 Uhr.
 */
export type Vorkommen = Termine & { _vorkommen?: number }
type Wdh = { wiederholung?: string | null; wiederholungBis?: string | null; auslassen?: { datum?: string | null }[] | null }

const TZ = 'Europe/Berlin'
const teile = (d: Date) => {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  const o = Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]))
  return { y: +o.year!, m: +o.month!, d: +o.day!, h: +o.hour!, mi: +o.minute!, s: +o.second! }
}
/** Lokale Berliner Zeit → echter Zeitpunkt */
const ausLokal = (y: number, m: number, d: number, h: number, mi: number, s: number) => {
  let t = Date.UTC(y, m - 1, d, h, mi, s)
  for (let i = 0; i < 2; i++) {
    const p = teile(new Date(t))
    t -= Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Date.UTC(y, m - 1, d, h, mi, s)
  }
  return new Date(t)
}
export const berlinTag = (d: Date | string) => new Date(d).toLocaleDateString('sv-SE', { timeZone: TZ })

/** n-tes Vorkommen ab dem Start (null, wenn es den Tag nicht gibt, z. B. 31. im Februar) */
function verschieben(start: Date, art: string, n: number): Date | null {
  const p = teile(start)
  if (art === 'monatlich') {
    const zielMonat = p.m - 1 + n
    const y = p.y + Math.floor(zielMonat / 12)
    const m = (zielMonat % 12) + 1
    const letzterTag = new Date(Date.UTC(y, m, 0)).getUTCDate()
    if (p.d > letzterTag) return null
    return ausLokal(y, m, p.d, p.h, p.mi, p.s)
  }
  const tage = n * (art === 'zweiwoechentlich' ? 14 : 7)
  const tag = new Date(Date.UTC(p.y, p.m - 1, p.d + tage))
  return ausLokal(tag.getUTCFullYear(), tag.getUTCMonth() + 1, tag.getUTCDate(), p.h, p.mi, p.s)
}

/** Alle Vorkommen eines Termins im Zeitraum [ab, bis] (höchstens max) */
export function vorkommen(t: Termine, ab: Date, bis: Date, max = 120): Vorkommen[] {
  const w = t as Termine & Wdh
  const art = w.wiederholung && w.wiederholung !== 'keine' ? w.wiederholung : null
  if (!art || !w.wiederholungBis) return new Date(t.beginn) >= ab && new Date(t.beginn) <= bis ? [t] : []
  const start = new Date(t.beginn)
  const dauer = t.ende ? new Date(t.ende).getTime() - start.getTime() : null
  const ende = new Date(Math.min(new Date(w.wiederholungBis).getTime() + 86400000, bis.getTime()))
  const ohne = new Set((w.auslassen ?? []).map((a) => (a.datum ? berlinTag(a.datum) : '')).filter(Boolean))
  const out: Vorkommen[] = []
  for (let n = 0; n < 800 && out.length < max; n++) {
    const b = verschieben(start, art, n)
    if (!b) continue
    if (b > ende) break
    if (b < ab || ohne.has(berlinTag(b))) continue
    out.push({ ...t, beginn: b.toISOString(), ende: dauer !== null ? new Date(b.getTime() + dauer).toISOString() : t.ende, _vorkommen: n })
  }
  return out
}

/** Liste von Terminen in Einzeltermine auflösen, sortieren und begrenzen */
export function aufloesen(termine: Termine[], ab: Date, bis: Date, limit = 500): Vorkommen[] {
  return termine
    .flatMap((t) => vorkommen(t, ab, bis))
    .sort((a, b) => new Date(a.beginn).getTime() - new Date(b.beginn).getTime())
    .slice(0, limit)
}

/** Datenbank-Filter: normale Termine ab „ab“ – oder Serien, die bis mindestens „ab“ laufen */
export const abFilter = (ab: Date): Where => ({
  or: [{ beginn: { greater_than_equal: ab.toISOString() } }, { and: [{ wiederholung: { in: ['woechentlich', 'zweiwoechentlich', 'monatlich'] } }, { wiederholungBis: { greater_than_equal: ab.toISOString() } }] }],
})

/** Eindeutiger Schlüssel/Anker pro Vorkommen */
export const terminSchluessel = (t: Vorkommen) => (t._vorkommen ? `${t.id}-${t._vorkommen}` : String(t.id))
