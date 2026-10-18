import type { ArrayField, Field, GlobalConfig } from 'payload'

import { ausblendenAusser, isEditor } from '@/access/roles'
import { revalidateAllesGlobal } from '@/hooks/revalidateAlles'

import { STANDARD_FUSSZEILE, STANDARD_HAUPTMENUE, STANDARD_VEREIN_MEHR, STANDARD_VEREIN_UEBER_UNS } from './standard'

/** Ein Menüeintrag: Seite aus „Seiten“, eigene Adresse – oder (nur Hauptmenü) eines der Aufklappmenüs. */
const eintrag = (mitAufklapp: boolean): Field[] => [
  {
    type: 'row',
    fields: [
      { name: 'label', label: 'Text im Menü', type: 'text', required: true, admin: { width: '40%' } },
      {
        name: 'ziel',
        label: 'Was soll der Eintrag tun?',
        type: 'radio',
        defaultValue: 'seite',
        options: [
          { label: 'Seite aus „Seiten“ öffnen', value: 'seite' },
          { label: 'Adresse öffnen', value: 'adresse' },
          ...(mitAufklapp ? [{ label: 'Aufklappmenü zeigen', value: 'aufklapp' }] : []),
        ],
        admin: { layout: 'horizontal', width: '60%' },
      },
    ],
  },
  {
    name: 'seite',
    label: 'Seite',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      condition: (_, s) => !s?.ziel || s?.ziel === 'seite',
      description: 'Die Seite muss veröffentlicht sein, sonst führt der Link ins Leere.',
    },
    validate: (wert: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
      siblingData?.ziel && siblingData.ziel !== 'seite' ? true : wert ? true : 'Bitte eine Seite auswählen.',
  },
  {
    type: 'row',
    fields: [
      {
        name: 'adresse',
        label: 'Adresse',
        type: 'text',
        admin: {
          condition: (_, s) => s?.ziel === 'adresse',
          placeholder: '/termine oder https://…',
          description: 'Interne Seiten mit „/“ beginnen (z. B. /news, /termine, /kontakt), externe mit „https://“.',
          width: '70%',
        },
        validate: (wert: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
          if (siblingData?.ziel !== 'adresse') return true
          const v = String(wert ?? '').trim()
          return /^(\/|https?:\/\/|mailto:)/.test(v) ? true : 'Bitte mit „/“ oder „https://“ beginnen.'
        },
      },
      {
        name: 'neuerTab',
        label: 'In neuem Tab öffnen',
        type: 'checkbox',
        admin: { condition: (_, s) => s?.ziel === 'adresse', width: '30%', style: { alignSelf: 'flex-end' } },
      },
    ],
  },
  ...(mitAufklapp
    ? ([
        {
          name: 'aufklapp',
          label: 'Welches Aufklappmenü?',
          type: 'select',
          defaultValue: 'fussball',
          options: [
            { label: 'Fußball (füllt sich automatisch aus „Teams & Kurse“)', value: 'fussball' },
            { label: 'Breitensport (füllt sich automatisch aus „Teams & Kurse“)', value: 'breitensport' },
            { label: 'Verein (Inhalt unten bei „Aufklappmenü Verein“)', value: 'verein' },
          ],
          admin: { condition: (_, s) => s?.ziel === 'aufklapp' },
        },
      ] as Field[])
    : []),
]

const liste = (name: string, label: string, description: string, maxRows: number, defaultValue: unknown[], mitAufklapp = false): ArrayField => ({
  name,
  label,
  type: 'array',
  maxRows,
  defaultValue,
  labels: { singular: 'Eintrag', plural: 'Einträge' },
  admin: { description, initCollapsed: true, components: { RowLabel: '@/Menue/RowLabel' } },
  fields: eintrag(mitAufklapp),
})

/**
 * Menü und Fußzeile der Website – komplett ohne Code pflegbar.
 * „Fußball“ und „Breitensport“ füllen sich automatisch aus Teams & Kursen.
 */
export const Menue: GlobalConfig = {
  slug: 'menue',
  label: 'Menü & Fußzeile',
  admin: {
    group: 'Inhalte',
    hidden: ausblendenAusser('admin', 'redaktion'),
    description:
      'Alle Einträge oben im Menü und unten in der Fußzeile. Reihenfolge ändern: am Griff links ziehen. Entfernen: drei Punkte rechts → „Entfernen“.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hauptmenü oben',
          description: 'Die Einträge in der Menüleiste – in genau dieser Reihenfolge.',
          fields: [
            liste(
              'links',
              'Einträge in der Menüleiste',
              'Von links nach rechts. Am besten höchstens 8, sonst wird es eng. Eine leere Liste zeigt das Standardmenü.',
              10,
              STANDARD_HAUPTMENUE,
              true,
            ),
          ],
        },
        {
          label: 'Aufklappmenü „Verein“',
          description: 'Was erscheint, wenn man über „Verein“ fährt.',
          fields: [
            liste('vereinUeberUns', 'Linke Spalte („Über uns“)', 'Eine leere Liste zeigt die Standard-Links.', 10, STANDARD_VEREIN_UEBER_UNS),
            liste('vereinMehr', 'Rechte Spalte („Mehr“)', 'Eine leere Liste zeigt die Standard-Links.', 10, STANDARD_VEREIN_MEHR),
          ],
        },
        {
          label: 'Fußzeile unten',
          description: 'Die Spalten mit Links ganz unten auf jeder Seite. Die Kontakt-Spalte kommt aus den Vereinsdaten.',
          fields: [
            {
              name: 'fusszeile',
              label: 'Spalten der Fußzeile',
              type: 'array',
              maxRows: 5,
              defaultValue: STANDARD_FUSSZEILE,
              labels: { singular: 'Spalte', plural: 'Spalten' },
              admin: { initCollapsed: true, description: 'Eine leere Liste zeigt die Standard-Fußzeile.', components: { RowLabel: '@/Menue/SpaltenLabel' } },
              fields: [
                { name: 'titel', label: 'Überschrift der Spalte', type: 'text', required: true },
                {
                  name: 'eintraege',
                  label: 'Links',
                  type: 'array',
                  maxRows: 10,
                  labels: { singular: 'Link', plural: 'Links' },
                  admin: { initCollapsed: true, components: { RowLabel: '@/Menue/RowLabel' } },
                  fields: eintrag(false),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    // Leere Listen zeigen den Standard – auch in der Verwaltung, damit man ihn direkt bearbeiten kann
    afterRead: [
      ({ doc }) => {
        const leer = (v: unknown) => !Array.isArray(v) || v.length === 0
        if (leer(doc.links)) doc.links = STANDARD_HAUPTMENUE
        if (leer(doc.vereinUeberUns)) doc.vereinUeberUns = STANDARD_VEREIN_UEBER_UNS
        if (leer(doc.vereinMehr)) doc.vereinMehr = STANDARD_VEREIN_MEHR
        if (leer(doc.fusszeile)) doc.fusszeile = STANDARD_FUSSZEILE
        return doc
      },
    ],
    afterChange: [revalidateAllesGlobal],
  },
}
