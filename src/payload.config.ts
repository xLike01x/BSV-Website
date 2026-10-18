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
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      // Eigenes, helles Dashboard (Begrüßung, Kennzahlen, Schnellzugriff, Aktivitäten)
      views: {
        dashboard: { Component: '@/components/Admin/Dashboard' },
        // Hilfe-Center mit Suche, Anleitungen, Videos und FAQ
        hilfe: { Component: '@/components/Admin/HilfeCenter', path: '/hilfe', exact: true },
        // Druckbare Kurzanleitung je Rolle
        kurzanleitung: { Component: '@/components/Admin/HilfeCenter/Kurzanleitung', path: '/hilfe/kurzanleitung', exact: true },
      },
      graphics: {
        Logo: '@/components/Admin/Logo',
        Icon: '@/components/Admin/Icon',
      },
      beforeNavLinks: ['@/components/Admin/NavKopf'],
      afterNavLinks: ['@/components/Admin/NavFuss'],
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
  collections: [Posts, Termine, Media, Pages, Categories, Angebote, Ausfaelle, Probetraining, Mitgliedsantraege, Kontaktanfragen, Users, HilfeFeedback],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, Menue, Verein, Texte, HilfeInhalte],
  i18n: {
    supportedLanguages: { de },
    fallbackLanguage: 'de',
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
