import { hinweisFeld } from '@/fields/hinweise'
import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { canUpload, eigeneAngebotIds, hasRole, redaktionOderEigeneTeams } from '../access/roles'

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
    read: anyone,
    update: redaktionOderEigeneTeams('team'),
  },
  labels: { singular: 'Bild / Datei', plural: 'Mediathek' },
  admin: { description: 'Alle Bilder und Dateien. Fotos von Kindern nur mit Einverständnis der Eltern hochladen.', group: 'Inhalte', defaultColumns: ['filename', 'alt', 'team', 'inGalerie'] },
  hooks: { beforeChange: [teamBildPruefen] },
  fields: [
    {
      name: 'alt',
      label: 'Bildbeschreibung',
      type: 'text',
      admin: { description: 'Was ist zu sehen? Z. B. „Die F1 jubelt mit dem Pokal“. Hilft Menschen, die sich Seiten vorlesen lassen.' },
    },
    hinweisFeld('MedienHinweise'),
    {
      name: 'team',
      label: 'Team / Kurs',
      type: 'relationship',
      relationTo: 'angebote',
      filterOptions: ({ user }) => (!user || hasRole(user as never, 'admin', 'redaktion') ? true : { leitung: { contains: user.id } }),
      admin: { position: 'sidebar', description: 'Bilder eines Teams kann dessen Team-Redaktion verwalten.' },
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
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
