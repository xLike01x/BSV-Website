import { datumUhrzeit } from '@/fields/datumUhrzeit'
import { berlinTag } from '@/bsv/wiederholung'
import { hinweisFeld } from '@/fields/hinweise'
import { ausblendenAusserMit, bereichFeld, imBereich, rolleOderRecht } from '@/access/roles'
import type { Access, CollectionConfig, PayloadRequest } from 'payload'

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
    create: rolleOderRecht('termine', 'admin', 'redaktion'),
    update: rolleOderRecht('termine', 'admin', 'redaktion'),
    delete: rolleOderRecht('termine', 'admin', 'redaktion'),
  },
  admin: {
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Veranstaltungen für den Vereinskalender auf der Seite „Termine“.',
    group: 'Inhalte',
    hidden: ausblendenAusserMit('termine', 'admin', 'redaktion'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'beginn', 'bereich', 'nurMitglieder', 'countdown'],
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
        { name: 'beginn', label: 'Beginn', type: 'date', required: true, admin: { date: datumUhrzeit } },
        { name: 'ende', label: 'Ende', type: 'date', admin: { description: 'Optional.', date: datumUhrzeit } },
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
    // Zu-/Absage im Mitgliederbereich (Antworten: Sammlung „termin-rueckmeldungen“, Liste unten im Termin)
    {
      name: 'anmeldung',
      label: 'Zu-/Absage im Mitgliederbereich',
      type: 'checkbox',
      admin: { description: 'Angemeldete Mitglieder sagen unter „Mein BSV“ zu oder ab. Die Liste erscheint unten in diesem Termin.' },
      validate: (wert: unknown, { siblingData }: { siblingData?: { wiederholung?: string | null } }) =>
        wert && siblingData?.wiederholung && siblingData.wiederholung !== 'keine' ? 'Zu-/Absage geht nur bei Terminen, die sich nicht wiederholen.' : true,
    },
    {
      type: 'row',
      admin: { condition: (d) => Boolean(d?.anmeldung) },
      fields: [
        {
          name: 'anmeldeschluss',
          label: 'Anmeldeschluss (optional)',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' }, description: 'Bis einschließlich diesem Tag änderbar. Leer = bis zum Beginn.' },
          validate: (wert: unknown, { siblingData }: { siblingData?: { beginn?: string } }) => {
            if (!wert || !siblingData?.beginn) return true
            return berlinTag(String(wert)) > berlinTag(siblingData.beginn) ? 'Der Anmeldeschluss liegt nach dem Termin.' : true
          },
        },
        {
          name: 'begleitung',
          label: 'Begleitperson erlaubt (bis 2 Personen)',
          type: 'checkbox',
          admin: { width: '50%', description: 'Dann wählen Mitglieder „1 Person“ oder „2 Personen“, z. B. mit Partnerin oder Partner.' },
        },
      ],
    },
    { name: 'rueckmeldungen', type: 'ui', admin: { condition: (d) => Boolean(d?.anmeldung), components: { Field: '@/components/Admin/Rueckmeldungen' } } },
    // Countdown auf der Startseite – gleiche Berechtigung wie früher unter „Texte & Bilder“ (Bereich Seiten),
    // damit ein reines Termine-Recht nicht die Startseite gestaltet. Die Startseite fragt ohne Anmeldung ab:
    // „nur für Mitglieder“ erscheint dort nie, auch wenn der Haken gesetzt ist.
    {
      name: 'countdown',
      label: 'Countdown auf der Startseite',
      type: 'checkbox',
      access: { create: bereichFeld('seiten'), update: bereichFeld('seiten') },
      admin: {
        position: 'sidebar',
        description: 'Zählt auf der Startseite bis zum Beginn herunter („Noch 12 Tage …“) und verschwindet nach dem Termin von selbst. Haben mehrere Termine den Haken, kommt der nächste dran.',
      },
      validate: (wert: unknown, { siblingData, req }: { siblingData?: { nurMitglieder?: boolean | null }; req: PayloadRequest }) => {
        if (!wert || !siblingData?.nurMitglieder) return true
        // Wer den Haken nicht ändern darf, soll den Termin trotzdem speichern können (er erscheint ohnehin nicht)
        if (!imBereich(req.user, 'seiten')) return true
        return 'Termine „nur für Mitglieder“ erscheinen nicht auf der Startseite. Bitte den Haken „Countdown“ entfernen oder „Nur für Mitglieder sichtbar“ ausschalten.'
      },
    },
    {
      name: 'countdownSeite',
      label: 'Countdown-Button führt zu (optional)',
      type: 'relationship',
      relationTo: 'pages',
      filterOptions: () => ({ _status: { equals: 'published' } }),
      access: { create: bereichFeld('seiten'), update: bereichFeld('seiten') },
      admin: {
        position: 'sidebar',
        allowCreate: false,
        condition: (data) => Boolean(data?.countdown),
        description: 'Eigene Seite, z. B. „Weihnachtsfeier 2026“. Leer = zu diesem Termin im Kalender.',
      },
    },
    {
      name: 'countdownText',
      label: 'Countdown-Text (optional)',
      type: 'textarea',
      maxLength: 200,
      access: { create: bereichFeld('seiten'), update: bereichFeld('seiten') },
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.countdown),
        description: 'z. B. „Essen und Getränke inklusive“. Leer = Ort des Termins.',
      },
    },
  ],
}

export const canSeeAllTermine = (user: unknown) => hasRole(user as never, 'admin', 'redaktion')
