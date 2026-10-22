import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import { type EinzelrechtKey, hatEinzelrechte, hatRecht } from './einzelrechte'

/**
 * Rollen im BSV. Ein Login für alle – die Rolle bestimmt die Rechte.
 * - webadmin:       Technik-Verantwortliche/r: alles wie Admin, dazu Technik-Bereiche und Schutz der
 *                   obersten Konten (nur Web-Admins vergeben Admin-/Web-Admin-Rechte). Hat automatisch auch „admin“.
 * - admin:          alles, inkl. Rollen vergeben (außer Admin/Web-Admin)
 * - redaktion:      News für die Startseite, Termine, Seiten, alle Teams & Kurse
 * - kasse:          Mitgliedsanträge inkl. Bankdaten
 * - passwesen:      Fußball-Passanträge aller Teams (auch ohne eigenes Team)
 * - uebungsleitung: eigene Teams/Kurse pflegen, Ausfälle, Probetraining-Anfragen, Team-News und -Bilder
 * - teamredaktion:  eigene Teams/Kurse: News, Bilder, Zeiten, Ausfälle (z. B. Pressewart einer Mannschaft)
 * - lesen:          „Nur ansehen“ – alles lesen, nichts ändern (siehe src/access/nurAnsehen.ts)
 * - mitglied:       nur Mitgliederbereich auf der Website
 *
 * „Eigene“ Teams sind die, bei denen die Person im Angebot unter „Verantwortliche“ eingetragen ist.
 */
export const ROLES = ['webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'lesen', 'mitglied'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: 'Web-Admin (Technik, oberste Rechte)', value: 'webadmin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Redaktion (Startseite & alle News)', value: 'redaktion' },
  { label: 'Kasse', value: 'kasse' },
  { label: 'Passwesen (Spielerpässe Fußball)', value: 'passwesen' },
  { label: 'Trainer', value: 'uebungsleitung' },
  { label: 'Team-Redaktion', value: 'teamredaktion' },
  { label: 'Nur ansehen (alles lesen, nichts ändern)', value: 'lesen' },
  { label: 'Mitglied', value: 'mitglied' },
]

