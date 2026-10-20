import { mitEindeutigemSlug } from '@/hooks/slugEindeutig'
import { teilnehmendeEndpunkt } from '@/components/Admin/Teilnehmende/endpunkt'
import { reihenfolgeEndpunkt } from '@/Menue/reihenfolgeEndpunkt'
import { medienPruefen } from '@/hooks/medienPruefen'
import { ausblendenBeiNurEinzelrechten, medienAuswahl } from '@/access/roles'
import { hinweisFeld } from '@/fields/hinweise'
import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { canEditAngebot, isEditor, isEditorField } from '../access/roles'
import { slugFromTitle } from '../hooks/slugFromTitle'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '../hooks/revalidateAlles'

/**
 * Teams (Fußball) und Kurse (Breitensport) in einer Sammlung.
 * Ein neues Angebot erscheint automatisch im Menü, im Angebotsfinder
 * und im Anmeldeformular.
 */
/** Holt die Widget-ID aus dem eingefügten FuPa-Code (oder lässt eine reine ID stehen) */
export const fupaId = (wert: unknown) => {
  const v = String(wert ?? '').trim()
  if (!v) return v
  const treffer = v.match(/fp-widget_root-([A-Za-z0-9_-]+)/)
  return treffer ? treffer[1] : v
}

