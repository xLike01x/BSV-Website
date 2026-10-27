import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/roles'
import { posteingangEndpunkte } from '@/posteingang/endpunkte'
import { posteingangFelder, statusImVerlauf, zustaendigNameSetzen } from '@/posteingang/felder'

import { kuendigungEndpunkte } from './endpunkte'
import { kuendigungBearbeiter } from './Kuendigungsdokumente'
import { STATUS_LABEL } from './texte'

const nieAendern = { update: () => false, create: () => false }
const tag = { date: { pickerAppearance: 'dayOnly' as const, displayFormat: 'dd.MM.yyyy' } }

/**
 * Kündigungen aus dem Mitgliederbereich (Satzung: wirksam zum Ende des Quartals, in dem sie eingeht).
 * - Einreichen nur über POST /api/kuendigungen/einreichen (eigenes Konto, eigene Mitgliedschaften, Datei geprüft).
 * - Bearbeiten (Posteingang): Kasse/Admin oder Zusatzrecht „Mitgliedsanträge bearbeiten“ – über die Knöpfe
 *   „Bestätigen · Rückfrage · Ablehnen · Im DFBnet ausgetragen“ (POST /api/kuendigungen/:id/entscheidung).
 * - Bestätigen setzt „Gültig bis“ der Mitgliedschaft aufs Quartalsende; danach beendet die tägliche Aufgabe die Mitgliedschaft.
 * - Mitglieder lesen ihre Kündigungen nicht über die Schnittstelle – der Mitgliederbereich holt sie auf dem Server.
 */
