import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  labels: { singular: 'Bild oder Video', plural: 'Bilder oder Videos' },
  fields: [
    {
      name: 'media',
      label: 'Bild oder Video aus der Mediathek',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}
