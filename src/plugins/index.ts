import { hinweisFeld } from '@/fields/hinweise'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { zweistufigerPapierkorb } from '@/papierkorb/plugin'
import { nurAnsehen } from '@/access/nurAnsehen'
import { anyone } from '@/access/anyone'
import { ausblendenAusser, ausblendenAusserBereich, ausblendenAusserMit, bereichFeld, bereichZugriff, isAdmin, istWebAdmin, rolleOderRecht } from '@/access/roles'
import type { Access } from 'payload'

/** Technik-Bereiche (Weiterleitungen, Suchindex): ändern nur Web-Admins – auch über die Schnittstelle, nicht nur in der Seitenleiste */
const nurWebAdmin: Access = ({ req }) => istWebAdmin(req.user)
import { spamSchutz } from '@/hooks/spamSchutz'

import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { eingangPruefen, mailsPruefen } from '@/hooks/formularBaukasten'
import { keineUploadsPerAdresse } from '@/hooks/keinUploadPerAdresse'
import { sortierenNurEigeneFelder } from '@/hooks/sortierSchutz'

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
      admin: {
        group: 'Technik',
        hidden: ausblendenAusser('webadmin'),
        useAsTitle: 'from',
        description:
          'Leitet eine alte Adresse auf eine Seite oder News weiter – z. B. wenn eine Seite umbenannt wurde und alte Links noch im Umlauf sind.',
      },
      access: { read: anyone, create: nurWebAdmin, update: nurWebAdmin, delete: nurWebAdmin },
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description:
                  'Alte Adresse ohne https:// und Domain, z. B. /sommerfest-2025. Greift, sobald es unter dieser Adresse keine Seite mehr gibt – kurz nach dem Speichern.',
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
    beforeEmail: mailsPruefen as never,
    formSubmissionOverrides: {
      // Formulare aus dem Baukasten (Seiten). Eingänge liegen im „Posteingang“, die Formulare selbst unter „Website-Aufbau“.
      labels: { singular: 'Formular-Eingang', plural: 'Formular-Eingänge' },
      trash: true,
      admin: {
        group: 'Posteingang',
        hidden: ausblendenAusserMit('formulare', 'admin', 'redaktion'),
        defaultColumns: ['form', 'submissionData', 'createdAt'],
        components: { beforeList: ['@/components/Admin/Einstieg'] },
      },
      access: { create: anyone, read: rolleOderRecht('formulare', 'admin', 'redaktion'), update: isAdmin, delete: isAdmin },
      // Gleicher Schutz wie bei Kontakt & Co.: Anfragen pro Adresse begrenzen, übergroße Eingaben abweisen
      hooks: { beforeValidate: [spamSchutz('formular'), eingangPruefen] },
      // Deutsche Beschriftungen statt „Form“ / „Submission Data“ (nur Anzeige, keine Datenbank-Änderung)
      fields: ({ defaultFields }) =>
        defaultFields.map((f) => {
          if (!('name' in f)) return f
          const unterfelder = (felder: typeof defaultFields) =>
            felder.map((u) => ('name' in u && u.name === 'field' ? { ...u, label: 'Feld' } : 'name' in u && u.name === 'value' ? { ...u, label: 'Antwort' } : u)) as typeof defaultFields
          if (f.name === 'form') return { ...f, label: 'Formular' } as typeof f
          if (f.name === 'submissionData' && f.type === 'array')
            return { ...f, label: 'Antworten', labels: { singular: 'Antwort', plural: 'Antworten' }, fields: unterfelder(f.fields) } as typeof f
          if (f.name === 'submissionUploads' && f.type === 'array')
            return { ...f, label: 'Hochgeladene Dateien', labels: { singular: 'Datei', plural: 'Dateien' }, fields: unterfelder(f.fields) } as typeof f
          return f
        }),
    },
    formOverrides: {
      labels: { singular: 'Formular', plural: 'Formulare' },
      trash: true,
      admin: {
        group: 'Website-Aufbau',
        hidden: ausblendenAusserBereich('seiten'),
        components: { beforeList: ['@/components/Admin/Einstieg'] },
      },
      access: { read: anyone, create: bereichZugriff('seiten'), update: bereichZugriff('seiten'), delete: bereichZugriff('seiten') },
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
          let field = ('name' in roh && beschriftung[roh.name]
            ? { ...roh, label: beschriftung[roh.name]!.label, admin: { ...(roh.admin ?? {}), description: beschriftung[roh.name]!.description } }
            : roh) as typeof roh
          // Empfänger-Adressen der Benachrichtigungen sind nicht öffentlich
          if ('name' in field && field.name === 'emails')
            field = { ...field, labels: { singular: 'E-Mail-Benachrichtigung', plural: 'E-Mail-Benachrichtigungen' }, access: { read: bereichFeld('seiten') } } as typeof field
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
      admin: {
        group: 'Technik',
        hidden: ausblendenAusser('webadmin'),
        description:
          'Entsteht automatisch aus den veröffentlichten News und wird für die Suche auf der Website genutzt. Nichts von Hand ändern – fehlt etwas, oben „Neuindizieren“ wählen.',
      },
      access: { read: anyone, create: nurWebAdmin, update: nurWebAdmin, delete: nurWebAdmin },
      fields: ({ defaultFields }) => {
        const deutsch: Record<string, string> = { title: 'Titel', priority: 'Reihenfolge in der Suche', doc: 'News', docUrl: 'Adresse' }
        return [...defaultFields.map((f) => ('name' in f && deutsch[f.name] ? ({ ...f, label: deutsch[f.name] } as typeof f) : f)), ...searchFields]
      },
    },
  }),
  // Uploads nur mit Datei, nie per Internet-Adresse (gilt für alle Upload-Bereiche)
  keineUploadsPerAdresse,
  // Sortieren über die Schnittstelle nur nach eigenen Feldern (nicht über verknüpfte Konten)
  sortierenNurEigeneFelder,
  // Rolle „Nur ansehen“: alles lesen, nichts ändern – nach allen Plugins, die Bereiche anlegen, und vor dem Papierkorb
  nurAnsehen,
  // Muss als Letztes laufen: hängt sich an alle Bereiche mit Papierkorb (auch die der Plugins)
  zweistufigerPapierkorb,
]
