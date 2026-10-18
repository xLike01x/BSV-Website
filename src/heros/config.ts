import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Art des Kopfbereichs',
      admin: { description: 'Groß mit Bild, mittel mit Bild, schlicht nur Text – oder gar keiner.' },
      options: [
        {
          label: 'Kein Kopfbereich',
          value: 'none',
        },
        {
          label: 'Groß mit Bild (bildschirmfüllend)',
          value: 'highImpact',
        },
        {
          label: 'Mittel mit Bild',
          value: 'mediumImpact',
        },
        {
          label: 'Schlicht (nur Text)',
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: 'Überschrift und Einleitung',
      admin: { description: 'Große Überschrift ganz oben auf der Seite, darunter ein kurzer Satz.' },
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      label: 'Bild im Kopfbereich',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },
  ],
  label: false,
}
