import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isEditor } from '../access/roles'
import { slugField } from 'payload'
import { createBreadcrumbsField, createParentField } from '@payloadcms/plugin-nested-docs'

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
    description: 'Schlagworte, nach denen Besucher die News filtern können.',
    group: 'Website-Aufbau',
    // Nur Admins sehen die Kategorien in der Seitenleiste
    hidden: ({ user }) => !((user as { roles?: string[] } | null)?.roles ?? []).includes('admin'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    listSearchableFields: ['title'],
  },
  fields: [
    {
      name: 'title',
      label: 'Name',
      type: 'text',
      required: true,
      admin: { description: 'So heißt der Filter auf der News-Seite, z. B. „Fußball“ oder „Kids“.' },
    },
    slugField({
      position: undefined,
    }),
    // Felder des Plugins „verschachtelte Kategorien“ – hier nur mit deutschen Beschriftungen
    createParentField('categories', {
      label: 'Übergeordnete Kategorie (optional)',
      admin: { position: 'sidebar', description: 'Nur nötig, wenn diese Kategorie unter einer anderen stehen soll. Meist leer lassen.' },
    }),
    createBreadcrumbsField('categories', { label: 'Pfad', admin: { hidden: true } }),
  ],
}
