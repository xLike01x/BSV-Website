import type { GlobalConfig } from 'payload'

import { hasRole } from '@/access/roles'

/** Automatische Abmeldung in der Verwaltung nach Inaktivität – einstellbar durch den Web-Admin */
export const Sicherheit: GlobalConfig = {
  slug: 'sicherheit',
  label: 'Automatisch abmelden',
  access: {
    // Jede Person mit Verwaltungs-Zugang muss die Zeiten lesen können (der Wächter läuft in ihrem Browser)
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user as never, 'webadmin'),
  },
  admin: {
    group: 'Einstellungen',
    hidden: ({ user }) => !hasRole(user as never, 'webadmin'),
    description:
      'Wer in der Verwaltung eine Weile nichts tut (kein Klick, keine Taste, kein Scrollen), wird automatisch abgemeldet – wichtig an gemeinsam genutzten Computern, z. B. im Vereinsheim. Vorher erscheint eine Warnung mit „Angemeldet bleiben“. Ungespeicherte Änderungen gehen beim Abmelden verloren.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'minuten', label: 'Abmelden nach … Minuten ohne Aktivität', type: 'number', required: true, defaultValue: 30, min: 5, max: 480, admin: { width: '50%', description: 'Empfohlen: 30. Höchstens 480 (8 Stunden).' } },
        { name: 'warnenMinuten', label: 'Warnung … Minuten vorher', type: 'number', required: true, defaultValue: 5, min: 1, max: 30, admin: { width: '50%', description: 'Empfohlen: 5.' } },
      ],
    },
    { name: 'aus', label: 'Automatisches Abmelden ausschalten', type: 'checkbox', defaultValue: false, admin: { description: 'Nicht empfohlen. Dann gilt nur die feste Höchstdauer von 8 Stunden.' } },
  ],
}
