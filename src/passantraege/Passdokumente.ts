import path from 'path'
import type { CollectionConfig, Where } from 'payload'
import { fileURLToPath } from 'url'

import { ausblendenAusser, istMitgliedOderMehr } from '@/access/roles'

import { istPassVerwaltung, passLesen } from './zugriff'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Unterlagen zu Passanträgen (Ausweis, Passfoto, unterschriebener Antrag …).
 * Liegen NICHT im öffentlichen Ordner. Sichtbar nur für die hochladende Person,
 * Admin/Passwesen und die Übungsleitung des Teams.
 */
export const Passdokumente: CollectionConfig = {
  slug: 'passdokumente',
  labels: { singular: 'Pass-Unterlage', plural: 'Pass-Unterlagen' },
  access: {
    read: passLesen('team', 'hochgeladenVon'),
    create: ({ req }) => istMitgliedOderMehr(req.user),
    update: ({ req }) => istPassVerwaltung(req.user),
    delete: async (args) => {
      const user = args.req.user as { id: number } | null
      if (!user) return false
      if (istPassVerwaltung(user)) return true
      // Eigene Unterlagen nur, solange sie noch keinem Antrag zugeordnet sind
      return { and: [{ hochgeladenVon: { equals: user.id } }, { antrag: { exists: false } }] } as Where
    },
  },
  admin: {
    group: 'Sport',
    hidden: ausblendenAusser('admin'),
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'art', 'antrag', 'createdAt'],
    description: 'Die einzelnen Dateien zu den Passanträgen. Normalerweise öffnest du sie direkt im Passantrag.',
  },
  upload: {
    staticDir: path.resolve(dirname, '../../passantraege'),
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  },
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && req.user && !istPassVerwaltung(req.user)) {
          data.hochgeladenVon = req.user.id
          data.antrag = null
          data.team = null
        } else if (operation === 'create' && req.user && !data.hochgeladenVon) data.hochgeladenVon = req.user.id
        return data
      },
    ],
  },
  fields: [
    {
      name: 'art',
      label: 'Art',
      type: 'select',
      options: [
        { label: 'Passantrag (unterschrieben)', value: 'passantrag' },
        { label: 'Ausweis / Geburtsurkunde', value: 'ausweis' },
        { label: 'Passfoto', value: 'passfoto' },
        { label: 'Einverständniserklärung', value: 'einwilligung' },
        { label: 'Abmeldung alter Verein', value: 'abmeldung' },
        { label: 'Meldebescheinigung', value: 'meldebescheinigung' },
        { label: 'Sonstiges', value: 'sonstiges' },
      ],
    },
    { name: 'hochgeladenVon', label: 'Hochgeladen von', type: 'relationship', relationTo: 'users', index: true, admin: { readOnly: true } },
    { name: 'antrag', label: 'Passantrag', type: 'relationship', relationTo: 'passantraege', index: true, admin: { readOnly: true } },
    { name: 'team', label: 'Team', type: 'relationship', relationTo: 'angebote', index: true, admin: { readOnly: true } },
  ],
}
