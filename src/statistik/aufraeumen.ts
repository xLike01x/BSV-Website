import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

type MitDrizzle = { drizzle: { execute: (q: unknown) => Promise<{ rowCount?: number | null }> } }

/** Alte Statistik-Einträge löschen (Frist unter Einstellungen → Datenschutz-Fristen, Standard 14 Monate) */
export async function statistikAufraeumen(payload: Payload) {
  const f = (await payload.findGlobal({ slug: 'datenschutz' as never, depth: 0, overrideAccess: true }).catch(() => null)) as { statistikMonate?: number | null; suchbegriffMonate?: number | null } | null
  const monate = Math.max(1, Math.min(36, f?.statistikMonate ?? 14))
  const d = new Date()
  d.setMonth(d.getMonth() - monate)
  const grenze = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  const r = await (payload.db as unknown as MitDrizzle).drizzle.execute(sql`delete from statistik where tag < ${grenze}`)
  if (r.rowCount) payload.logger.info(`Statistik: ${r.rowCount} Einträge älter als ${monate} Monate gelöscht`)
  // Suchbegriffe (Freitext, kann Namen enthalten) kürzer aufbewahren
  const sm = Math.max(1, Math.min(14, f?.suchbegriffMonate ?? 3))
  const s = new Date()
  s.setMonth(s.getMonth() - sm)
  const sg = s.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  const r2 = await (payload.db as unknown as MitDrizzle).drizzle.execute(sql`delete from statistik where art = 'suche' and tag < ${sg}`)
  if (r2.rowCount) payload.logger.info(`Statistik: ${r2.rowCount} Suchbegriffe älter als ${sm} Monate gelöscht`)
}
