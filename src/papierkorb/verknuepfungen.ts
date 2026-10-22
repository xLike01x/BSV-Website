import { sql } from '@payloadcms/db-postgres'
import type { CollectionBeforeDeleteHook, CollectionSlug, PayloadRequest } from 'payload'

/**
 * Verknüpfungen eines Eintrags vor dem endgültigen Löschen – direkt aus den Fremdschlüsseln der Datenbank gelesen,
 * damit neue Felder automatisch mitzählen.
 *
 * - „Lücke“: Die Verknüpfung wird beim Löschen geleert (z. B. ein Bild in einer News, ein Team bei einem Benutzer).
 * - „mitlöschen“: Ohne den Eintrag dürfen die verknüpften Datensätze nicht stehen (Pflichtfeld), z. B. Eingänge eines
 *   Formulars oder Ausfälle eines Teams. Sie werden beim endgültigen Löschen mitgelöscht (verknuepfteMitloeschen).
 *
 * Nicht erfasst: Bilder, die nur im Fließtext (Richtext) einer News oder Seite stecken – die stehen nicht als
 * Fremdschlüssel in der Datenbank.
 */
type Db = { drizzle: { execute: (q: unknown) => Promise<{ rows: Record<string, unknown>[] }> } }
const db = (req: { payload: { db: unknown } }) => (req.payload.db as unknown as Db).drizzle

type Fk = { von: string; spalte: string; regel: string; pflicht: boolean; hatParent: boolean; hatUnterParent: boolean }

const tabelle = (slug: string) => slug.replace(/-/g, '_')
const cache = new Map<string, { zeit: number; fks: Fk[] }>()

async function fremdschluessel(req: { payload: { db: unknown } }, slug: string): Promise<Fk[]> {
  const t = tabelle(slug)
  const c = cache.get(t)
  if (c && Date.now() - c.zeit < 10 * 60 * 1000) return c.fks
  const r = await db(req).execute(sql`
    select c.conrelid::regclass::text as von, a.attname as spalte, c.confdeltype as regel, a.attnotnull as pflicht,
      exists (select 1 from information_schema.columns k where k.table_name = c.conrelid::regclass::text and k.column_name = 'parent_id') as hat_parent,
      exists (select 1 from information_schema.columns k where k.table_name = c.conrelid::regclass::text and k.column_name = '_parent_id') as hat_unter_parent
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f' and c.confrelid = ${t}::regclass and c.confdeltype in ('n', 'a', 'r', 'c')`)
  const fks = r.rows
    .map((x) => ({ von: String(x.von).replace(/"/g, ''), spalte: String(x.spalte), regel: String(x.regel), pflicht: x.pflicht === true, hatParent: x.hat_parent === true, hatUnterParent: x.hat_unter_parent === true }))
    // Versionen (zählen schon beim Haupteintrag), eigene Untertabellen und interne Tabellen von Payload/Suche auslassen
    .filter((f) => !f.von.startsWith('_') && f.von !== t && !f.von.startsWith(`${t}_`) && !f.von.startsWith('payload_') && !f.von.startsWith('search'))
    // „Mitlöschen per Datenbank“ (cascade) zählt nur bei Mehrfach-Verknüpfungen anderer Bereiche (z. B. Teams eines Benutzers)
    .filter((f) => f.regel !== 'c' || f.von.endsWith('_rels'))
  cache.set(t, { zeit: Date.now(), fks })
  return fks
}

/** Zu welchem Bereich (Sammlung oder Einstellung) gehört eine Tabelle – längster passender Tabellenname */
function besitzer(req: PayloadRequest, tab: string): { slug: string; label: string; global: boolean } | null {
  let best: { slug: string; label: string; global: boolean; laenge: number } | null = null
  const pruefen = (slug: string, label: unknown, global: boolean) => {
    const t = tabelle(slug)
    if ((tab === t || tab.startsWith(`${t}_`)) && (!best || t.length > best.laenge)) {
      const l = typeof label === 'string' ? label : ((label as Record<string, string> | undefined)?.de ?? slug)
      best = { slug, label: l, global, laenge: t.length }
    }
  }
  for (const [slug, c] of Object.entries(req.payload.collections)) pruefen(slug, c.config.labels?.plural, false)
  for (const g of req.payload.config.globals ?? []) pruefen(g.slug, g.label, true)
  return best
}

export type Verknuepfung = { bereich: string; anzahl: number; mitloeschen: boolean }

export async function verknuepfungen(req: PayloadRequest, slug: string, id: number): Promise<Verknuepfung[]> {
  // Je Bereich die betroffenen Einträge sammeln (ein Eintrag kann über mehrere Felder verknüpft sein, z. B. Titel- und Vorschaubild)
  const summe = new Map<string, { bereich: string; ids: Set<string>; mitloeschen: boolean }>()
  for (const f of await fremdschluessel(req, slug)) {
    const b = besitzer(req, f.von)
    if (!b) continue
    // Bei Untertabellen zählt der übergeordnete Eintrag
    const spalte = f.hatParent ? sql.identifier('parent_id') : f.hatUnterParent ? sql.identifier('_parent_id') : sql.identifier('id')
    const r = await db(req)
      .execute(sql`select distinct ${spalte}::text as k from ${sql.identifier(f.von)} where ${sql.identifier(f.spalte)} = ${id} limit 1000`)
      .catch(() => ({ rows: [] as Record<string, unknown>[] }))
    if (!r.rows.length) continue
    const mitloeschen = f.regel === 'a' || f.regel === 'r' || (f.regel === 'n' && f.pflicht)
    const key = `${b.slug}|${mitloeschen}`
    const eintrag = summe.get(key) ?? { bereich: b.global ? `Einstellung „${b.label}“` : b.label, ids: new Set<string>(), mitloeschen }
    for (const x of r.rows) eintrag.ids.add(String(x.k))
    summe.set(key, eintrag)
  }
  return [...summe.values()]
    .map((e) => ({ bereich: e.bereich, anzahl: e.ids.size, mitloeschen: e.mitloeschen }))
    .sort((a, b) => Number(b.mitloeschen) - Number(a.mitloeschen) || a.bereich.localeCompare(b.bereich))
}

/**
 * Vor dem endgültigen Löschen: Datensätze, die ohne diesen Eintrag nicht stehen dürfen (Pflichtfeld), ebenfalls
 * endgültig löschen – sonst scheitert das Löschen in der Datenbank. Läuft nur beim echten Löschen, nicht beim
 * Verschieben in den Papierkorb.
 */
export const verknuepfteMitloeschen: CollectionBeforeDeleteHook = async ({ collection, id, req }) => {
  for (const f of await fremdschluessel(req, collection.slug)) {
    if (!(f.regel === 'a' || f.regel === 'r' || (f.regel === 'n' && f.pflicht))) continue
    const b = besitzer(req, f.von)
    // Nur Haupttabellen anderer Sammlungen (Pflicht-Beziehungsfeld) – über Payload löschen, damit deren Hooks laufen
    if (!b || b.global || f.von !== tabelle(b.slug) || !/_id$/.test(f.spalte)) continue
    const feld = f.spalte.replace(/_id$/, '').replace(/_([a-z])/g, (_, z: string) => z.toUpperCase())
    await req.payload.delete({ collection: b.slug as CollectionSlug, where: { [feld]: { equals: id } }, trash: true, overrideAccess: true, req })
  }
}
