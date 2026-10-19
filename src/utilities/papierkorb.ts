import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, CollectionSlug, Payload } from 'payload'
import { APIError } from 'payload'

/** Bereiche mit Papierkorb (dazu Formulare und Formular-Eingänge über das Plugin) */
export const PAPIERKORB: string[] = ['posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'kontaktanfragen', 'dokumente', 'alben', 'sponsoren', 'gesuche', 'mitgliedschaften']
export const PAPIERKORB_TAGE = 30

/** Einträge, die länger als 30 Tage im Papierkorb liegen, endgültig löschen */
export async function papierkorbAufraeumen(payload: Payload) {
  const grenze = new Date(Date.now() - PAPIERKORB_TAGE * 86400000).toISOString()
  let gesamt = 0
  for (const slug of [...PAPIERKORB, 'forms', 'form-submissions']) {
    try {
      const r = await payload.delete({
        collection: slug as CollectionSlug,
        where: { deletedAt: { less_than: grenze } },
        trash: true,
        overrideAccess: true,
      })
      gesamt += r.docs.length
    } catch (e) {
      payload.logger.warn({ err: e }, `Papierkorb ${slug} konnte nicht geleert werden`)
    }
  }
  if (gesamt) payload.logger.info(`Papierkorb: ${gesamt} Einträge nach ${PAPIERKORB_TAGE} Tagen endgültig gelöscht`)
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
