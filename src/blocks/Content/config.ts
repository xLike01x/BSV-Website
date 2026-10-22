import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
  OrderedListFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'

const columnFields: Field[] = [
  {
    name: 'size',
    label: 'Breite der Spalte',
    type: 'select',
    defaultValue: 'oneThird',
    options: [
      {
        label: 'Ein Drittel',
        value: 'oneThird',
      },
      {
        label: 'Halbe Breite',
        value: 'half',
      },
      {
        label: 'Zwei Drittel',
        value: 'twoThirds',
      },
      {
        label: 'Volle Breite',
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          // Aufzählungen (z. B. in Impressum/Datenschutz)
          UnorderedListFeature(),
          OrderedListFeature(),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: 'Text',
  },
  {
    name: 'enableLink',
    label: 'Link unter dem Text anzeigen',
    type: 'checkbox',
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  imageURL: '/bausteine/content.svg',
  imageAltText: 'Text in zwei Spalten',
  interfaceName: 'ContentBlock',
  labels: { singular: 'Text (in Spalten)', plural: 'Texte' },
  fields: [
    {
      name: 'columns',
      label: 'Spalten',
      labels: { singular: 'Spalte', plural: 'Spalten' },
      type: 'array',
      admin: {
        initCollapsed: false,
      },
      fields: columnFields,
    },
  ],
}
