import { sql } from '@payloadcms/db-postgres'
import type { Access, CollectionConfig, CollectionSlug, Config, Endpoint, FieldAccess, PayloadRequest, Plugin, Where } from 'payload'
import { deleteByIDOperation, deleteOperation, parseParams } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * Zweistufiger Papierkorb
 * 1. Löschen → normaler Papierkorb (Payload, Feld deletedAt). Nach 30 Tagen automatisch weiter zu Stufe 2.
 * 2. „Endgültig löschen“ durch alle außer Web-Admin → Web-Admin-Papierkorb: Der Eintrag bleibt vollständig erhalten
 *    (mit Bildern, Dateien, Verknüpfungen), ist aber nur noch für Web-Admins sichtbar (Feld endgueltigAm).
 *    Wiederherstellen oder wirklich löschen: Einstellungen → „Web-Admin-Papierkorb“.
 *    Nach der eingestellten Frist wird er automatisch endgültig gelöscht.
 * Was ein Web-Admin endgültig löscht, ist sofort weg.
 *
 * Umgesetzt über eigene DELETE-Endpunkte je Bereich (gehen den Standard-Endpunkten von Payload vor):
 * Nur so lässt sich „endgültig löschen“ für Nicht-Web-Admins sauber umleiten – ein Hook vor dem Löschen
 * kann das Löschen per ID nicht abbrechen, ohne dass die Anfrage als Fehler endet.
 */

export const istWebAdminReq = (req: PayloadRequest) => hasRole(req.user as never, 'webadmin')
const istAdminReq = (req: PayloadRequest) => hasRole(req.user as never, 'admin')

/** Tabellenname in Postgres (Payload: Bindestriche → Unterstriche) */
export const tabelle = (slug: string) => slug.replace(/-/g, '_')

type Db = { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }> } }
export const ausfuehren = (req: { payload: { db: unknown } }, q: unknown) => (req.payload.db as unknown as Db).drizzle.execute(q)

const NICHT_ENTFERNT: Where = { endgueltigAm: { exists: false } }
const NICHT_GELOESCHT: Where = { deletedAt: { exists: false } }

const und = (r: boolean | Where, w: Where): Where => (r === true ? w : { and: [r as Where, w] })

/** Welche Einträge darf diese Person löschen? (Zugriffsregel „delete“ als Filter) */
const loeschFilter = async (c: CollectionConfig, req: PayloadRequest): Promise<Where | false> => {
  const zugriff = c.access?.delete
  if (typeof zugriff !== 'function') return req.user ? {} : false
  const r = await zugriff({ req } as never)
  if (r === false) return false
  return r === true ? {} : (r as Where)
}

/**
 * Lesen:
 * - Einträge im Web-Admin-Papierkorb sieht nur der Web-Admin.
 * - Einträge im normalen Papierkorb sieht nur, wer sie auch löschen/wiederherstellen darf
 *   (sonst wären z. B. gelöschte News über ?trash=true weiter öffentlich abrufbar).
 */
const lesenMitFilter =
  (c: CollectionConfig, orig: Access | undefined): Access =>
  async (args) => {
    const r = orig ? await orig(args) : Boolean(args.req.user)
    if (r === false || istWebAdminReq(args.req)) return r
    const erlaubt = args.req.user ? await loeschFilter(c, args.req) : false
    const papierkorb: Where = erlaubt === false ? NICHT_GELOESCHT : Object.keys(erlaubt).length ? { or: [NICHT_GELOESCHT, erlaubt] } : {}
    return und(r, Object.keys(papierkorb).length ? { and: [NICHT_ENTFERNT, papierkorb] } : NICHT_ENTFERNT)
  }

/** Ändern/Löschen: Einträge im Web-Admin-Papierkorb fasst nur der Web-Admin an (auch nicht wiederherstellen) */
const schreibenMitFilter =
  (orig: Access | undefined): Access =>
  async (args) => {
    const r = orig ? await orig(args) : Boolean(args.req.user)
    if (r === false || istWebAdminReq(args.req)) return r
    return und(r, NICHT_ENTFERNT)
  }

