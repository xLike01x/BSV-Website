import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import type { Access, CollectionBeforeChangeHook, Where } from 'payload'
import { APIError } from 'payload'

import { eigeneAngebotIds, hasRole, isEditorField, redaktionOderEigeneTeams, TEAM_ROLLEN } from '../../access/roles'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { slugFromTitle } from '../../hooks/slugFromTitle'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

/** Redaktion: alle News. Team-Rollen: News ihrer eigenen Teams (auch Entwürfe). Alle anderen: Veröffentlichtes. */
const newsLesen: Access = async ({ req }) => {
  const user = req.user as { roles?: string[] } | null
  if (hasRole(user as never, 'admin', 'redaktion')) return true
  if (hasRole(user as never, ...TEAM_ROLLEN)) {
    const ids = await eigeneAngebotIds(req)
    if (ids.length) return { or: [{ _status: { equals: 'published' } }, { team: { in: ids } }] } as Where
  }
  return { _status: { equals: 'published' } }
}

const newsAnlegen: Access = async ({ req }) => {
  const user = req.user as { roles?: string[] } | null
  if (hasRole(user as never, 'admin', 'redaktion')) return true
  return hasRole(user as never, ...TEAM_ROLLEN) && (await eigeneAngebotIds(req)).length > 0
}

/** Team-News: nur für eigene Teams, Startseite entscheidet die Redaktion */
const teamNewsPruefen: CollectionBeforeChangeHook = async ({ req, data, operation, originalDoc }) => {
  const user = req.user as { roles?: string[] } | null
  if (!user || hasRole(user as never, 'admin', 'redaktion')) return data
  const ids = await eigeneAngebotIds(req)
  const team = typeof data.team === 'object' && data.team ? data.team.id : data.team
  if (!team && ids.length === 1) data.team = ids[0]
  const ziel = Number(typeof data.team === 'object' && data.team ? data.team.id : data.team)
  if (!ids.includes(ziel)) throw new APIError('Bitte wähle eines deiner Teams aus. Du kannst nur News für eigene Teams schreiben.', 403)
  if (operation === 'create') data.aufStartseite = false
  else if (originalDoc) data.aufStartseite = originalDoc.aufStartseite
  return data
}

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'News', plural: 'News' },
  access: {
    create: newsAnlegen,
    delete: redaktionOderEigeneTeams('team'),
    read: newsLesen,
    update: redaktionOderEigeneTeams('team'),
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    group: 'Inhalte',
    defaultColumns: ['title', 'team', 'aufStartseite', '_status', 'publishedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
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
    {
      name: 'team',
      label: 'Team / Kurs',
      type: 'relationship',
      relationTo: 'angebote',
      // Team-Rollen sehen in der Auswahl nur ihre eigenen Teams
      filterOptions: ({ user }) => (!user || hasRole(user as never, 'admin', 'redaktion') ? true : { leitung: { contains: user.id } }),
      admin: {
        position: 'sidebar',
        description: 'Erscheint auf der Seite dieses Teams. Leer lassen für Vereins-News.',
      },
    },
    {
      name: 'aufStartseite',
      label: 'Auch auf Startseite und unter „News“ zeigen',
      type: 'checkbox',
      defaultValue: true,
      access: { create: isEditorField, update: isEditorField },
      admin: {
        position: 'sidebar',
        description: 'Entscheidet die Redaktion. Team-News erscheinen zunächst nur auf der Teamseite.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    beforeValidate: [slugFromTitle],
    beforeChange: [teamNewsPruefen],
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
