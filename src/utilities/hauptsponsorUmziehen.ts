import { logoFreistellen } from '@/sponsoren/logo'
import type { Payload } from 'payload'

type Alt = { name?: string | null; url?: string | null; logo?: number | { id: number } | null }

/**
 * Einmalig: Der Hauptsponsor stand früher unter „Vereinsdaten“. Jetzt wird er wie alle
 * anderen in „Sponsoren“ gepflegt (Art „Hauptsponsor“). Beim Start wird er dorthin
 * übernommen und das alte Feld geleert, damit es nur noch eine Stelle gibt.
 */
export async function hauptsponsorUmziehen(payload: Payload): Promise<string | null> {
  // Nie beim Bauen der Website: dort laufen mehrere Prozesse gleichzeitig – jeder hätte einen eigenen Hauptsponsor angelegt
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
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

/**
 * Aufräumen: Ältere Versionen haben den Hauptsponsor beim Bauen der Website mehrfach angelegt
 * (je ein Eintrag pro Bau-Prozess). Exakt gleiche Kopien – gleicher Name, Link, Logo, ohne Text,
 * nie bearbeitet – kommen in den Papierkorb; der älteste Eintrag bleibt.
 */
export async function doppelteHauptsponsorenAufraeumen(payload: Payload) {
  const r = await payload.find({ collection: 'sponsoren', where: { stufe: { equals: 'haupt' } }, sort: 'createdAt', limit: 200, depth: 0, overrideAccess: true })
  type S = { id: number; name?: string; url?: string | null; logo?: number | null; text?: string | null; createdAt: string; updatedAt: string }
  const docs = r.docs as unknown as S[]
  const schluessel = (d: S) => JSON.stringify([d.name?.trim(), d.url ?? null, d.logo ?? null])
  const gesehen = new Set<string>()
  let n = 0
  for (const d of docs) {
    const k = schluessel(d)
    const unveraendert = !d.text && Math.abs(new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) < 5000
    if (gesehen.has(k) && unveraendert) {
      await payload.db.updateOne({ collection: 'sponsoren', id: d.id, data: { deletedAt: new Date().toISOString() } as never, returning: false })
      n++
    } else gesehen.add(k)
  }
  if (n) payload.logger.info(`${n} doppelte Hauptsponsor-Einträge in den Papierkorb gelegt`)
  return n
}

/** Logos aller Sponsoren in den Mediathek-Ordner „Sponsoren“ legen (für Logos von vor dem neuen Ordner) */
export async function sponsorLogosEinordnen(payload: Payload) {
  const r = await payload.find({ collection: 'sponsoren', where: { logo: { exists: true } }, limit: 500, depth: 0, overrideAccess: true, select: { logo: true } as never })
  const ids = [...new Set((r.docs as unknown as { logo?: number | { id: number } | null }[]).map((d) => (d.logo && typeof d.logo === 'object' ? d.logo.id : d.logo)).filter(Boolean))] as number[]
  if (!ids.length) return 0
  // Ältere Logos ohne freigestellte Größe nachträglich erzeugen
  for (const id of ids) await logoFreistellen(payload, id).catch((e) => payload.logger.warn({ err: e }, 'Logo freistellen fehlgeschlagen'))
  const u = await payload.update({
    collection: 'media',
    where: { and: [{ id: { in: ids } }, { team: { exists: false } }, { sponsoren: { not_equals: true } }] },
    data: { allgemein: true, sponsoren: true } as never,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  if (u.docs.length) payload.logger.info(`${u.docs.length} Sponsor-Logos in den Mediathek-Ordner „Sponsoren“ gelegt`)
  return u.docs.length
}
