import type { Endpoint } from 'payload'

/**
 * GET /api/gesund – für die Überwachung (Uptime-Dienst) und das Update-Skript.
 * Antwortet 200, wenn die Website läuft und die Datenbank erreichbar ist, sonst 503. Verrät keine Details.
 */
export const gesundEndpunkt: Endpoint = {
  path: '/gesund',
  method: 'get',
  handler: async (req) => {
    try {
      await (req.payload.db as unknown as { pool: { query: (s: string) => Promise<unknown> } }).pool.query('select 1')
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
  },
}
