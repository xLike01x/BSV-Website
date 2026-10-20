import { createHash, randomBytes } from 'crypto'
import type { Payload } from 'payload'

import { hatEinzelrechte } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'
import { ratenGrenze } from '@/hooks/spamSchutz'
import { clientIp } from '@/utilities/clientIp'

export type Ereignis = { art: 'aufruf' | 'schritt' | 'suche'; pfad?: string; referrer?: string; utm?: string; schritt?: number; suchbegriff?: string; treffer?: number }

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i

// Täglich wechselnder Zufallswert – nur im Arbeitsspeicher, wird nie gespeichert
const g = globalThis as unknown as { __bsvSalz?: { tag: string; wert: string } }
const heute = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
const salz = (tag: string) => {
  if (g.__bsvSalz?.tag !== tag) g.__bsvSalz = { tag, wert: randomBytes(32).toString('hex') }
  return g.__bsvSalz.wert
}


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
  const u = utm?.toLowerCase().trim()
  // Nur einfache Namen (instagram, newsletter, plakat-2026) – kein beliebiger Text in der Herkunfts-Liste
  if (u && /^[a-z0-9_-]{1,30}$/.test(u)) return BEKANNT.find(([, name]) => name.toLowerCase() === u)?.[1] ?? u
  if (!referrer) return 'direkt'
  let host = ''
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return 'direkt'
  }
  if (!host || !/^[a-z0-9.-]{1,60}$/.test(host)) return 'direkt'
  if (eigenerHost && host === eigenerHost.replace(/^www\./, '')) return 'intern'
  return BEKANNT.find(([re]) => re.test(host))?.[1] ?? host.slice(0, 60)
}

/** Feste Seiten der Website, die gezählt werden (Login, Bestätigungs- und Ausweis-Links absichtlich nicht) */
const FEST = new Set(['/', '/breitensport', '/fussball', '/galerie', '/kontakt', '/mitglied-werden', '/mitglieder', '/mitglieder/passantrag', '/mitmachen', '/news', '/registrieren', '/sponsoren', '/suche', '/termine', '/trainingszeiten', '/verein'])
/** Seiten mit Adresse aus dem Inhalt: Vorsatz → Bereich */
const AUS_INHALT: [string, string, boolean][] = [
  ['', 'pages', true],
  ['/news/', 'posts', true],
  ['/angebote/', 'angebote', false],
  ['/galerie/', 'alben', false],
]
const g2 = globalThis as unknown as { __bsvPfade?: { bis: number; pfade: Set<string> } }

/** Alle Adressen, die es auf der Website wirklich gibt (10 Minuten zwischengespeichert) */
async function gueltigePfade(payload: Payload): Promise<Set<string>> {
  if (g2.__bsvPfade && g2.__bsvPfade.bis > Date.now()) return g2.__bsvPfade.pfade
  const pfade = new Set(FEST)
  for (const [vorsatz, slug, entwuerfe] of AUS_INHALT) {
    const r = await payload
      .find({ collection: slug as never, where: entwuerfe ? { _status: { equals: 'published' } } : undefined, select: { slug: true } as never, depth: 0, limit: 0, pagination: false, overrideAccess: true })
      .catch(() => null)
    for (const d of (r?.docs ?? []) as { slug?: string }[]) if (d.slug && d.slug !== 'home') pfade.add(`${vorsatz || '/'}${d.slug}`)
  }
  g2.__bsvPfade = { bis: Date.now() + 10 * 60 * 1000, pfade }
  return pfade
}

/** Pfad säubern: nur Adressen, die es auf der Website gibt – ohne Parameter, ohne erfundene oder fremde Adressen */
export const pfadSaeubern = (p?: string) => {
  if (!p || !p.startsWith('/') || p.startsWith('//') || p.includes('\\')) return null
  const pfad = (p.split(/[?#]/)[0]!.replace(/\/+$/, '') || '/').toLowerCase()
  if (pfad.length > 120 || !/^\/[a-z0-9\-/]*$/.test(pfad) || pfad.includes('//')) return null
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
  let pfad = pfadSaeubern(e.pfad)
  if (pfad && !(await gueltigePfade(payload)).has(pfad)) pfad = null
  if (e.art === 'aufruf' && !pfad) return
  // Suchanfragen kommen ohne Beacon direkt von der Seite – eigene Grenze, damit niemand die Tabelle füllt
  if (e.art === 'suche') {
    try {
      ratenGrenze({ headers }, 'statistik-suche', 30, 600)
    } catch {
      return
    }
  }
  const tag = heute()
  const besucher = createHash('sha256').update(`${salz(tag)}|${clientIp(headers)}|${ua}`).digest('hex').slice(0, 16)
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
