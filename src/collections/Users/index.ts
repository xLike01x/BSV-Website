import { mailHtml } from '@/auth/mail'
import { registrierungEndpunkte, unbestaetigt } from '@/auth/registrierung'
import { getServerSideURL } from '@/utilities/getURL'
import { webadminLoeschSchutz, webadminSchutz } from './webadminSchutz'
import { ausblendenAusser } from '@/access/roles'
import type { CollectionConfig } from 'payload'

import { EINZELRECHTE } from '../../access/einzelrechte'
import { canUseAdminPanel, hasRole, isAdmin, isAdminField, isAdminOrSelf, istVerwaltung, istWebAdminField, ROLE_OPTIONS } from '../../access/roles'
import { testkontenEndpunkte, testkontenErlaubt, testkontoFeld } from '../../auth/testkonten'
import { APIError } from 'payload'
import { aktuellesPasswortFeld, anmeldeFehlerEinheitlich, anmeldungGeklappt, passwortNichtPersoenlich, passwortUndLogin } from '../../auth/passwort'
import { teamsNachher, teamsVerantwortlichFeld, teamsVorher } from './teamsVerantwortlich'
import { loginHerabgestuft, meHerabgestuft, ohneOffenenZweitenFaktor, zweiFaktorEndpunkte, zweiFaktorFelder, zweiFaktorStrategie, zweiFaktorZuruecksetzen } from '../../auth/zweiFaktor'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Benutzer', plural: 'Benutzer' },
  access: {
    admin: canUseAdminPanel,
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    // Ohne bestätigten zweiten Faktor darf niemand Passwort/E-Mail ändern (sonst könnte jemand mit nur dem Passwort den echten Inhaber aussperren)
    update: (args) => !(args.req.user as { _zweiFaktorOffen?: boolean } | null)?._zweiFaktorOffen && isAdminOrSelf(args),
    // Gesperrte Konten (zu viele Fehlversuche) entsperren nur Admins
    unlock: isAdmin,
  },
  admin: {
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Wer sich anmelden darf und mit welcher Rolle. Die Rolle bestimmt, was jemand bearbeiten kann.',
    group: 'Mitglieder',
    hidden: ausblendenAusser('admin'),
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    // Bei jeder Anfrage wird das angemeldete Konto geladen – ohne verknüpfte Einträge (Teams, Profilfoto).
    // Ohne diese Zeile gälte Tiefe 2: 5–10 zusätzliche Datenbank-Abfragen bei JEDER Anfrage.
    // Wer verknüpfte Daten braucht (Mitgliederbereich), lädt sie gezielt nach.
    depth: 0,
    tokenExpiration: 60 * 60 * 8, // 8 Stunden
    // Ganze Konto-Sperre erst nach 100 Fehlversuchen von überall (verteiltes Raten). Die eigentliche Bremse ist die
    // Sperre je Konto UND Anschluss nach 5 Fehlversuchen (src/auth/passwort.ts) – so kann niemand Fremdes ein Konto
    // mit ein paar falschen Passwörtern dauerhaft aussperren.
    maxLoginAttempts: 100,
    // Anmelde-Cookie: nur über HTTPS (Live-Website), nicht für fremde Seiten
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
    lockTime: 10 * 60 * 1000, // 10 Minuten
    // Läuft vor dem Standard-Token-Check: ohne bestätigten zweiten Faktor gelten keine Rollen
    strategies: [zweiFaktorStrategie],
    // „Passwort vergessen“: deutsche E-Mail mit Link auf die eigene Seite (nicht in die Verwaltung)
    forgotPassword: {
      expiration: 60 * 60 * 1000, // Link gilt 1 Stunde
      generateEmailSubject: () => 'Neues Passwort festlegen – BSV 1919',
      generateEmailHTML: (args) => {
        const link = `${getServerSideURL()}/login/passwort-neu?t=${encodeURIComponent(String(args?.token ?? ''))}`
        const name = (args?.user as { name?: string } | undefined)?.name
        return mailHtml({
          titel: 'Neues Passwort festlegen',
          absaetze: [name ? `Hallo ${name},` : 'Hallo,', 'für dein Konto auf der Website des BSV 1919 wurde ein neues Passwort angefordert. Über diesen Knopf legst du es fest:'],
          knopf: 'Neues Passwort festlegen',
          link,
          fuss: 'Der Link gilt 1 Stunde. Du hast nichts angefordert? Dann ignoriere diese E-Mail – dein bisheriges Passwort bleibt gültig.',
        })
      },
    },
  },
  endpoints: [...zweiFaktorEndpunkte, ...testkontenEndpunkte, ...registrierungEndpunkte],
  fields: [
    // Direkt unter „Neues Passwort“ – erscheint nur beim Ändern des eigenen Passworts
    aktuellesPasswortFeld,
    // „Was darf diese Person?“ – Klartext-Zusammenfassung, live aus Rollen + Zusatzrechten berechnet (nur Admins)
    { name: 'wasDarf', type: 'ui', admin: { components: { Field: '@/components/Admin/WasDarf' }, condition: (_d, _s, { user }) => hasRole(user as never, 'admin') } },
    { name: 'name', label: 'Name', type: 'text', required: true, admin: { description: 'Vor- und Nachname. Erscheint in der Verwaltung und als Autor:in von News.' } },
    {
      name: 'roles',
      label: 'Rollen',
      type: 'select',
      hasMany: true,
      options: ROLE_OPTIONS,
      defaultValue: ['mitglied'],
      required: true,
      // Nicht ins Anmelde-Token: Rechte werden bei jeder Anfrage aus der Datenbank gelesen, und das Token wäre
      // sonst lesbar, bevor der zweite Faktor bestätigt ist (Audit 2026-10 F-4)
      access: {
        read: ohneOffenenZweitenFaktor,
        create: isAdminField,
        update: isAdminField,
      },
      // Kacheln mit Häkchen und einer Zeile Erklärung je Rolle (statt Auswahlliste)
      admin: { components: { Field: '@/components/Admin/RollenKacheln' } },
    },
    teamsVerantwortlichFeld,
    {
      name: 'angebote',
      label: 'Teams & Kurse',
      type: 'relationship',
      relationTo: 'angebote',
      hasMany: true,
      // Ordnet die Verwaltung zu (steht auf dem Ausweis und gibt Trainern Einblick ins Profilfoto)
      access: { update: isAdminField },
      admin: {
        allowCreate: false,
        description: 'Wo die Person selbst mitspielt bzw. teilnimmt (steht auf dem Ausweis). Gibt keine Rechte – dafür das Feld darüber.',
      },
    },
    {
      // Ausnahmen für einzelne Personen – zugeklappt, damit der Alltag (Rolle + Team) übersichtlich bleibt.
      // Admins sehen den Abschnitt nur, wenn die Person wirklich Zusatzrechte hat; ändern kann nur ein Web-Admin.
      type: 'collapsible',
      label: 'Ausnahmen: Zusatzrechte nur für diese Person (Web-Admin)',
      admin: {
        initCollapsed: true,
        condition: (data, _sibling, { user }) =>
          hasRole(user as never, 'webadmin') || Object.values((data as { zusatzrechte?: Record<string, unknown> })?.zusatzrechte ?? {}).some((v) => v === true),
      },
      fields: [
        {
          // Einzelne Berechtigungen nur für diese Person – zusätzlich zu den Rollen (siehe src/access/einzelrechte.ts)
          name: 'zusatzrechte',
          label: false,
          type: 'group',
          // Nur Web-Admins vergeben Zusatzrechte – Admins sehen sie, ändern aber nicht
          access: { read: ohneOffenenZweitenFaktor, create: istWebAdminField, update: istWebAdminField },
          admin: {
            description:
              'Nur für Ausnahmen, wenn eine ganze Rolle zu viel wäre – z. B. „der Jugendleiter soll alle Probetraining-Anfragen sehen“ oder „die Pressewartin soll nur News schreiben“. Im Normalfall reicht die Rolle oben. Häkchen setzen, speichern, gilt beim nächsten Seitenaufruf. Wer ein Zusatzrecht hat, kommt in die Verwaltung und braucht die Zwei-Faktor-Anmeldung. Ein Bereichsrecht gibt genau die Rechte der zuständigen Rolle in diesem Bereich. Benutzerverwaltung, Admin-Rechte, Bankdaten und Datensicherung lassen sich bewusst nicht einzeln vergeben.',
          },
          fields: EINZELRECHTE.map((r) => ({ name: r.key, label: r.label, type: 'checkbox' as const, defaultValue: false, admin: { description: `${r.gruppe} · ${r.text}` } })),
        },
      ],
    },
    {
      name: 'profilbild',
      label: 'Profilfoto',
      type: 'upload',
      relationTo: 'profilbilder',
      // Setzt das Mitglied selbst im Mitgliederbereich (Hochladen trägt es automatisch ein)
      access: { create: isAdminField, update: isAdminField },
      admin: { position: 'sidebar', description: 'Lädt das Mitglied selbst im Mitgliederbereich hoch. Sichtbar für das Mitglied, Admin/Kasse und die Trainer seiner Kurse.' },
    },
    {
      name: 'freigegeben',
      label: 'Freigegeben',
      type: 'checkbox',
      defaultValue: true,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Ohne Haken: selbst registriert, wartet auf Freigabe – sieht noch keinen Mitgliederbereich. Freigeben geht auch unter „Registrierungen“.',
      },
    },
    {
      name: 'registriertUeber',
      label: 'Registriert über',
      type: 'select',
      options: [
        { label: 'Von der Verwaltung angelegt', value: 'verwaltung' },
        { label: 'Selbst registriert (E-Mail)', value: 'email' },
        // Alt (Google-Anmeldung wurde entfernt) – bleibt nur, damit bestehende Daten gültig sind
        { label: 'Selbst registriert (Google)', value: 'google' },
      ],
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, condition: (d) => Boolean(d?.registriertUeber) },
    },
    {
      name: 'emailBestaetigt',
      label: 'E-Mail bestätigt',
      type: 'checkbox',
      defaultValue: false,
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, condition: (d) => Boolean(d?.registriertUeber), description: 'Die Person hat auf den Link in der Bestätigungs-E-Mail geklickt. Erst dann kann sie sich anmelden und erscheint unter „Registrierungen“.' },
    },
    {
      name: 'wunschAngebote',
      label: 'Wunsch bei der Registrierung',
      type: 'relationship',
      relationTo: 'angebote',
      hasMany: true,
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        condition: (d) => d?.freigegeben === false,
        description: 'Diese Teams & Kurse hat die Person bei der Registrierung angekreuzt (dazu gehört sie oder da möchte sie hin). Unter „Registrierungen“ sind sie bei der Freigabe schon vorausgewählt.',
      },
    },
    // Bestätigungslink (nur der Fingerabdruck, nie über die Schnittstelle sichtbar)
    { name: 'bestaetigungHash', type: 'text', index: true, access: { read: () => false, create: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'bestaetigungBis', type: 'date', access: { read: () => false, create: () => false, update: () => false }, admin: { hidden: true } },
    // Alt: Verknüpfung mit dem Google-Konto (Google-Anmeldung entfernt; Feld bleibt, damit die Datenbank unverändert bleibt)
    { name: 'googleId', type: 'text', index: true, access: { read: () => false, create: () => false, update: () => false }, admin: { hidden: true } },
    {
      name: 'mailBenachrichtigung',
      label: 'E-Mail-Benachrichtigungen',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        condition: (d) => (d?.roles ?? []).some((r: string) => r !== 'mitglied'),
        description: 'Mail bei neuer Probetraining-Anfrage oder neuem Passantrag für deine Teams, alle 3 Monate „Passt noch?“ für deine Teams, (Kasse) bei neuem Mitgliedsantrag und (Admins) der Monatsbericht. Haken entfernen = keine Mails.',
      },
    },
    ...zweiFaktorFelder,
    testkontoFeld,
    {
      name: 'letzteAnmeldung',
      label: 'Zuletzt angemeldet',
      type: 'date',
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, date: { displayFormat: 'dd.MM.yyyy HH:mm' }, description: 'Wird bei jeder Anmeldung automatisch gesetzt.' },
    },
  ],
  hooks: {
    beforeOperation: [passwortUndLogin],
    afterError: [anmeldeFehlerEinheitlich],
    afterMe: [meHerabgestuft],
    afterOperation: [loginHerabgestuft as never],
    // „Passwort vergessen“ beweist ebenfalls, dass die E-Mail-Adresse der Person gehört → gilt als bestätigt.
    // (Payload ruft diesen Hook beim Zurücksetzen mit dem kompletten Konto samt neuem Passwort-Hash auf.)
    beforeValidate: [
      ({ data }) => {
        const d = data as Record<string, unknown> | undefined
        if (d && d.hash && d.salt && d.resetPasswordExpiration && d.registriertUeber === 'email' && !d.emailBestaetigt) {
          d.emailBestaetigt = true
          d.bestaetigungHash = null
          d.bestaetigungBis = null
        }
        return data
      },
    ],
    // Testkonten (ohne Zwei-Faktor) nur auf dem lokalen Server
    beforeLogin: [
      ({ user, req }) => {
        if ((user as { testkonto?: boolean }).testkonto && !testkontenErlaubt(req?.headers)) throw new APIError('Testkonten gehen nur lokal (nicht über einen Tunnel oder die Live-Website).', 403)
        // Selbst registriert: erst nach Klick auf den Link in der Bestätigungs-E-Mail (Passwort wurde da schon geprüft)
        if (unbestaetigt(user as never)) throw new APIError('E-Mail noch nicht bestätigt: Bitte klicke zuerst auf den Link in der E-Mail, die wir dir geschickt haben.', 403)
        return user
      },
    ],
    // Letzte Anmeldung merken (für „Alte Zugänge“ in der Rollen-Übersicht)
    afterLogin: [
      anmeldungGeklappt,
      async ({ req, user }) => {
        await req.payload
          .update({ collection: 'users', id: user.id, data: { letzteAnmeldung: new Date().toISOString() } as never, overrideAccess: true, context: { zweiFaktorIntern: true }, req })
          .catch(() => {})
      },
    ],
    afterChange: [zweiFaktorZuruecksetzen as never, teamsNachher],
    beforeChange: [
      passwortNichtPersoenlich,
      teamsVorher,
      // Eigene E-Mail nur über die Verwaltung ändern (sonst könnte man sich z. B. fremde Mitgliedsausweise „holen“).
      // Selbst registrierte Konten können bis zur Freigabe auch den Namen nicht mehr ändern.
      ({ req, operation, data, originalDoc }) => {
        if (operation !== 'update' || !originalDoc || !req.user || hasRole(req.user as never, 'admin')) return data
        if (typeof data.email === 'string' && data.email.trim().toLowerCase() !== String(originalDoc.email).toLowerCase())
          throw new APIError('Die E-Mail-Adresse kann nur die Verwaltung ändern. Bitte kurz Bescheid geben.', 403)
        if (originalDoc.freigegeben === false && typeof data.name === 'string' && data.name !== originalDoc.name)
          throw new APIError('Der Name kann bis zur Freigabe nicht geändert werden.', 403)
        return data
      },
      // Die allererste Person, die sich anlegt, wird automatisch Web-Admin.
      // Auf der Live-Website nur über das Server-Skript „pnpm konto:erstes“ – sonst könnte sich jeder, der eine frisch
      // eingerichtete (leere) Website zuerst findet, im Browser selbst zum Web-Admin machen.
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
          if (totalDocs === 0) {
            if (process.env.NODE_ENV === 'production' && req.context?.bsvErstesKonto !== true)
              throw new APIError('Das erste Konto wird auf dem Server angelegt: pnpm konto:erstes (siehe deploy/README.md).', 403)
            data.roles = ['webadmin', 'admin']
          }
        }
        return data
      },
      webadminSchutz,
    ],
    beforeDelete: [
      webadminLoeschSchutz,
      // Konto wird gelöscht → Profilfoto mit löschen (vorher, solange die Verknüpfung noch besteht)
      async ({ id, req }) => {
        await req.payload.delete({ collection: 'profilbilder', where: { besitzer: { equals: id } }, overrideAccess: true, req }).catch(() => {})
      },
    ],
  },
  timestamps: true,
}

export const isStaffUser = (user: unknown) => istVerwaltung(user)
