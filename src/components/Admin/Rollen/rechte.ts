import type { PayloadRequest } from 'payload'

import { ROLES } from '@/access/roles'

export type Stufe = 'ja' | 'eigene' | 'nein' | 'website'
export type RechteZeile = { slug: string; art: 'bereich' | 'einstellung'; titel: string; gruppe: string; ansehen: Stufe; anlegen: Stufe; bearbeiten: Stufe; loeschen: Stufe }
export type RechteMatrix = Record<string, RechteZeile[]>

const AUSLASSEN = new Set(['hilfe-feedback', 'search', 'payload-folders'])
const TEAM_ROLLEN = ['uebungsleitung', 'teamredaktion']
/** Einschränkungen, die zusätzlich beim Speichern bzw. in der Liste greifen (Hooks, Filter) */
const ZUSATZ_TEAM: Record<string, Partial<Record<'ansehen' | 'anlegen', Stufe>>> = {
  posts: { anlegen: 'eigene' },
  ausfaelle: { anlegen: 'eigene' },
  media: { ansehen: 'eigene', anlegen: 'eigene' },
}

/**
 * Rechte je Rolle – direkt aus den echten Zugriffsregeln berechnet (nicht von Hand gepflegt).
 * Für jede Rolle wird eine Beispiel-Person simuliert. Team-Rollen bekommen ein Beispiel-Team,
 * damit „nur eigene Teams“ erkannt wird.
 */
export async function rechteBerechnen(req: PayloadRequest): Promise<RechteMatrix> {
  const matrix: RechteMatrix = {}
  for (const rolle of ROLES) {
    const roles = rolle === 'webadmin' ? ['webadmin', 'admin'] : [rolle]
    const user = { id: -1, email: 'beispiel@bsv.test', roles, collection: 'users' }
    const fakeReq = { ...req, user, context: { _eigeneAngebote: [-1] } } as unknown as PayloadRequest
    const stufe = async (fn: unknown, data?: unknown): Promise<Stufe> => {
      if (typeof fn !== 'function') return 'ja'
      try {
        const r = await (fn as (a: unknown) => unknown)({ req: fakeReq, data })
        if (r === true) return 'ja'
        if (!r || typeof r !== 'object') return 'nein'
        // „Alle veröffentlichten“ (z. B. News) zählt als sehen – eingeschränkt sind nur Entwürfe anderer
        return JSON.stringify(r).includes('"_status"') ? 'ja' : 'eigene'
      } catch {
        return 'nein'
      }
    }
    const versteckt = (hidden: unknown) => (typeof hidden === 'function' ? Boolean((hidden as (a: unknown) => unknown)({ user })) : Boolean(hidden))
    const zeilen: RechteZeile[] = []
    // Darf die Rolle überhaupt in die Verwaltung? (Mitglieder nicht)
    const usersCfg = req.payload.config.collections.find((c) => c.slug === 'users')
    const verwaltung = (await stufe(usersCfg?.access?.admin)) !== 'nein'

    for (const c of req.payload.config.collections) {
      if (c.slug.startsWith('payload-') || AUSLASSEN.has(c.slug)) continue
      const a = c.access ?? {}
      const lesen = await stufe(a.read)
      const ansehen: Stufe = !verwaltung || versteckt(c.admin?.hidden) ? 'nein' : lesen
      const label = c.labels?.plural
      // Anlegen, das auch ohne Anmeldung erlaubt ist, kommt über ein Website-Formular
      const oeffentlich = typeof a.create === 'function' && (await (async () => {
        try {
          return (await (a.create as (x: unknown) => unknown)({ req: { ...req, user: null, context: {} } })) === true
        } catch {
          return false
        }
      })())
      const zusatz = TEAM_ROLLEN.includes(rolle) ? (ZUSATZ_TEAM[c.slug] ?? {}) : {}
      zeilen.push({
        slug: c.slug,
        art: 'bereich',
        titel: typeof label === 'string' ? label : ((label as Record<string, string> | undefined)?.de ?? c.slug),
        gruppe: typeof c.admin?.group === 'string' ? c.admin.group : 'Weitere',
        ansehen: ansehen !== 'nein' && zusatz.ansehen ? zusatz.ansehen : ansehen,
        anlegen: ansehen === 'nein' ? 'nein' : oeffentlich ? 'website' : zusatz.anlegen && (await stufe(a.create)) !== 'nein' ? zusatz.anlegen : await stufe(a.create),
        bearbeiten: ansehen === 'nein' ? 'nein' : await stufe(a.update),
        loeschen: ansehen === 'nein' ? 'nein' : await stufe(a.delete),
      })
    }
    for (const g of req.payload.config.globals) {
      if (['header', 'footer'].includes(g.slug)) continue
      const a = g.access ?? {}
      const ansehen: Stufe = !verwaltung || versteckt(g.admin?.hidden) ? 'nein' : await stufe(a.read)
      const label = g.label
      zeilen.push({
        slug: g.slug,
        art: 'einstellung',
        titel: typeof label === 'string' ? label : ((label as Record<string, string> | undefined)?.de ?? g.slug),
        gruppe: typeof g.admin?.group === 'string' ? g.admin.group : 'Weitere',
        ansehen,
        anlegen: 'nein',
        bearbeiten: ansehen === 'nein' ? 'nein' : await stufe(a.update),
        loeschen: 'nein',
      })
    }
    matrix[rolle] = zeilen
  }
  return matrix
}
