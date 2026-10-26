/**
 * Einheitliche Datums-/Uhrzeit-Auswahl in der Verwaltung: 24-Stunden-Format („19:00 Uhr“ statt „7:00 nachm.“),
 * Überschrift „Uhrzeit“ statt „Time“. Eingetippt wird weiterhin „12.12.2026 19:00“.
 */
export const datumUhrzeit = {
  pickerAppearance: 'dayAndTime',
  displayFormat: 'dd.MM.yyyy HH:mm',
  timeFormat: "HH:mm 'Uhr'",
  timeIntervals: 30,
  overrides: { timeCaption: 'Uhrzeit' },
} as const
