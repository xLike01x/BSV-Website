import type { ArrayField, Field, GlobalConfig } from 'payload'

import { ausblendenAusser, isEditor } from '@/access/roles'
import { revalidateAllesGlobal } from '@/hooks/revalidateAlles'

/** Ein Menüeintrag: entweder eine Seite aus „Seiten“ oder eine eigene Adresse. */
const eintrag: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'label', label: 'Text im Menü', type: 'text', required: true, admin: { width: '50%' } },
      {
        name: 'ziel',
        label: 'Ziel',
        type: 'radio',
        defaultValue: 'seite',
        options: [
          { label: 'Seite aus „Seiten“', value: 'seite' },
          { label: 'Eigene Adresse', value: 'adresse' },
        ],
        admin: { layout: 'horizontal', width: '50%' },
      },
    ],
  },
  {
    name: 'seite',
    label: 'Seite',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      condition: (_, s) => s?.ziel !== 'adresse',
      description: 'Die Seite muss veröffentlicht sein, sonst führt der Link ins Leere.',
    },
    validate: (wert: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
      siblingData?.ziel === 'adresse' || wert ? true : 'Bitte eine Seite auswählen.',
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
          description: 'Interne Seiten mit „/“ beginnen, externe mit „https://“.',
          width: '70%',
        },
        validate: (wert: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
          if (siblingData?.ziel !== 'adresse') return true
          const v = String(wert ?? '').trim()
          return v.startsWith('/') || v.startsWith('https://') || v.startsWith('http://') || v.startsWith('mailto:')
            ? true
            : 'Bitte mit „/“ oder „https://“ beginnen.'
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
]

const liste = (name: string, label: string, description: string, maxRows: number): ArrayField => ({
  name,
  label,
  type: 'array',
  maxRows,
  labels: { singular: 'Eintrag', plural: 'Einträge' },
  admin: { description, initCollapsed: true, components: { RowLabel: '@/Menue/RowLabel' } },
  fields: eintrag,
})

/**
 * Hauptmenü der Website. „Fußball“ und „Breitensport“ füllen sich automatisch aus Teams & Kursen;
 * hier pflegt die Redaktion die übrigen Links – ohne Code.
 */
export const Menue: GlobalConfig = {
  slug: 'menue',
  label: 'Menü',
  admin: {
    group: 'Inhalte',
    hidden: ausblendenAusser('admin', 'redaktion'),
    description:
      'Links im Hauptmenü oben. „Fußball“ und „Breitensport“ füllen sich automatisch aus „Teams & Kurse“. Eine leere Liste zeigt das Standardmenü.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    liste('links', 'Links in der Menüleiste', 'Erscheinen rechts neben „Verein“ – am besten höchstens 5, sonst wird es eng.', 6),
    {
      type: 'collapsible',
      label: 'Aufklappmenü „Verein“',
      fields: [
        liste('vereinUeberUns', 'Spalte „Über uns“', 'Linke Spalte im Aufklappmenü „Verein“.', 10),
        liste('vereinMehr', 'Spalte „Mehr“', 'Rechte Spalte im Aufklappmenü „Verein“.', 10),
      ],
    },
  ],
  hooks: { afterChange: [revalidateAllesGlobal] },
}
