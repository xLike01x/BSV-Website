import type { Endpoint, GlobalConfig, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'
import { istJson } from '@/utilities/istJson'

/**
 * Wartung: wann zuletzt eine Wiederherstellung getestet und der Saisonwechsel gemacht wurde.
 * Kein eigener Menüpunkt – gesetzt wird über die Knöpfe auf „Datensicherung“ bzw. im Saisonwechsel-Assistenten.
 */
const name = (req: PayloadRequest) => {
  const u = req.user as { name?: string | null; email?: string } | null
  return (u?.name || u?.email || 'unbekannt').slice(0, 120)
}

const getestetEndpunkt: Endpoint = {
  path: '/wiederherstellung-getestet',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'webadmin')) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
    if (!istJson(req)) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 415 })
    const am = new Date().toISOString()
    await req.payload.updateGlobal({ slug: 'wartung' as never, data: { wiederherstellungGetestetAm: am, wiederherstellungVon: name(req) } as never, overrideAccess: true, req })
    return Response.json({ am, von: name(req) })
  },
}

/** Saisonwechsel (nur Fußball): Teams abhaken, neue Saison beginnen, abschließen (Admin und Redaktion) */
export type SaisonStand = { saisonStart?: string | null; saisonGeprueft?: Record<string, string> | null; saisonwechselAm?: string | null; saisonwechselVon?: string | null }
let kette: Promise<unknown> = Promise.resolve()
const nacheinander = <T>(f: () => Promise<T>): Promise<T> => {
  const p = kette.then(f, f)
  kette = p.catch(() => {})
  return p
}

const saisonEndpunkt: Endpoint = {
  path: '/saison',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'redaktion')) return Response.json({ fehler: 'Nur für Admins und Redaktion.' }, { status: 403 })
    if (!istJson(req)) return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 415 })
    const body = (await req.json?.().catch(() => null)) as { aktion?: unknown; id?: unknown; geprueft?: unknown } | null
    const aktion = body?.aktion
    if (aktion !== 'pruefen' && aktion !== 'start' && aktion !== 'abschliessen') return Response.json({ fehler: 'Unbekannte Aktion.' }, { status: 400 })
    let id: number | null = null
    if (aktion === 'pruefen') {
      id = typeof body?.id === 'number' && Number.isInteger(body.id) && body.id > 0 && body.id <= 2147483647 ? body.id : null
      if (!id || typeof body?.geprueft !== 'boolean') return Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 400 })
      const da = await req.payload.count({ collection: 'angebote', where: { and: [{ id: { equals: id } }, { bereich: { equals: 'fussball' } }] }, overrideAccess: true })
      if (!da.totalDocs) return Response.json({ fehler: 'Dieses Fußballteam gibt es nicht (mehr).' }, { status: 404 })
    }
    return nacheinander(async () => {
      const alt = (await req.payload.findGlobal({ slug: 'wartung' as never, depth: 0, overrideAccess: true })) as SaisonStand
      const jetzt = new Date().toISOString()
      let data: SaisonStand
      if (aktion === 'start') data = { saisonStart: jetzt, saisonGeprueft: {} }
      else if (aktion === 'abschliessen') data = { saisonwechselAm: jetzt, saisonwechselVon: name(req) }
      else {
        const geprueft = { ...(alt.saisonGeprueft ?? {}) }
        if (body?.geprueft) geprueft[String(id)] = jetzt
        else delete geprueft[String(id)]
        data = { saisonGeprueft: geprueft, ...(alt.saisonStart ? {} : { saisonStart: jetzt }) }
      }
      const neu = (await req.payload.updateGlobal({ slug: 'wartung' as never, data: data as never, overrideAccess: true, req })) as SaisonStand
      return Response.json({ saisonStart: neu.saisonStart ?? null, saisonGeprueft: neu.saisonGeprueft ?? {}, saisonwechselAm: neu.saisonwechselAm ?? null, saisonwechselVon: neu.saisonwechselVon ?? null })
    })
  },
}

const nurWebAdmin = ({ req }: { req: PayloadRequest }) => hasRole(req.user as never, 'webadmin')

export const Wartung: GlobalConfig = {
  slug: 'wartung',
  label: 'Wartung',
  access: {
    read: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion'),
    // Nur über die Endpunkte (mit Rollenprüfung) – kein freies Bearbeiten
    update: () => false,
  },
  admin: { hidden: true },
  endpoints: [getestetEndpunkt, saisonEndpunkt],
  fields: [
    { name: 'wiederherstellungGetestetAm', type: 'date', access: { read: nurWebAdmin } },
    { name: 'wiederherstellungVon', type: 'text', access: { read: nurWebAdmin } },
    { name: 'saisonStart', type: 'date' },
    { name: 'saisonGeprueft', type: 'json' },
    { name: 'saisonwechselAm', type: 'date' },
    { name: 'saisonwechselVon', type: 'text' },
    { name: 'monatsberichtAm', type: 'date', access: { read: nurWebAdmin } },
  ],
}
