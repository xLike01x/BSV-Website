import type { Endpoint, Where } from 'payload'

import { hasRole } from '@/access/roles'
import { darfRegistrierungen, WARTEND } from '@/auth/registrierung'
import { istPassVerwaltung } from '@/passantraege/zugriff'

/** Was gilt im Posteingang als „neu“? (gleiche Werte wie der Reiter „Neu“ über der Liste) */
const NEU: { sammlung: string; status: string[] }[] = [
  { sammlung: 'mitgliedsantraege', status: ['neu'] },
  { sammlung: 'kontaktanfragen', status: ['neu'] },
  { sammlung: 'probetraining', status: ['neu'] },
  { sammlung: 'passantraege', status: ['eingereicht'] },
]

/**
 * GET /api/posteingang – Anzahl neuer Einträge je Bereich für die Seitenleiste.
 * Zählt mit den Rechten der angemeldeten Person: Trainer sehen nur ihre Teams.
 */
export const posteingangEndpunkt: Endpoint = {
  path: '/posteingang',
  method: 'get',
  handler: async (req) => {
    const user = req.user
    if (!user) return Response.json({}, { status: 401 })
    const zahlen: Record<string, number> = {}
    // Passanträge nur für die, die sie bearbeiten (nicht die eigenen Anträge als Mitglied)
    const passBearbeiter = istPassVerwaltung(user) || hasRole(user as never, 'uebungsleitung')
    await Promise.all(
      NEU.filter((n) => n.sammlung !== 'passantraege' || passBearbeiter).map(async ({ sammlung, status }) => {
        const where: Where = { status: { in: status } }
        const r = await req.payload.count({ collection: sammlung as never, where, user, overrideAccess: false, req }).catch(() => null)
        if (r) zahlen[sammlung] = r.totalDocs
      }),
    )
    if (darfRegistrierungen(user)) {
      zahlen.registrierungen = (await req.payload.count({ collection: 'users', where: WARTEND, overrideAccess: true, req })).totalDocs
    }
    return Response.json(zahlen, { headers: { 'Cache-Control': 'no-store' } })
  },
}
