import { ausblendenBeiNurEinzelrechten } from '@/access/roles'
import { hinweisFeld } from '@/fields/hinweise'
import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { canUpload, eigeneAngebotIds, hasRole, medienSichtbar, redaktionOderEigeneTeams } from '../access/roles'
import { autoZuordnenEndpunkt } from './Media/autoZuordnen'
import { LOGO_GROESSE } from '@/sponsoren/logo'

/** Team-Rollen laden Bilder immer für eines ihrer Teams hoch */
const teamBildPruefen: CollectionBeforeChangeHook = async ({ req, data, operation }) => {
  const user = req.user as { roles?: string[] } | null
  if (!user || hasRole(user as never, 'admin', 'redaktion')) return data
  const ids = await eigeneAngebotIds(req)
  if (!data.team && ids.length === 1) data.team = ids[0]
  const ziel = Number(typeof data.team === 'object' && data.team ? data.team.id : data.team)
  if ((operation === 'create' || data.team !== undefined) && !ids.includes(ziel)) throw new APIError('Bitte ordne das Bild einem deiner Teams zu.', 403)
  return data
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: canUpload,
    delete: redaktionOderEigeneTeams('team'),
    // Öffentlich lesbar – aber Dateien im Papierkorb nur noch für die Verwaltung (z. B. nach Widerruf einer Foto-Einwilligung)
    read: ({ req, isReadingStaticFile }) => {
      if (!isReadingStaticFile || canUpload({ req })) return true
      return { deletedAt: { exists: false } }
    },
    update: redaktionOderEigeneTeams('team'),
  },
  labels: { singular: 'Bild / Datei', plural: 'Mediathek' },
  admin: {
    description: 'Alle Bilder und Dateien, sortiert in Ordner je Team. Fotos von Kindern nur mit Einverständnis der Eltern hochladen.',
    group: 'Inhalte',
    hidden: ausblendenBeiNurEinzelrechten,
    defaultColumns: ['filename', 'alt', 'team', 'allgemein', 'inGalerie'],
    // Team-Rollen sehen nur Bilder ihrer Teams und „Verein allgemein“
    baseFilter: ({ req }) => medienSichtbar(req),
    components: { beforeList: ['@/components/Admin/MedienOrdner'] },
  },
  endpoints: [autoZuordnenEndpunkt],
  hooks: {
    beforeChange: [
      teamBildPruefen,
      // Ordner eindeutig halten: Team-Ordner schließt „Sponsoren“ aus, „Sponsoren“ zählt als Vereinsbild (alle dürfen es benutzen)
      ({ data }) => {
        if (data.team) data.sponsoren = false
        else if (data.sponsoren) data.allgemein = true
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Bildbeschreibung',
      type: 'text',
      admin: { description: 'Was ist zu sehen? Z. B. „Die F1 jubelt mit dem Pokal“. Hilft Menschen, die sich Seiten vorlesen lassen.' },
    },
    {
      name: 'personen',
      label: 'Sind Personen zu erkennen?',
      type: 'radio',
      options: [
        { label: 'Nein – keine Personen erkennbar (z. B. Plakat, Logo, Sportplatz)', value: 'keine' },
        { label: 'Ja – und die Einwilligung liegt vor (bei Kindern von den Eltern)', value: 'einwilligung' },
      ],
      admin: {
        layout: 'vertical',
        description: 'Pflicht beim Hochladen. Fotos, auf denen Personen erkennbar sind, nur mit Einwilligung – bei Kindern unter 16 Jahren der Eltern.',
      },
      validate: (wert: unknown, opts: unknown) => {
        // Pflicht nur beim Hochladen durch Personen – nicht bei Startinhalten (Seed) und nicht rückwirkend für alte Bilder
        const o = opts as { operation?: string; req?: { user?: unknown } }
        if (wert || o.operation !== 'create' || !o.req?.user) return true
        return 'Bitte angeben, ob Personen zu erkennen sind.'
      },
    },
    {
      name: 'einwilligungNachweis',
      label: 'Wo liegt die Einwilligung? (optional, empfohlen)',
      type: 'text',
      maxLength: 200,
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        condition: (d) => d?.personen === 'einwilligung',
        description: 'Z. B. „Foto-Einwilligung im Mitgliedsantrag“ oder „Formular vom 03.05.2026, Ordner Vorstand“. Hilft, wenn jemand widerruft oder nachfragt. Nicht öffentlich sichtbar.',
      },
    },
    hinweisFeld('MedienHinweise'),
    {
      name: 'team',
      label: 'Ordner (Team / Kurs)',
      type: 'relationship',
      relationTo: 'angebote',
      filterOptions: ({ user }) => (!user || hasRole(user as never, 'admin', 'redaktion') ? true : { leitung: { contains: user.id } }),
      admin: { position: 'sidebar', description: 'Der Ordner, in dem das Bild liegt. Nur Verantwortliche dieses Teams (und die Redaktion) sehen und benutzen es.' },
    },
    {
      name: 'allgemein',
      label: 'Verein allgemein',
      type: 'checkbox',
      // Nur Redaktion/Admin legen fest, was alle Trainer benutzen dürfen
      access: {
        create: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion'),
        update: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion'),
      },
      admin: {
        position: 'sidebar',
        condition: (data) => !data?.team,
        description: 'Für Bilder ohne Team, z. B. Logo, Sportplatz, Vereinsfotos. Alle Trainer dürfen sie benutzen, aber nicht ändern.',
      },
    },
    {
      name: 'sponsoren',
      label: 'Sponsoren-Logo',
      type: 'checkbox',
      access: {
        create: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion'),
        update: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion'),
      },
      admin: {
        position: 'sidebar',
        condition: (data) => !data?.team,
        description: 'Legt das Bild in den Ordner „Sponsoren“. Passiert automatisch, sobald es bei einem Sponsor als Logo gespeichert wird.',
      },
    },
    {
      name: 'inGalerie',
      label: 'In der Bildergalerie des Teams zeigen',
      type: 'checkbox',
      admin: { position: 'sidebar', description: 'Nur Fotos mit Einwilligung der abgebildeten Personen – bei Kindern der Eltern.' },
    },
    {
      name: 'caption',
      label: 'Bildunterschrift (optional)',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Bewusst NICHT in public/: Dateien laufen nur über /api/media/file/… und damit über die Zugriffsregeln
    // (Papierkorb-Bilder sind sofort weg, Payload setzt sichere Header)
    staticDir: path.resolve(dirname, '../../medien'),
    // Nur Bilder und PDFs – keine HTML/XML/SVG-Dateien, die im Browser Skripte ausführen könnten
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf'],
    adminThumbnail: 'thumbnail',
    // Original über sharp neu schreiben: entfernt Standort (GPS), Kameradaten und andere Metadaten aus Fotos,
    // dreht nach EXIF richtig herum und begrenzt riesige Handy-Fotos auf 2560 px (Audit F-11)
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        // Neue Uploads als WebP – deutlich kleiner bei gleicher Qualität
        formatOptions: { format: 'webp', options: { quality: 80 } },
        width: 300,
      },
      {
        name: 'square',
        // Neue Uploads als WebP – deutlich kleiner bei gleicher Qualität
        formatOptions: { format: 'webp', options: { quality: 80 } },
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        // Neue Uploads als WebP – deutlich kleiner bei gleicher Qualität
        formatOptions: { format: 'webp', options: { quality: 80 } },
        width: 600,
      },
      {
        name: 'medium',
        // Neue Uploads als WebP – deutlich kleiner bei gleicher Qualität
        formatOptions: { format: 'webp', options: { quality: 80 } },
        width: 900,
      },
      {
        name: 'large',
        // Neue Uploads als WebP – deutlich kleiner bei gleicher Qualität
        formatOptions: { format: 'webp', options: { quality: 80 } },
        width: 1400,
      },
      {
        name: 'xlarge',
        // Neue Uploads als WebP – deutlich kleiner bei gleicher Qualität
        formatOptions: { format: 'webp', options: { quality: 80 } },
        width: 1920,
      },
      // Logo ohne leeren Rand – für die einheitliche Darstellung der Sponsoren
      LOGO_GROESSE,
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
