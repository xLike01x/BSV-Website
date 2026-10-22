import { sql } from '@payloadcms/db-postgres'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

import { PAPIERKORB, PAPIERKORB_TAGE } from '@/utilities/papierkorb'

import { hatRecht } from '@/access/einzelrechte'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { ausfuehren, istWebAdminReq, PERSONEN_BEREICHE, tabelle } from './plugin'
import { type Verknuepfung, verknuepfungen } from './verknuepfungen'

const BEREICHE = [...PAPIERKORB, 'forms', 'form-submissions']

/**
 * Zusatzrecht „papierkorb“: nur der normale Papierkorb (nicht „Nur Web-Admin“), nur Bereiche ohne persönliche Daten,
 * nur wiederherstellen. Endgültig löschen und alles mit Namen/Kontaktdaten bleibt beim Web-Admin.
 */
const NUR_WIEDERHERSTELLEN = BEREICHE.filter((b) => !PERSONEN_BEREICHE.includes(b))
const mitZusatzrecht = (req: PayloadRequest) => !istWebAdminReq(req) && hatRecht(req.user, 'papierkorb')
/**
 * Bilder (z. B. nach Widerruf einer Foto-Einwilligung gelöscht) und Teams (bringen ihre Verantwortlichen und deren Rechte
 * zurück) nur, wer den Bereich auch selbst bearbeiten darf.
 */
const BEREICH_NOETIG: Record<string, 'medien' | 'teams'> = { media: 'medien', alben: 'medien', angebote: 'teams' }
const zusatzBereiche = (req: PayloadRequest) => NUR_WIEDERHERSTELLEN.filter((b) => !BEREICH_NOETIG[b] || hatRecht(req.user, BEREICH_NOETIG[b]!))

/**
 * Wiederherstellen ohne Speichern über Payload: Bei News und Seiten würde Payload sonst einen offenen Entwurf in den
 * Hauptdatensatz schreiben und eine veröffentlichte Seite offline nehmen. Deshalb nur die Papierkorb-Spalten leeren
 * (Eintrag und seine Versionen) und die Website neu aufbauen.
 */
async function zurueckholen(req: PayloadRequest, slug: string, id: number) {
  const t = tabelle(slug)
  const r = await ausfuehren(req, sql`update ${sql.identifier(t)} set deleted_at = null, endgueltig_am = null, endgueltig_von = null where id = ${id}`)
  if (!r.rowCount) throw new Error('nicht gefunden')
  if (req.payload.collections[slug as CollectionSlug]?.config.versions) {
    await ausfuehren(req, sql`update ${sql.identifier(`_${t}_v`)} set version_deleted_at = null, version_endgueltig_am = null where parent_id = ${id}`)
  }
  // Beim Löschen hat die Suche den Eintrag entfernt – veröffentlichte News wieder aufnehmen
  if (slug === 'posts') {
    const d = (await req.payload.findByID({ collection: 'posts', id, depth: 0, draft: false, overrideAccess: true, req }).catch(() => null)) as { title?: string; _status?: string } | null
    const schon = await req.payload.count({ collection: 'search', where: { 'doc.value': { equals: id } }, overrideAccess: true, req }).catch(() => ({ totalDocs: 1 }))
    if (d?._status === 'published' && !schon.totalDocs) {
      const daten = await beforeSyncWithSearch({ req, originalDoc: d, searchDoc: { title: d.title ?? '', doc: { relationTo: 'posts', value: id } } } as never)
      await req.payload.create({ collection: 'search', data: daten as never, overrideAccess: true, req }).catch((e) => req.payload.logger.warn({ err: e }, 'Suche: wiederhergestellte News nicht aufgenommen'))
    }
  }
  try {
    revalidatePath('/', 'layout')
    revalidateTag('pages-sitemap', 'max')
    revalidateTag('posts-sitemap', 'max')
  } catch {
    // außerhalb von Next.js nichts neu aufzubauen
  }
}

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

