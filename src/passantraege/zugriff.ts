import type { Access, PayloadRequest, Where } from 'payload'

import { eigeneAngebotIds, hasRole, istMitgliedOderMehr } from '@/access/roles'

type U = { id: number; roles?: string[] | null } | null

/** Admin und Passwesen sehen alle Passanträge */
export const istPassVerwaltung = (user: unknown) => hasRole(user as never, 'admin', 'passwesen')

/** Teams, deren Passanträge diese Person sehen darf – nur Übungsleitung (nicht Team-Redaktion) */
export const passTeams = async (req: PayloadRequest): Promise<number[]> => {
  if (!hasRole(req.user as never, 'uebungsleitung')) return []
  return eigeneAngebotIds(req)
}

/** Lesen/Bearbeiten: eigene Anträge; Übungsleitung zusätzlich die ihrer Teams; Admin/Passwesen alle */
export const passLesen =
  (teamFeld: string, besitzerFeld: string): Access =>
  async ({ req }) => {
    const user = req.user as U
    if (!user || !istMitgliedOderMehr(user)) return false
    if (istPassVerwaltung(user)) return true
    const eigene: Where = { [besitzerFeld]: { equals: user.id } }
    const teams = await passTeams(req)
    return teams.length ? ({ or: [eigene, { [teamFeld]: { in: teams } }] } as Where) : eigene
  }

/** Bearbeitet die Person den Antrag als Verwaltung (Status setzen usw.)? */
export const istBearbeiter = async (req: PayloadRequest, teamId?: number | null) => {
  if (istPassVerwaltung(req.user)) return true
  if (!teamId) return false
  return (await passTeams(req)).includes(teamId)
}
