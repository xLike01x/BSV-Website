import type { Endpoint, Where } from 'payload'

import { leserHaken } from '@/access/nurAnsehen'
import { hasRole } from '@/access/roles'
import { rechteLaden } from '@/access/rollenRechte'
import { EINTRAEGE, eintragSichtbar } from './eintraege'
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
    if (darfRegistrierungen(user) || (await leserHaken(req, 'benutzer'))) {
      zahlen.registrierungen = (await req.payload.count({ collection: 'users', where: WARTEND, overrideAccess: true, req })).totalDocs
    }
    // „Nur ansehen“: Sonderseiten, deren Haken der Web-Admin entfernt hat (der Browser kennt nur die Standardwerte)
    if (hasRole(user as never, 'lesen')) {
      await rechteLaden(req.payload)
      const aus = EINTRAEGE.filter((e) => !eintragSichtbar(e, user)).map((e) => e.key)
      return Response.json({ ...zahlen, _aus: aus }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(zahlen, { headers: { 'Cache-Control': 'no-store' } })
  },
}
