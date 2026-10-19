import type { CollectionConfig, Where } from 'payload'

import { hasRole, isFinance, istMitgliedOderMehr } from '@/access/roles'
import { darf, rechteLaden } from '@/access/rollenRechte'

export const MITGLIEDSART: Record<string, string> = {
  jugend: 'Einzelmitgliedschaft · Jugend',
  aktiv: 'Einzelmitgliedschaft · aktiv',
  passiv: 'Einzelmitgliedschaft · passiv',
  familie: 'Familienmitgliedschaft',
}

/**
 * Mitgliedsdaten für den digitalen Ausweis. Pflegt die Kasse (oder entsteht automatisch,
 * wenn ein Online-Mitgliedsantrag auf „Aufgenommen“ gesetzt wird).
 * Der Ausweis erscheint im Mitgliederbereich des Kontos mit derselben E-Mail –
 * bei Kindern die E-Mail der Eltern, dann sehen sie alle Ausweise der Familie.
 */
export const Mitgliedschaften: CollectionConfig = {
  slug: 'mitgliedschaften',
  labels: { singular: 'Mitgliedschaft', plural: 'Mitgliedschaften' },
  access: {
    read: async ({ req }) => {
      const user = req.user as { email?: string; roles?: string[] } | null
      if (!user || !istMitgliedOderMehr(user)) return false
      if ((user.roles ?? []).some((r) => r === 'admin' || r === 'kasse')) return true
      await rechteLaden(req.payload)
      if (darf(user, 'passwesen', 'mitgliedschaften')) return true
      // Nur über die feste Verknüpfung mit dem Konto – nicht über die E-Mail (die ist nicht bestätigt)
      return { and: [{ konto: { equals: (user as { id?: number }).id } }, { deletedAt: { exists: false } }] } as Where
    },
    create: isFinance,
    update: isFinance,
    delete: isFinance,
  },
  admin: {
    group: 'Mitglieder',
    hidden: ({ user }) => !(hasRole(user as never, 'admin', 'kasse') || darf(user, 'passwesen', 'mitgliedschaften')),
    useAsTitle: 'anzeigeName',
    defaultColumns: ['anzeigeName', 'mitgliedsnummer', 'art', 'eintritt', 'konto', 'aktiv'],
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Die Daten für den digitalen Mitgliedsausweis. Neue Einträge entstehen automatisch, wenn ein Mitgliedsantrag auf „Aufgenommen“ gesetzt wird – Mitgliedsnummer dann nur noch ergänzen. Sichtbar wird der Ausweis im verknüpften Benutzerkonto.',
  },
  defaultSort: 'nachname',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase()
        data.anzeigeName = [data.vorname, data.nachname].filter(Boolean).join(' ').trim()
        return data
      },
    ],
  },
  fields: [
    { name: 'anzeigeName', label: 'Name', type: 'text', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'vorname', label: 'Vorname', type: 'text', required: true, maxLength: 80 },
        { name: 'nachname', label: 'Nachname', type: 'text', required: true, maxLength: 80 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'mitgliedsnummer', label: 'Mitgliedsnummer', type: 'text', index: true, maxLength: 40, admin: { description: 'Z. B. aus dem DFBnet oder eurer Mitgliederliste.' } },
        { name: 'eintritt', label: 'Mitglied seit', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'art',
          label: 'Mitgliedschaft',
          type: 'select',
          required: true,
          defaultValue: 'aktiv',
          options: Object.entries(MITGLIEDSART).map(([value, label]) => ({ value, label })),
        },
        { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' }, description: 'Nur zur Unterscheidung, steht nicht auf dem Ausweis.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'konto',
          label: 'Benutzerkonto',
          type: 'relationship',
          relationTo: 'users',
          index: true,
          admin: { width: '50%', description: 'Unter diesem Konto erscheint der Ausweis. Wird bei der Freigabe einer Registrierung mit gleicher E-Mail automatisch verknüpft. Bei Kindern das Konto der Eltern.' },
        },
        {
          name: 'email',
          label: 'E-Mail',
          type: 'email',
          required: true,
          index: true,
          admin: { width: '50%', description: 'Zum Verknüpfen: Registriert sich jemand mit dieser E-Mail und wird freigegeben, wird das Konto hier eingetragen.' },
        },
      ],
    },
    {
      name: 'angebote',
      label: 'Teams & Kurse',
      type: 'relationship',
      relationTo: 'angebote',
      hasMany: true,
      admin: { description: 'Stehen auf dem Ausweis. Leer lassen = die Kurse aus dem Benutzerkonto werden angezeigt.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'aktiv', label: 'Mitgliedschaft gültig', type: 'checkbox', defaultValue: true, admin: { width: '50%' } },
        { name: 'austritt', label: 'Gültig bis (Austritt)', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' }, description: 'Danach zeigt der Ausweis „nicht mehr gültig“.' } },
      ],
    },
    { name: 'antrag', label: 'Aus Mitgliedsantrag', type: 'relationship', relationTo: 'mitgliedsantraege', admin: { readOnly: true, position: 'sidebar' } },
  ],
  timestamps: true,
}

/** Ist die Mitgliedschaft heute gültig? */
export const istGueltig = (m: { aktiv?: boolean | null; austritt?: string | null }) =>
  m.aktiv !== false && (!m.austritt || new Date(m.austritt).getTime() >= new Date().setHours(0, 0, 0, 0))
