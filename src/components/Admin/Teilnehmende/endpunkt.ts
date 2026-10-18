import type { Endpoint } from 'payload'

import { eigeneAngebotIds, hasRole, TEAM_ROLLEN } from '@/access/roles'

/** Mitglieder eines Teams/Kurses mit Foto – für Admin, Redaktion, Kasse und die Verantwortlichen des Kurses */
export const teilnehmendeEndpunkt: Endpoint = {
  path: '/:id/teilnehmende',
  method: 'get',
  handler: async (req) => {
    const id = Number(req.routeParams?.id)
    const user = req.user
    if (!user || !id) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    const verwaltung = hasRole(user as never, 'admin', 'redaktion', 'kasse')
    const trainer = hasRole(user as never, ...TEAM_ROLLEN) && (await eigeneAngebotIds(req)).includes(id)
    if (!verwaltung && !trainer) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
    const r = await req.payload.find({
      collection: 'users',
      where: { and: [{ angebote: { contains: id } }, { freigegeben: { not_equals: false } }] },
      sort: 'name',
      limit: 300,
      depth: 1,
      overrideAccess: true,
    })
    return Response.json({
      personen: r.docs.map((u) => {
        const foto = u.profilbild && typeof u.profilbild === 'object' ? u.profilbild : null
        return { id: u.id, name: u.name, foto: foto ? (foto.sizes?.klein?.url ?? foto.url ?? null) : null }
      }),
    })
  },
}
