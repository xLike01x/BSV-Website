import type { Payload } from 'payload'

/**
 * Einmalig nach dem Update vom Oktober 2026: „Automatisch aufräumen“ für bestehende Installationen einschalten
 * (vorher war es standardmäßig aus – Fristen griffen dann nie). Danach kann man es wieder abschalten, es bleibt dann aus.
 */
export async function datenschutzStandards(payload: Payload) {
  const d = (await payload.findGlobal({ slug: 'datenschutz' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { standardsOktober2026?: boolean | null } | null
  if (!d || d.standardsOktober2026) return
  await payload.updateGlobal({ slug: 'datenschutz' as never, data: { automatisch: true, standardsOktober2026: true } as never, overrideAccess: true, context: { disableRevalidate: true } })
  payload.logger.info('Datenschutz: „Automatisch aufräumen“ eingeschaltet (neuer Standard)')
}
