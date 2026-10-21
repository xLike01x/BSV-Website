import type { CollectionConfig } from 'payload'

import { hasRole, imBereich } from '@/access/roles'

/**
 * Besucherstatistik – ein Eintrag pro Seitenaufruf bzw. Ereignis.
 * Datensparsam: keine Cookies, keine IP-Adresse, kein Fingerabdruck über den Tag hinaus.
 * „besucher“ ist ein Kürzel aus IP + Browser + einem täglich wechselnden Zufallswert, der nie gespeichert wird –
 * so lassen sich Besucher eines Tages zählen, aber niemand wiedererkennen.
 * Auswertung: /admin/statistik (Web-Admin und Zusatzrecht „statistik“). Alte Einträge löscht die tägliche Aufgabe (Datenschutz-Fristen).
 */
export const Statistik: CollectionConfig = {
  slug: 'statistik',
  // Auswertungen filtern fast immer nach Art und Tag
  indexes: [{ fields: ['art', 'tag'] }],
  labels: { singular: 'Statistik-Eintrag', plural: 'Statistik' },
  access: {
    read: ({ req }) => imBereich(req.user, 'statistik'),
    create: () => false,
    update: () => false,
    delete: ({ req }) => hasRole(req.user as never, 'webadmin'),
  },
  admin: { hidden: true, group: 'Einstellungen' },
  fields: [
    { name: 'tag', type: 'text', index: true, required: true },
    {
      name: 'art',
      type: 'select',
      index: true,
      required: true,
      options: [
        { label: 'Seitenaufruf', value: 'aufruf' },
        { label: 'Mitgliedsantrag: Schritt', value: 'schritt' },
        { label: 'Suche', value: 'suche' },
      ],
    },
    { name: 'pfad', type: 'text', index: true },
    { name: 'quelle', type: 'text' },
    { name: 'geraet', type: 'select', options: ['handy', 'tablet', 'computer'].map((v) => ({ label: v, value: v })) },
    { name: 'besucher', type: 'text', index: true },
    { name: 'schritt', type: 'number' },
    { name: 'suchbegriff', type: 'text' },
    { name: 'treffer', type: 'number' },
  ],
  timestamps: true,
}
