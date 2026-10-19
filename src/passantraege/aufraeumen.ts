import type { Payload } from 'payload'

type Fristen = { passUnterlagenTage?: number | null; passAntragMonate?: number | null }

/** Diese Unterlagen werden schon kurz nach Abschluss gelöscht – der unterschriebene Passantrag bleibt länger */
const KURZ = ['ausweis', 'passfoto', 'einwilligung', 'abmeldung', 'meldebescheinigung'] as const

/**
 * Datenschutz nach Abschluss eines Passantrags (erteilt/abgelehnt):
 * 1. Ausweis, Passfoto, Erklärungen usw. nach der kurzen Frist löschen (Standard 30 Tage).
 * 2. Der unterschriebene Passantrag muss 2 Jahre aufbewahrt werden – danach Antrag samt Datei löschen.
 * Dazu: hochgeladene Dateien, die nie zu einem Antrag wurden, nach 7 Tagen löschen.
 */
export async function passUnterlagenAufraeumen(payload: Payload) {
  const f = (await payload.findGlobal({ slug: 'datenschutz' as never, overrideAccess: true }).catch(() => ({}))) as Fristen
  const tage = f.passUnterlagenTage ?? 30
  const monate = f.passAntragMonate ?? 24
  let n = 0

  // 1. Kurze Frist: alles außer dem unterschriebenen Antrag
  const kurz = new Date(Date.now() - tage * 86400000).toISOString()
  const faellig = await payload.find({
    collection: 'passantraege',
    where: { and: [{ abgeschlossenAm: { less_than: kurz } }, { unterlagenGeloeschtAm: { exists: false } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  for (const a of faellig.docs) {
    // Alles löschen, was am Antrag hängt – außer der Datei im Feld „Passantrag (unterschrieben)“
    const behalten = a.passantrag && typeof a.passantrag === 'object' ? a.passantrag.id : a.passantrag
    const r = await payload.delete({
      collection: 'passdokumente',
      where: { and: [{ antrag: { equals: a.id } }, ...(behalten ? [{ id: { not_equals: behalten } }] : [])] },
      overrideAccess: true,
    })
    n += r.docs.length
    await payload.db.updateOne({
      collection: 'passantraege',
      id: a.id,
      data: { unterlagenGeloeschtAm: new Date().toISOString(), ...Object.fromEntries(KURZ.map((k) => [k, null])) } as never,
      returning: false,
    })
  }

  // 2. Aufbewahrungsfrist abgelaufen: Antrag samt unterschriebenem Formular löschen
  const grenze = new Date()
  grenze.setMonth(grenze.getMonth() - monate)
  const alt = await payload.find({ collection: 'passantraege', where: { abgeschlossenAm: { less_than: grenze.toISOString() } }, limit: 500, depth: 0, overrideAccess: true })
  for (const a of alt.docs) {
    await payload.delete({ collection: 'passantraege', id: a.id, overrideAccess: true }).catch(() => null)
    n++
  }

  const verwaist = await payload.delete({
    collection: 'passdokumente',
    where: { and: [{ antrag: { exists: false } }, { createdAt: { less_than: new Date(Date.now() - 7 * 86400000).toISOString() } }] },
    overrideAccess: true,
  })
  n += verwaist.docs.length
  if (n) payload.logger.info(`Passanträge: ${n} Unterlagen bzw. Anträge nach Frist gelöscht`)
  return n
}
