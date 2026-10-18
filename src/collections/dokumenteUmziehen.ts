import fs from 'fs'
import path from 'path'
import type { Endpoint } from 'payload'

import { hasRole } from '@/access/roles'
import { MEDIEN_ORDNER } from '@/utilities/medienUmziehen'

type Download = { id?: string; titel?: string; nurMitglieder?: boolean | null; datei?: number | { id: number; filename?: string } | null; dokument?: unknown }

/**
 * Alte Downloads „Nur für Mitglieder“, deren Datei noch öffentlich in der Mediathek liegt,
 * in die geschützten Mitglieder-Dokumente umziehen – und die öffentliche Kopie löschen.
 */
export const dokumenteUmziehen: Endpoint = {
  path: '/umziehen',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'redaktion', 'kasse')) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
    const p = req.payload
    const verein = (await p.findGlobal({ slug: 'verein', depth: 1, overrideAccess: true })) as unknown as { downloads?: Download[] }
    const downloads = verein.downloads ?? []
    let umgezogen = 0
    const neu: Download[] = []
    for (const d of downloads) {
      const m = d.datei && typeof d.datei === 'object' ? d.datei : null
      if (!d.nurMitglieder || d.dokument || !m?.filename) {
        neu.push({ ...d, datei: m ? m.id : (d.datei as number | null), dokument: d.dokument && typeof d.dokument === 'object' ? (d.dokument as { id: number }).id : d.dokument })
        continue
      }
      const quelle = path.join(MEDIEN_ORDNER, m.filename)
      if (!fs.existsSync(quelle)) {
        neu.push({ ...d, datei: m.id })
        continue
      }
      const dok = await p.create({ collection: 'dokumente', data: { titel: d.titel ?? m.filename }, filePath: quelle, overrideAccess: true })
      neu.push({ ...d, datei: null, dokument: dok.id })
      // Öffentliche Kopie samt Bildgrößen endgültig entfernen
      await p.delete({ collection: 'media', id: m.id, overrideAccess: true }).catch(() => {})
      umgezogen++
    }
    if (umgezogen) await p.updateGlobal({ slug: 'verein', data: { downloads: neu } as never, overrideAccess: true })
    return Response.json({ umgezogen })
  },
}
