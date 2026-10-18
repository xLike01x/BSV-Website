import { registrierungEndpunkte } from '@/auth/registrierung'
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
    // Ohne bestätigten zweiten Faktor darf niemand Passwort/E-Mail ändern (sonst könnte jemand mit nur dem Passwort den echten Inhaber aussperren)
    update: (args) => !(args.req.user as { _zweiFaktorOffen?: boolean } | null)?._zweiFaktorOffen && isAdminOrSelf(args),
    // Gesperrte Konten (zu viele Fehlversuche) entsperren nur Admins
    unlock: isAdmin,
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
    // Anmelde-Cookie: nur über HTTPS (Live-Website), nicht für fremde Seiten
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
    lockTime: 10 * 60 * 1000, // 10 Minuten Sperre nach 5 Fehlversuchen
    // Läuft vor dem Standard-Token-Check: ohne bestätigten zweiten Faktor gelten keine Rollen
    strategies: [zweiFaktorStrategie],
  },
  endpoints: [...zweiFaktorEndpunkte, ...testkontenEndpunkte, ...registrierungEndpunkte],
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
    {
      name: 'profilbild',
      label: 'Profilfoto',
      type: 'upload',
      relationTo: 'profilbilder',
      // Setzt das Mitglied selbst im Mitgliederbereich (Hochladen trägt es automatisch ein)
      access: { create: isAdminField, update: isAdminField },
      admin: { position: 'sidebar', description: 'Lädt das Mitglied selbst im Mitgliederbereich hoch. Sichtbar für das Mitglied, Admin/Kasse und die Übungsleitung seiner Kurse.' },
    },
    {
      name: 'freigegeben',
      label: 'Freigegeben',
      type: 'checkbox',
      defaultValue: true,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Ohne Haken: selbst registriert, wartet auf Freigabe – sieht noch keinen Mitgliederbereich. Freigeben geht auch unter „Registrierungen“.',
      },
    },
    {
      name: 'registriertUeber',
      label: 'Registriert über',
      type: 'select',
      options: [
        { label: 'Von der Verwaltung angelegt', value: 'verwaltung' },
        { label: 'Selbst registriert (E-Mail)', value: 'email' },
        { label: 'Selbst registriert (Google)', value: 'google' },
      ],
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, condition: (d) => Boolean(d?.registriertUeber) },
    },
    // Verknüpfung mit dem Google-Konto (nie über die Schnittstelle sichtbar)
    { name: 'googleId', type: 'text', index: true, access: { read: () => false, create: () => false, update: () => false }, admin: { hidden: true } },
    ...zweiFaktorFelder,
    testkontoFeld,
    {
      name: 'letzteAnmeldung',
      label: 'Zuletzt angemeldet',
      type: 'date',
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, date: { displayFormat: 'dd.MM.yyyy HH:mm' }, description: 'Wird bei jeder Anmeldung automatisch gesetzt.' },
    },
  ],
  hooks: {
    // Testkonten (ohne Zwei-Faktor) nur auf dem lokalen Server
    beforeLogin: [
      ({ user, req }) => {
        if ((user as { testkonto?: boolean }).testkonto && !testkontenErlaubt(req?.headers)) throw new APIError('Testkonten gehen nur lokal auf dem eigenen PC (nicht über einen Tunnel oder die Live-Website).', 403)
        return user
      },
    ],
    // Letzte Anmeldung merken (für „Alte Zugänge“ in der Rollen-Übersicht)
    afterLogin: [
      async ({ req, user }) => {
        await req.payload
          .update({ collection: 'users', id: user.id, data: { letzteAnmeldung: new Date().toISOString() } as never, overrideAccess: true, context: { zweiFaktorIntern: true }, req })
          .catch(() => {})
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
    beforeDelete: [
      webadminLoeschSchutz,
      // Konto wird gelöscht → Profilfoto mit löschen (vorher, solange die Verknüpfung noch besteht)
      async ({ id, req }) => {
        await req.payload.delete({ collection: 'profilbilder', where: { besitzer: { equals: id } }, overrideAccess: true, req }).catch(() => {})
      },
    ],
  },
  timestamps: true,
}

export const isStaffUser = (user: unknown) =>
  hasRole(user as never, 'admin', 'redaktion', 'kasse', 'uebungsleitung', 'teamredaktion')
