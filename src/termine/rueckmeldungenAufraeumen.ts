import type { Payload } from 'payload'

/**
 * Datenschutz: Zu- und Absagen X Tage nach dem Termin endgültig löschen (Einstellungen → Datenschutz-Fristen, Standard 30).
 * Dazu Einträge ohne Termin oder ohne Konto (Termin bzw. Konto wurde gelöscht).
 */
export async function rueckmeldungenAufraeumen(payload: Payload) {
  const f = (await payload.findGlobal({ slug: 'datenschutz' as never, depth: 0, overrideAccess: true }).catch(() => ({}))) as { rueckmeldungenTage?: number | null }
  const tage = Math.max(1, f.rueckmeldungenTage ?? 30)
  const grenze = new Date(Date.now() - tage * 86400000).toISOString()
  // Termine (auch im Papierkorb), deren Beginn – bzw. Ende, falls angegeben – länger als die Frist zurückliegt
  const alt = await payload.find({
    collection: 'termine',
    where: { and: [{ beginn: { less_than: grenze } }, { or: [{ ende: { exists: false } }, { ende: { less_than: grenze } }] }] },
    trash: true,
    depth: 0,
    limit: 0,
    pagination: false,
    select: {},
    overrideAccess: true,
  })
  const ids = alt.docs.map((t) => t.id)
  const r = await payload.delete({
    collection: 'termin-rueckmeldungen',
    where: { or: [...(ids.length ? [{ termin: { in: ids } }] : []), { termin: { exists: false } }, { mitglied: { exists: false } }] },
    overrideAccess: true,
  })
  if (r.docs.length) payload.logger.info(`Termine: ${r.docs.length} Zu-/Absagen nach Frist gelöscht`)
  return r.docs.length
}
