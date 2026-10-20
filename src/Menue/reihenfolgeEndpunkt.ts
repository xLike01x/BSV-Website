import { revalidatePath } from 'next/cache'
import type { Endpoint } from 'payload'
import { commitTransaction, initTransaction, killTransaction } from 'payload'

/**
 * POST /api/angebote/reihenfolge  { ids: [3, 7, 5] } – neue Reihenfolge einer Menü-Spalte in EINEM Schritt speichern.
 * Entweder alle oder keiner (Transaktion), mit den Rechten der Person (nur Teams, die sie ändern darf),
 * und die Website wird nur einmal neu aufgebaut statt einmal pro Eintrag (Audit QA-07).
 */
export const reihenfolgeEndpunkt: Endpoint = {
  path: '/reihenfolge',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    const body = (await req.json?.().catch(() => ({}))) as { ids?: unknown[] }
    const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter((n) => Number.isInteger(n) && n > 0)
    if (!ids.length || ids.length > 200 || new Set(ids).size !== ids.length) return Response.json({ fehler: 'Ungültige Liste.' }, { status: 400 })
    const eigene = await initTransaction(req)
    try {
      for (const [i, id] of ids.entries()) {
        await req.payload.update({ collection: 'angebote', id, data: { reihenfolge: (i + 1) * 10 } as never, overrideAccess: false, user: req.user, req, context: { disableRevalidate: true } })
      }
      if (eigene) await commitTransaction(req)
    } catch {
      if (eigene) await killTransaction(req)
      return Response.json({ fehler: 'Das Umsortieren hat nicht geklappt – es wurde nichts geändert.' }, { status: 400 })
    }
    try {
      revalidatePath('/', 'layout')
    } catch {}
    return Response.json({ ok: true })
  },
}