export const Angebote: CollectionConfig<'angebote'> = {
  slug: 'angebote',
  labels: { singular: 'Angebot', plural: 'Teams & Kurse' },
  access: {
    read: anyone,
    create: isEditor,
    delete: isEditor,
    update: canEditAngebot,
  },
  defaultPopulate: { title: true, slug: true, bereich: true, kategorie: true, alterText: true, bild: true },
  admin: {
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Alle Teams und Kurse. Jedes aktive Angebot erscheint automatisch im Menü, im Angebotsfinder und im Mitgliedsantrag.',
    group: 'Sport',
    hidden: ausblendenBeiNurEinzelrechten,
    useAsTitle: 'title',
    defaultColumns: ['title', 'bereich', 'kategorie', 'alterText'],
    listSearchableFields: ['title'],
  },
  endpoints: [teilnehmendeEndpunkt, reihenfolgeEndpunkt],
  hooks: {
    beforeChange: [medienPruefen], beforeValidate: [slugFromTitle], afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    { name: 'title', label: 'Name', type: 'text', required: true, admin: { description: 'So heißt das Team oder der Kurs überall auf der Website.' } },
    {
      type: 'row',
      fields: [
        {
          name: 'bereich',
          label: 'Bereich',
          type: 'select',
          required: true,
          access: { update: isEditorField },
          options: [
            { label: 'Fußball', value: 'fussball' },
            { label: 'BSV Kids', value: 'kids' },
            { label: 'Erwachsene & Senioren', value: 'erwachsene' },
          ],
          admin: { description: 'Bestimmt, in welchem Menü das Angebot erscheint.' },
        },
        {
          name: 'untergruppe',
          label: 'Gruppe (Fußball)',
          type: 'select',
          options: [
            { label: 'Junioren', value: 'junioren' },
            { label: 'Juniorinnen', value: 'juniorinnen' },
            { label: 'Senioren', value: 'senioren' },
            { label: 'Seniorinnen', value: 'seniorinnen' },
          ],
          admin: { condition: (data) => data?.bereich === 'fussball', description: 'Spalte im Fußball-Menü.' },
        },
        {
          name: 'kategorie',
          label: 'Kategorie',
          type: 'select',
          options: ['Fußball', 'Tanzen', 'Turnen', 'Zirkus', 'Fitness', 'Gesundheit', 'Ausdauer', 'Kampfkunst'].map(
            (k) => ({ label: k, value: k }),
          ),
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'alterText', label: 'Alter (Anzeige)', type: 'text', admin: { placeholder: 'z. B. 3–6 Jahre', description: 'Steht im Menü und auf den Karten.' } },
        { name: 'alterVon', label: 'Alter von', type: 'number', min: 0, max: 99, admin: { description: 'Für den Angebotsfinder.' } },
        { name: 'alterBis', label: 'Alter bis', type: 'number', min: 0, max: 99, admin: { description: 'Für den Angebotsfinder.' } },
      ],
    },
    { name: 'kurzbeschreibung', label: 'Kurzbeschreibung', type: 'textarea', maxLength: 240, admin: { description: 'Ein Satz für Übersichtskarten (höchstens 240 Zeichen).' } },
    { name: 'beschreibung', label: 'Beschreibung', type: 'richText', admin: { description: 'Ausführlicher Text auf der Seite des Teams.' } },
    { name: 'bild', label: 'Titelbild', type: 'upload', relationTo: 'media', filterOptions: medienAuswahl, admin: { description: 'Großes Bild oben auf der Teamseite und auf Karten.' } },
    {
      type: 'collapsible',
      label: 'Hinweis-Banner auf der Teamseite',
      admin: {
        initCollapsed: true,
        description: 'Kurzer Hinweis ganz oben auf der Teamseite, z. B. „Heute in Halle 2“ oder „Ferienpause bis 5. Januar“. Verschwindet nach dem Datum von selbst. Trainer können ihn auch im Mitgliederbereich setzen.',
      },
      fields: [
        { name: 'bannerText', label: 'Hinweis', type: 'text', maxLength: 160, admin: { placeholder: 'z. B. Training heute in Halle 2' } },
        {
          type: 'row',
          fields: [
            { name: 'bannerBis', label: 'Anzeigen bis einschließlich', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' }, description: 'Leer = bis du ihn löschst.' } },
            {
              name: 'bannerArt',
              label: 'Art',
              type: 'radio',
              defaultValue: 'info',
              options: [
                { label: 'ℹ️ Info', value: 'info' },
                { label: '⚠️ Wichtig', value: 'wichtig' },
              ],
              admin: { width: '50%', layout: 'horizontal' },
            },
          ],
        },
      ],
    },
    {
      name: 'zeiten',
      label: 'Trainingszeiten',
      type: 'array',
      labels: { singular: 'Termin', plural: 'Termine' },
      admin: { description: 'Wann und wo trainiert wird – erscheint auf der Teamseite.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'tag',
              label: 'Tag',
              type: 'select',
              options: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((t) => ({
                label: t,
                value: t,
              })),
            },
            { name: 'von', label: 'von', type: 'text', admin: { placeholder: '15:00' } },
            { name: 'bis', label: 'bis', type: 'text', admin: { placeholder: '16:00' } },
            { name: 'ort', label: 'Ort', type: 'text', admin: { placeholder: 'Sporthalle Petristraße' } },
          ],
        },
        { name: 'hinweis', label: 'Hinweis', type: 'text', admin: { placeholder: 'z. B. nur in ungeraden Kalenderwochen' } },
      ],
    },
    // Mitglieder dieses Kurses mit Foto (nur Anzeige)
    { name: 'teilnehmendeAnzeige', type: 'ui', admin: { components: { Field: '@/components/Admin/Teilnehmende' } } },
    {
      name: 'leitung',
      label: 'Verantwortliche (Benutzerkonten)',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      // Wer ein Team betreuen darf, entscheiden Admin/Redaktion – nicht die Trainer selbst
      access: { create: isEditorField, update: isEditorField },
      admin: { description: 'Personen mit Rolle Trainer oder Team-Redaktion, die dieses Team/diesen Kurs pflegen dürfen: Zeiten, Ausfälle, Team-News und Bilder.' },
    },
    {
      name: 'team',
      label: 'Trainer- und Betreuerteam (Anzeige)',
      labels: { singular: 'Person', plural: 'Personen' },
      admin: { description: 'Nur zur Anzeige auf der Teamseite. Wer bearbeiten darf, steht oben bei „Verantwortliche“.' },
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'rolle', label: 'Rolle', type: 'text', admin: { placeholder: 'Trainer, Co-Trainerin, Betreuer …' } },
          ],
        },
        { name: 'foto', label: 'Foto', type: 'upload', relationTo: 'media', filterOptions: medienAuswahl },
      ],
    },
    {
      type: 'collapsible',
      label: 'Kursplätze',
      admin: { initCollapsed: true },
      fields: [
        { name: 'plaetzeBegrenzt', label: 'Plätze begrenzt (Reservierung im Mitgliederbereich)', type: 'checkbox' },
        { name: 'maxPlaetze', label: 'Max. Plätze', type: 'number', admin: { condition: (d) => Boolean(d?.plaetzeBegrenzt) } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Fußball-Widgets',
      admin: { initCollapsed: true, condition: (data) => data?.bereich === 'fussball' },
      fields: [
        { name: 'spielklasse', label: 'Spielklasse', type: 'text' },
        {
          name: 'fupaWidgetId',
          label: 'FuPa-Widget (Kader, Tabelle oder Spielplan)',
          type: 'text',
          admin: {
            description:
              'Bei FuPa im Widget-Builder auf „Speichern“ klicken und den kompletten Code hier einfügen – die Website liest die ID automatisch heraus. Wichtig: Bei FuPa als „URL der Webseite“ die echte Vereinsadresse eintragen; auf dem eigenen PC (localhost) zeigt FuPa das Widget eventuell nicht an.',
          },
          // Aus dem kompletten FuPa-Code nur die ID behalten (z. B. 3Kuku8Auad7WJFmIvEpH7zFzfAK)
          hooks: { beforeValidate: [({ value }) => fupaId(value)] },
          validate: (wert: unknown) => (!wert || /^[A-Za-z0-9_-]{6,80}$/.test(String(wert)) ? true : 'Das sieht nicht nach einem FuPa-Widget aus. Bitte den Code aus dem FuPa-Widget-Builder einfügen.'),
        },
        { name: 'fussballDeTeamId', label: 'FUSSBALL.DE Team-ID (Spielplan/Tabelle)', type: 'text' },
      ],
    },
    hinweisFeld('AngebotHinweise'),
    { name: 'reihenfolge', label: 'Reihenfolge', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Kleinere Zahl = weiter vorne – im Aufklappmenü und auf den Übersichtsseiten. Bequemer: Menü & Fußzeile → Reiter „Aufklappmenü Fußball“ bzw. „Breitensport“ → ziehen.' } },
    { name: 'aktiv', label: 'Aktiv (öffentlich sichtbar)', type: 'checkbox', defaultValue: true, access: { create: isEditorField, update: isEditorField }, admin: { position: 'sidebar', description: 'Ohne Haken ist das Angebot auf der Website ausgeblendet – News und Bilder bleiben erhalten.' } },
    mitEindeutigemSlug(slugField({ position: 'sidebar' }), 'angebote'),
  ],
}
