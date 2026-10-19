import type { Access, CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { hasRole, isEditorField } from '../access/roles'
import { darf, rechteLaden } from '../access/rollenRechte'
import { spamSchutz } from '../hooks/spamSchutz'
import { statusPille, statusReiter } from '@/components/Admin/StatusReiter/konfig'
import { teamBenachrichtigen } from '@/sport/teamMail'

/** Übungsleitungen sehen nur Anfragen zu ihren eigenen Angeboten. */
const readAnfragen: Access = async ({ req }) => {
  const user = req.user as { id: number; roles?: string[] } | null
  if (!user) return false
  if (hasRole(user as never, 'admin', 'redaktion')) return true
  await rechteLaden(req.payload)
  if (darf(user, 'uebungsleitung', 'probetraining')) {
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
    delete: async ({ req }) => (await rechteLaden(req.payload), hasRole(req.user as never, 'admin') || darf(req.user, 'redaktion', 'probetrainingLoeschen')),
  },
  admin: {
    components: {
      beforeList: [
        '@/components/Admin/Einstieg',
        statusReiter('probetraining', [
          { key: 'neu', titel: 'Neu', symbol: '🆕', status: ['neu'], hervorheben: true },
          { key: 'arbeit', titel: 'In Arbeit', symbol: '⏳', status: ['zugesagt', 'alternativ'] },
          { key: 'erledigt', titel: 'Erledigt', symbol: '✓', status: ['erledigt'] },
          { key: 'alle', titel: 'Alle', symbol: '🗂️', status: null },
        ]),
      ],
    },
    description: 'Anfragen für ein Probetraining von der Website. Bitte zeitnah melden und danach den Status ändern.',
    group: 'Sport',
    useAsTitle: 'name',
    defaultColumns: ['name', 'angebot', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeValidate: [spamSchutz('probetraining')],
    // Neue Anfrage → kurze Mail an die Trainer des Teams (ohne Kontaktdaten im Text – die stehen in der Verwaltung)
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const id = typeof doc.angebot === 'object' ? doc.angebot?.id : doc.angebot
        if (!id) return doc
        const team = (await req.payload.findByID({ collection: 'angebote', id, depth: 0, overrideAccess: true, req }).catch(() => null)) as { title?: string } | null
        await teamBenachrichtigen(req, {
          angebotId: id,
          schalterKey: 'probetraining',
          betreff: `Neue Probetraining-Anfrage: ${team?.title ?? 'dein Team'}`,
          titel: 'Neue Probetraining-Anfrage',
          absaetze: [`für „${team?.title ?? 'dein Team'}“ ist eine neue Anfrage eingegangen${doc.wunschtermin ? ` (Wunschtermin: ${String(doc.wunschtermin).slice(0, 80)})` : ''}.`, 'Name und Kontaktdaten findest du in der Verwaltung. Bitte melde dich zeitnah und setze danach den Status.'],
          pfad: `/admin/collections/probetraining/${doc.id}`,
        }).catch((e) => req.payload.logger.error({ err: e }, 'Probetraining-Benachrichtigung fehlgeschlagen'))
        return doc
      },
    ],
  },
  fields: [
    // Nachträglich umhängen nur Admin/Redaktion (sonst könnten Trainer Anfragen samt Daten anderen Teams zuschieben)
    { name: 'angebot', label: 'Angebot', type: 'relationship', relationTo: 'angebote', required: true, access: { update: isEditorField } },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120 },
        { name: 'email', label: 'E-Mail', type: 'email', required: true },
      ],
    },
    { name: 'teilnehmer', label: 'Teilnehmer/in (z. B. Kind)', type: 'text', maxLength: 120 },
    { name: 'alter', label: 'Alter', type: 'number', min: 0, max: 120 },
    { name: 'wunschtermin', label: 'Wunschtermin', type: 'text', maxLength: 200 },
    { name: 'nachricht', label: 'Nachricht', type: 'textarea', maxLength: 3000 },
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
      admin: {
        position: 'sidebar',
        components: statusPille({ neu: { text: '🆕 Neu', klasse: 'neu' }, zugesagt: { text: 'Zugesagt', klasse: 'warten' }, alternativ: { text: 'Anderer Termin', klasse: 'warten' }, erledigt: { text: '✓ Erledigt', klasse: 'ok' } }),
      },
      access: { create: () => false },
    },
  ],
  timestamps: true,
}
