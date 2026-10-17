import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isAdmin } from '../access/roles'

/** Vereinsdaten an einer Stelle: Adressen, Kennzahlen, Beiträge, Hauptsponsor. */
export const Verein: GlobalConfig = {
  slug: 'verein',
  label: 'Vereinsdaten',
  access: { read: anyone, update: isAdmin },
  admin: { group: 'Verwaltung' },
  fields: [
    { name: 'name', label: 'Vereinsname', type: 'text', defaultValue: 'Büdericher Spielverein 1919 e.V.' },
    {
      type: 'row',
      fields: [
        { name: 'mitglieder', label: 'Mitgliederzahl', type: 'number', defaultValue: 1121 },
        { name: 'kinderFussball', label: 'Kinder in der Fußballjugend', type: 'number', defaultValue: 142 },
        { name: 'gruendung', label: 'Gründungsjahr', type: 'number', defaultValue: 1919 },
      ],
    },
    { name: 'sportpark', label: 'Sportplatz', type: 'textarea', defaultValue: 'Kutscher-Remy-Sportpark\nSchützenstraße 25a\n46487 Wesel' },
    { name: 'postanschrift', label: 'Postanschrift', type: 'textarea', defaultValue: 'Am Weißen Stein 2f\n46487 Wesel' },
    {
      name: 'beitraege',
      label: 'Mitgliedsbeiträge',
      type: 'array',
      defaultValue: [
        { key: 'jugend', label: 'Jugendliche', zielgruppe: '0 bis 17 Jahre', quartal: 15 },
        { key: 'aktiv', label: 'Erwachsene aktiv', zielgruppe: 'ab 18 Jahren', quartal: 21 },
        { key: 'familie', label: 'Familie', zielgruppe: 'die ganze Familie', quartal: 36 },
        { key: 'passiv', label: 'Erwachsene passiv', zielgruppe: 'Verein unterstützen', quartal: 12 },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'key', label: 'Schlüssel', type: 'text', required: true },
            { name: 'label', label: 'Bezeichnung', type: 'text', required: true },
            { name: 'zielgruppe', label: 'Zielgruppe', type: 'text' },
            { name: 'quartal', label: '€ pro Quartal', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'hauptsponsor',
      label: 'Hauptsponsor',
      fields: [
        { name: 'name', label: 'Name', type: 'text', defaultValue: 'Dachdeckerbetrieb Kutscher-Remy' },
        { name: 'url', label: 'Website', type: 'text', defaultValue: 'https://remy-dach.de' },
        { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      type: 'group',
      name: 'social',
      label: 'Social Media',
      fields: [
        { name: 'instagram', type: 'text', defaultValue: 'https://www.instagram.com/buedericher_spielverein/' },
        { name: 'facebook', type: 'text', defaultValue: 'https://www.facebook.com/bsv1919ev/' },
      ],
    },
  ],
}
