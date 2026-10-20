import { sql } from '@payloadcms/db-postgres'
import type { Access, CollectionConfig, Config, Plugin, PayloadRequest, Where } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * Zweistufiger Papierkorb
 * 1. Löschen → normaler Papierkorb (Payload, Feld deletedAt). Nach 30 Tagen automatisch weiter zu Stufe 2.
 * 2. „Endgültig löschen“ durch alle außer Web-Admin → Web-Admin-Papierkorb: Der Eintrag bleibt vollständig erhalten
 *    (mit Bildern, Dateien, Verknüpfungen), ist aber nur noch für Web-Admins sichtbar (Feld endgueltigAm).
 *    Wiederherstellen oder wirklich löschen: Einstellungen → „Web-Admin-Papierkorb“.
 *    Nach der eingestellten Frist (Standard 1 Jahr) wird er automatisch endgültig gelöscht.
 * Was ein Web-Admin endgültig löscht, ist sofort weg.
 */

export const istWebAdminReq = (req: PayloadRequest) => hasRole(req.user as never, 'webadmin')

/** Tabellenname in Postgres (Payload: Bindestriche → Unterstriche) */
export const tabelle = (slug: string) => slug.replace(/-/g, '_')

type Db = { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }> } }
export const ausfuehren = (req: { payload: { db: unknown } }, q: unknown) => (req.payload.db as unknown as Db).drizzle.execute(q)

const NICHT_ENTFERNT: Where = { endgueltigAm: { exists: false } }

/** Lesen: Nicht-Web-Admins sehen Einträge im Web-Admin-Papierkorb nicht (auch nicht im normalen Papierkorb) */
const lesenMitFilter =
  (orig: Access | undefined): Access =>
  async (args) => {
    const r = orig ? await orig(args) : Boolean(args.req.user)
    if (r === false || istWebAdminReq(args.req)) return r
    if (r === true) return NICHT_ENTFERNT
    return { and: [r as Where, NICHT_ENTFERNT] }
  }

/** Welche Einträge darf diese Person löschen? (Zugriffsregel „delete“ als Filter) */
const loeschFilter = async (c: CollectionConfig, req: PayloadRequest): Promise<Where | false> => {
  const zugriff = c.access?.delete
  if (typeof zugriff !== 'function') return Boolean(req.user) ? {} : false
  const r = await zugriff({ req } as never)
  if (r === false) return false
  return r === true ? {} : (r as Where)
}

const verschieben = (c: CollectionConfig): NonNullable<NonNullable<CollectionConfig['hooks']>['beforeOperation']>[number] => async ({ args, operation, req }) => {
  // Nur echtes Löschen aus dem Papierkorb durch angemeldete Nicht-Web-Admins umleiten
  if (operation !== 'delete' || !req.user || istWebAdminReq(req)) return args
  const a = args as { where?: Where; trash?: boolean }
  const erlaubt = await loeschFilter(c, req)
  if (erlaubt === false) return args // Payload meldet dann selbst „keine Berechtigung“
  const where: Where = { and: [a.where ?? {}, erlaubt, NICHT_ENTFERNT] }
  const treffer = await req.payload.find({ collection: c.slug as never, where, trash: true, depth: 0, limit: 500, pagination: false, overrideAccess: true, req })
  if (!treffer.docs.length) return args
  const ids = treffer.docs.map((d) => (d as { id: number }).id)
  const von = String((req.user as { name?: string; email?: string }).name || (req.user as { email?: string }).email || 'unbekannt').slice(0, 120)
  await ausfuehren(req, sql`update ${sql.identifier(tabelle(c.slug))} set endgueltig_am = now(), endgueltig_von = ${von}, deleted_at = coalesce(deleted_at, now()) where id in ${sql.raw(`(${ids.map(Number).join(',')})`)}`)
  ;(req.context as Record<string, unknown>).papierkorbVerschoben = treffer.docs
  // Payload selbst löscht nichts mehr – nur die übrigen (nicht verschobenen) Einträge, falls welche dabei sind
  return { ...args, where: { and: [a.where ?? {}, { id: { not_in: ids } }] } }
}

const ergebnis = (): NonNullable<NonNullable<CollectionConfig['hooks']>['afterOperation']>[number] => ({ operation, result, req }) => {
  const verschoben = (req.context as Record<string, unknown>).papierkorbVerschoben as unknown[] | undefined
  if (operation !== 'delete' || !verschoben?.length) return result
  const r = result as { docs?: unknown[]; errors?: unknown[] }
  // Für die Person sieht es aus wie gelöscht („3 endgültig gelöscht“)
  return { ...r, docs: [...(r.docs ?? []), ...verschoben], errors: r.errors ?? [] }
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
      access: { ...c.access, read: lesenMitFilter(c.access?.read) },
      hooks: {
        ...c.hooks,
        beforeOperation: [...(c.hooks?.beforeOperation ?? []), verschieben(c)],
        afterOperation: [...(c.hooks?.afterOperation ?? []), ergebnis()],
        beforeChange: [wiederherstellen, ...(c.hooks?.beforeChange ?? [])],
      },
      fields: [
        ...c.fields,
        { name: 'endgueltigAm', type: 'date', index: true, admin: { hidden: true, disableListColumn: true, disableListFilter: true } },
        { name: 'endgueltigVon', type: 'text', admin: { hidden: true, disableListColumn: true, disableListFilter: true } },
      ],
    }
  }),
})
