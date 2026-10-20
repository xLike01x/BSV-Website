import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, CollectionSlug, Payload } from 'payload'
import { APIError } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import { ausfuehren, PERSONEN_BEREICHE, tabelle, zusatzBeimEntfernen } from '@/papierkorb/plugin'

/** Bereiche mit Papierkorb (dazu Formulare und Formular-Eingänge über das Plugin) */
export const PAPIERKORB: string[] = ['posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'kontaktanfragen', 'dokumente', 'alben', 'sponsoren', 'gesuche', 'mitgliedschaften']
export const PAPIERKORB_TAGE = 30

/**
 * Täglich:
 * 1. Einträge, die länger als 30 Tage im normalen Papierkorb liegen → Web-Admin-Papierkorb (nichts geht sofort verloren)
 * 2. Einträge, die länger als die eingestellte Frist im Web-Admin-Papierkorb liegen (Standard 1 Jahr) → endgültig löschen
 */
export async function papierkorbAufraeumen(payload: Payload) {
  const grenze = new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString()
  const s = (await payload.findGlobal({ slug: 'sicherheit' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { papierkorbTage?: number | null } | null
  const tage = Math.max(30, Math.min(3650, s?.papierkorbTage ?? 365))
  const wegGrenze = new Date(Date.now() - tage * 86400000).toISOString()
  const ds = (await payload.findGlobal({ slug: 'datenschutz' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { personenPapierkorbTage?: number | null } | null
  const personenTage = Math.max(1, Math.min(90, ds?.personenPapierkorbTage ?? 30))
  const personenGrenze = new Date(Date.now() - personenTage * 86400000).toISOString()
  let weiter = 0
  let gesamt = 0
  for (const slug of [...PAPIERKORB, 'forms', 'form-submissions']) {
    try {
      const r = await ausfuehren({ payload }, sql`update ${sql.identifier(tabelle(slug))} set endgueltig_am = now(), endgueltig_von = ${'automatisch nach ' + PAPIERKORB_TAGE + ' Tagen'}${zusatzBeimEntfernen(slug)} where deleted_at < ${grenze} and endgueltig_am is null`)
      weiter += r.rowCount ?? 0
      const grenzeHier = PERSONEN_BEREICHE.includes(slug) ? personenGrenze : wegGrenze
      const weg = await payload.delete({ collection: slug as CollectionSlug, where: { endgueltigAm: { less_than: grenzeHier } }, trash: true, overrideAccess: true })
      gesamt += weg.docs.length
    } catch (e) {
      payload.logger.warn({ err: e }, `Papierkorb ${slug} konnte nicht aufgeräumt werden`)
    }
  }
  if (weiter) payload.logger.info(`Papierkorb: ${weiter} Einträge nach ${PAPIERKORB_TAGE} Tagen in den Web-Admin-Papierkorb verschoben`)
  if (gesamt) payload.logger.info(`Web-Admin-Papierkorb: ${gesamt} Einträge nach ${tage} Tagen endgültig gelöscht`)
  return gesamt
}

type Doc = { id: number | string; deletedAt?: string | null }

/**
 * Schutz rund um den Papierkorb (wird an alle Bereiche mit Papierkorb gehängt):
 * - Wiederherstellen nur, wer auch löschen darf (sonst könnte z. B. die Redaktion vom Admin Gelöschtes zurückholen)
 * - Sofort endgültig löschen (ohne Papierkorb) nur Admins – alle anderen löschen über den Papierkorb
 */
export const papierkorbSchutz = (slug: string): { beforeChange: CollectionBeforeChangeHook[]; beforeDelete: CollectionBeforeDeleteHook[] } => ({
  beforeChange: [
    async ({ data, originalDoc, req, collection }) => {
      const wiederherstellen = Boolean((originalDoc as Doc | undefined)?.deletedAt) && data && 'deletedAt' in data && !data.deletedAt
      if (!wiederherstellen || !req.user) return data
      const zugriff = collection.access?.delete
      const erlaubt = typeof zugriff === 'function' ? await zugriff({ req, id: (originalDoc as Doc).id as number, data: originalDoc }) : true
      if (erlaubt === false) throw new APIError('Wiederherstellen darf nur, wer diesen Eintrag auch löschen darf.', 403)
      return data
    },
  ],
  beforeDelete: [
    async ({ id, req }) => {
      const user = req.user as { roles?: string[] } | null
      if (!user || user.roles?.includes('admin')) return
      const doc = (await req.payload.findByID({ collection: slug as CollectionSlug, id, trash: true, depth: 0, overrideAccess: true, req }).catch(() => null)) as Doc | null
      if (doc && !doc.deletedAt) throw new APIError('Bitte über den Papierkorb löschen – endgültig löschen dürfen nur Admins.', 403)
    },
  ],
})
