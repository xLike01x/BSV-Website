import { isEditor } from '../access/roles'
import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

// Aus der Vorlage; Menü und Fußzeile kommen jetzt automatisch aus Teams & Kursen bzw. den Vereinsdaten
export const Header: GlobalConfig = {
  slug: 'header',
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
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
