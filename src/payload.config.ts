import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { anzeigeMail } from './auth/mail'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, type CollectionConfig, PayloadRequest } from 'payload'
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
import { PAPIERKORB, papierkorbSchutz } from './utilities/papierkorb'
import { doppelteHauptsponsorenAufraeumen, hauptsponsorUmziehen, sponsorLogosEinordnen } from './utilities/hauptsponsorUmziehen'
import { medienUmziehen } from './utilities/medienUmziehen'
import { Profilbilder } from './collections/Profilbilder'
import { Passantraege } from './passantraege/Passantraege'
import { Mitgliedschaften } from './mitgliedschaften/Mitgliedschaften'
import { Passdokumente } from './passantraege/Passdokumente'
import { taeglicheAufgaben } from './utilities/taeglich'
import { trainerUmbenennen } from './utilities/trainerUmbenennen'
import { Datenschutz } from './datenschutz/config'
import { RollenRechte } from './rollenRechte/config'
import { vorstandFotoEndpunkt } from './Verein/vorstandFoto'
import { rechteLaden } from './access/rollenRechte'
import { Dokumente } from './collections/Dokumente'
import { Alben } from './collections/Alben'
import { Sponsoren } from './collections/Sponsoren'
import { Gesuche } from './collections/Gesuche'
import { datenschutzEndpunkte } from './datenschutz/aufraeumen'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { canUpload, hasRole, isEditor } from './access/roles'

// E-Mail-Versand (Bestätigung bei Registrierung, „Passwort vergessen“, Benachrichtigungen).
// Nur aktiv mit SMTP_HOST in der .env – sonst stehen die Mails beim Entwickeln im Server-Fenster.
const smtpPort = Number(process.env.SMTP_PORT || 465)
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      defaultFromName: process.env.SMTP_FROM_NAME || 'BSV 1919',
      skipVerify: true,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        requireTLS: smtpPort !== 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
    })
  : process.env.NODE_ENV !== 'production'
    ? anzeigeMail
    : undefined

export default buildConfig({
  email,
  endpoints: [...sicherungEndpunkte, ...datenschutzEndpunkte, vorstandFotoEndpunkt],
  // Tägliche Aufgaben: Papierkorb nach 30 Tagen leeren, Datenschutz-Fristen (falls automatisch)
  onInit: async (payload) => {
    if (process.env.NEXT_PHASE === 'phase-production-build') return
    medienUmziehen(payload)
    await rechteLaden(payload, true)
    await hauptsponsorUmziehen(payload).catch((e) => payload.logger.warn({ err: e }, 'Hauptsponsor-Übernahme fehlgeschlagen'))
    await doppelteHauptsponsorenAufraeumen(payload).catch((e) => payload.logger.warn({ err: e }, 'Doppelte Hauptsponsoren aufräumen fehlgeschlagen'))
    await sponsorLogosEinordnen(payload).catch((e) => payload.logger.warn({ err: e }, 'Sponsor-Logos einordnen fehlgeschlagen'))
    await trainerUmbenennen(payload).catch((e) => payload.logger.warn({ err: e }, 'Trainer-Umbenennung fehlgeschlagen'))
    taeglicheAufgaben(payload)
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
        // Selbst registrierte Konten freigeben (Admin & Kasse)
        registrierungen: { Component: '@/components/Admin/Registrierungen', path: '/registrierungen', exact: true },
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
      actions: ['@/components/Admin/KontoMenue', '@/components/Admin/Hilfe'],
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
    // Payload-eigene Ordner (nicht genutzt) – ohne diese Zeile dürfte sie jeder Angemeldete bearbeiten
    collectionOverrides: [({ collection }) => ({ ...collection, access: { read: canUpload, create: isEditor, update: isEditor, delete: isEditor } })],
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
  collections: [Posts, Termine, Media, Alben, Dokumente, Pages, Categories, Angebote, Ausfaelle, Probetraining, Mitgliedsantraege, Kontaktanfragen, Sponsoren, Gesuche, Mitgliedschaften, Passantraege, Passdokumente, Users, Profilbilder, HilfeFeedback].map((c) =>
    PAPIERKORB.includes(c.slug)
      ? (() => {
          const schutz = papierkorbSchutz(c.slug)
          return {
            ...(c as CollectionConfig),
            trash: true,
            hooks: {
              ...c.hooks,
              beforeChange: [...schutz.beforeChange, ...(c.hooks?.beforeChange ?? [])],
              beforeDelete: [...schutz.beforeDelete, ...(c.hooks?.beforeDelete ?? [])],
            },
          }
        })()
      : c,
  ),
  cors: [getServerSideURL()].filter(Boolean),
  // Live-Website: Anmelde-Cookie nur bei Anfragen von der eigenen Adresse gültig (Schutz gegen CSRF).
  // Lokal bewusst offen, damit der Zugriff z. B. per Handy im WLAN klappt.
  csrf: process.env.NODE_ENV === 'production' ? [getServerSideURL()].filter(Boolean) : [],
  // Wird nicht genutzt – abgeschaltet heißt eine Angriffsfläche weniger
  graphQL: { disable: true },
  // Größte erlaubte Datei beim Hochladen (Bilder, PDFs)
  upload: { limits: { fileSize: 25 * 1024 * 1024 } },
  globals: [Header, Footer, Menue, Verein, Texte, HilfeInhalte, Datenschutz, RollenRechte],
  i18n: {
    supportedLanguages: { de },
    fallbackLanguage: 'de',
    // Alltagssprache statt Fachbegriffe in der Verwaltung
    translations: {
      de: {
        // Das Weiterleitungs-Plugin bringt kein Deutsch mit
        'plugin-redirects': {
          customUrl: 'Eigene Adresse',
          documentToRedirect: 'Weiterleiten zu (Seite oder News)',
          fromUrl: 'Von Adresse',
          internalLink: 'Seite auf der Website',
          redirectType: 'Art der Weiterleitung',
          toUrlType: 'Ziel',
        },
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
        // Nur Admins (oder ein Zeitplan mit CRON_SECRET) dürfen Hintergrund-Aufgaben anstoßen
        if (hasRole(req.user as never, 'admin')) return true

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
