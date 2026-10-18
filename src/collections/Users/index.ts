import { webadminLoeschSchutz, webadminSchutz } from './webadminSchutz'
import { ausblendenAusser } from '@/access/roles'
import type { CollectionConfig } from 'payload'

import { canUseAdminPanel, hasRole, isAdmin, isAdminField, isAdminOrSelf, ROLE_OPTIONS } from '../../access/roles'
import { testkontenEndpunkte, testkontenErlaubt, testkontoFeld } from '../../auth/testkonten'
import { APIError } from 'payload'
import { zweiFaktorEndpunkte, zweiFaktorFelder, zweiFaktorStrategie, zweiFaktorZuruecksetzen } from '../../auth/zweiFaktor'

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
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Wer sich anmelden darf und mit welcher Rolle. Die Rolle bestimmt, was jemand bearbeiten kann.',
    group: 'Verwaltung',
    hidden: ausblendenAusser('admin'),
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8 Stunden
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 Minuten Sperre nach 5 Fehlversuchen
    // Läuft vor dem Standard-Token-Check: ohne bestätigten zweiten Faktor gelten nur Mitgliedsrechte
    strategies: [zweiFaktorStrategie],
  },
  endpoints: [...zweiFaktorEndpunkte, ...testkontenEndpunkte],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, admin: { description: 'Vor- und Nachname. Erscheint in der Verwaltung und als Autor:in von News.' } },
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
      admin: { description: 'Wer welche Rolle für welches Team hat: siehe „Rollen-Übersicht“ links unten. Web-Admin: alles inkl. Technik und Admin-Konten · Admin: alles außer Admin-/Web-Admin-Rechte vergeben · Redaktion: News, Seiten, Menü, Texte, Vereinsdaten · Kasse: Mitgliedsanträge, Beiträge · Übungsleitung / Team-Redaktion: nur eigene Teams · Mitglied: nur Mitgliederbereich.' },
    },
    {
      name: 'angebote',
      label: 'Teams & Kurse',
      type: 'relationship',
      relationTo: 'angebote',
      hasMany: true,
      admin: {
        description: 'Angebote, an denen diese Person als Mitglied teilnimmt.',
      },
    },
    {
      name: 'verantwortlichFuer',
      label: 'Verantwortlich für (Team-Rechte)',
      type: 'join',
      collection: 'angebote',
      on: 'leitung',
      admin: {
        description: 'Zuordnung im jeweiligen Team/Kurs unter „Verantwortliche“. Mit Rolle Übungsleitung oder Team-Redaktion darf die Person dort News, Bilder, Zeiten und Ausfälle pflegen.',
        defaultColumns: ['title', 'bereich'],
      },
    },
    ...zweiFaktorFelder,
    testkontoFeld,
  ],
  hooks: {
    // Testkonten (ohne Zwei-Faktor) nur auf dem lokalen Server
    beforeLogin: [
      ({ user }) => {
        if ((user as { testkonto?: boolean }).testkonto && !testkontenErlaubt()) throw new APIError('Testkonten sind auf der Live-Website gesperrt.', 403)
        return user
      },
    ],
    afterChange: [zweiFaktorZuruecksetzen as never],
    beforeChange: [
      // Die allererste Person, die sich anlegt, wird automatisch Web-Admin.
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
          if (totalDocs === 0) data.roles = ['webadmin', 'admin']
        }
        return data
      },
      webadminSchutz,
    ],
    beforeDelete: [webadminLoeschSchutz],
  },
  timestamps: true,
}

export const isStaffUser = (user: unknown) =>
  hasRole(user as never, 'admin', 'redaktion', 'kasse', 'uebungsleitung', 'teamredaktion')
