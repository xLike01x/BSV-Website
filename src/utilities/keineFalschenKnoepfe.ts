import type { Field, SanitizedConfig } from 'payload'

/**
 * Missverständliche Knöpfe in der Verwaltung abschalten (nach der Payload-Aufbereitung der Konfiguration):
 *
 * 1. Kein „+“ an Auswahlfeldern (Verknüpfungen): Dort wählt man Vorhandenes aus. Das „+“ legte unbemerkt
 *    ein NEUES Team, ein neues Benutzerkonto, eine neue Seite usw. an – z. B. beim Team unter „Verantwortliche“
 *    ein neues Konto. Bilder hochladen (Upload-Felder) bleibt erlaubt.
 * 2. Kein „Duplizieren“ bei Einträgen mit persönlichen Daten: Eine Kopie eines Mitgliedsantrags samt IBAN oder
 *    eines Benutzerkontos ergibt keinen Sinn und verdoppelt nur persönliche Daten.
 */
const OHNE_DUPLIZIEREN = ['users', 'mitgliedsantraege', 'mitgliedschaften', 'kontaktanfragen', 'probetraining', 'passantraege', 'passdokumente', 'profilbilder', 'form-submissions', 'hilfe-feedback', 'statistik']

function felderDurchgehen(felder: Field[] | undefined) {
  for (const f of felder ?? []) {
    if (f.type === 'relationship') {
      const admin = (f.admin ?? {}) as { allowCreate?: boolean }
      if (admin.allowCreate !== true) f.admin = { ...admin, allowCreate: false } as typeof f.admin
    }
    if ('fields' in f && Array.isArray(f.fields)) felderDurchgehen(f.fields as Field[])
    if (f.type === 'tabs') for (const t of f.tabs) felderDurchgehen(t.fields)
    if (f.type === 'blocks') for (const b of f.blocks ?? []) felderDurchgehen(b.fields)
  }
}

export function keineFalschenKnoepfe(c: SanitizedConfig) {
  for (const col of c.collections) {
    felderDurchgehen(col.fields)
    if (OHNE_DUPLIZIEREN.includes(col.slug)) col.disableDuplicate = true
  }
  for (const g of c.globals ?? []) felderDurchgehen(g.fields)
  for (const b of (c.blocks ?? []) as { fields?: Field[] }[]) felderDurchgehen(b.fields)
  return c
}
