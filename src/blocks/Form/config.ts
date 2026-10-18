import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const FormBlock: Block = {
  slug: 'formBlock',
  imageURL: '/bausteine/formBlock.svg',
  imageAltText: 'Formular mit Feldern und Absende-Button',
  interfaceName: 'FormBlock',
  fields: [
    {
      name: 'form',
      label: 'Formular',
      admin: { description: 'Noch kein passendes Formular? Unter „Eigene Formulare → Formulare“ anlegen – dort gibt es fertige Vorlagen (Anmeldung, Helferliste, Bestellung).' },
      type: 'relationship',
      relationTo: 'forms',
      required: true,
    },
    {
      name: 'enableIntro',
      type: 'checkbox',
      label: 'Einleitungstext über dem Formular anzeigen',
    },
    {
      name: 'introContent',
      type: 'richText',
      admin: {
        condition: (_, { enableIntro }) => Boolean(enableIntro),
      },
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
      label: 'Einleitungstext',
    },
  ],
  graphQL: {
    singularName: 'FormBlock',
  },
  labels: {
    plural: 'Formulare',
    singular: 'Formular',
  },
}