export const Kuendigungen: CollectionConfig = {
  slug: 'kuendigungen',
  labels: { singular: 'Kündigung', plural: 'Kündigungen' },
  access: {
    read: ({ req }) => kuendigungBearbeiter(req.user),
    create: () => false,
    update: ({ req }) => kuendigungBearbeiter(req.user),
    delete: ({ req }) => hasRole(req.user as never, 'admin', 'kasse'),
  },
  admin: {
    group: 'Posteingang',
    hidden: ({ user }) => !kuendigungBearbeiter(user),
    useAsTitle: 'namen',
    defaultColumns: ['namen', 'wirksamZum', 'status', 'zustaendig', 'eingangAm'],
    description:
      'Kündigungen aus dem Mitgliederbereich mit unterschriebenem Schreiben. Wirksam zum Ende des Quartals, in dem sie eingegangen sind. Prüfen → „Bestätigen“ setzt das Austrittsdatum, danach im DFBnet austragen und „Im DFBnet ausgetragen“ klicken.',
    components: {
      beforeList: [
        '@/components/Admin/Einstieg',
        {
          path: '@/components/Admin/StatusReiter',
          serverProps: {
            sammlung: 'kuendigungen',
            reiter: [
              { key: 'neu', titel: 'Neu', symbol: '🆕', status: ['neu'], hervorheben: true },
              { key: 'rueckfrage', titel: 'Rückfrage', symbol: '⏳', status: ['rueckfrage'] },
              { key: 'dfbnet', titel: 'Im DFBnet austragen', symbol: '📋', status: ['bestaetigt'] },
              {
                key: 'erledigt',
                titel: 'Erledigt',
                symbol: '✓',
                status: ['erledigt', 'abgelehnt', 'zurueckgezogen'],
              },
              { key: 'alle', titel: 'Alle', symbol: '🗂️', status: null },
            ],
          },
        },
      ],
    },
  },
  defaultSort: '-eingangAm',
  endpoints: [...kuendigungEndpunkte, ...posteingangEndpunkte('kuendigungen')],
  hooks: {
    beforeChange: [zustaendigNameSetzen, statusImVerlauf(STATUS_LABEL)],
    // Mit der Kündigung auch das unterschriebene Schreiben löschen (Datenschutz-Frist, Löschen von Hand)
    afterDelete: [
      async ({ doc, req }) => {
        const dok =
          doc?.dokument && typeof doc.dokument === 'object' ? doc.dokument.id : doc?.dokument
        if (dok)
          await req.payload
            .delete({ collection: 'kuendigungsdokumente', id: dok, overrideAccess: true, req })
            .catch(() => null)
      },
    ],
  },
  fields: [
    ...posteingangFelder(),
    // Prüfhilfe mit Knöpfen „Bestätigen · Rückfrage · Ablehnen · Im DFBnet ausgetragen“
    { name: 'pruefung', type: 'ui', admin: { components: { Field: '@/kuendigungen/Pruefung' } } },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      index: true,
      defaultValue: 'neu',
      options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
      // Nur über die Knöpfe (Endpunkt) – der prüft die erlaubten Übergänge und setzt das Austrittsdatum
      access: { create: () => false, update: ({ req }) => req.context?.bsvPosteingang === true },
      admin: {
        position: 'sidebar',
        readOnly: true,
        components: {
          Cell: {
            path: '@/components/Admin/StatusReiter/Pille',
            clientProps: {
              farben: {
                neu: { text: '🆕 Eingegangen', klasse: 'neu' },
                rueckfrage: { text: '⏳ Rückfrage', klasse: 'warten' },
                bestaetigt: { text: '📋 Im DFBnet austragen', klasse: 'warten' },
                erledigt: { text: '✓ Erledigt', klasse: 'ok' },
                abgelehnt: { text: 'Abgelehnt', klasse: 'aus' },
                zurueckgezogen: { text: 'Zurückgezogen', klasse: 'aus' },
              },
            },
          },
        },
      },
    },
    {
      name: 'namen',
      label: 'Gekündigt für',
      type: 'text',
      access: nieAendern,
      admin: {
        readOnly: true,
        description: 'Name(n) und Mitgliedsnummer(n) zum Zeitpunkt der Kündigung.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eingangAm',
          label: 'Eingegangen am',
          type: 'date',
          index: true,
          access: nieAendern,
          admin: { readOnly: true, width: '50%', date: { displayFormat: 'dd.MM.yyyy, HH:mm' } },
        },
        {
          name: 'wirksamZum',
          label: 'Wirksam zum (Quartalsende)',
          type: 'date',
          index: true,
          access: nieAendern,
          admin: { readOnly: true, width: '50%', ...tag },
        },
      ],
    },
    {
      name: 'mitgliedschaften',
      label: 'Mitgliedschaften',
      type: 'relationship',
      relationTo: 'mitgliedschaften',
      hasMany: true,
      index: true,
      access: nieAendern,
      admin: { readOnly: true },
    },
    {
      name: 'dokument',
      label: 'Unterschriebenes Schreiben',
      type: 'upload',
      relationTo: 'kuendigungsdokumente',
      access: nieAendern,
      admin: { readOnly: true },
    },
    {
      name: 'grund',
      label: 'Grund (freiwillig)',
      type: 'textarea',
      maxLength: 500,
      access: nieAendern,
      admin: { readOnly: true, condition: (d) => Boolean(d?.grund) },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'konto',
          label: 'Eingereicht von (Konto)',
          type: 'relationship',
          relationTo: 'users',
          index: true,
          access: nieAendern,
          admin: { readOnly: true, hidden: true },
        },
        {
          name: 'email',
          label: 'Eingereicht von (E-Mail des Kontos)',
          type: 'email',
          access: nieAendern,
          admin: { readOnly: true, description: 'Antworten gehen an diese Adresse.' },
        },
      ],
    },
    {
      name: 'vorname',
      label: 'Vorname (Anrede)',
      type: 'text',
      access: nieAendern,
      admin: { hidden: true },
    },
    {
      name: 'bestaetigtAm',
      label: 'Bestätigt am',
      type: 'date',
      access: { create: () => false, update: ({ req }) => req.context?.bsvPosteingang === true },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (d) => Boolean(d?.bestaetigtAm),
        date: { displayFormat: 'dd.MM.yyyy, HH:mm' },
      },
    },
    {
      name: 'wirksamGeworden',
      label: 'Mitgliedschaft beendet',
      type: 'checkbox',
      defaultValue: false,
      access: nieAendern,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Wird am Tag nach dem Quartalsende automatisch gesetzt.',
      },
    },
  ],
  timestamps: true,
}