async function liste(req: PayloadRequest, nurNormal: boolean): Promise<PapierkorbEintrag[]> {
  const s = (await req.payload.findGlobal({ slug: 'sicherheit' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { papierkorbTage?: number | null } | null
  const tage = s?.papierkorbTage ?? 365
  const alle: PapierkorbEintrag[] = []
  for (const slug of nurNormal ? zusatzBereiche(req) : BEREICHE) {
    const col = req.payload.collections[slug as CollectionSlug]
    if (!col) continue
    const titelFeld = col.config.admin?.useAsTitle || (col.config.upload ? 'filename' : 'id')
    const r = await req.payload
      .find({ collection: slug as CollectionSlug, where: nurNormal ? { and: [{ deletedAt: { exists: true } }, { endgueltigAm: { exists: false } }] } : { deletedAt: { exists: true } }, trash: true, depth: 0, limit: 0, pagination: false, overrideAccess: true, req, sort: '-deletedAt' })
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
      if (!istWebAdminReq(req) && !mitZusatzrecht(req)) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
      return Response.json({ eintraege: await liste(req, mitZusatzrecht(req)) }, { headers: { 'Cache-Control': 'no-store' } })
    },
  },
  {
    // Vor dem endgültigen Löschen: Was ist mit den gewählten Einträgen noch verknüpft? (nur Web-Admins)
    path: '/papierkorb/verknuepfungen',
    method: 'post',
    handler: async (req) => {
      if (!istWebAdminReq(req)) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
      const body = (await req.json?.().catch(() => ({}))) as { eintraege?: { slug?: string; id?: number }[] }
      const eintraege = (body.eintraege ?? []).filter((e) => e.slug && BEREICHE.includes(e.slug) && Number(e.id) > 0).slice(0, 200)
      const ergebnis: { slug: string; id: number; verknuepfungen: Verknuepfung[] }[] = []
      for (const e of eintraege) {
        const v = await verknuepfungen(req, e.slug!, Number(e.id))
        if (v.length) ergebnis.push({ slug: e.slug!, id: Number(e.id), verknuepfungen: v })
      }
      return Response.json({ eintraege: ergebnis }, { headers: { 'Cache-Control': 'no-store' } })
    },
  },
  {
    path: '/papierkorb/aktion',
    method: 'post',
    handler: async (req) => {
      const zusatz = mitZusatzrecht(req)
      if (!istWebAdminReq(req) && !zusatz) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
      const body = (await req.json?.().catch(() => ({}))) as { aktion?: string; eintraege?: { slug?: string; id?: number }[] }
      const eintraege = (body.eintraege ?? []).filter((e) => e.slug && BEREICHE.includes(e.slug) && Number(e.id) > 0).slice(0, 500)
      if (!eintraege.length || !['wiederherstellen', 'loeschen'].includes(body.aktion ?? '')) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 })
      if (zusatz && (body.aktion !== 'wiederherstellen' || eintraege.some((e) => !zusatzBereiche(req).includes(e.slug!)))) return Response.json({ fehler: 'Endgültig löschen, Bereiche mit persönlichen Daten, Bilder und Teams nur für Web-Admins (bzw. mit dem passenden Zusatzrecht).' }, { status: 403 })
      let ok = 0
      const fehler: string[] = []
      for (const e of eintraege) {
        try {
          if (body.aktion === 'wiederherstellen') {
            // Zusatzrecht: nur aus dem normalen Papierkorb (nicht, was ein Web-Admin-Papierkorb-Eintrag ist)
            if (zusatz) {
              const d = (await req.payload.findByID({ collection: e.slug as CollectionSlug, id: Number(e.id), trash: true, depth: 0, overrideAccess: true, req }).catch(() => null)) as { deletedAt?: string | null; endgueltigAm?: string | null } | null
              if (!d?.deletedAt || d.endgueltigAm) throw new Error('nicht im Papierkorb')
            }
            await zurueckholen(req, e.slug!, Number(e.id))
          } else {
            // Web-Admin: wirklich löschen (der Umleitungs-Hook greift für Web-Admins nicht)
            const r = await req.payload.delete({ collection: e.slug as CollectionSlug, where: { id: { equals: Number(e.id) } }, trash: true, overrideAccess: true, req })
            // Sammel-Löschen wirft bei Fehlern nicht, sondern meldet sie in „errors“
            if (r.errors?.length) throw new Error(String((r.errors[0] as { message?: string }).message ?? 'Löschen fehlgeschlagen'))
            if (!r.docs?.length) throw new Error('nicht gefunden')
          }
          ok++
        } catch (err) {
          // Keine Datenbank-Details an die Oberfläche – die stehen im Server-Protokoll
          req.payload.logger.error({ err }, `Papierkorb: ${e.slug} #${e.id} – ${body.aktion} fehlgeschlagen`)
          fehler.push(`${label(req, e.slug!)} #${e.id}: ${body.aktion === 'loeschen' ? 'konnte nicht gelöscht werden' : 'konnte nicht wiederhergestellt werden'} (Details im Server-Protokoll).`)
        }
      }
      return Response.json({ ok, fehler })
    },
  },
]