/** Rollen, mit denen jemand in die Verwaltung kommt (Web-Admin hat immer auch „admin“) */
export const VERWALTUNGS_ROLLEN: Role[] = ['admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'lesen']
/** Rollen, die in der Verwaltung etwas ändern dürfen (alle außer „Nur ansehen“) */
export const SCHREIB_ROLLEN: Role[] = ['admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion']

/** Rollen mit Rechten für „eigene“ Teams und Kurse */
export const TEAM_ROLLEN: Role[] = ['uebungsleitung', 'teamredaktion']

type MaybeUser = { id?: number | string; roles?: (Role | string)[] | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((r) => roles.includes(r as Role)))

const userOf = (req: PayloadRequest) => req.user as MaybeUser

/** Angemeldet UND freigegeben (selbst registrierte Konten ohne Freigabe haben keine Rollen) */
export const istMitgliedOderMehr = (user: unknown): boolean => Boolean(user && ((user as MaybeUser)?.roles ?? []).length > 0)

/**
 * Bereiche, die sich auch als Zusatzrecht einzeln vergeben lassen (src/access/einzelrechte.ts). Wer das Zusatzrecht hat,
 * darf in diesem Bereich genau das, was die genannten Rollen dort dürfen – nicht mehr.
 * Bankdaten, Benutzerverwaltung und Datensicherung gibt es bewusst nicht als Bereich.
 */
const BEREICH_ROLLEN = {
  news: ['admin', 'redaktion'],
  seiten: ['admin', 'redaktion'],
  medien: ['admin', 'redaktion'],
  sponsoren: ['admin', 'redaktion'],
  teams: ['admin', 'redaktion'],
  saisonwechsel: ['admin', 'redaktion'],
  verein: ['admin', 'redaktion', 'kasse'],
  hilfe: ['admin', 'redaktion'],
  statistik: ['webadmin'],
} as const satisfies Partial<Record<EinzelrechtKey, readonly Role[]>>
export type Bereich = keyof typeof BEREICH_ROLLEN

/** Darf die Person in diesem Bereich arbeiten? (passende Rolle oder Zusatzrecht) */
export const imBereich = (user: unknown, b: Bereich): boolean => hasRole(user as MaybeUser, ...BEREICH_ROLLEN[b]) || hatRecht(user, b)
export const bereichZugriff =
  (b: Bereich): Access =>
  ({ req }) =>
    imBereich(req.user, b)
export const bereichFeld =
  (b: Bereich): FieldAccess =>
  ({ req }) =>
    imBereich(req.user, b)
/** Seitenleiste: nur für Personen mit Zugang zu diesem Bereich */
export const ausblendenAusserBereich =
  (b: Bereich) =>
  ({ user }: { user: unknown }): boolean =>
    !imBereich(user, b)

/** Admin darf alles. */
export const isAdmin: Access = ({ req }) => hasRole(userOf(req), 'admin')
export const isAdminField: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin')

/** Web-Admin: oberste Rolle (Technik, Admin-Konten verwalten) */
export const istWebAdmin = (user: unknown): boolean => hasRole(user as MaybeUser, 'webadmin')

/** Feld nur für Web-Admins änderbar (z. B. Zusatzrechte einzelner Personen) */
export const istWebAdminField: FieldAccess = ({ req }) => hasRole(userOf(req), 'webadmin')

/** Inhalte pflegen: Admin + Redaktion. */
export const isEditor: Access = ({ req }) => hasRole(userOf(req), 'admin', 'redaktion')
export const isEditorField: FieldAccess = ({ req }) => hasRole(userOf(req), 'admin', 'redaktion')

/** Finanzen/Anträge: Admin + Kasse. */
export const isFinance: Access = ({ req }) => hasRole(userOf(req), 'admin', 'kasse')

/** Wer darf das Admin-Panel unter /admin öffnen? Mitglieder nutzen nur die Website. */
export const canUseAdminPanel = ({ req }: { req: PayloadRequest }): boolean => istVerwaltung(req.user)

/** Verwaltungs-Zugang: eine Verwaltungsrolle oder mindestens ein Einzelrecht */
export const istVerwaltung = (user: unknown): boolean => hasRole(user as MaybeUser, ...VERWALTUNGS_ROLLEN) || hatEinzelrechte(user)

/** „Nur ansehen“ (darf alles lesen – was genau, steuern die Haken unter Rollen-Rechte) */
export const istLeser = (user: unknown): boolean => hasRole(user as MaybeUser, 'lesen')

/** NUR „Nur ansehen“ – ohne weitere Rolle und ohne Einzelrechte: darf nirgends etwas ändern (außer am eigenen Konto) */
export const nurLeser = (user: unknown): boolean => istLeser(user) && !hasRole(user as MaybeUser, ...SCHREIB_ROLLEN) && !hatEinzelrechte(user)

/** Medien hochladen: alle mit Inhaltsrechten (Rolle oder Zusatzrecht für einen Bereich mit Bildern). */
const BILDER_BEREICHE = ['news', 'seiten', 'medien', 'sponsoren', 'teams'] as const
/** Zusatzrecht für einen Bereich mit Bildern → alle Bilder hochladen, sehen und auswählen (wie die Redaktion) */
const bilderPerZusatzrecht = (user: unknown): boolean => BILDER_BEREICHE.some((b) => hatRecht(user, b))
export const darfHochladen = (user: unknown): boolean => hasRole(user as MaybeUser, 'admin', 'redaktion', ...TEAM_ROLLEN) || bilderPerZusatzrecht(user)
/** Alle Bilder sehen, auswählen und ohne Team-Ordner hochladen (Redaktion bzw. Zusatzrecht für einen Bereich mit Bildern) */
export const alleBilder = (user: unknown): boolean => hasRole(user as MaybeUser, 'admin', 'redaktion') || bilderPerZusatzrecht(user)
export const canUpload: Access = ({ req }) => darfHochladen(req.user)

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

/** Zugriff „alles“ für Redaktion (bzw. Zusatzrecht des Bereichs), „nur eigene Teams“ (über ein Feld) für Team-Rollen */
export const redaktionOderEigeneTeams =
  (feld: string, bereich: Bereich | null): Access =>
  async ({ req }) => {
    const user = userOf(req)
    if (!user) return false
    if (hasRole(user, 'admin', 'redaktion') || (bereich && hatRecht(user, bereich))) return true
    if (hasRole(user, ...TEAM_ROLLEN)) {
      const ids = await eigeneAngebotIds(req)
      return ids.length ? ({ [feld]: { in: ids } } as Where) : false
    }
    return false
  }

/** Angebote bearbeiten: Admin/Redaktion (bzw. Zusatzrecht „teams“) alle, Team-Rollen nur die eigenen. */
export const canEditAngebot: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (imBereich(user, 'teams')) return true
  if (hasRole(user, ...TEAM_ROLLEN)) return { leitung: { contains: user.id } }
  return false
}

