import type { Payload } from 'payload'

const id = (x: unknown) => (x && typeof x === 'object' ? (x as { id: number }).id : (x ?? null))

type Alt = { aktion?: Record<string, unknown> | null; startseite?: Record<string, unknown> | null; uebernommen?: boolean | null }

/**
 * Einmalig: Bilder und die grüne Aktions-Box stehen jetzt unter „Texte & Bilder“ beim passenden Reiter.
 * Quelle ist „Startseite & Bilder“ (falls schon übernommen), sonst „Vereinsdaten“. Die alten Felder bleiben unsichtbar erhalten.
 */
export async function texteBilderUmziehen(payload: Payload) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const texte = (await payload.findGlobal({ slug: 'texte', depth: 0, overrideAccess: true }).catch(() => null)) as { bilderUebernommen?: boolean } | null
  if (!texte || texte.bilderUebernommen) return
  const start = (await payload.findGlobal({ slug: 'startseite' as never, depth: 0, overrideAccess: true }).catch(() => null)) as Alt | null
  const quelle: Alt = start?.uebernommen ? start : ((await payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true })) as unknown as Alt)
  const s = quelle.startseite ?? {}
  const a = quelle.aktion ?? {}
  const aktion = Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'id').map(([k, w]) => [k, k === 'bild' ? id(w) : w]))
  await payload.updateGlobal({
    slug: 'texte',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      bilderUebernommen: true,
      heroBilder: ((s.heroBilder as unknown[] | null) ?? []).map(id).filter(Boolean),
      ...(s.heroTag1 ? { heroTag1: s.heroTag1 } : {}),
      ...(s.heroTag2 ? { heroTag2: s.heroTag2 } : {}),
      bildFussball: id(s.bildFussball),
      bildKids: id(s.bildKids),
      bildFitness: id(s.bildFitness),
      aktion,
      breitensport: { bild1: id(s.bildBreitensport1), bild2: id(s.bildBreitensport2), bild3: id(s.bildBreitensport3) },
      verein: { titelbild: id(s.bildVerein) },
    } as never,
  })
  payload.logger.info('Bilder und Aktions-Box nach „Texte & Bilder“ übernommen')
}
