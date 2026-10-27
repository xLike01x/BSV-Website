/**
 * Einzelrechte: einzelne Berechtigungen für eine bestimmte Person – zusätzlich zu ihren Rollen.
 * Vergibt nur ein Web-Admin beim Benutzer („Zusatzrechte nur für diese Person“). Admins sehen sie nur.
 * Ein Bereichsrecht (z. B. „news“) gibt in diesem Bereich genau die Rechte der zuständigen Rolle (siehe imBereich in roles.ts).
 * Bewusst ausgenommen: Benutzerverwaltung, Admin-Rechte, Bankdaten und Datensicherung.
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
  { key: 'news', gruppe: 'Inhalte', label: 'News aller Teams schreiben und bearbeiten', text: 'Wie die Redaktion, nur für News: auch Vereins-News, Kategorien und „Auf Startseite“, Vorschläge der Trainer annehmen.' },
  { key: 'termine', gruppe: 'Inhalte', label: 'Termine anlegen und bearbeiten', text: 'Der Vereinskalender auf der Seite „Termine“.' },
  { key: 'gesuche', gruppe: 'Inhalte', label: 'Ehrenamt & Mitmachen pflegen', text: 'Gesuche für Helfer und Ehrenamt.' },
  { key: 'medien', gruppe: 'Inhalte', label: 'Bilder, Galerie und Dokumente verwalten', text: 'Alle Bilder bearbeiten und löschen, Fotoalben, Dokumente für Mitglieder.' },
  { key: 'sponsoren', gruppe: 'Inhalte', label: 'Sponsoren pflegen', text: 'Sponsoren und Partner, auch den Hauptsponsor.' },
  { key: 'seiten', gruppe: 'Website-Aufbau', label: 'Seiten, Menü, „Texte & Bilder“ und Formulare bearbeiten', text: 'Aufbau und Texte der Website.' },
  { key: 'teams', gruppe: 'Sport', label: 'Alle Teams & Kurse bearbeiten', text: 'Anlegen, Zeiten, Texte, Verantwortliche, aktiv/inaktiv – für alle Teams, nicht nur die eigenen.' },
  { key: 'ausfaelle', gruppe: 'Sport', label: 'Trainingsausfälle für alle Teams melden', text: 'Nicht nur für die eigenen Teams.' },
  { key: 'saisonwechsel', gruppe: 'Sport', label: 'Saisonwechsel (Fußball) durchgehen', text: 'Die Liste zum Saisonwechsel öffnen und abhaken (ohne E-Mail-Adressen der Verantwortlichen).' },
  { key: 'antraege', gruppe: 'Mitglieder', label: 'Mitgliedsanträge bearbeiten – ohne Bankdaten', text: 'Anträge und Kündigungen sehen, beantworten und bestätigen. IBAN, Kontoinhaber und Export für die Kasse bleiben der Rolle Kasse vorbehalten.' },
  { key: 'mitgliedschaften', gruppe: 'Mitglieder', label: 'Mitgliedschaften ansehen – nur lesen', text: 'Mitgliedsnummer, Eintritt, Abteilungen (ohne Bankdaten).' },
  { key: 'verein', gruppe: 'Einstellungen', label: 'Vereinsdaten bearbeiten', text: 'Zahlen, Adressen, Beiträge, Vorstand, Kontaktformular, Downloads.' },
  { key: 'datenschutz', gruppe: 'Einstellungen', label: 'Datenschutz-Fristen einstellen', text: 'Fristen ansehen und verlängern, Fälliges in den Papierkorb verschieben. Kürzer als der Standard nur Admins; nichts wird direkt gelöscht.' },
  { key: 'statistik', gruppe: 'Technik', label: 'Besucherstatistik ansehen', text: 'Seitenaufrufe und Suchbegriffe der Website – ohne Cookies und ohne IP-Adressen.' },
  { key: 'papierkorb', gruppe: 'Technik', label: 'Papierkorb: Gelöschtes wiederherstellen', text: 'Nur der normale Papierkorb, ohne Bereiche mit persönlichen Daten; Bilder nur mit „Bilder“, Teams nur mit „Alle Teams“. Endgültig löschen bleibt dem Web-Admin.' },
  { key: 'hilfe', gruppe: 'Einstellungen', label: 'Hilfe-Texte ergänzen und Rückmeldungen lesen', text: 'Eigene Tipps in der Hilfe, Rückmeldungen aus „Hat dir das geholfen?“ (ohne Namen).' },
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
