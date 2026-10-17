import type { Access, CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { anyone } from '../access/anyone'
import { hasRole } from '../access/roles'

/** Ausfall melden: Admin/Redaktion für alle, Übungsleitung nur für eigene Angebote. */
const canManage: Access = async ({ req }) => {
  const user = req.user as { id: number } | null
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

export const Ausfaelle: CollectionConfig = {
  slug: 'ausfaelle',
  labels: { singular: 'Trainingsausfall', plural: 'Trainingsausfälle' },
  access: {
    read: anyone,
    create: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion', 'uebungsleitung'),
    update: canManage,
    delete: canManage,
  },
  admin: {
    group: 'Sport',
    useAsTitle: 'grund',
    defaultColumns: ['angebot', 'datum', 'grund'],
  },
  defaultSort: '-datum',
  fields: [
    { name: 'angebot', label: 'Angebot', type: 'relationship', relationTo: 'angebote', required: true },
    { name: 'datum', label: 'Datum', type: 'date', required: true, admin: { date: { displayFormat: 'dd.MM.yyyy' } } },
    {
      name: 'grund',
      label: 'Grund',
      type: 'select',
      defaultValue: 'Krankheit',
      options: ['Krankheit', 'Halle belegt', 'Ferien / Feiertag', 'Wetter', 'Sonstiges'].map((g) => ({ label: g, value: g })),
    },
    { name: 'hinweis', label: 'Hinweis an die Teilnehmenden', type: 'textarea' },
    { name: 'benachrichtigen', label: 'Teilnehmende per E-Mail/Push benachrichtigen', type: 'checkbox', defaultValue: true },
  ],
  hooks: {
    beforeChange: [
      // Übungsleitungen dürfen Ausfälle nur für eigene Angebote anlegen.
      async ({ req, data, operation }) => {
        const user = req.user as { id: number } | null
        if (operation === 'create' && user && !hasRole(user as never, 'admin', 'redaktion')) {
          const angebot = await req.payload.findByID({ collection: 'angebote', id: data.angebot, depth: 0, overrideAccess: true })
          const leitung = (angebot?.leitung ?? []) as (number | { id: number })[]
          const ok = leitung.some((l) => (typeof l === 'object' ? l.id : l) === user.id)
          if (!ok) throw new APIError('Du kannst nur für deine eigenen Angebote einen Ausfall melden.', 403)
        }
        return data
      },
    ],
  },
  timestamps: true,
}
