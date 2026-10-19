/**
 * Einzelrechte: einzelne Berechtigungen für eine bestimmte Person – zusätzlich zu ihren Rollen.
 * Vergibt nur ein Admin beim Benutzer („Zusatzrechte für diese Person“).
 * Bewusst ausgenommen: Benutzerverwaltung, Admin-Rechte, Bankdaten (Mitgliedsanträge) und Datensicherung.
 *
 * Wer mindestens ein Einzelrecht hat, kommt in die Verwaltung – und braucht wie alle Verwaltungs-Zugänge
 * die Zwei-Faktor-Anmeldung. Ohne bestätigten Code oder ohne Freigabe gelten die Einzelrechte nicht.
 */
export const EINZELRECHTE = [
  { key: 'kontaktanfragen', gruppe: 'Posteingang', label: 'Kontaktanfragen sehen und bearbeiten', text: 'Alle Nachrichten aus dem Kontaktformular.' },
  { key: 'probetraining', gruppe: 'Posteingang', label: 'Probetraining-Anfragen aller Teams sehen und bearbeiten', text: 'Nicht nur die der eigenen Teams.' },
  { key: 'passantraege', gruppe: 'Posteingang', label: 'Passanträge aller Teams sehen und bearbeiten', text: 'Wie die Rolle Passwesen, inkl. Pass-Unterlagen.' },
  { key: 'registrierungen', gruppe: 'Posteingang', label: 'Registrierungen freigeben', text: 'Selbst registrierte Mitglieder freischalten oder ablehnen.' },
  { key: 'formulare', gruppe: 'Posteingang', label: 'Formular-Eingänge sehen', text: 'Einsendungen aus Formularen, die auf Seiten eingebaut sind.' },
  { key: 'termine', gruppe: 'Inhalte', label: 'Termine anlegen und bearbeiten', text: 'Der Vereinskalender auf der Seite „Termine“.' },
  { key: 'gesuche', gruppe: 'Inhalte', label: 'Ehrenamt & Mitmachen pflegen', text: 'Gesuche für Helfer und Ehrenamt.' },
  { key: 'ausfaelle', gruppe: 'Sport', label: 'Trainingsausfälle für alle Teams melden', text: 'Nicht nur für die eigenen Teams.' },
  { key: 'mitgliedschaften', gruppe: 'Mitglieder', label: 'Mitgliedschaften ansehen – nur lesen', text: 'Mitgliedsnummer, Eintritt, Abteilungen (ohne Bankdaten).' },
] as const

export type EinzelrechtKey = (typeof EINZELRECHTE)[number]['key']

type MitRechten = { roles?: string[] | null; zusatzrechte?: Partial<Record<string, boolean | null>> | null } | null | undefined

/** Liste der eingeschalteten Einzelrechte einer Person */
export const einzelrechteVon = (user: unknown): EinzelrechtKey[] => {
  const z = (user as MitRechten)?.zusatzrechte
  return z ? EINZELRECHTE.filter((r) => z[r.key] === true).map((r) => r.key) : []
}

/** Hat die Person dieses Einzelrecht? (nur freigegebene Konten mit bestätigtem zweitem Faktor – sonst sind die Rechte leer) */
export const hatRecht = (user: unknown, key: EinzelrechtKey): boolean => {
  const u = user as MitRechten
  return Boolean(u && (u.roles ?? []).length > 0 && u.zusatzrechte?.[key] === true)
}

/** Hat die Person überhaupt Einzelrechte? */
export const hatEinzelrechte = (user: unknown): boolean => {
  const u = user as MitRechten
  return Boolean(u && (u.roles ?? []).length > 0 && einzelrechteVon(u).length > 0)
}

export const einzelrechtLabel = (key: string) => EINZELRECHTE.find((r) => r.key === key)?.label ?? key
