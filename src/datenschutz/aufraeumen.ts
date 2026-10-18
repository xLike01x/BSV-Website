import type { CollectionSlug, Endpoint, Payload, Where } from 'payload'

import { hasRole } from '@/access/roles'

type Fristen = { probetrainingMonate?: number | null; kontaktMonate?: number | null; antraegeMonate?: number | null; eingaengeMonate?: number | null; automatisch?: boolean | null }
export type Faellig = { slug: string; label: string; anzahl: number; monate: number; rollen: string[] }

const vor = (monate: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - monate)
  return d.toISOString()
}

const regeln = (f: Fristen) => [
  { slug: 'probetraining', label: 'erledigte Probetraining-Anfragen', monate: f.probetrainingMonate ?? 6, rollen: ['admin'], where: (g: string): Where => ({ and: [{ status: { equals: 'erledigt' } }, { updatedAt: { less_than: g } }] }) },
  { slug: 'kontaktanfragen', label: 'erledigte Kontaktanfragen', monate: f.kontaktMonate ?? 6, rollen: ['admin'], where: (g: string): Where => ({ and: [{ status: { equals: 'erledigt' } }, { updatedAt: { less_than: g } }] }) },
  { slug: 'mitgliedsantraege', label: 'bearbeitete Mitgliedsanträge', monate: f.antraegeMonate ?? 3, rollen: ['admin', 'kasse'], where: (g: string): Where => ({ and: [{ status: { in: ['aufgenommen', 'abgelehnt'] } }, { updatedAt: { less_than: g } }] }) },
  { slug: 'form-submissions', label: 'Formular-Eingänge', monate: f.eingaengeMonate ?? 12, rollen: ['admin'], where: (g: string): Where => ({ createdAt: { less_than: g } }) },
]

const fristen = (payload: Payload) => payload.findGlobal({ slug: 'datenschutz' as never, overrideAccess: true }).catch(() => ({})) as Promise<Fristen>

/** Wie viele Einträge sind über der Frist? (nur Bereiche, die die Rollen betreffen) */
export async function faellige(payload: Payload, rollen?: string[]): Promise<Faellig[]> {
  const f = await fristen(payload)
  const raus: Faellig[] = []
  for (const r of regeln(f)) {
    if (rollen && !r.rollen.some((x) => rollen.includes(x))) continue
    const { totalDocs } = await payload.count({ collection: r.slug as CollectionSlug, where: r.where(vor(r.monate)), overrideAccess: true })
    if (totalDocs) raus.push({ slug: r.slug, label: r.label, anzahl: totalDocs, monate: r.monate, rollen: r.rollen })
  }
  return raus
}

/** Fällige Einträge in den Papierkorb verschieben */
export async function aufraeumen(payload: Payload, nur?: string[]) {
  const f = await fristen(payload)
  let gesamt = 0
  for (const r of regeln(f)) {
    if (nur && !nur.includes(r.slug)) continue
    const res = await payload.update({
      collection: r.slug as CollectionSlug,
      where: r.where(vor(r.monate)),
      data: { deletedAt: new Date().toISOString() } as never,
      overrideAccess: true,
      context: { ohneRevalidierung: true },
    })
    gesamt += res.docs.length
  }
  return gesamt
}

export async function datenschutzAutomatisch(payload: Payload) {
  const f = await fristen(payload)
  if (!f.automatisch) return 0
  const n = await aufraeumen(payload)
  if (n) payload.logger.info(`Datenschutz: ${n} Einträge über der Frist in den Papierkorb verschoben`)
  return n
}

export const datenschutzEndpunkte: Endpoint[] = [
  {
    path: '/datenschutz/faellig',
    method: 'get',
    handler: async (req) => {
      const rollen = ((req.user as { roles?: string[] } | null)?.roles ?? []) as string[]
      if (!hasRole(req.user as never, 'admin', 'kasse')) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
      return Response.json({ faellig: await faellige(req.payload, rollen) })
    },
  },
  {
    path: '/datenschutz/aufraeumen',
    method: 'post',
    handler: async (req) => {
      const rollen = ((req.user as { roles?: string[] } | null)?.roles ?? []) as string[]
      if (!hasRole(req.user as never, 'admin', 'kasse')) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
      // Kasse räumt nur Mitgliedsanträge auf
      const nur = rollen.includes('admin') ? undefined : ['mitgliedsantraege']
      return Response.json({ verschoben: await aufraeumen(req.payload, nur) })
    },
  },
]
