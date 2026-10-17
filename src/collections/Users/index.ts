import type { CollectionConfig } from 'payload'

import { canUseAdminPanel, hasRole, isAdmin, isAdminField, isAdminOrSelf, ROLE_OPTIONS } from '../../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Benutzer', plural: 'Benutzer' },
  access: {
    admin: canUseAdminPanel,
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  admin: {
    group: 'Verwaltung',
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8 Stunden
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 Minuten Sperre nach 5 Fehlversuchen
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'roles',
      label: 'Rollen',
      type: 'select',
      hasMany: true,
      options: ROLE_OPTIONS,
      defaultValue: ['mitglied'],
      required: true,
      saveToJWT: true,
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: { description: 'Bestimmt, was diese Person sehen und bearbeiten darf.' },
    },
    {
      name: 'angebote',
      label: 'Teams & Kurse',
      type: 'relationship',
      relationTo: 'angebote',
      hasMany: true,
      admin: {
        description: 'Bei Mitgliedern: angemeldete Angebote. Bei Übungsleitungen siehe „Leitung“ im Angebot.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      // Die allererste Person, die sich anlegt, wird automatisch Admin.
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
          if (totalDocs === 0) data.roles = ['admin']
        }
        return data
      },
    ],
  },
  timestamps: true,
}

export const isStaffUser = (user: unknown) =>
  hasRole(user as never, 'admin', 'redaktion', 'kasse', 'uebungsleitung')
