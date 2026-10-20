import type { Endpoint } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

import { hasRole } from '@/access/roles'
import { fehlerAntwort, idAus, jsonVon, nurJson } from '@/posteingang/endpunkte'

/**
 * Vorschlag für die Startseite annehmen oder ablehnen – nur Redaktion und Admins.
 * Payload prüft zusätzlich die Feldrechte („Auf Startseite“ dürfen nur Redaktion/Admin setzen).
 *
 * Achtung Entwürfe: Hat eine veröffentlichte News einen neueren, noch nicht veröffentlichten Entwurf, würde ein
 * normales Speichern den Entwurf veröffentlichen bzw. die News offline nehmen. Dann wird der Entwurf (für später)
 * und die veröffentlichte Fassung getrennt geändert – der Entwurfstext bleibt unveröffentlicht.
 */
export const startseiteEndpunkt: Endpoint = {
  path: '/:id/startseite',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
    if (!hasRole(req.user as never, 'admin', 'redaktion')) return Response.json({ fehler: 'Das entscheidet die Redaktion.' }, { status: 403 })
    const id = idAus(req)
    if (!id) return Response.json({ fehler: 'News nicht gefunden.' }, { status: 404 })
    const body = await jsonVon<{ annehmen?: unknown }>(req)
    if (!body) return nurJson()
    const annehmen = body.annehmen === true
    const data = annehmen ? { aufStartseite: true, startseiteVorschlag: false } : { startseiteVorschlag: false }
    const gemeinsam = { collection: 'posts' as const, id, overrideAccess: false, user: req.user, req, depth: 0 }
    try {
      const live = await req.payload.findByID({ ...gemeinsam, draft: false })
      const neuester = await req.payload.findByID({ ...gemeinsam, draft: true })
      const offenerEntwurf = live._status === 'published' && neuester._status === 'draft'
      if (!offenerEntwurf) {
        await req.payload.update({ ...gemeinsam, data })
      } else {
        // 1) Entwurf: Entscheidung mitnehmen, damit sie beim späteren Veröffentlichen erhalten bleibt (prüft die Rechte)
        await req.payload.update({ ...gemeinsam, data, draft: true })
        // 2) Veröffentlichte Fassung: nur diese beiden Felder, ohne den Entwurf zu veröffentlichen
        await req.payload.db.updateOne({ collection: 'posts', id, data, req })
        revalidatePath('/')
        revalidatePath('/news')
        if (live.slug) revalidatePath(`/news/${live.slug}`)
        revalidateTag('posts-sitemap', 'max')
      }
      return Response.json({ ok: true })
    } catch (e) {
      return fehlerAntwort(e)
    }
  },
}
