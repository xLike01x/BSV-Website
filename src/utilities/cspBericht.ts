import type { Endpoint } from 'payload'

import { ratenGrenze } from '@/hooks/spamSchutz'

/**
 * POST /api/csp-bericht – der Browser meldet hier, wenn die Content-Security-Policy etwas blockiert hat.
 * Steht dann im Server-Protokoll („CSP blockiert …“). Häufige Meldungen zu FuPa/FUSSBALL.DE = Liste in next.config.ts ergänzen.
 */
export const cspBerichtEndpunkt: Endpoint = {
  path: '/csp-bericht',
  method: 'post',
  handler: async (req) => {
    const leer = new Response(null, { status: 204 })
    try {
      ratenGrenze(req, 'csp', 30, 300)
    } catch {
      return leer
    }
    if (Number(req.headers.get('content-length') || 0) > 10_000) return leer
    const text = (await req.text?.().catch(() => '')) ?? ''
    if (!text || text.length > 10_000) return leer
    try {
      const j = JSON.parse(text) as { 'csp-report'?: Record<string, string> }
      const r = j['csp-report'] ?? {}
      const kurz = (v?: string) => String(v ?? '').replace(/[\r\n]/g, ' ').slice(0, 200)
      req.payload.logger.warn(`CSP blockiert: ${kurz(r['effective-directive'] || r['violated-directive'])} → ${kurz(r['blocked-uri'])} (Seite: ${kurz(r['document-uri']?.replace(/\?.*$/, ''))})`)
    } catch {}
    return leer
  },
}
