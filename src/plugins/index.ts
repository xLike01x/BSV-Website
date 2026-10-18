import { hinweisFeld } from '@/fields/hinweise'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { anyone } from '@/access/anyone'
import { ausblendenAusser, isAdmin, isEditor } from '@/access/roles'

import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Büdericher SV 1919` : 'Büdericher Spielverein 1919 e.V.'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      labels: { singular: 'Weiterleitung', plural: 'Weiterleitungen' },
      admin: { group: 'Einstellungen', hidden: ausblendenAusser('webadmin') },
      access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      // Formulare aus dem Baukasten (Seiten). Eigene BSV-Formulare liegen unter „Verwaltung“.
      labels: { singular: 'Formular-Eingang', plural: 'Formular-Eingänge' },
      admin: { group: 'Eigene Formulare', hidden: ausblendenAusser('admin', 'redaktion'), components: { beforeList: ['@/components/Admin/Einstieg'] } },
      access: { create: anyone, read: isEditor, update: isAdmin, delete: isAdmin },
    },
    formOverrides: {
      labels: { singular: 'Formular', plural: 'Formulare' },
      admin: {
        group: 'Eigene Formulare',
        hidden: ausblendenAusser('admin', 'redaktion'),
        components: { beforeList: ['@/components/Admin/Einstieg'] },
      },
      access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
      fields: ({ defaultFields }) => {
        // Deutsche, verständliche Beschriftungen für den Formular-Baukasten
        const beschriftung: Record<string, { label: string; description?: string }> = {
          title: { label: 'Name des Formulars', description: 'Nur intern, z. B. „Anmeldung Sommerfest“.' },
          fields: { label: 'Felder', description: 'Was abgefragt wird – z. B. Name, E-Mail, Anzahl Personen.' },
          submitButtonLabel: { label: 'Text auf dem Absende-Button', description: 'z. B. „Anmelden“ oder „Absenden“.' },
          confirmationType: { label: 'Nach dem Absenden …', description: 'Eine Danke-Nachricht zeigen oder auf eine andere Seite weiterleiten.' },
          confirmationMessage: { label: 'Danke-Nachricht' },
          redirect: { label: 'Weiterleiten zu' },
          emails: { label: 'E-Mail-Benachrichtigungen', description: 'Funktioniert erst, wenn der E-Mail-Versand eingerichtet ist.' },
        }
        return defaultFields.map((roh) => {
          const field = ('name' in roh && beschriftung[roh.name]
            ? { ...roh, label: beschriftung[roh.name]!.label, admin: { ...(roh.admin ?? {}), description: beschriftung[roh.name]!.description } }
            : roh) as typeof roh
          if ('name' in field && field.name === 'confirmationType' && 'options' in field) {
            const text: Record<string, string> = { message: 'Danke-Nachricht zeigen', redirect: 'Auf eine Seite weiterleiten' }
            return {
              ...field,
              options: (field.options as { label: string; value: string }[]).map((o) => (typeof o === 'object' ? { ...o, label: text[o.value] ?? o.label } : o)),
            } as typeof field
          }
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        }).concat([hinweisFeld('FormularHinweise')])
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      labels: { singular: 'Suchindex-Eintrag', plural: 'Suchindex' },
      admin: { group: 'Einstellungen', hidden: ausblendenAusser('webadmin') },
      access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