/** Veröffentlichte Seiten für alle, Entwürfe nur für Redaktion/Admin bzw. Zusatzrecht „seiten“. */
export const editorOrPublished: Access = ({ req }) => {
  if (imBereich(req.user, 'seiten')) return true
  return { _status: { equals: 'published' } }
}

/**
 * Seitenleiste aufräumen: Bereiche, die eine Rolle nur lesen, aber nicht bearbeiten kann,
 * werden ausgeblendet. (Nur Anzeige – die eigentlichen Rechte stehen in `access`.)
 */
export const ausblendenAusser =
  (...roles: Role[]) =>
  ({ user }: { user: unknown }): boolean =>
    !hasRole(user as MaybeUser, ...roles)

/** Nur über Einzelrechte in der Verwaltung (keine Verwaltungs-Rolle)? Dann Bereiche ohne passendes Recht ausblenden. */
export const nurEinzelrechte = (user: unknown): boolean =>
  hatEinzelrechte(user) && !hasRole(user as MaybeUser, ...VERWALTUNGS_ROLLEN)

/** Für Personen, die nur über Einzelrechte hier sind, ausblenden (z. B. News, Mediathek, die sie nur lesen könnten) */
export const ausblendenBeiNurEinzelrechten = ({ user }: { user: unknown }): boolean => nurEinzelrechte(user)

/** Wie ausblendenAusser – zusätzlich sichtbar für Personen mit diesem Einzelrecht */
export const ausblendenAusserMit =
  (recht: EinzelrechtKey, ...roles: Role[]) =>
  ({ user }: { user: unknown }): boolean =>
    !hasRole(user as MaybeUser, ...roles) && !hatRecht(user, recht)

/** Zugriff für diese Rollen ODER Personen mit diesem Einzelrecht */
export const rolleOderRecht =
  (recht: EinzelrechtKey, ...roles: Role[]): Access =>
  ({ req }) =>
    hasRole(userOf(req), ...roles) || hatRecht(req.user, recht)

/**
 * Welche Bilder darf jemand in der Verwaltung sehen und auswählen?
 * Redaktion/Admin: alle. Team-Rollen: Bilder ihrer Teams + „Verein allgemein“ (nur benutzen).
 * Auf der Website bleiben alle Bilder öffentlich – das betrifft nur die Verwaltung.
 */
export const medienSichtbar = async (req: PayloadRequest): Promise<Where | null> => {
  const user = userOf(req)
  // Reines „Nur ansehen“ sieht alle Ordner (wählen oder zuordnen kann es nichts). Mit Trainer/Team-Redaktion zusammen
  // gilt weiter „nur eigene Teams“ – sonst könnte die Person fremde Bilder (z. B. Kinderfotos) in ihre News einbauen.
  if (!user || alleBilder(user) || nurLeser(user)) return null
  const ids = await eigeneAngebotIds(req)
  return { or: [...(ids.length ? [{ team: { in: ids } }] : []), { allgemein: { equals: true } }] }
}

/** Für Bild-Felder (`filterOptions`): nur erlaubte Bilder zur Auswahl anbieten */
export const medienAuswahl = async ({ req }: { req: PayloadRequest }): Promise<Where | true> => (await medienSichtbar(req)) ?? true
