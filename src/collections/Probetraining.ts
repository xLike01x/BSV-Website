import type { Access, CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { hasRole } from '../access/roles'
import { spamSchutz } from '../hooks/spamSchutz'

/** Übungsleitungen sehen nur Anfragen zu ihren eigenen Angeboten. */
const readAnfragen: Access = async ({ req }) => {
  const user = req.user as { id: number; roles?: string[] } | null
  if (!user) return false
  if (hasRole(user as never, 'admin', 'redaktion')) return true
  if (hasRole(user as never, 'uebungsleitung')) {
    const eigene = await req.payload.find({
      collection: 'angebote',
      where: { leitung: { contains: user.id } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })
    return { angebot: { in: eigene.docs.map((d) => d.id) } }
  }
  return false
}

export const Probetraining: CollectionConfig = {
  slug: 'probetraining',
  labels: { singular: 'Probetraining-Anfrage', plural: 'Probetraining-Anfragen' },
  access: {
    create: anyone,
    read: readAnfragen,
    update: readAnfragen,
    delete: ({ req }) => hasRole(req.user as never, 'admin'),
  },
  admin: {
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Anfragen für ein Probetraining von der Website. Bitte zeitnah melden und danach den Status ändern.',
    group: 'Sport',
    useAsTitle: 'name',
    defaultColumns: ['name', 'angebot', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  hooks: { beforeValidate: [spamSchutz('probetraining')] },
  fields: [
    { name: 'angebot', label: 'Angebot', type: 'relationship', relationTo: 'angebote', required: true },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'E-Mail', type: 'email', required: true },
      ],
    },
    { name: 'teilnehmer', label: 'Teilnehmer/in (z. B. Kind)', type: 'text' },
    { name: 'alter', label: 'Alter', type: 'number' },
    { name: 'wunschtermin', label: 'Wunschtermin', type: 'text' },
    { name: 'nachricht', label: 'Nachricht', type: 'textarea' },
    { name: 'datenschutz', label: 'Datenschutzhinweise gelesen', type: 'checkbox', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'neu',
      options: [
        { label: 'Neu', value: 'neu' },
        { label: 'Zugesagt', value: 'zugesagt' },
        { label: 'Anderer Termin vorgeschlagen', value: 'alternativ' },
        { label: 'Erledigt', value: 'erledigt' },
      ],
      admin: { position: 'sidebar' },
      access: { create: () => false },
    },
  ],
  timestamps: true,
}
