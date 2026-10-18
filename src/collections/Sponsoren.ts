import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { ausblendenAusser, isEditor } from '@/access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '@/hooks/revalidateAlles'

/** Sponsoren und Partner – erscheinen auf /sponsoren und (mit Logo) im Laufband der Startseite */
export const Sponsoren: CollectionConfig = {
  slug: 'sponsoren',
  labels: { singular: 'Sponsor', plural: 'Sponsoren' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'name',
    defaultColumns: ['name', 'stufe', 'aktiv', 'reihenfolge'],
    hidden: ausblendenAusser('admin', 'redaktion'),
    components: { beforeList: ['@/components/Admin/Einstieg', '@/components/Admin/Sponsoren'] },
    description: 'Alle Sponsoren und Partner – auch der Hauptsponsor (Art „Hauptsponsor“), der zusätzlich unten in der Fußzeile jeder Seite steht.',
  },
  defaultSort: 'reihenfolge',
  hooks: { afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Am besten mit transparentem oder weißem Hintergrund (PNG oder SVG), quer.' },
    },
    { name: 'url', label: 'Website', type: 'text', admin: { placeholder: 'https://…' } },
    { name: 'text', label: 'Kurzer Text (optional)', type: 'textarea', maxLength: 200, admin: { description: 'Z. B. „Unterstützt seit 2015 unsere Jugend“.' } },
    {
      name: 'stufe',
      label: 'Art',
      type: 'select',
      defaultValue: 'partner',
      options: [
        { label: 'Hauptsponsor (auch unten in der Fußzeile)', value: 'haupt' },
        { label: 'Premium-Partner', value: 'premium' },
        { label: 'Partner', value: 'partner' },
        { label: 'Förderer & Freunde', value: 'foerderer' },
      ],
      admin: { position: 'sidebar', description: 'Bestimmt die Gruppe und Größe auf der Sponsoren-Seite. „Hauptsponsor“ steht ganz oben und in der Fußzeile (bei mehreren: der mit der kleinsten Reihenfolge-Zahl).' },
    },
    { name: 'imLaufband', label: 'Im Laufband auf der Startseite', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Nur mit Logo.' } },
    { name: 'reihenfolge', label: 'Reihenfolge', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Kleinere Zahl = weiter vorne.' } },
    { name: 'aktiv', label: 'Aktiv (sichtbar)', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
