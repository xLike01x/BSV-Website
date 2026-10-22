import type { CollectionBeforeOperationHook, FlattenedField, Plugin } from 'payload'
import { APIError } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * Sortieren über Felder verknüpfter Einträge (z. B. `sort=leitung.email` oder `leitung__email`) prüft Payload nicht
 * gegen die Leserechte des verknüpften Bereichs – die Reihenfolge der Treffer verriete dann Daten fremder Konten
 * (Audit 2026-10). Über die Schnittstelle deshalb kein Sortieren über eine Beziehung hinweg; Felder in Gruppen
 * (`meta.title`) und Versionen (`version.title`) gehen weiter. Admins dürfen alles, interne Abläufe (Local API,
 * overrideAccess) sind nicht betroffen.
 */
const BEZIEHUNG = new Set(['relationship', 'upload', 'join'])

/** true, wenn der Pfad über eine Beziehung in einen anderen Bereich springt */
export function sortiertUeberBeziehung(felder: FlattenedField[], pfad: string, mitVersion: boolean): boolean {
  let teile = pfad.replace(/^[-+]/, '').replace(/__/g, '.').split('.').filter(Boolean)
  if (mitVersion && teile[0] === 'version') teile = teile.slice(1)
  let aktuell: FlattenedField[] | undefined = felder
  for (let i = 0; i < teile.length; i++) {
    const f: FlattenedField | undefined = aktuell?.find((x) => x.name === teile[i])
    if (!f) return false // unbekannter Pfad – lehnt Payload selbst ab
    const rest = i < teile.length - 1
    if (BEZIEHUNG.has(f.type)) return rest
    if (!rest) return false
    aktuell = 'flattenedFields' in f ? (f.flattenedFields as FlattenedField[]) : undefined
    if (!aktuell) return false
  }
  return false
}

const PRUEFEN = new Set(['read', 'readDistinct', 'update', 'delete'])

const nurEigeneFelder: CollectionBeforeOperationHook = ({ args, collection, operation, req }) => {
  if (!PRUEFEN.has(operation)) return args
  const a = args as { overrideAccess?: boolean; sort?: unknown }
  if (a.overrideAccess || a.sort == null || a.sort === '' || hasRole(req.user as never, 'admin', 'webadmin')) return args
  const teile = (Array.isArray(a.sort) ? a.sort : String(a.sort).split(',')).map((t) => String(t).trim()).filter(Boolean)
  const felder = (collection as unknown as { flattenedFields?: FlattenedField[] }).flattenedFields ?? []
  if (teile.some((t) => sortiertUeberBeziehung(felder, t, Boolean(collection.versions)))) throw new APIError('Sortieren geht nur nach Feldern dieser Liste.', 400)
  return args
}

export const sortierenNurEigeneFelder: Plugin = (config) => ({
  ...config,
  collections: (config.collections ?? []).map((c) => ({ ...c, hooks: { ...c.hooks, beforeOperation: [nurEigeneFelder, ...(c.hooks?.beforeOperation ?? [])] } })),
})
