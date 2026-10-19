import { hinweisFeld } from '@/fields/hinweise'
import { ausblendenAusser } from '@/access/roles'
import type { Access, CollectionConfig } from 'payload'

import { hasRole, isEditor, istMitgliedOderMehr } from '../access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '../hooks/revalidateAlles'

/** Öffentliche Termine für alle, Mitgliedertermine nur nach Login. */
const readTermine: Access = ({ req }) => {
  if (istMitgliedOderMehr(req.user)) return true
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
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Veranstaltungen für den Vereinskalender auf der Seite „Termine“.',
    group: 'Inhalte',
    hidden: ausblendenAusser('admin', 'redaktion'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'beginn', 'bereich', 'nurMitglieder'],
  },
  defaultSort: 'beginn',
  hooks: { afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    // Übernimmt Vorlagen aus dem Einstiegs-Kasten in „Neu erstellen“ (speichert nichts)
    { name: 'vorlage', type: 'ui', admin: { components: { Field: '@/components/Admin/Einstieg/VorlageUebernehmen' } } },
    hinweisFeld('TerminHinweise', false),
    { name: 'title', label: 'Titel', type: 'text', required: true, admin: { description: 'Name der Veranstaltung, z. B. „Sommerfest“.' } },
    {
      type: 'row',
      fields: [
        { name: 'beginn', label: 'Beginn', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } } },
        { name: 'ende', label: 'Ende', type: 'date', admin: { description: 'Optional.', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' } } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'wiederholung',
          label: 'Wiederholen',
          type: 'select',
          defaultValue: 'keine',
          options: [
            { label: 'Nicht wiederholen', value: 'keine' },
            { label: 'Jede Woche', value: 'woechentlich' },
            { label: 'Alle 2 Wochen', value: 'zweiwoechentlich' },
            { label: 'Jeden Monat (gleicher Tag)', value: 'monatlich' },
          ],
          admin: { width: '50%', description: 'Einmal anlegen statt mehrfach. Auf der Website erscheint jeder Termin einzeln.' },
        },
        {
          name: 'wiederholungBis',
          label: 'Wiederholen bis einschließlich',
          type: 'date',
          admin: { width: '50%', condition: (d) => Boolean(d?.wiederholung) && d?.wiederholung !== 'keine', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' }, description: 'Höchstens 2 Jahre. Monatlich am 29.–31.: in kürzeren Monaten entfällt der Termin.' },
          validate: (wert: unknown, { siblingData }: { siblingData?: { wiederholung?: string; beginn?: string } }) => {
            if (!siblingData?.wiederholung || siblingData.wiederholung === 'keine') return true
            if (!wert) return 'Bitte angeben, bis wann der Termin wiederholt wird.'
            const bis = new Date(String(wert)).getTime()
            const start = siblingData.beginn ? new Date(siblingData.beginn).getTime() : Date.now()
            if (bis < start) return 'Das Ende der Wiederholung liegt vor dem ersten Termin.'
            if (bis - start > 731 * 86400000) return 'Bitte höchstens 2 Jahre im Voraus.'
            return true
          },
        },
      ],
    },
    {
      name: 'auslassen',
      label: 'Einzelne Termine auslassen',
      labels: { singular: 'Datum', plural: 'Daten' },
      type: 'array',
      admin: { condition: (d) => Boolean(d?.wiederholung) && d?.wiederholung !== 'keine', initCollapsed: false, description: 'Z. B. Ferien oder Feiertage – an diesen Tagen findet der Termin nicht statt.' },
      fields: [{ name: 'datum', label: 'Datum', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } }],
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
      admin: { description: 'Bestimmt die Farbe im Kalender.' },
    },
    { name: 'beschreibung', label: 'Beschreibung', type: 'textarea' },
    { name: 'nurMitglieder', label: 'Nur für Mitglieder sichtbar', type: 'checkbox', admin: { description: 'Dann sehen den Termin nur angemeldete Mitglieder.' } },
    { name: 'anmeldung', label: 'Anmeldung im Mitgliederbereich möglich', type: 'checkbox' },
  ],
}

export const canSeeAllTermine = (user: unknown) => hasRole(user as never, 'admin', 'redaktion')
