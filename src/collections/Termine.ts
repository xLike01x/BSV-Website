import type { Access, CollectionConfig } from 'payload'

import { hasRole, isEditor } from '../access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '../hooks/revalidateAlles'

/** Öffentliche Termine für alle, Mitgliedertermine nur nach Login. */
const readTermine: Access = ({ req }) => {
  if (req.user) return true
  return { nurMitglieder: { not_equals: true } }
}

export const Termine: CollectionConfig = {
  slug: 'termine',
  labels: { singular: 'Termin', plural: 'Termine' },
  access: {
    read: readTermine,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'title',
    defaultColumns: ['title', 'beginn', 'bereich', 'nurMitglieder'],
  },
  defaultSort: 'beginn',
  hooks: { afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    { name: 'title', label: 'Titel', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'beginn', label: 'Beginn', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } } },
        { name: 'ende', label: 'Ende', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } } },
      ],
    },
    { name: 'ort', label: 'Ort', type: 'text', defaultValue: 'Kutscher-Remy-Sportpark, Schützenstraße 25a, 46487 Wesel' },
    {
      name: 'bereich',
      label: 'Bereich',
      type: 'select',
      defaultValue: 'verein',
      options: [
        { label: 'Verein', value: 'verein' },
        { label: 'Fußball', value: 'fussball' },
        { label: 'BSV Kids', value: 'kids' },
        { label: 'Breitensport', value: 'erwachsene' },
      ],
    },
    { name: 'beschreibung', label: 'Beschreibung', type: 'textarea' },
    { name: 'nurMitglieder', label: 'Nur für Mitglieder sichtbar', type: 'checkbox' },
    { name: 'anmeldung', label: 'Anmeldung im Mitgliederbereich möglich', type: 'checkbox' },
  ],
}

export const canSeeAllTermine = (user: unknown) => hasRole(user as never, 'admin', 'redaktion')
