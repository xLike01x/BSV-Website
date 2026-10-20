import { rechteVorschauEndpunkt } from '@/components/Admin/WasDarf/endpunkt'
import { Statistik } from './statistik/Statistik'
import { statistikEndpunkt } from './statistik/endpunkt'
import { papierkorbEndpunkte } from './papierkorb/endpunkt'
import { startpruefung } from './utilities/startpruefung'
import { gesundEndpunkt } from './utilities/gesund'
import { datenschutzStandards } from './datenschutz/standards'
import { cspBerichtEndpunkt } from './utilities/cspBericht'
import { keineFalschenKnoepfe } from './utilities/keineFalschenKnoepfe'
import { MailVorlagen } from './antraege/vorlagen'
import { migrations } from './migrations'
import { posteingangEndpunkt } from '@/components/Admin/NavZusatz/endpunkt'
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
import { Startseite } from './Startseite/config'
import { Sicherheit } from './Sicherheit/config'
import { startseiteUmziehen } from './Startseite/umziehen'
import { texteBilderUmziehen } from './Texte/bilderUmziehen'
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

import { canUpload, canUseAdminPanel, hasRole, isEditor } from './access/roles'

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

const konfiguration = buildConfig({
  email,
  endpoints: [...sicherungEndpunkte, ...datenschutzEndpunkte, vorstandFotoEndpunkt, posteingangEndpunkt, rechteVorschauEndpunkt, statistikEndpunkt, ...papierkorbEndpunkte, gesundEndpunkt, cspBerichtEndpunkt],
  // Tägliche Aufgaben: Papierkorb nach 30 Tagen leeren, Datenschutz-Fristen (falls automatisch)
  onInit: async (payload) => {
    if (process.env.NEXT_PHASE === 'phase-production-build') return
    await startpruefung(payload)
    medienUmziehen(payload)
    await rechteLaden(payload, true)
    await hauptsponsorUmziehen(payload).catch((e) => payload.logger.warn({ err: e }, 'Hauptsponsor-Übernahme fehlgeschlagen'))
    await doppelteHauptsponsorenAufraeumen(payload).catch((e) => payload.logger.warn({ err: e }, 'Doppelte Hauptsponsoren aufräumen fehlgeschlagen'))
    await sponsorLogosEinordnen(payload).catch((e) => payload.logger.warn({ err: e }, 'Sponsor-Logos einordnen fehlgeschlagen'))
    await trainerUmbenennen(payload).catch((e) => payload.logger.warn({ err: e }, 'Trainer-Umbenennung fehlgeschlagen'))
    await startseiteUmziehen(payload).catch((e) => payload.logger.warn({ err: e }, 'Übernahme „Startseite & Bilder“ fehlgeschlagen'))
    await texteBilderUmziehen(payload).catch((e) => payload.logger.warn({ err: e }, 'Übernahme nach „Texte & Bilder“ fehlgeschlagen'))
    await datenschutzStandards(payload).catch((e) => payload.logger.warn({ err: e }, 'Datenschutz-Standards setzen fehlgeschlagen'))
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
        // Besucherstatistik ohne Cookies (nur Web-Admin)
        statistik: { Component: '@/components/Admin/Statistik', path: '/statistik', exact: true },
        // Zentraler Papierkorb (beide Stufen, alle Bereiche) – nur Web-Admin
        papierkorb: { Component: '@/components/Admin/Papierkorb', path: '/papierkorb', exact: true },
        // Druckbare Kurzanleitung je Rolle
        kurzanleitung: { Component: '@/components/Admin/HilfeCenter/Kurzanleitung', path: '/hilfe/kurzanleitung', exact: true },
      },
      graphics: {
        Logo: '@/components/Admin/Logo',
        Icon: '@/components/Admin/Icon',
      },
      // Automatisch abmelden nach Inaktivität (Warnung vorher) – auf allen Seiten der Verwaltung
      providers: ['@/components/Admin/AutoAbmelden'],
      beforeNavLinks: ['@/components/Admin/NavKopf'],
      afterNavLinks: ['@/components/Admin/NavZusatz', '@/components/Admin/NavFuss', '@/components/Admin/AppSymbol'],
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
    // Datenbank-Aufbau:
    // - Beim Entwickeln (pnpm dev) passt Payload die Tabellen automatisch an („push“).
    // - Live (und bei Befehlen wie pnpm sicherung:einspielen) NIE automatisch – dort gelten nur die Migrationen in
    //   src/migrations. Sie laufen beim Start der Live-Website von selbst (prodMigrations) bzw. mit `pnpm payload migrate`.
    // Nach jeder Feld-Änderung: `pnpm payload migrate:create <name>` und die neue Datei mit committen (siehe deploy/README.md).
    push: process.env.NODE_ENV === 'development',
    migrationDir: path.resolve(dirname, 'migrations'),
    // Nicht beim Bauen (dort könnte eine Rückfrage den Build blockieren) – im Update-Skript laufen sie danach ausdrücklich
    prodMigrations: process.env.NEXT_PHASE === 'phase-production-build' ? undefined : migrations,
  }),
  // Reihenfolge bestimmt die Reihenfolge in der Seitenleiste
  // Papierkorb: Gelöschtes bleibt 30 Tage wiederherstellbar (Benutzerkonten werden sofort gelöscht)
  collections: [
    // Posteingang
    Mitgliedsantraege, Kontaktanfragen, Probetraining, Passantraege,
    // Inhalte
    Posts, Termine, Alben, Media, Sponsoren, Gesuche,
    // Website-Aufbau
    Pages, Categories,
    // Sport
    Angebote, Ausfaelle, Passdokumente,
    // Mitglieder
    Users, Mitgliedschaften, Profilbilder, Dokumente,
    // Einstellungen
    HilfeFeedback,
    // Besucherstatistik (ohne Cookies) – nur intern, Auswertung unter /admin/statistik
    Statistik,
  ].map((c) =>
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
  globals: [Header, Footer, Menue, Texte, Startseite, Verein, Datenschutz, MailVorlagen, HilfeInhalte, RollenRechte, Sicherheit],
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
  // Keine Nutzungsdaten an Payload senden
  telemetry: false,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      // Hintergrund-Aufgaben (derzeit keine eingerichtet) nur durch Admins anstoßen
      run: ({ req }: { req: PayloadRequest }): boolean => hasRole(req.user as never, 'admin'),
    },
    tasks: [],
  },
})

/**
 * Bearbeitungssperren („wird gerade von … bearbeitet“): Payload erlaubt sie standardmäßig jedem angemeldeten Konto.
 * Nur die Verwaltung braucht sie – Mitglieder sollen weder sehen, wer was bearbeitet, noch Sperren löschen (Audit F-25).
 */
export default konfiguration.then((c) => {
  const sperren = c.collections.find((x) => x.slug === 'payload-locked-documents')
  if (sperren) {
    const nurVerwaltung = ({ req }: { req: Parameters<typeof canUseAdminPanel>[0]['req'] }) => canUseAdminPanel({ req })
    sperren.access = { ...sperren.access, read: nurVerwaltung, create: nurVerwaltung, update: nurVerwaltung, delete: nurVerwaltung }
  }
  return keineFalschenKnoepfe(c)
})
