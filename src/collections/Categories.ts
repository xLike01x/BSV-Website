import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isEditor } from '../access/roles'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategorie', plural: 'Kategorien' },
  access: {
    create: isEditor,
    delete: isEditor,
    read: anyone,
    update: isEditor,
  },
  admin: {
    group: 'Inhalte',
    // Nur Admins sehen die Kategorien in der Seitenleiste
    hidden: ({ user }) => !((user as { roles?: string[] } | null)?.roles ?? []).includes('admin'),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
