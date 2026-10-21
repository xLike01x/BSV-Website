import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { logoFreistellen } from '@/sponsoren/logo'
import { sichereAdresse } from '@/fields/sichereAdresse'
import { ausblendenAusserBereich, bereichZugriff } from '@/access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '@/hooks/revalidateAlles'

/** Sponsoren und Partner – erscheinen auf /sponsoren und (mit Logo) im Laufband der Startseite */
export const Sponsoren: CollectionConfig = {
  slug: 'sponsoren',
  labels: { singular: 'Sponsor', plural: 'Sponsoren' },
  access: { read: anyone, create: bereichZugriff('sponsoren'), update: bereichZugriff('sponsoren'), delete: bereichZugriff('sponsoren') },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'name',
    defaultColumns: ['name', 'stufe', 'aktiv', 'reihenfolge'],
    hidden: ausblendenAusserBereich('sponsoren'),
    components: { beforeList: ['@/components/Admin/Einstieg', '@/components/Admin/Sponsoren'] },
    description: 'Alle Sponsoren und Partner – auch der Hauptsponsor (Art „Hauptsponsor“), der zusätzlich unten in der Fußzeile jeder Seite steht.',
  },
  defaultSort: 'reihenfolge',
  hooks: {
    afterChange: [
      revalidateAllesNachAenderung,
      // Sponsor-Logos landen automatisch im Mediathek-Ordner „Sponsoren“
      async ({ doc, req }) => {
        for (const feld of [doc.logo, doc.logoFusszeile]) {
        const id = feld && typeof feld === 'object' ? feld.id : feld
        if (!id) continue
        const m = (await req.payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true, req }).catch(() => null)) as { team?: unknown; sponsoren?: boolean | null } | null
        await logoFreistellen(req.payload, id).catch((e) => req.payload.logger.warn({ err: e }, 'Logo freistellen fehlgeschlagen'))
        if (m && !m.team && !m.sponsoren) await req.payload.update({ collection: 'media', id, data: { allgemein: true, sponsoren: true } as never, overrideAccess: true, req, context: { disableRevalidate: true } }).catch(() => null)
        }
        return doc
      },
    ],
    afterDelete: [revalidateAllesNachLoeschen],
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Ideal: PNG mit durchsichtigem (oder weißem) Hintergrund, mindestens 600 Pixel breit (am besten 1000–2000), nur das Logo ohne weitere Elemente drumherum. Größe und Seitenverhältnis sind egal – die Website entfernt den leeren Rand automatisch und gleicht alle Logos so an, dass sie gleich groß wirken. Beim Hochladen kein Team wählen; das Logo kommt beim Speichern automatisch in den Mediathek-Ordner „Sponsoren“.',
      },
    },
    {
      name: 'logoFusszeile',
      label: 'Logo für die Fußzeile (optional)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (d) => d?.stufe === 'haupt',
        description:
          'Nur für Hauptsponsoren: In der Fußzeile ist wenig Platz (ca. 40 Pixel hoch). Hat der Sponsor eine kompakte Variante (z. B. nur Schriftzug, quer), hier hochladen. Leer = das normale Logo wird genommen. Ideal: PNG mit durchsichtigem Hintergrund, quer, mindestens 400 Pixel breit.',
      },
    },
    { name: 'url', label: 'Website', type: 'text', validate: sichereAdresse, admin: { placeholder: 'https://…' } },
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
      admin: { position: 'sidebar', description: 'Bestimmt die Gruppe und Größe auf der Sponsoren-Seite. „Hauptsponsor“ steht ganz oben und in der Fußzeile – auch mehrere Hauptsponsoren sind möglich (Reihenfolge-Zahl bestimmt die Reihenfolge).' },
    },
    { name: 'imLaufband', label: 'Im Laufband auf der Startseite', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Nur mit Logo.' } },
    { name: 'reihenfolge', label: 'Reihenfolge', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Kleinere Zahl = weiter vorne.' } },
    { name: 'aktiv', label: 'Aktiv (sichtbar)', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
