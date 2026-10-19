import type { Payload } from 'payload'

type Alt = { name?: string | null; url?: string | null; logo?: number | { id: number } | null }

/**
 * Einmalig: Der Hauptsponsor stand früher unter „Vereinsdaten“. Jetzt wird er wie alle
 * anderen in „Sponsoren“ gepflegt (Art „Hauptsponsor“). Beim Start wird er dorthin
 * übernommen und das alte Feld geleert, damit es nur noch eine Stelle gibt.
 */
export async function hauptsponsorUmziehen(payload: Payload): Promise<string | null> {
  const verein = (await payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true })) as unknown as { hauptsponsor?: Alt }
  const alt = verein.hauptsponsor
  if (!alt?.name?.trim()) return null

  // Nicht doppelt laufen (Start, Website-Aufruf und Admin-Liste können gleichzeitig kommen)
  const g = globalThis as unknown as { __bsvHauptsponsor?: Promise<string | null> }
  if (g.__bsvHauptsponsor) return g.__bsvHauptsponsor
  g.__bsvHauptsponsor = uebernehmen(payload, alt).finally(() => {
    g.__bsvHauptsponsor = undefined
  })
  return g.__bsvHauptsponsor
}

async function uebernehmen(payload: Payload, alt: Alt): Promise<string | null> {
  const context = { disableRevalidate: true }
  // Gibt es schon einen aktiven Hauptsponsor (nicht im Papierkorb)? Dann nichts anlegen.
  const haupt = await payload.find({ collection: 'sponsoren', where: { stufe: { equals: 'haupt' } }, limit: 1, depth: 0, overrideAccess: true })
  // Gleicher Name schon als anderer Sponsor da? Dann zum Hauptsponsor machen statt doppelt anlegen.
  const gleich = haupt.totalDocs ? null : (await payload.find({ collection: 'sponsoren', where: { name: { equals: alt.name } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (gleich) await payload.update({ collection: 'sponsoren', id: gleich.id, data: { stufe: 'haupt', aktiv: true } as never, overrideAccess: true, context })
  const neu = haupt.totalDocs === 0 && !gleich
  if (neu) {
    await payload.create({
      collection: 'sponsoren',
      overrideAccess: true,
      context,
      data: {
        name: alt.name!,
        url: alt.url || undefined,
        logo: alt.logo && typeof alt.logo === 'object' ? alt.logo.id : (alt.logo ?? undefined),
        stufe: 'haupt',
        reihenfolge: 1,
        imLaufband: true,
        aktiv: true,
      },
    })
    payload.logger.info(`Hauptsponsor „${alt.name}“ in die Sponsoren übernommen`)
  }
  // Leerer Text (statt leer) = schon übernommen, kommt nicht wieder
  await payload.updateGlobal({ slug: 'verein', overrideAccess: true, context, data: { hauptsponsor: { name: '', url: '', logo: null } } as never })
  return neu || gleich ? (alt.name ?? null) : null
}
