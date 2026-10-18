import type { Payload } from 'payload'

type Alt = { name?: string | null; url?: string | null; logo?: number | { id: number } | null }

/**
 * Einmalig: Der Hauptsponsor stand früher unter „Vereinsdaten“. Jetzt wird er wie alle
 * anderen in „Sponsoren“ gepflegt (Art „Hauptsponsor“). Beim Start wird er dorthin
 * übernommen und das alte Feld geleert, damit es nur noch eine Stelle gibt.
 */
export async function hauptsponsorUmziehen(payload: Payload) {
  const verein = (await payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true })) as unknown as { hauptsponsor?: Alt }
  const alt = verein.hauptsponsor
  if (!alt?.name?.trim()) return

  const vorhanden = await payload.find({
    collection: 'sponsoren',
    trash: true,
    where: { or: [{ stufe: { equals: 'haupt' } }, { name: { equals: alt.name } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const context = { disableRevalidate: true }
  if (vorhanden.totalDocs === 0) {
    await payload.create({
      collection: 'sponsoren',
      overrideAccess: true,
      context,
      data: {
        name: alt.name,
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
}
