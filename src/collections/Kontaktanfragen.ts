import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isAdmin, isEditor } from '../access/roles'
import { spamSchutz } from '../hooks/spamSchutz'

/** Nachrichten aus dem Kontaktformular. Telefonnummern und E-Mail-Adressen des Vorstands bleiben so geschützt. */
export const Kontaktanfragen: CollectionConfig = {
  slug: 'kontaktanfragen',
  labels: { singular: 'Kontaktanfrage', plural: 'Kontaktanfragen' },
  access: {
    create: anyone,
    read: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Nachrichten aus dem Kontaktformular. Nach dem Beantworten auf „Erledigt“ setzen.',
    group: 'Verwaltung',
    useAsTitle: 'betreff',
    defaultColumns: ['betreff', 'name', 'an', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  hooks: { beforeValidate: [spamSchutz('kontakt')] },
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'neu',
      options: [
        { label: 'Neu', value: 'neu' },
        { label: 'In Bearbeitung', value: 'bearbeitung' },
        { label: 'Erledigt', value: 'erledigt' },
      ],
      admin: { position: 'sidebar' },
      access: { create: () => false },
    },
    { name: 'an', label: 'An', type: 'text', admin: { description: 'Gewählte Ansprechperson oder Thema' } },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120 },
        { name: 'email', label: 'E-Mail', type: 'email', required: true },
      ],
    },
    { name: 'betreff', label: 'Betreff', type: 'text', required: true, maxLength: 200 },
    { name: 'nachricht', label: 'Nachricht', type: 'textarea', required: true, maxLength: 5000 },
    { name: 'datenschutz', label: 'Datenschutzhinweise gelesen', type: 'checkbox', required: true },
  ],
  timestamps: true,
}
