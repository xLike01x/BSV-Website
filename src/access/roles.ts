import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

/**
 * Rollen im BSV. Ein Login für alle – die Rolle bestimmt die Rechte.
 * - admin:          alles, inkl. Rollen vergeben
 * - redaktion:      News für die Startseite, Termine, Seiten, alle Teams & Kurse
 * - kasse:          Mitgliedsanträge inkl. Bankdaten
 * - uebungsleitung: eigene Teams/Kurse pflegen, Ausfälle, Probetraining-Anfragen, Team-News und -Bilder
 * - teamredaktion:  eigene Teams/Kurse: News, Bilder, Zeiten, Ausfälle (z. B. Pressewart einer Mannschaft)
 * - mitglied:       nur Mitgliederbereich auf der Website
 *
 * „Eigene“ Teams sind die, bei denen die Person im Angebot unter „Verantwortliche“ eingetragen ist.
 */
export const ROLES = ['admin', 'redaktion', 'kasse', 'uebungsleitung', 'teamredaktion', 'mitglied'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Redaktion (Startseite & alle News)', value: 'redaktion' },
  { label: 'Kasse', value: 'kasse' },
  { label: 'Übungsleitung', value: 'uebungsleitung' },
  { label: 'Team-Redaktion', value: 'teamredaktion' },
  { label: 'Mitglied', value: 'mitglied' },
]

/** Rollen mit Rechten für „eigene“ Teams und Kurse */
export const TEAM_ROLLEN: Role[] = ['uebungsleitung', 'teamredaktion']

type MaybeUser = { id?: number | string; roles?: (Role | string)[] | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((r) => roles.includes(r as Role)))

const userOf = (req: PayloadRequest) => req.user as MaybeUser

/** Admin darf alles. */
export const isAdmin: Access = ({ req }) => hasRole(userOf(req), 'admin')
export const isAdminField: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin')

/** Inhalte pflegen: Admin + Redaktion. */
export const isEditor: Access = ({ req }) => hasRole(userOf(req), 'admin', 'redaktion')
export const isEditorField: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin', 'redaktion')

/** Finanzen/Anträge: Admin + Kasse. */
export const isFinance: Access = ({ req }) => hasRole(userOf(req), 'admin', 'kasse')

/** Wer darf das Admin-Panel unter /admin öffnen? Mitglieder nutzen nur die Website. */
export const canUseAdminPanel = ({ req }: { req: PayloadRequest }): boolean =>
  hasRole(userOf(req), 'admin', 'redaktion', 'kasse', 'uebungsleitung', 'teamredaktion')

/** Medien hochladen: alle mit Inhaltsrechten. */
export const canUpload: Access = ({ req }) => hasRole(userOf(req), 'admin', 'redaktion', ...TEAM_ROLLEN)

/** Eigenes Benutzerkonto oder Admin. */
export const isAdminOrSelf: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (hasRole(user, 'admin')) return true
  return { id: { equals: user.id } }
}

/**
 * IDs der Teams/Kurse, für die die Person verantwortlich ist.
 * Wird pro Anfrage einmal geladen und zwischengespeichert.
 */
export const eigeneAngebotIds = async (req: PayloadRequest): Promise<number[]> => {
  const user = userOf(req)
  if (!user?.id || !hasRole(user, ...TEAM_ROLLEN)) return []
  const ctx = req.context as { _eigeneAngebote?: number[] }
  if (ctx._eigeneAngebote) return ctx._eigeneAngebote
  const res = await req.payload.find({
    collection: 'angebote',
    where: { leitung: { contains: user.id } },
    depth: 0,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    select: {},
    req,
  })
  ctx._eigeneAngebote = res.docs.map((d) => d.id as number)
  return ctx._eigeneAngebote
}

/** Zugriff „alles“ für Redaktion, „nur eigene Teams“ (über ein Feld) für Team-Rollen */
export const redaktionOderEigeneTeams =
  (feld: string): Access =>
  async ({ req }) => {
    const user = userOf(req)
    if (!user) return false
    if (hasRole(user, 'admin', 'redaktion')) return true
    if (hasRole(user, ...TEAM_ROLLEN)) {
      const ids = await eigeneAngebotIds(req)
      return ids.length ? ({ [feld]: { in: ids } } as Where) : false
    }
    return false
  }

/** Angebote bearbeiten: Admin/Redaktion alle, Team-Rollen nur die eigenen. */
export const canEditAngebot: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (hasRole(user, 'admin', 'redaktion')) return true
  if (hasRole(user, ...TEAM_ROLLEN)) return { leitung: { contains: user.id } }
  return false
}

/** Veröffentlichte Inhalte für alle, Entwürfe nur für Redaktion/Admin. */
export const editorOrPublished: Access = ({ req }) => {
  if (hasRole(userOf(req), 'admin', 'redaktion')) return true
  return { _status: { equals: 'published' } }
}
