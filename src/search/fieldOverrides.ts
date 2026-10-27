import { Field } from 'payload'

export const searchFields: Field[] = [
  {
    name: 'slug',
    label: 'Adresse (Slug)',
    type: 'text',
    index: true,
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'meta',
    label: 'Vorschau',
    type: 'group',
    index: true,
    admin: {
      readOnly: true,
    },
    fields: [
      {
        type: 'text',
        name: 'title',
        label: 'Titel',
      },
      {
        type: 'text',
        name: 'description',
        label: 'Beschreibung',
      },
      {
        name: 'image',
        label: 'Bild',
        type: 'upload',
        relationTo: 'media',
      },
    ],
  },
  {
    label: 'Kategorien',
    name: 'categories',
    type: 'array',
    admin: {
      readOnly: true,
    },
    fields: [
      {
        name: 'relationTo',
        type: 'text',
      },
      {
        name: 'categoryID',
        type: 'text',
      },
      {
        name: 'title',
        type: 'text',
      },
    ],
  },
]
