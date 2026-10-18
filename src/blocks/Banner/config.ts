import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Banner: Block = {
  slug: 'banner',
  fields: [
    {
      name: 'style',
      label: 'Farbe',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info (blau)', value: 'info' },
        { label: 'Achtung (gelb)', value: 'warning' },
        { label: 'Wichtig (rot)', value: 'error' },
        { label: 'Erfolg (grün)', value: 'success' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: 'Text im Hinweis',
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
  labels: { singular: 'Farbiger Hinweis', plural: 'Farbige Hinweise' },
}
