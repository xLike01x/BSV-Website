import type { CheckboxFieldValidation, CollectionBeforeValidateHook, DateFieldValidation, TextFieldValidation } from 'payload'
import { APIError } from 'payload'

/**
 * Serverseitige Prüfungen für öffentliche Formulare (Audit F-18).
 * Der Browser prüft vieles schon vorher – diese Regeln gelten auch für Anfragen direkt an die Schnittstelle.
 */

/** Pflicht-Haken (z. B. „Datenschutzhinweise gelesen“): Payload akzeptiert bei required-Checkboxen auch „false“ */
export const pflichtHaken =
  (meldung: string): CheckboxFieldValidation =>
  (v) =>
    v === true || meldung

export const plzPruefen: TextFieldValidation = (v) => (typeof v === 'string' && /^\d{5}$/.test(v.trim())) || 'Bitte eine fünfstellige Postleitzahl eingeben.'

export const telefonPruefen: TextFieldValidation = (v) => !v || (typeof v === 'string' && /^[0-9+()\/\s.-]{5,30}$/.test(v.trim())) || 'Bitte eine gültige Telefonnummer eingeben (nur Ziffern, +, Leerzeichen, -, /).'

/** Geburtsdatum: nicht in der Zukunft, nicht vor 1900 */
export const geburtsdatumPruefen =
  (pflicht = true): DateFieldValidation =>
  (v) => {
    if (!v) return pflicht ? 'Bitte das Geburtsdatum angeben.' : true
    const d = new Date(v as string | Date)
    if (Number.isNaN(d.getTime())) return 'Das Geburtsdatum ist ungültig.'
    if (d.getTime() > Date.now()) return 'Das Geburtsdatum liegt in der Zukunft.'
    if (d.getFullYear() < 1900) return 'Bitte das Geburtsdatum prüfen.'
    return true
  }

export const alterAm = (geburt: string | Date, stichtag = new Date()) => {
  const g = new Date(geburt)
  let a = stichtag.getFullYear() - g.getFullYear()
  const m = stichtag.getMonth() - g.getMonth()
  if (m < 0 || (m === 0 && stichtag.getDate() < g.getDate())) a--
  return a
}

/** Regeln, die mehrere Felder des Mitgliedsantrags betreffen (nur beim Absenden, nicht beim Bearbeiten durch die Kasse) */
export const antragRegeln: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !data || req.user) return data
  const art = data.mitgliedsart as string | undefined
  if (data.geburtsdatum && art === 'jugend' && alterAm(data.geburtsdatum as string) >= 18) {
    throw new APIError('„Jugendliche“ gilt bis 17 Jahre. Bitte „Erwachsene aktiv“, „Erwachsene passiv“ oder „Familie“ wählen.', 400)
  }
  const familie = Array.isArray(data.familienmitglieder) ? data.familienmitglieder : []
  if (art === 'familie' && familie.length === 0) throw new APIError('Beim Familienbeitrag bitte mindestens ein weiteres Familienmitglied eintragen.', 400)
  if (art !== 'familie' && familie.length) data.familienmitglieder = []
  if (art === 'passiv' && Array.isArray(data.angebote) && data.angebote.length) {
    throw new APIError('Passive Mitglieder nehmen nicht am Training teil – bitte keine Teams oder Kurse auswählen oder „aktiv“ wählen.', 400)
  }
  return data
}
