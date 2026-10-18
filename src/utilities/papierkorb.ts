import type { CollectionSlug, Payload } from 'payload'

/** Bereiche mit Papierkorb (dazu Formulare und Formular-Eingänge über das Plugin) */
export const PAPIERKORB: string[] = ['posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'kontaktanfragen', 'dokumente']
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
