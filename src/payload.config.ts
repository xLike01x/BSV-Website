import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Angebote } from './collections/Angebote'
import { Termine } from './collections/Termine'
import { Mitgliedsantraege } from './collections/Mitgliedsantraege'
import { Probetraining } from './collections/Probetraining'
import { Ausfaelle } from './collections/Ausfaelle'
import { Kontaktanfragen } from './collections/Kontaktanfragen'
import { Verein } from './Verein/config'
import { Texte } from './Texte/config'
import { Menue } from './Menue/config'
import { HilfeFeedback, HilfeInhalte } from './Hilfe/config'
import { de } from '@payloadcms/translations/languages/de'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { sicherungEndpunkte } from './sicherung/endpunkte'
import { PAPIERKORB } from './utilities/papierkorb'
import { taeglicheAufgaben } from './utilities/taeglich'
import { Datenschutz } from './datenschutz/config'
import { Dokumente } from './collections/Dokumente'
import { Alben } from './collections/Alben'
import { Sponsoren } from './collections/Sponsoren'
import { Gesuche } from './collections/Gesuche'
import { datenschutzEndpunkte } from './datenschutz/aufraeumen'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  endpoints: [...sicherungEndpunkte, ...datenschutzEndpunkte],
  // Tägliche Aufgaben: Papierkorb nach 30 Tagen leeren, Datenschutz-Fristen (falls automatisch)
  onInit: async (payload) => {
    if (process.env.NEXT_PHASE !== 'phase-production-build') taeglicheAufgaben(payload)
  },
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      // Eigenes, helles Dashboard (Begrüßung, Kennzahlen, Schnellzugriff, Aktivitäten)
      views: {
        dashboard: { Component: '@/components/Admin/Dashboard' },
        // Hilfe-Center mit Suche, Anleitungen, Videos und FAQ
        hilfe: { Component: '@/components/Admin/HilfeCenter', path: '/hilfe', exact: true },
        // Wer hat welche Rolle für welche Teams? (nur Admin/Web-Admin)
        rollen: { Component: '@/components/Admin/Rollen', path: '/rollen', exact: true },
        sicherung: { Component: '@/components/Admin/Sicherung', path: '/sicherung', exact: true },
        // Druckbare Kurzanleitung je Rolle
        kurzanleitung: { Component: '@/components/Admin/HilfeCenter/Kurzanleitung', path: '/hilfe/kurzanleitung', exact: true },
      },
      graphics: {
        Logo: '@/components/Admin/Logo',
        Icon: '@/components/Admin/Icon',
      },
      beforeNavLinks: ['@/components/Admin/NavKopf'],
      afterNavLinks: ['@/components/Admin/NavFuss', '@/components/Admin/AppSymbol'],
      // „? Hilfe“-Knopf oben rechts – erklärt jeden Bereich in einfachen Worten
      actions: ['@/components/Admin/Hilfe'],
    },
    // Immer hell und freundlich – kein Dunkelmodus
    theme: 'light',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    // Keine Profilbilder von Gravatar laden (Datenschutz)
    avatar: 'default',
    meta: {
      titleSuffix: ' – BSV Verwaltung',
    },
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // Ordner-Ansicht nicht als eigenen Menüpunkt zeigen (Ordner bleiben in der Mediathek nutzbar)
  folders: {
    browseByFolder: false,
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  // Reihenfolge bestimmt die Reihenfolge in der Seitenleiste
  // Papierkorb: Gelöschtes bleibt 30 Tage wiederherstellbar (Benutzerkonten werden sofort gelöscht)
  collections: [Posts, Termine, Media, Alben, Dokumente, Pages, Categories, Angebote, Ausfaelle, Probetraining, Mitgliedsantraege, Kontaktanfragen, Sponsoren, Gesuche, Users, HilfeFeedback].map((c) =>
    PAPIERKORB.includes(c.slug) ? { ...c, trash: true } : c,
  ),
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, Menue, Verein, Texte, HilfeInhalte, Datenschutz],
  i18n: {
    supportedLanguages: { de },
    fallbackLanguage: 'de',
    // Alltagssprache statt Fachbegriffe in der Verwaltung
    translations: {
      de: {
        general: {
          selectValue: 'Bitte auswählen …',
          creating: 'Neu:',
          // Leere Häkchen-Felder in Listen (sonst erscheint „general:null“)
          null: 'nein',
          true: 'ja',
          false: 'nein',
        },
        version: {
          publishChanges: 'Veröffentlichen',
        },
        fields: {
          block: 'Baustein',
          blocks: 'Bausteine',
          blockType: 'Art des Bausteins',
          searchForBlock: 'Baustein suchen',
          addNew: 'Neuen Eintrag hinzufügen',
        },
        upload: {
          dragAndDrop: 'Datei hierher ziehen',
          dragAndDropHere: 'oder Datei hierher ziehen',
          pasteURL: 'Adresse aus dem Internet',
          focalPoint: 'Wichtigster Bildbereich',
          previewSizes: 'Bildgrößen anzeigen',
        },
        lexical: {
          general: {
            placeholder: 'Hier schreiben … (mit „/“ gibt es Überschriften, Listen und mehr)',
          },
        },
      },
    } as unknown as NonNullable<NonNullable<Parameters<typeof buildConfig>[0]['i18n']>['translations']>,
  },
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
