import { mitEindeutigemSlug } from '@/hooks/slugEindeutig'
import { medienPruefen } from '@/hooks/medienPruefen'
import { ausblendenBeiNurEinzelrechten, medienAuswahl } from '@/access/roles'
import { hinweisFeld } from '@/fields/hinweise'
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
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { slugFromTitle } from '../../hooks/slugFromTitle'
import { seoAutomatisch } from '../../hooks/seoAutomatisch'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'
import { startseiteEndpunkt } from './startseite'

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

const istRedaktion = (user: unknown) => hasRole(user as never, 'admin', 'redaktion')

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
  // Schon auf der Startseite → kein Vorschlag nötig
  if (data.aufStartseite) data.startseiteVorschlag = false
  // Diese Felder entscheidet die Redaktion – Team-Rollen können sie auch über die Schnittstelle nicht setzen
  const ids2 = (v: unknown) => (Array.isArray(v) ? v.map((x) => (x && typeof x === 'object' ? (x as { id: number }).id : x)) : [])
  const uid = (user as { id?: number }).id
  if (operation === 'create' || !originalDoc) {
    data.categories = []
    data.relatedPosts = []
    data.authors = uid ? [uid] : []
    data.publishedAt = data._status === 'published' ? new Date().toISOString() : null
  } else {
    data.categories = ids2(originalDoc.categories)
    data.relatedPosts = ids2(originalDoc.relatedPosts)
    data.authors = ids2(originalDoc.authors)
    data.publishedAt = originalDoc.publishedAt ?? (data._status === 'published' ? new Date().toISOString() : null)
  }
  return data
}

/** Holt die Redaktion eine News auf die Startseite, ist der Vorschlag erledigt */
const vorschlagErledigt: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.aufStartseite) data.startseiteVorschlag = false
  return data
}

