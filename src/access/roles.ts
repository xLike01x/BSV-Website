import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Rollen im BSV. Ein Login für alle – die Rolle bestimmt die Rechte.
 * - admin:          alles, inkl. Rollen vergeben
 * - redaktion:      News, Termine, Seiten, Angebote
 * - kasse:          Mitgliedsanträge inkl. Bankdaten
 * - uebungsleitung: eigene Angebote pflegen, Ausfälle, Probetraining-Anfragen
 * - mitglied:       nur Mitgliederbereich auf der Website
 */
export const ROLES = ['admin', 'redaktion', 'kasse', 'uebungsleitung', 'mitglied'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Redaktion', value: 'redaktion' },
  { label: 'Kasse', value: 'kasse' },
  { label: 'Übungsleitung', value: 'uebungsleitung' },
  { label: 'Mitglied', value: 'mitglied' },
]

type MaybeUser = { id?: number | string; roles?: (Role | string)[] | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((r) => roles.includes(r as Role)))

const userOf = (req: PayloadRequest) => req.user as MaybeUser

/** Admin darf alles. */
export const isAdmin: Access = ({ req }) => hasRole(userOf(req), 'admin')
export const isAdminField: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin')

/** Inhalte pflegen: Admin + Redaktion. */
export const isEditor: Access = ({ req }) => hasRole(userOf(req), 'admin', 'redaktion')

/** Finanzen/Anträge: Admin + Kasse. */
export const isFinance: Access = ({ req }) => hasRole(userOf(req), 'admin', 'kasse')

/** Wer darf das Admin-Panel unter /admin öffnen? Mitglieder nutzen nur die Website. */
export const canUseAdminPanel = ({ req }: { req: PayloadRequest }): boolean =>
  hasRole(userOf(req), 'admin', 'redaktion', 'kasse', 'uebungsleitung')

/** Medien hochladen: alle Rollen außer reinen Mitgliedern. */
export const canUpload: Access = ({ req }) =>
  hasRole(userOf(req), 'admin', 'redaktion', 'uebungsleitung')

/** Eigenes Benutzerkonto oder Admin. */
export const isAdminOrSelf: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (hasRole(user, 'admin')) return true
  return { id: { equals: user.id } }
}

/**
 * Angebote bearbeiten: Admin/Redaktion alle, Übungsleitung nur die eigenen
 * (die, bei denen sie in "leitung" eingetragen ist).
 */
export const canEditAngebot: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (hasRole(user, 'admin', 'redaktion')) return true
  if (hasRole(user, 'uebungsleitung')) return { leitung: { contains: user.id } }
  return false
}

/** Veröffentlichte Inhalte für alle, Entwürfe nur für Redaktion/Admin. */
export const editorOrPublished: Access = ({ req }) => {
  if (hasRole(userOf(req), 'admin', 'redaktion')) return true
  return { _status: { equals: 'published' } }
}
