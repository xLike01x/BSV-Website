import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { istWebAdmin } from '@/access/roles'

type MitRollen = { id?: number | string; roles?: string[] | null; email?: string; zweiFaktorAktiv?: boolean | null }

const hat = (doc: MitRollen | undefined | null, rolle: string) => Boolean(doc?.roles?.includes(rolle))

const anzahlWebAdmins = async (req: PayloadRequest, ohne?: number | string) => {
  const r = await req.payload.find({ collection: 'users', where: { roles: { contains: 'webadmin' } }, limit: 50, depth: 0, overrideAccess: true, req })
  return r.docs.filter((d) => d.id !== ohne).length
}

/**
 * Schutz der obersten Konten:
 * - Web-Admin hat immer auch „admin“.
 * - Nur Web-Admins vergeben oder entziehen „admin“/„webadmin“/„lesen“ (Ausnahme: solange es noch keinen Web-Admin gibt).
 *   „Nur ansehen“ öffnet auch Bereiche, die sonst nur Web-Admins sehen (z. B. Besucherstatistik).
 * - Konten von Web-Admins kann nur ein Web-Admin ändern (oder die Person selbst).
 * - Bei anderen Admins darf nur ein Web-Admin E-Mail und Passwort ändern, die Zwei-Faktor-Anmeldung zurücksetzen
 *   oder das Konto löschen – sonst könnte ein Admin das Konto eines anderen Admins übernehmen (Audit I-03).
 * - Der letzte Web-Admin kann seine Rolle nicht verlieren.
 */
export const webadminSchutz: CollectionBeforeChangeHook = async ({ req, data, originalDoc, operation }) => {
  const ich = req.user as MitRollen | null
  const neu = Array.isArray(data.roles) ? (data.roles as string[]) : undefined

  // Web-Admin ⇒ immer auch Admin
  if (neu?.includes('webadmin') && !neu.includes('admin')) data.roles = [...neu, 'admin']

  if (!ich) return data // interne Vorgänge (z. B. Einrichtung, Import)

  const vorher = (originalDoc ?? {}) as MitRollen
  const binIchWebAdmin = istWebAdmin(ich)
  const selbst = operation === 'update' && vorher.id === ich.id

  if (operation === 'update' && hat(vorher, 'webadmin') && !binIchWebAdmin && !selbst)
    throw new APIError('Dieses Konto gehört einem Web-Admin und kann nur von einem Web-Admin geändert werden.', 403)

  if (operation === 'update' && hat(vorher, 'admin') && !binIchWebAdmin && !selbst) {
    const zugang =
      (typeof data.email === 'string' && data.email.trim().toLowerCase() !== (vorher.email ?? '').toLowerCase()) ||
      typeof data.password === 'string' ||
      (data.zweiFaktorAktiv === false && vorher.zweiFaktorAktiv === true)
    if (zugang && (await anzahlWebAdmins(req)) > 0)
      throw new APIError('E-Mail, Passwort und Zwei-Faktor-Anmeldung eines anderen Admins kann nur ein Web-Admin ändern.', 403)
  }

  if (neu) {
    const nachher = data.roles as string[]
    const geaendert = ['admin', 'webadmin', 'lesen'].some((r) => (vorher.roles ?? []).includes(r) !== nachher.includes(r))
    if (geaendert && !binIchWebAdmin) {
      const gibtWebAdmin = (await anzahlWebAdmins(req)) > 0
      if (gibtWebAdmin) throw new APIError('Die Rollen Admin, Web-Admin und „Nur ansehen“ kann nur ein Web-Admin vergeben oder entziehen.', 403)
    }
    if (operation === 'update' && hat(vorher, 'webadmin') && !nachher.includes('webadmin') && (await anzahlWebAdmins(req, vorher.id)) === 0)
      throw new APIError('Das ist der letzte Web-Admin. Bitte zuerst eine andere Person zum Web-Admin machen.', 400)
  }
  return data
}

export const webadminLoeschSchutz: CollectionBeforeDeleteHook = async ({ req, id }) => {
  const ich = req.user as MitRollen | null
  if (!ich) return
  const ziel = (await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req })) as MitRollen
  if (hat(ziel, 'admin') && !hat(ziel, 'webadmin') && !istWebAdmin(ich) && ziel.id !== ich.id && (await anzahlWebAdmins(req)) > 0)
    throw new APIError('Konten von Admins kann nur ein Web-Admin löschen.', 403)
  if (!hat(ziel, 'webadmin')) return
  if (!istWebAdmin(ich)) throw new APIError('Konten von Web-Admins kann nur ein Web-Admin löschen.', 403)
  if ((await anzahlWebAdmins(req, id)) === 0) throw new APIError('Der letzte Web-Admin kann nicht gelöscht werden.', 400)
}
