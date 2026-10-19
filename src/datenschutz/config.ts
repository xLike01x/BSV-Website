import type { GlobalConfig } from 'payload'

import { ausblendenAusser, hasRole } from '@/access/roles'

/** Datenschutz-Fristen: Wie lange bleiben persönliche Daten gespeichert? */
export const Datenschutz: GlobalConfig = {
  slug: 'datenschutz',
  label: 'Datenschutz-Fristen',
  access: {
    read: ({ req }) => hasRole(req.user as never, 'admin', 'kasse'),
    update: ({ req }) => hasRole(req.user as never, 'admin'),
  },
  admin: {
    group: 'Einstellungen',
    hidden: ausblendenAusser('admin'),
    description: 'Persönliche Daten nur so lange speichern, wie sie gebraucht werden (DSGVO). Hier legst du fest, wann erledigte Einträge aufgeräumt werden.',
  },
  fields: [
    { name: 'uebersicht', type: 'ui', admin: { components: { Field: '@/datenschutz/Uebersicht' } } },
    {
      type: 'row',
      fields: [
        { name: 'probetrainingMonate', label: 'Probetraining-Anfragen (erledigt) – nach Monaten', type: 'number', min: 1, defaultValue: 6, admin: { width: '50%' } },
        { name: 'kontaktMonate', label: 'Kontaktanfragen (erledigt) – nach Monaten', type: 'number', min: 1, defaultValue: 6, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'antraegeMonate',
          label: 'Mitgliedsanträge (aufgenommen/abgelehnt) – nach Monaten',
          type: 'number',
          min: 1,
          defaultValue: 3,
          admin: { width: '50%', description: 'Erst löschen, wenn die Daten in die Mitgliederverwaltung übernommen sind.' },
        },
        { name: 'eingaengeMonate', label: 'Formular-Eingänge – nach Monaten', type: 'number', min: 1, defaultValue: 12, admin: { width: '50%' } },
      ],
    },
    {
      name: 'passUnterlagenTage',
      label: 'Passanträge: Unterlagen (Ausweis, Foto …) löschen – Tage nach Abschluss',
      type: 'number',
      min: 1,
      defaultValue: 30,
      admin: { description: 'Läuft immer automatisch. Der Antrag selbst (Name, Team, Status) bleibt als Nachweis erhalten.' },
    },
    {
      name: 'automatisch',
      label: 'Automatisch aufräumen (einmal täglich in den Papierkorb verschieben)',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Ohne Haken erinnert nur das Dashboard. Aus dem Papierkorb lässt sich alles noch 30 Tage zurückholen, danach wird es endgültig gelöscht.' },
    },
  ],
}