/** Versionen/Entwürfe: Redaktion alle, Team-Rollen nur die ihrer Teams, sonst niemand */
const versionenLesen: Access = async ({ req }) => {
  const user = req.user as { roles?: string[] } | null
  if (hasRole(user as never, 'admin', 'redaktion')) return true
  if (hasRole(user as never, ...TEAM_ROLLEN)) {
    const ids = await eigeneAngebotIds(req)
    if (ids.length) return { 'version.team': { in: ids } } as Where
  }
  return false
}

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'News', plural: 'News' },
  endpoints: [startseiteEndpunkt],
  access: {
    create: newsAnlegen,
    delete: redaktionOderEigeneTeams('team'),
    read: newsLesen,
    readVersions: versionenLesen,
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
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Neuigkeiten schreiben und veröffentlichen. Oben rechts unter „Hilfe“ steht, wie es geht.',
    group: 'Inhalte',
    hidden: ausblendenBeiNurEinzelrechten,
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
      label: 'Titel',
      type: 'text',
      required: true,
      admin: { description: 'Kurz und konkret, z. B. „F1 gewinnt Hallenturnier“.' },
    },
    {
      name: 'heroImage',
      label: 'Titelbild',
      type: 'upload',
      relationTo: 'media',
      filterOptions: medienAuswahl,
      admin: { description: 'Das große Bild über der News. Fotos von Kindern nur mit Einverständnis der Eltern.' },
    },
    {
      name: 'content',
      label: 'Text',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            BlocksFeature({ blocks: [Banner, MediaBlock] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
      required: true,
      admin: { description: 'Einfach losschreiben. Markierter Text lässt sich fett, kursiv oder als Link formatieren.' },
    },
    {
      // Nur für Redaktion/Admin – alles hier füllt sich sonst automatisch
      type: 'collapsible',
      label: 'Für Fortgeschrittene: Google-Vorschau und passende News (optional)',
      admin: {
        initCollapsed: true,
        condition: (_data, _sibling, { user }) => istRedaktion(user),
        description: 'Musst du nicht ausfüllen – die Website erzeugt das automatisch aus Titel, Text und Titelbild.',
      },
      fields: [
        {
          name: 'relatedPosts',
          label: 'Passende News (unter dem Artikel)',
          type: 'relationship',
          filterOptions: ({ id }) => ({ id: { not_in: [id] } }),
          hasMany: true,
          relationTo: 'posts',
          admin: { description: 'Leer lassen = keine Empfehlungen unter dem Artikel.' },
        },
        {
          name: 'meta',
          label: 'Google-Vorschau (SEO)',
          type: 'group',
          admin: { description: 'So erscheint die News bei Google und beim Teilen in WhatsApp & Co. Leer = automatisch.' },
          fields: [
            OverviewField({ titlePath: 'meta.title', descriptionPath: 'meta.description', imagePath: 'meta.image' }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: 'media' }),
            MetaDescriptionField({}),
            PreviewField({ hasGenerateFn: true, titlePath: 'meta.title', descriptionPath: 'meta.description' }),
          ],
        },
      ],
    },
    hinweisFeld('NewsHinweise'),
    {
      name: 'team',
      label: 'Team / Kurs',
      type: 'relationship',
      relationTo: 'angebote',
      // Wer genau ein Team betreut, hat es schon vorausgewählt
      defaultValue: async ({ user, req }) => {
        if (!user || istRedaktion(user)) return undefined
        const r = await req.payload.find({ collection: 'angebote', where: { leitung: { contains: user.id } }, limit: 2, depth: 0, select: {} })
        return r.docs.length === 1 ? r.docs[0]!.id : undefined
      },
      // Team-Rollen sehen in der Auswahl nur ihre eigenen Teams
      filterOptions: ({ user }) => (!user || hasRole(user as never, 'admin', 'redaktion') ? true : { leitung: { contains: user.id } }),
      admin: {
        position: 'sidebar',
        description: 'Erscheint auf der Seite dieses Teams. Leer lassen für Vereins-News.',
      },
    },
    {
      name: 'categories',
      label: 'Kategorie',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        condition: (_data, _sibling, { user }) => istRedaktion(user),
        description: 'Filter auf der News-Seite, z. B. „Fußball“ oder „Kids“.',
      },
    },
    {
      name: 'aufStartseite',
      label: 'Auf Startseite',
      type: 'checkbox',
      defaultValue: true,
      access: { create: isEditorField, update: isEditorField },
      admin: {
        position: 'sidebar',
        condition: (_data, _sibling, { user }) => istRedaktion(user),
        description: 'Zeigt die News auch auf der Startseite und unter „News“. Entscheidet die Redaktion – Team-News erscheinen zunächst nur auf der Teamseite.',
      },
    },
    {
      // Trainer/Team-Redaktion bitten die Redaktion, die News auf die Startseite zu holen
      name: 'startseiteVorschlag',
      label: 'Für die Startseite vorschlagen',
      type: 'checkbox',
      index: true,
      admin: {
        position: 'sidebar',
        condition: (data, _sibling, { user }) => !istRedaktion(user) || Boolean(data?.startseiteVorschlag && !data?.aufStartseite),
        description: 'Die Redaktion sieht deinen Vorschlag auf ihrer Startseite und holt die News mit einem Klick auf die Startseite der Website.',
      },
    },
    {
      name: 'publishedAt',
      label: 'Veröffentlicht am',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        condition: (_data, _sibling, { user }) => istRedaktion(user),
        description: 'Leer = Zeitpunkt der Veröffentlichung.',
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
      label: 'Autor:in',
      type: 'relationship',
      // Wer die News anlegt, steht automatisch als Autor:in drin
      defaultValue: ({ user }) => (user ? [user.id] : []),
      admin: {
        position: 'sidebar',
        condition: (_data, _sibling, { user }) => istRedaktion(user),
        description: 'Wird automatisch mit deinem Namen vorbelegt.',
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
    mitEindeutigemSlug(
      slugField({
        overrides: (feld) => ({
          ...feld,
          admin: { ...feld.admin, condition: (_data: unknown, _sibling: unknown, { user }: { user: unknown }) => istRedaktion(user) },
        }),
      }),
      'posts',
    ),
  ],
  hooks: {
    beforeValidate: [slugFromTitle],
    beforeChange: [teamNewsPruefen, vorschlagErledigt, medienPruefen, seoAutomatisch({ text: (d) => d.content, bild: (d) => d.heroImage })],
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      // Kein Autosave: sonst entsteht beim Öffnen von „News schreiben“ sofort ein leerer Entwurf.
      // Gespeichert wird mit „Entwurf speichern“ oder „Veröffentlichen“.
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