/** Versionen (News, Seiten): Versionen von Einträgen im Web-Admin-Papierkorb nur für Web-Admins */
const versionenMitFilter =
  (slug: string, orig: Access | undefined): Access =>
  async (args) => {
    const r = orig ? await orig(args) : Boolean(args.req.user)
    if (r === false || istWebAdminReq(args.req)) return r
    const res = await ausfuehren(args.req, sql`select id from ${sql.identifier(tabelle(slug))} where endgueltig_am is not null`).catch(() => null)
    const ids = (res?.rows ?? []).map((x) => Number(x.id)).filter(Boolean)
    return ids.length ? und(r, { parent: { not_in: ids } }) : r
  }

const nurWebAdmin: FieldAccess = ({ req }) => istWebAdminReq(req)

const name = (req: PayloadRequest) => String((req.user as { name?: string; email?: string }).name || (req.user as { email?: string }).email || 'unbekannt').slice(0, 120)

/**
 * Nicht-Web-Admin löscht endgültig → in den Web-Admin-Papierkorb verschieben.
 * Ziel = genau die angefragten Einträge, die die Person löschen darf und die noch nicht dort liegen.
 * Nicht-Admins dürfen nur aus dem Papierkorb heraus endgültig löschen (wie papierkorbSchutz).
 */
async function verschieben(c: CollectionConfig, req: PayloadRequest, ziel: Where): Promise<{ docs: Record<string, unknown>[]; abgelehnt: boolean }> {
  const erlaubt = await loeschFilter(c, req)
  if (erlaubt === false) return { docs: [], abgelehnt: true }
  const teile: Where[] = [ziel, erlaubt, NICHT_ENTFERNT]
  if (!istAdminReq(req)) teile.push({ deletedAt: { exists: true } })
  const treffer = await req.payload.find({ collection: c.slug as CollectionSlug, where: { and: teile }, trash: true, depth: 0, limit: 0, pagination: false, overrideAccess: true, req })
  const docs = treffer.docs as unknown as Record<string, unknown>[]
  if (!docs.length) return { docs, abgelehnt: false }
  const ids = docs.map((d) => Number(d.id)).filter((n) => Number.isInteger(n) && n > 0)
  const von = name(req)
  // Eine einzige Anweisung – entweder alle oder keiner. Danach passiert in dieser Anfrage nichts mehr.
  await ausfuehren(req, sql`update ${sql.identifier(tabelle(c.slug))} set endgueltig_am = now(), endgueltig_von = ${von}, deleted_at = coalesce(deleted_at, now()) where id in ${sql.raw(`(${ids.join(',')})`)} and endgueltig_am is null`)
  const jetzt = new Date().toISOString()
  // Nur das Nötigste zurückgeben (die Suche lief ohne Feldrechte)
  return { docs: docs.map((d) => ({ id: d.id, deletedAt: d.deletedAt ?? jetzt, endgueltigAm: jetzt, endgueltigVon: von })), abgelehnt: false }
}

const titel = (l: unknown) => (typeof l === 'string' ? l : ((l as Record<string, string> | undefined)?.de ?? 'Einträge'))

const HINWEIS = 'In den Web-Admin-Papierkorb verschoben. Wiederherstellen oder wirklich löschen kann nur ein Web-Admin.'

