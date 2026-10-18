import { isEditor } from '../access/roles'
import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

// Aus der Vorlage; Menü und Fußzeile kommen jetzt automatisch aus Teams & Kursen bzw. den Vereinsdaten
export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: { hidden: true },
  access: {
    read: () => true,
    update: isEditor,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
