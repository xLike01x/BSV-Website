import type { Endpoint } from 'payload'

import { EINZELRECHTE } from '@/access/einzelrechte'
import { hasRole, ROLES } from '@/access/roles'
import { rechteFuer } from '@/components/Admin/Rollen/rechte'

export type Vorschau = {
  verwaltung: boolean
  bearbeiten: { titel: string; eigene: boolean }[]
  ansehen: { titel: string; eigene: boolean }[]
  website: string[]
  kein: string[]
  teams: string[]
}

/**
 * GET /api/rechte-vorschau?rollen=trainer,…&zusatz=termine,…&person=12
 * Was darf eine Person mit diesen Rollen und Zusatzrechten? Berechnet aus den echten Zugriffsregeln.
 * Nur für Admins (beim Bearbeiten eines Benutzers).
 */
export const rechteVorschauEndpunkt: Endpoint = {
  path: '/rechte-vorschau',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin')) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
    const q = req.searchParams
    const rollen = (q.get('rollen') ?? '').split(',').filter((r) => (ROLES as readonly string[]).includes(r))
    if (rollen.includes('webadmin') && !rollen.includes('admin')) rollen.push('admin')
    const zusatz = Object.fromEntries((q.get('zusatz') ?? '').split(',').filter((z) => EINZELRECHTE.some((e) => e.key === z)).map((z) => [z, true]))
    const zeilen = rollen.length ? await rechteFuer(req, rollen, zusatz) : []
    const sichtbar = zeilen.filter((z) => z.ansehen !== 'nein')

    // Teams, für die die Person verantwortlich ist (für „nur eigene Teams“)
    const person = Number(q.get('person'))
    const teams = person
      ? (await req.payload.find({ collection: 'angebote', where: { leitung: { contains: person } }, depth: 0, limit: 50, sort: 'title', overrideAccess: true, select: { title: true } as never })).docs.map((d) => (d as unknown as { title: string }).title)
      : []

    const antwort: Vorschau = {
      verwaltung: sichtbar.length > 1 || sichtbar.some((z) => z.slug !== 'seite-hilfe'),
      bearbeiten: sichtbar.filter((z) => z.bearbeiten === 'ja' || z.bearbeiten === 'eigene' || z.anlegen === 'ja' || z.anlegen === 'eigene').map((z) => ({ titel: z.titel, eigene: z.bearbeiten === 'eigene' || z.anlegen === 'eigene' || z.ansehen === 'eigene' })),
      ansehen: sichtbar.filter((z) => !(z.bearbeiten === 'ja' || z.bearbeiten === 'eigene' || z.anlegen === 'ja' || z.anlegen === 'eigene') && z.slug !== 'seite-hilfe').map((z) => ({ titel: z.titel, eigene: z.ansehen === 'eigene' })),
      website: sichtbar.filter((z) => z.anlegen === 'website' && z.bearbeiten === 'nein').map((z) => z.titel),
      kein: zeilen.filter((z) => z.ansehen === 'nein').map((z) => z.titel),
      teams,
    }
    return Response.json(antwort, { headers: { 'Cache-Control': 'no-store' } })
  },
}
