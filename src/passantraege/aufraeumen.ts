import type { Payload } from 'payload'

/**
 * Datenschutz: Nach Abschluss eines Passantrags (erteilt/abgelehnt) werden die Unterlagen
 * (Ausweis, Foto, …) nach der eingestellten Frist gelöscht. Der Antrag selbst bleibt als Nachweis.
 * Dazu: hochgeladene Dateien, die nie zu einem Antrag wurden, nach 2 Tagen löschen.
 */
export async function passUnterlagenAufraeumen(payload: Payload) {
  const f = (await payload.findGlobal({ slug: 'datenschutz' as never, overrideAccess: true }).catch(() => ({}))) as { passUnterlagenTage?: number | null }
  const tage = f.passUnterlagenTage ?? 30
  const grenze = new Date(Date.now() - tage * 86400000).toISOString()
  const faellig = await payload.find({
    collection: 'passantraege',
    where: { and: [{ abgeschlossenAm: { less_than: grenze } }, { unterlagenGeloeschtAm: { exists: false } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  let n = 0
  for (const a of faellig.docs) {
    const r = await payload.delete({ collection: 'passdokumente', where: { antrag: { equals: a.id } }, overrideAccess: true })
    n += r.docs.length
    await payload.db.updateOne({
      collection: 'passantraege',
      id: a.id,
      data: { unterlagenGeloeschtAm: new Date().toISOString(), passantrag: null, ausweis: null, passfoto: null, einwilligung: null, abmeldung: null, meldebescheinigung: null } as never,
      returning: false,
    })
  }
  const verwaist = await payload.delete({
    collection: 'passdokumente',
    where: { and: [{ antrag: { exists: false } }, { createdAt: { less_than: new Date(Date.now() - 2 * 86400000).toISOString() } }] },
    overrideAccess: true,
  })
  n += verwaist.docs.length
  if (n) payload.logger.info(`Passanträge: ${n} Unterlagen nach Frist gelöscht`)
  return n
}
