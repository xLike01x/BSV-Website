import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { ausblendenAusser, isEditor } from '@/access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '@/hooks/revalidateAlles'

/** „Wir suchen“: Ehrenamt, Trainer, Helfer – erscheint auf /mitmachen */
export const Gesuche: CollectionConfig = {
  slug: 'gesuche',
  labels: { singular: 'Gesuch (Ehrenamt)', plural: 'Ehrenamt & Mitmachen' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'titel',
    defaultColumns: ['titel', 'aufwand', 'aktiv'],
    hidden: ausblendenAusser('admin', 'redaktion'),
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Wen der Verein gerade sucht – Trainer, Helfer, Schiris, Vorstand. Erscheint auf der Seite „Mitmachen“.',
  },
  defaultSort: 'reihenfolge',
  hooks: { afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    { name: 'titel', label: 'Wen suchen wir?', type: 'text', required: true, admin: { placeholder: 'z. B. Trainer/in für die F-Jugend' } },
    { name: 'text', label: 'Beschreibung', type: 'textarea', required: true, admin: { description: 'Was ist zu tun? Was bieten wir? Kurz und einladend.' } },
    {
      type: 'row',
      fields: [
        { name: 'aufwand', label: 'Aufwand', type: 'text', admin: { placeholder: 'z. B. 2 Std. pro Woche', width: '50%' } },
        {
          name: 'symbol',
          label: 'Symbol',
          type: 'select',
          defaultValue: '🙋',
          options: ['🙋', '⚽', '🤸', '🧑‍🍳', '🧾', '🧑‍⚖️', '🎉', '📸', '🛠️'].map((s) => ({ label: s, value: s })),
          admin: { width: '50%' },
        },
      ],
    },
    { name: 'reihenfolge', label: 'Reihenfolge', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
    { name: 'aktiv', label: 'Auf der Website zeigen', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
