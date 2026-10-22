import type { CollectionSlug, Payload, PayloadRequest } from 'payload'

/**
 * Einzelne Felder eines Datensatzes direkt in der Datenbank ändern (ohne Hooks und Rechteprüfung).
 *
 * Nicht `payload.db.updateOne({ id, data })` verwenden: Der Postgres-Adapter (3.91) schreibt das als
 * „INSERT … ON CONFLICT DO UPDATE“ – bei Teil-Daten scheitert das an Pflichtspalten ohne Standardwert
 * (z. B. „name“ bei Benutzern). Mit `where` + `atomic` entsteht ein echtes UPDATE.
 * Nur für Felder der Haupttabelle (keine Listen, Mehrfach-Beziehungen oder Übersetzungen).
 */
export async function zeileAendern(
  payload: Payload,
  collection: CollectionSlug,
  id: number | string,
  data: Record<string, unknown>,
  req?: Partial<PayloadRequest>,
): Promise<void> {
  await payload.db.updateOne({ collection, where: { id: { equals: id } }, data, req, returning: false, options: { atomic: true } } as never)
}
