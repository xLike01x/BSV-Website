import type { GlobalAfterChangeHook } from 'payload'

/** PDF-Dateien aus „Satzung & Downloads“ landen automatisch im Mediathek-Ordner „Vereinsdokumente“ (wie Sponsor-Logos im Ordner „Sponsoren“) */
export const downloadsInOrdner: GlobalAfterChangeHook = async ({ doc, req }) => {
  const ids = ((doc as { downloads?: { datei?: unknown }[] | null }).downloads ?? [])
    .map((d) => (d.datei && typeof d.datei === 'object' ? (d.datei as { id?: number }).id : d.datei))
    .filter((id): id is number | string => id != null && id !== '')
  for (const id of new Set(ids)) {
    const m = (await req.payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true, req }).catch(() => null)) as {
      team?: unknown
      sponsoren?: boolean | null
      vereinsdokument?: boolean | null
      mimeType?: string | null
    } | null
    // Nur PDFs ohne Team und ohne Sponsoren-Logo: nichts aus Team-Ordnern herausziehen und keine Fotos
    // (z. B. aus „Noch nicht zugeordnet“) für alle Trainer freigeben – auch wenn die Person kein Recht „Bilder“ hat
    if (m && m.mimeType === 'application/pdf' && !m.team && !m.sponsoren && !m.vereinsdokument)
      await req.payload.update({ collection: 'media', id, data: { allgemein: true, vereinsdokument: true } as never, overrideAccess: true, req, context: { disableRevalidate: true } }).catch(() => null)
  }
  return doc
}
