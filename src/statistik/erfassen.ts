import { createHash, randomBytes } from 'crypto'
import type { Payload } from 'payload'

import { hatEinzelrechte } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'

export type Ereignis = { art: 'aufruf' | 'schritt' | 'suche'; pfad?: string; referrer?: string; utm?: string; schritt?: number; suchbegriff?: string; treffer?: number }

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i

// Täglich wechselnder Zufallswert – nur im Arbeitsspeicher, wird nie gespeichert
const g = globalThis as unknown as { __bsvSalz?: { tag: string; wert: string } }
const heute = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
const salz = (tag: string) => {
  if (g.__bsvSalz?.tag !== tag) g.__bsvSalz = { tag, wert: randomBytes(32).toString('hex') }
  return g.__bsvSalz.wert
}

const ipVon = (h: Headers) => h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unbekannt'

const geraetVon = (ua: string) => (/ipad|tablet|kindle|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua)) ? 'tablet' : /mobi|iphone|ipod|android/i.test(ua) ? 'handy' : 'computer')

/** Herkunft aus Referrer bzw. ?utm_source=… – nur der Name, nie die vollständige Adresse */
const BEKANNT: [RegExp, string][] = [
  [/(^|\.)google\./, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/duckduckgo\.com$/, 'DuckDuckGo'],
  [/ecosia\.org$/, 'Ecosia'],
  [/instagram\.com$/, 'Instagram'],
  [/(facebook\.com|fb\.me|fb\.com)$/, 'Facebook'],
  [/(whatsapp\.com|wa\.me)$/, 'WhatsApp'],
  [/fupa\.net$/, 'FuPa'],
  [/(t\.co|twitter\.com|x\.com)$/, 'X'],
  [/youtube\.com$/, 'YouTube'],
]

export const quelleVon = (referrer: string | undefined, utm: string | undefined, eigenerHost: string | null) => {
  // ?utm_source=instagram → „Instagram“ (gleiche Schreibweise wie über den Referrer)
  if (utm) {
    const u = utm.toLowerCase().trim().slice(0, 40)
    return BEKANNT.find(([, name]) => name.toLowerCase() === u)?.[1] ?? u
  }
  if (!referrer) return 'direkt'
  let host = ''
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return 'direkt'
  }
  if (!host || (eigenerHost && host === eigenerHost.replace(/^www\./, ''))) return 'intern'
  return BEKANNT.find(([re]) => re.test(host))?.[1] ?? host.slice(0, 60)
}

/** Pfad säubern: nur der Pfad, ohne Parameter, ohne Verwaltung/Schnittstelle */
const pfadSaeubern = (p?: string) => {
  if (!p || !p.startsWith('/')) return null
  const pfad = p.split(/[?#]/)[0]!.slice(0, 200).replace(/\/+$/, '') || '/'
  if (/^\/(admin|api|_next|next)(\/|$)/.test(pfad)) return null
  return pfad
}

/**
 * Ein Ereignis speichern – ohne Cookies und ohne IP-Adresse.
 * Nicht gezählt: Bots, angemeldete Mitarbeitende (Verwaltung) und ungültige Pfade.
 */
export async function erfassen(payload: Payload, headers: Headers, user: unknown, e: Ereignis) {
  const ua = headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua)) return
  if (hasRole(user as never, 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion') || hatEinzelrechte(user)) return
  const pfad = pfadSaeubern(e.pfad)
  if (e.art === 'aufruf' && !pfad) return
  const tag = heute()
  const besucher = createHash('sha256').update(`${salz(tag)}|${ipVon(headers)}|${ua}`).digest('hex').slice(0, 16)
  const eigenerHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SERVER_URL || '').hostname || headers.get('host')?.split(':')[0] || null
    } catch {
      return headers.get('host')?.split(':')[0] ?? null
    }
  })()
  await payload
    .create({
      collection: 'statistik' as never,
      overrideAccess: true,
      context: { disableRevalidate: true },
      data: {
        tag,
        art: e.art,
        pfad,
        quelle: e.art === 'aufruf' ? quelleVon(e.referrer, e.utm, eigenerHost) : null,
        geraet: geraetVon(ua),
        besucher,
        schritt: e.art === 'schritt' ? Math.max(1, Math.min(9, Number(e.schritt) || 1)) : null,
        suchbegriff: e.art === 'suche' ? (e.suchbegriff ?? '').toLowerCase().trim().slice(0, 80) : null,
        treffer: e.art === 'suche' ? Math.max(0, Math.min(999, Number(e.treffer) || 0)) : null,
      } as never,
    })
    .catch((err) => payload.logger.warn({ err }, 'Statistik: Eintrag fehlgeschlagen'))
}
