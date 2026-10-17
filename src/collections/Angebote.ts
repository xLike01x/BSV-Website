import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { canEditAngebot, isEditor } from '../access/roles'
import { slugFromTitle } from '../hooks/slugFromTitle'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '../hooks/revalidateAlles'

/**
 * Teams (Fußball) und Kurse (Breitensport) in einer Sammlung.
 * Ein neues Angebot erscheint automatisch im Menü, im Angebotsfinder
 * und im Anmeldeformular.
 */
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
    group: 'Sport',
    useAsTitle: 'title',
    defaultColumns: ['title', 'bereich', 'kategorie', 'alterText'],
    listSearchableFields: ['title'],
  },
  hooks: { beforeValidate: [slugFromTitle], afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    { name: 'title', label: 'Name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'bereich',
          label: 'Bereich',
          type: 'select',
          required: true,
          options: [
            { label: 'Fußball', value: 'fussball' },
            { label: 'BSV Kids', value: 'kids' },
            { label: 'Erwachsene & Senioren', value: 'erwachsene' },
          ],
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
          admin: { condition: (data) => data?.bereich === 'fussball' },
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
        { name: 'alterText', label: 'Alter (Anzeige)', type: 'text', admin: { placeholder: 'z. B. 3–6 Jahre' } },
        { name: 'alterVon', label: 'Alter von', type: 'number', min: 0, max: 99 },
        { name: 'alterBis', label: 'Alter bis', type: 'number', min: 0, max: 99 },
      ],
    },
    { name: 'kurzbeschreibung', label: 'Kurzbeschreibung', type: 'textarea', maxLength: 240 },
    { name: 'beschreibung', label: 'Beschreibung', type: 'richText' },
    { name: 'bild', label: 'Titelbild', type: 'upload', relationTo: 'media' },
    {
      name: 'zeiten',
      label: 'Trainingszeiten',
      type: 'array',
      labels: { singular: 'Termin', plural: 'Termine' },
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
    {
      name: 'leitung',
      label: 'Leitung (Benutzerkonten)',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: { description: 'Diese Personen dürfen das Angebot selbst bearbeiten und Ausfälle melden.' },
    },
    {
      name: 'team',
      label: 'Trainer- und Betreuerteam (Anzeige)',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'rolle', label: 'Rolle', type: 'text', admin: { placeholder: 'Trainer, Übungsleitung …' } },
          ],
        },
        { name: 'foto', label: 'Foto', type: 'upload', relationTo: 'media' },
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
        { name: 'fupaWidgetId', label: 'FuPa-Widget-ID (Kader)', type: 'text' },
        { name: 'fussballDeTeamId', label: 'FUSSBALL.DE Team-ID (Spielplan/Tabelle)', type: 'text' },
      ],
    },
    { name: 'reihenfolge', label: 'Reihenfolge', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
    { name: 'aktiv', label: 'Aktiv (öffentlich sichtbar)', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    slugField({ position: 'sidebar' }),
  ],
}
