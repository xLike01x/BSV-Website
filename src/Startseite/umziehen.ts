import type { Payload } from 'payload'

const id = (x: unknown) => (x && typeof x === 'object' ? (x as { id: number }).id : x)

/**
 * Einmalig: Aktions-Box und Bilder standen früher unter „Vereinsdaten“.
 * Beim Start werden sie nach „Startseite & Bilder“ übernommen (die alten Felder bleiben unsichtbar erhalten).
 */
export async function startseiteUmziehen(payload: Payload) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  const neu = (await payload.findGlobal({ slug: 'startseite' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { uebernommen?: boolean } | null
  if (!neu || neu.uebernommen) return
  const v = (await payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true })) as unknown as { aktion?: Record<string, unknown>; startseite?: Record<string, unknown> }
  const s = v.startseite ?? {}
  const startseite = Object.fromEntries(
    Object.entries(s)
      .filter(([k]) => k !== 'id')
      .map(([k, w]) => [k, k === 'heroBilder' ? ((w as unknown[] | null) ?? []).map(id) : k.startsWith('bild') ? (id(w) ?? null) : w]),
  )
  const a = v.aktion ?? {}
  const aktion = Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'id').map(([k, w]) => [k, k === 'bild' ? (id(w) ?? null) : w]))
  await payload.updateGlobal({ slug: 'startseite' as never, data: { uebernommen: true, aktion, startseite } as never, overrideAccess: true, context: { disableRevalidate: true } })
  payload.logger.info('Aktions-Box und Bilder nach „Startseite & Bilder“ übernommen')
}
