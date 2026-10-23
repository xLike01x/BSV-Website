import type { Endpoint } from 'payload'

import { hasRole } from '@/access/roles'
import { istJson } from '@/utilities/istJson'

import { updatePruefungAus, updatesPruefen } from './updates'

let zuletzt = 0

/** POST /api/updates/pruefen – Update-Prüfung sofort ausführen (nur Web-Admins, höchstens einmal pro Minute) */
export const updatesEndpunkt: Endpoint = {
  path: '/updates/pruefen',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'webadmin')) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
    if (!istJson(req)) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 415 })
    if (updatePruefungAus()) return Response.json({ fehler: 'Die Prüfung ist abgeschaltet (BSV_PAKETPRUEFUNG=aus).' }, { status: 409 })
    if (Date.now() - zuletzt < 60_000) return Response.json({ fehler: 'Gerade erst geprüft – bitte eine Minute warten.' }, { status: 429 })
    zuletzt = Date.now()
    const s = await updatesPruefen(req.payload)
    return Response.json({ geprueftAm: s.geprueftAm, anzahl: s.eintraege.filter((e) => e.art !== 'aktuell').length })
  },
}
