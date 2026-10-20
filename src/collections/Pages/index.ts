import { mitEindeutigemSlug } from '@/hooks/slugEindeutig'
import { seoAutomatisch } from '@/hooks/seoAutomatisch'
import { hinweisFeld } from '@/fields/hinweise'
import { ausblendenAusser } from '@/access/roles'
import type { CollectionConfig } from 'payload'

import { editorOrPublished, isEditor } from '../../access/roles'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: { singular: 'Seite', plural: 'Seiten' },
  access: {
    create: isEditor,
    delete: isEditor,
    read: editorOrPublished,
    readVersions: isEditor,
    update: isEditor,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Eigene Seiten aus Bausteinen bauen, z. B. für ein Fest. Im Menü erscheinen sie erst über „Menü & Fußzeile“.',
    group: 'Website-Aufbau',
    hidden: ausblendenAusser('admin', 'redaktion'),
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Titel',
      type: 'text',
      required: true,
      admin: { description: 'Name der Seite – steht im Browser-Tab und ergibt die Adresse, z. B. „Sommerfest 2027“ → /sommerfest-2027.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Kopfbereich',
          description: 'Der große Bereich ganz oben auf der Seite.',
        },
        {
          fields: [
            {
              name: 'layout',
              label: 'Bausteine der Seite',
              labels: { singular: 'Baustein', plural: 'Bausteine' },
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Inhalt (Bausteine)',
          description: 'Die Seite besteht aus Bausteinen untereinander. Mit „Baustein hinzufügen“ fügst du Text, Bilder, Buttons, News-Listen oder Formulare ein.',
        },
        {
          name: 'meta',
          label: 'Google-Vorschau (optional)',
          description: 'So erscheint die Seite bei Google und beim Teilen. Leer lassen = wird automatisch erzeugt.',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    hinweisFeld('SeitenHinweise'),
    {
      name: 'publishedAt',
      label: 'Veröffentlicht am',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    // Adresse eindeutig halten (auch Entwürfe und Papierkorb) – sonst scheitern Speichern und Löschen
    mitEindeutigemSlug(slugField(), 'pages'),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt, seoAutomatisch({ text: (d) => d.hero?.richText, bild: (d) => d.hero?.media })],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        // Zwischenspeichern für die Live-Vorschau: 1 Sekunde nach dem Tippen (vorher 0,1 s → sehr viele Versionen)
        interval: 1000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
