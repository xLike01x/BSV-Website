import { hinweisFeld } from '@/fields/hinweise'
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { anyone } from '../access/anyone'
import { eigeneAngebotIds, hasRole, redaktionOderEigeneTeams, TEAM_ROLLEN } from '../access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '../hooks/revalidateAlles'

/** Ausfall melden: Admin/Redaktion für alle, Team-Rollen nur für eigene Angebote. */
const canManage = redaktionOderEigeneTeams('angebot')

export const Ausfaelle: CollectionConfig = {
  slug: 'ausfaelle',
  labels: { singular: 'Trainingsausfall', plural: 'Trainingsausfälle' },
  access: {
    read: anyone,
    create: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion', ...TEAM_ROLLEN),
    update: canManage,
    delete: canManage,
  },
  admin: {
    description: 'Fällt ein Training aus? Hier eintragen – es erscheint sofort auf der Seite des Teams.',
    group: 'Sport',
    useAsTitle: 'grund',
    defaultColumns: ['angebot', 'datum', 'grund'],
  },
  defaultSort: '-datum',
  fields: [
    hinweisFeld('AusfallHinweise', false),
    {
      name: 'angebot',
      label: 'Angebot',
      type: 'relationship',
      relationTo: 'angebote',
      required: true,
      // Team-Rollen sehen in der Auswahl nur ihre eigenen Teams
      filterOptions: ({ user }) => (!user || hasRole(user as never, 'admin', 'redaktion') ? true : { leitung: { contains: user.id } }),
      admin: { description: 'Welches Team oder welcher Kurs ausfällt.' },
    },
    { name: 'datum', label: 'Datum', type: 'date', required: true, admin: { description: 'Nach diesem Tag verschwindet der Hinweis automatisch.', date: { displayFormat: 'dd.MM.yyyy' } } },
    {
      name: 'grund',
      label: 'Grund',
      type: 'select',
      defaultValue: 'Krankheit',
      options: ['Krankheit', 'Halle belegt', 'Ferien / Feiertag', 'Wetter', 'Sonstiges'].map((g) => ({ label: g, value: g })),
    },
    { name: 'hinweis', label: 'Hinweis an die Teilnehmenden', type: 'textarea', admin: { description: 'Optional, z. B. „Nachholtermin am Freitag“.' } },
    { name: 'benachrichtigen', label: 'Teilnehmende per E-Mail/Push benachrichtigen', type: 'checkbox', defaultValue: true, admin: { description: 'Kommt mit dem E-Mail-Versand – aktuell wird noch nichts verschickt.' } },
  ],
  hooks: {
    afterChange: [revalidateAllesNachAenderung],
    afterDelete: [revalidateAllesNachLoeschen],
    beforeChange: [
      // Team-Rollen dürfen Ausfälle nur für eigene Angebote anlegen.
      async ({ req, data, operation }) => {
        const user = req.user as { id: number } | null
        if (operation === 'create' && user && !hasRole(user as never, 'admin', 'redaktion')) {
          const ids = await eigeneAngebotIds(req)
          const ziel = typeof data.angebot === 'object' ? data.angebot?.id : data.angebot
          if (!ids.includes(Number(ziel))) throw new APIError('Du kannst nur für deine eigenen Angebote einen Ausfall melden.', 403)
        }
        return data
      },
    ],
  },
  timestamps: true,
}