const loeschEndpunkte = (c: CollectionConfig): Endpoint[] => [
  {
    path: '/:id',
    method: 'delete',
    handler: async (req) => {
      const id = req.routeParams?.id as string
      const collection = req.payload.collections[c.slug as CollectionSlug]
      const p = parseParams(req.query as never)
      // Web-Admins, Systemaufrufe: normales Löschen von Payload
      if (!req.user || istWebAdminReq(req)) {
        const doc = await deleteByIDOperation({ id, collection, depth: p.depth, overrideLock: p.overrideLock ?? false, populate: p.populate, req, select: p.select, trash: p.trash })
        return Response.json({ doc, message: req.t('general:deletedSuccessfully') }, { status: 200 })
      }
      const { docs, abgelehnt } = await verschieben(c, req, { id: { equals: id } })
      if (docs.length) return Response.json({ doc: docs[0], message: HINWEIS }, { status: 200 })
      if (abgelehnt) return Response.json({ errors: [{ message: req.t('error:notAllowedToPerformAction') }] }, { status: 403 })
      // Nichts Passendes: liegt nicht im Papierkorb, schon im Web-Admin-Papierkorb oder fremd
      const vorhanden = await req.payload.find({ collection: c.slug as CollectionSlug, where: { id: { equals: id } }, trash: true, depth: 0, limit: 1, req, overrideAccess: false }).catch(() => null)
      if (vorhanden?.docs.length && !istAdminReq(req)) return Response.json({ errors: [{ message: 'Bitte zuerst in den Papierkorb legen – endgültig löschen geht nur von dort.' }] }, { status: 403 })
      return Response.json({ errors: [{ message: req.t('general:notFound') }] }, { status: 404 })
    },
  },
  {
    path: '/',
    method: 'delete',
    handler: async (req) => {
      const collection = req.payload.collections[c.slug as CollectionSlug]
      const p = parseParams(req.query as never)
      if (!p.where || !Object.keys(p.where).length) return Response.json({ errors: [{ message: 'Bitte angeben, was gelöscht werden soll.' }] }, { status: 400 })
      if (!req.user || istWebAdminReq(req)) {
        const r = await deleteOperation({ collection, depth: p.depth, overrideLock: p.overrideLock ?? false, populate: p.populate, req, select: p.select, trash: p.trash, where: p.where })
        const label = (n: number) => titel(collection.config.labels?.[n === 1 ? 'singular' : 'plural'])
        if (!r.errors.length) return Response.json({ ...r, message: req.t('general:deletedCountSuccessfully', { count: r.docs.length, label: label(r.docs.length) }) }, { status: 200 })
        const errors = r.errors.map((e) => ((e as { isPublic?: boolean }).isPublic ? e : { ...e, message: 'Something went wrong.' }))
        const total = r.docs.length + r.errors.length
        return Response.json({ ...r, errors, message: req.t('error:unableToDeleteCount', { count: r.errors.length, label: label(total), total }) }, { status: 400 })
      }
      const { docs, abgelehnt } = await verschieben(c, req, p.where)
      if (abgelehnt) return Response.json({ docs: [], errors: [{ message: req.t('error:notAllowedToPerformAction') }] }, { status: 403 })
      return Response.json({ docs, errors: [], message: docs.length ? `${docs.length} ${docs.length === 1 ? 'Eintrag' : 'Einträge'}: ${HINWEIS}` : 'Nichts zu löschen.' }, { status: 200 })
    },
  },
]

/** Neue Einträge: Papierkorb-Felder nie von außen setzen (z. B. ein Formular, das sich selbst „versteckt“) */
const papierkorbFelderBeimAnlegen: NonNullable<NonNullable<CollectionConfig['hooks']>['beforeChange']>[number] = ({ data, operation, req }) => {
  if (operation === 'create' && data && !istWebAdminReq(req)) {
    delete data.deletedAt
    delete data.endgueltigAm
    delete data.endgueltigVon
  }
  return data
}

/** Beim Wiederherstellen (deletedAt geleert) auch die Markierung „Web-Admin-Papierkorb“ entfernen */
const wiederherstellen: NonNullable<NonNullable<CollectionConfig['hooks']>['beforeChange']>[number] = ({ data, originalDoc }) => {
  if (data && 'deletedAt' in data && !data.deletedAt && (originalDoc as { endgueltigAm?: string } | undefined)?.endgueltigAm) {
    data.endgueltigAm = null
    data.endgueltigVon = null
  }
  return data
}

export const zweistufigerPapierkorb: Plugin = (config: Config): Config => ({
  ...config,
  collections: (config.collections ?? []).map((c) => {
    if (!c.trash) return c
    return {
      ...c,
      access: {
        ...c.access,
        read: lesenMitFilter(c, c.access?.read),
        update: schreibenMitFilter(c.access?.update),
        delete: schreibenMitFilter(c.access?.delete),
        ...(c.versions ? { readVersions: versionenMitFilter(c.slug, c.access?.readVersions) } : {}),
      },
      endpoints: c.endpoints === false ? false : [...loeschEndpunkte(c), ...(c.endpoints ?? [])],
      hooks: {
        ...c.hooks,
        beforeChange: [papierkorbFelderBeimAnlegen, wiederherstellen, ...(c.hooks?.beforeChange ?? [])],
      },
      fields: [
        ...c.fields,
        { name: 'endgueltigAm', type: 'date', index: true, access: { create: nurWebAdmin, update: nurWebAdmin }, admin: { hidden: true, disableListColumn: true, disableListFilter: true } },
        { name: 'endgueltigVon', type: 'text', access: { create: nurWebAdmin, update: nurWebAdmin }, admin: { hidden: true, disableListColumn: true, disableListFilter: true } },
      ],
    }
  }),
})
