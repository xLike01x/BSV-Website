import type { GlobalConfig } from 'payload'

import { ausblendenAusser, hasRole } from '@/access/roles'

import { anyone } from '../access/anyone'
import { revalidateAllesGlobal } from '../hooks/revalidateAlles'

/**
 * Startseite & Bilder: die grüne Aktions-Box und alle Bilder der Bereichsseiten.
 * Stand früher unter „Vereinsdaten“ – gehört aber zum Aufbau der Website (Texte stehen unter „Website-Texte“).
 */
export const Startseite: GlobalConfig = {
  slug: 'startseite',
  label: 'Startseite & Bilder',
  access: { read: anyone, update: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion') },
  admin: {
    group: 'Website-Aufbau',
    hidden: ausblendenAusser('admin', 'redaktion'),
    description: 'Die grüne Aktions-Box auf der Startseite und die Bilder der Startseite, der Bereichsseiten und der Vereinsseite. Die Texte dazu stehen unter „Website-Texte“.',
  },
  hooks: { afterChange: [revalidateAllesGlobal] },
  fields: [
    // Einmalige Übernahme aus „Vereinsdaten“ erledigt?
    { name: 'uebernommen', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Aktion (grüne Box)',
          description: 'Ein großer grüner Hinweis auf der Startseite – z. B. für ein Projekt, ein Fest oder eine Spendenaktion.',
          fields: [
            {
              type: 'group',
              name: 'aktion',
              label: false,
              fields: [
                { name: 'aktiv', label: 'Anzeigen', type: 'checkbox', defaultValue: true, admin: { description: 'Haken entfernen = Box ausblenden. Der Inhalt bleibt für später gespeichert.' } },
                { name: 'kicker', label: 'Überzeile', type: 'text', defaultValue: 'Kunstrasen 2026' },
                { name: 'titel', label: 'Titel', type: 'text', defaultValue: 'Eröffnet – mit Schalke 04.' },
                { name: 'text', label: 'Text', type: 'textarea' },
                {
                  type: 'row',
                  fields: [
                    { name: 'linkText', label: 'Button-Text', type: 'text', defaultValue: 'Mehr zum Projekt' },
                    { name: 'linkUrl', label: 'Button-Link', type: 'text', defaultValue: '/kunstrasen', admin: { description: 'z. B. /kunstrasen oder https://…' } },
                  ],
                },
                { name: 'bild', label: 'Bild (z. B. Plakat)', type: 'upload', relationTo: 'media', admin: { description: 'Hochformat sieht am besten aus.' } },
              ],
            },
          ],
        },
        {
          label: 'Bilder',
          description: 'Fotos der Startseite, der Bereichsseiten und der Vereinsseite. Bild entfernen: ×, neues wählen: „Aus vorhandenen auswählen“.',
          fields: [
            {
              type: 'group',
              name: 'startseite',
              label: false,
              fields: [
                { name: 'heroBilder', label: 'Startseite: Bilder oben (4 Stück)', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 4 },
                {
                  type: 'row',
                  fields: [
                    { name: 'heroTag1', label: 'Schild 1', type: 'text', defaultValue: 'Tanzmäuse · 3–6 J.', admin: { description: 'Kleines Schild auf den Bildern oben.' } },
                    { name: 'heroTag2', label: 'Schild 2', type: 'text', defaultValue: 'Mädchenfußball' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'bildFussball', label: 'Kachel Fußball (auch Titelbild der Fußball-Seite)', type: 'upload', relationTo: 'media' },
                    { name: 'bildKids', label: 'Kachel BSV Kids', type: 'upload', relationTo: 'media' },
                    { name: 'bildFitness', label: 'Kachel Fitness', type: 'upload', relationTo: 'media' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'bildBreitensport1', label: 'Breitensport-Seite Bild 1', type: 'upload', relationTo: 'media' },
                    { name: 'bildBreitensport2', label: 'Bild 2', type: 'upload', relationTo: 'media' },
                    { name: 'bildBreitensport3', label: 'Bild 3', type: 'upload', relationTo: 'media' },
                  ],
                },
                { name: 'bildVerein', label: 'Vereinsseite Titelbild', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
