import type { GlobalConfig } from 'payload'

import { hasRole } from '@/access/roles'
import { darf, rechteLaden } from '@/access/rollenRechte'

/** Datenschutz-Fristen: Wie lange bleiben persönliche Daten gespeichert? */
export const Datenschutz: GlobalConfig = {
  slug: 'datenschutz',
  label: 'Datenschutz-Fristen',
  access: {
    read: ({ req }) => hasRole(req.user as never, 'admin', 'kasse'),
    update: async ({ req }) => (await rechteLaden(req.payload), hasRole(req.user as never, 'admin') || darf(req.user, 'kasse', 'datenschutz')),
  },
  admin: {
    group: 'Einstellungen',
    hidden: ({ user }) => !(hasRole(user as never, 'admin') || darf(user, 'kasse', 'datenschutz')),
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
      type: 'row',
      fields: [
        {
          name: 'passUnterlagenTage',
          label: 'Passanträge: Ausweis, Foto, Erklärungen löschen – Tage nach Abschluss',
          type: 'number',
          min: 1,
          defaultValue: 30,
          admin: { width: '50%', description: 'Läuft immer automatisch. Der unterschriebene Passantrag bleibt (siehe rechts).' },
        },
        {
          name: 'passAntragMonate',
          label: 'Passanträge: Antrag aufbewahren – Monate nach Abschluss',
          type: 'number',
          min: 24,
          defaultValue: 24,
          admin: { width: '50%', description: 'Der unterschriebene Antrag muss 2 Jahre aufbewahrt werden. Danach werden Antrag und Formular automatisch gelöscht.' },
        },
      ],
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
