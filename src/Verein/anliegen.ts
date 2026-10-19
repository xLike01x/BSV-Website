/** Auswahl „Worum geht es?“ im Kontaktformular – ohne Namen. Pflegbar unter Vereinsdaten → Kontaktformular. */
export const STANDARD_ANLIEGEN = [
  'Allgemeine Frage',
  'Mitgliedschaft & Beiträge',
  'Probetraining & Kurse',
  'Fußball – Senioren',
  'Fußball – Jugend',
  'Mädchenfußball',
  'Spielerpass & Spielberechtigung',
  'Termine & Veranstaltungen',
  'Presse & Fotos',
  'Sponsoring',
  'Platz & Halle',
  'Website',
  'Lob & Kritik',
]

export type Anliegen = { titel?: string | null; empfaenger?: string | null }

/** Die gepflegten Anliegen – oder die Standardliste, solange noch nichts eingetragen ist */
export const anliegenListe = (v: { kontaktAnliegen?: Anliegen[] | null } | null | undefined): Anliegen[] => {
  const eigene = (v?.kontaktAnliegen ?? []).filter((a) => a.titel?.trim())
  return eigene.length ? eigene : STANDARD_ANLIEGEN.map((titel) => ({ titel, empfaenger: null }))
}

/** E-Mail-Adressen aus „a@x.de, b@y.de“ (nur gültige, höchstens 10) */
export const adressen = (s?: string | null) =>
  (s ?? '')
    .split(/[\s,;]+/)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(x))
    .slice(0, 10)
