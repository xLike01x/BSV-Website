import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

import { PAPIERKORB, PAPIERKORB_TAGE } from '@/utilities/papierkorb'

import { istWebAdminReq } from './plugin'

const BEREICHE = [...PAPIERKORB, 'forms', 'form-submissions']

export type PapierkorbEintrag = {
  slug: string
  bereich: string
  id: number
  titel: string
  geloeschtAm: string
  stufe: 'papierkorb' | 'webadmin'
  entferntAm: string | null
  entferntVon: string | null
  loeschtAm: string
}

const label = (req: PayloadRequest, slug: string) => {
  const l = req.payload.collections[slug as CollectionSlug]?.config.labels?.plural
  return typeof l === 'string' ? l : ((l as Record<string, string> | undefined)?.de ?? slug)
}

async function liste(req: PayloadRequest): Promise<PapierkorbEintrag[]> {
  const s = (await req.payload.findGlobal({ slug: 'sicherheit' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { papierkorbTage?: number | null } | null
  const tage = s?.papierkorbTage ?? 365
  const alle: PapierkorbEintrag[] = []
  for (const slug of BEREICHE) {
    const col = req.payload.collections[slug as CollectionSlug]
    if (!col) continue
    const titelFeld = col.config.admin?.useAsTitle || (col.config.upload ? 'filename' : 'id')
    const r = await req.payload
      .find({ collection: slug as CollectionSlug, where: { deletedAt: { exists: true } }, trash: true, depth: 0, limit: 0, pagination: false, overrideAccess: true, req, sort: '-deletedAt' })
      .catch(() => null)
    for (const d of (r?.docs ?? []) as unknown as Record<string, unknown>[]) {
      const geloescht = String(d.deletedAt)
      const entfernt = (d.endgueltigAm as string | null) ?? null
      const loeschtAm = entfernt
        ? new Date(new Date(entfernt).getTime() + tage * 86400000).toISOString()
        : new Date(new Date(geloescht).getTime() + PAPIERKORB_TAGE * 86400000).toISOString()
      const roh = d[titelFeld] ?? d.title ?? d.titel ?? d.name ?? d.filename
      alle.push({
        slug,
        bereich: label(req, slug),
        id: Number(d.id),
        titel: String(roh ?? `#${d.id}`).slice(0, 140) || `#${d.id}`,
        geloeschtAm: geloescht,
        stufe: entfernt ? 'webadmin' : 'papierkorb',
        entferntAm: entfernt,
        entferntVon: (d.endgueltigVon as string | null) ?? null,
        loeschtAm,
      })
    }
  }
  return alle.sort((a, b) => (b.entferntAm ?? b.geloeschtAm).localeCompare(a.entferntAm ?? a.geloeschtAm))
}

/** Zentraler Papierkorb für Web-Admins: alles Gelöschte aus allen Bereichen, wiederherstellen oder endgültig löschen */
export const papierkorbEndpunkte: Endpoint[] = [
  {
    path: '/papierkorb/liste',
    method: 'get',
    handler: async (req) => {
      if (!istWebAdminReq(req)) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
      return Response.json({ eintraege: await liste(req) }, { headers: { 'Cache-Control': 'no-store' } })
    },
  },
  {
    path: '/papierkorb/aktion',
    method: 'post',
    handler: async (req) => {
      if (!istWebAdminReq(req)) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
      const body = (await req.json?.().catch(() => ({}))) as { aktion?: string; eintraege?: { slug?: string; id?: number }[] }
      const eintraege = (body.eintraege ?? []).filter((e) => e.slug && BEREICHE.includes(e.slug) && Number(e.id) > 0).slice(0, 500)
      if (!eintraege.length || !['wiederherstellen', 'loeschen'].includes(body.aktion ?? '')) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 })
      let ok = 0
      const fehler: string[] = []
      for (const e of eintraege) {
        try {
          if (body.aktion === 'wiederherstellen') {
            await req.payload.update({ collection: e.slug as CollectionSlug, id: Number(e.id), data: { deletedAt: null, endgueltigAm: null, endgueltigVon: null } as never, trash: true, overrideAccess: true, req })
          } else {
            // Web-Admin: wirklich löschen (der Umleitungs-Hook greift für Web-Admins nicht)
            await req.payload.delete({ collection: e.slug as CollectionSlug, where: { id: { equals: Number(e.id) } }, trash: true, overrideAccess: true, req })
          }
          ok++
        } catch (err) {
          fehler.push(`${e.slug} #${e.id}: ${(err as Error).message}`)
        }
      }
      return Response.json({ ok, fehler })
    },
  },
]
