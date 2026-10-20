import type { Endpoint } from 'payload'

import { ratenGrenze } from '@/hooks/spamSchutz'

import { erfassen } from './erfassen'

/** POST /api/besuch – Seitenaufruf oder Antrags-Schritt aus dem Browser (sendBeacon). Antwortet immer leer. */
export const statistikEndpunkt: Endpoint = {
  path: '/besuch',
  method: 'post',
  handler: async (req) => {
    const leer = new Response(null, { status: 204 })
    try {
      ratenGrenze(req, 'statistik', 200)
    } catch {
      return leer
    }
    if (Number(req.headers.get('content-length') || 0) > 2000) return leer
    const text = await req.text?.().catch(() => '')
    if (!text || text.length > 2000) return leer
    let b: { t?: string; p?: string; r?: string; u?: string; s?: number } = {}
    try {
      b = JSON.parse(text)
    } catch {
      return leer
    }
    if (b.t !== 'aufruf' && b.t !== 'schritt') return leer
    await erfassen(req.payload, req.headers, req.user, { art: b.t, pfad: b.p, referrer: b.r, utm: b.u, schritt: b.s })
    return leer
  },
}
