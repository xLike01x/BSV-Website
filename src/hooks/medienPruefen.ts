import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { alleBilder, medienSichtbar } from '@/access/roles'
import { medienImText, medienInDaten } from '@/collections/Media/autoZuordnen'

/** Alle Bild-IDs eines Eintrags (Bildfelder + Bilder im Text) */
const bilderVon = (doc: unknown) => {
  const d = (doc ?? {}) as Record<string, unknown>
  return new Set<number>([...medienInDaten(d), ...medienImText(d.content)])
}

/**
 * Team-Rollen dürfen nur Bilder ihrer Teams und „Verein allgemein“ neu einfügen.
 * Greift auch bei Entwürfen (dort prüft Payload die Auswahl-Filter nicht).
 * Bilder, die schon vorher im Eintrag waren (z. B. von der Redaktion), bleiben erlaubt.
 */
export const medienPruefen: CollectionBeforeChangeHook = async ({ req, data, originalDoc }) => {
  const user = req.user
  if (!user || alleBilder(user)) return data
  const vorher = bilderVon(originalDoc)
  const neu = [...bilderVon({ ...(originalDoc ?? {}), ...data })].filter((id) => !vorher.has(id))
  if (!neu.length) return data
  const where = await medienSichtbar(req)
  if (!where) return data
  const erlaubt = await req.payload.find({
    collection: 'media',
    where: { and: [{ id: { in: neu } }, where] },
    limit: neu.length,
    depth: 0,
    select: {},
    overrideAccess: true,
    req,
  })
  if (erlaubt.docs.length < neu.length)
    throw new APIError('Dieses Bild gehört zu einem anderen Team. Du kannst nur Bilder deiner Teams und aus „Verein allgemein“ benutzen.', 403)
  return data
}
