import { hasRole, isAdminField, istMitgliedOderMehr } from '@/access/roles'
import { STANDARD_ANLIEGEN } from './anliegen'
import { ausblendenAusser } from '@/access/roles'
import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { sichereAdresse } from '@/fields/sichereAdresse'
import { revalidateAllesGlobal } from '../hooks/revalidateAlles'

/** Vereinsdaten an einer Stelle: Adressen, Kennzahlen, Beiträge, Hauptsponsor. */
export const Verein: GlobalConfig = {
  slug: 'verein',
  label: 'Vereinsdaten',
  // Redaktion (Vorstand, Downloads) und Kasse (Beiträge) pflegen die Vereinsdaten mit
  access: { read: anyone, update: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion', 'kasse') },
  admin: { group: 'Einstellungen', description: 'Grunddaten des Vereins: Zahlen, Adressen, Beiträge, Vorstand, Kontaktformular und Downloads. Bilder und die grüne Aktions-Box: Website-Aufbau → „Startseite & Bilder“.', hidden: ausblendenAusser('admin', 'redaktion', 'kasse') },
  hooks: {
    afterChange: [revalidateAllesGlobal],
    // Über die öffentliche Schnittstelle niemals Dateien „Nur für Mitglieder“ verraten
    afterRead: [
      ({ doc, req }) => {
        if (istMitgliedOderMehr(req.user) || req.payloadAPI === 'local') return doc
        const d = doc as { downloads?: { nurMitglieder?: boolean | null; datei?: unknown; dokument?: unknown }[] }
        d.downloads = (d.downloads ?? []).map((x) => (x.nurMitglieder ? { ...x, datei: null, dokument: null } : x))
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      label: 'Vereinsname',
      type: 'text',
      defaultValue: 'Büdericher Spielverein 1919 e.V.',
      // Offizieller Name laut Vereinsregister – fest, damit er nicht versehentlich geändert wird
      access: { update: () => false },
      admin: { readOnly: true, description: 'Offizieller Name laut Vereinsregister – kann hier nicht geändert werden.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'mitglieder', label: 'Mitgliederzahl', type: 'number', defaultValue: 1121 },
        { name: 'kinderFussball', label: 'Kinder in der Fußballjugend', type: 'number', defaultValue: 142 },
        { name: 'gruendung', label: 'Gründungsjahr', type: 'number', defaultValue: 1919 },
      ],
    },
    { name: 'sportpark', label: 'Sportplatz', type: 'textarea', defaultValue: 'Kutscher-Remy-Sportpark\nSchützenstraße 25a\n46487 Wesel' },
    { name: 'postanschrift', label: 'Postanschrift', type: 'textarea', defaultValue: 'Am Weißen Stein 2f\n46487 Wesel' },
    {
      type: 'collapsible',
      label: 'Anfahrt-Karte (Kontaktseite)',
      admin: { initCollapsed: true, description: 'Position der Markierung auf der Karte. Herausfinden: in OpenStreetMap rechtsklicken → „Adresse anzeigen“ – die Zahlen oben links übernehmen.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'sportparkLat', label: 'Sportplatz: Breitengrad', type: 'number', defaultValue: 51.62638 },
            { name: 'sportparkLon', label: 'Sportplatz: Längengrad', type: 'number', defaultValue: 6.58253 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'halleLat', label: 'Sporthalle: Breitengrad', type: 'number', admin: { description: 'Leer = keine eingebettete Karte, nur Knöpfe.' } },
            { name: 'halleLon', label: 'Sporthalle: Längengrad', type: 'number' },
          ],
        },
      ],
    },
    {
      name: 'beitraege',
      label: 'Mitgliedsbeiträge',
      type: 'array',
      defaultValue: [
        { key: 'jugend', label: 'Jugendliche', zielgruppe: '0 bis 17 Jahre', quartal: 15 },
        { key: 'aktiv', label: 'Erwachsene aktiv', zielgruppe: 'ab 18 Jahren', quartal: 21 },
        { key: 'familie', label: 'Familie', zielgruppe: 'die ganze Familie', quartal: 36 },
        { key: 'passiv', label: 'Erwachsene passiv', zielgruppe: 'Verein unterstützen', quartal: 12 },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'key', label: 'Schlüssel', type: 'text', required: true },
            { name: 'label', label: 'Bezeichnung', type: 'text', required: true },
            { name: 'zielgruppe', label: 'Zielgruppe', type: 'text' },
            { name: 'quartal', label: '€ pro Quartal', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'hauptsponsor',
      label: 'Hauptsponsor',
      // Veraltet: wird beim Start nach „Sponsoren“ übernommen (Art „Hauptsponsor“)
      admin: { hidden: true },
      fields: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'url', label: 'Website', type: 'text' },
        { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'passantragVorlageUrl',
          label: 'Fußball: Passantrag – Link zum Formular',
          type: 'text',
          defaultValue: 'https://wdfv.de/download/spielberechtigungen/spielberechtigungsantrag.pdf',
          validate: sichereAdresse,
          admin: { width: '60%', description: 'Offizielles Formular des Verbands (WDFV) – ist immer aktuell. Erscheint beim Passantrag im Mitgliederbereich.' },
        },
        {
          name: 'passantragVorlage',
          label: 'oder eigene PDF',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '40%', description: 'Nur falls ihr ein eigenes Formular nutzt – hat Vorrang vor dem Link.' },
        },
      ],
    },
    { name: 'glaeubigerId', label: 'SEPA-Gläubiger-ID', type: 'text', admin: { description: 'Erscheint im Mitgliedsantrag beim SEPA-Mandat.' } },
    {
      name: 'vorstand',
      label: 'Vorstand und Ansprechpersonen',
      labels: { singular: 'Person', plural: 'Personen' },
      type: 'array',
      admin: { description: 'Wird auf der Vereinsseite angezeigt. Kontakt läuft über das Formular (dort ohne Namen), keine Telefonnummern.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              validate: (wert: unknown, { siblingData }: { siblingData?: { konto?: unknown } }) =>
                wert || siblingData?.konto ? true : 'Bitte einen Namen eintragen oder ein Benutzerkonto verknüpfen.',
              admin: { description: 'Mit verknüpftem Konto: leer lassen – dann steht dort immer der aktuelle Name aus dem Konto.' },
            },
            { name: 'rolle', label: 'Funktion', type: 'text', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'konto',
              label: 'Benutzerkonto (optional)',
              type: 'relationship',
              relationTo: 'users',
              // Nur freigegebene Konten; nicht über die öffentliche Schnittstelle sichtbar
              filterOptions: { freigegeben: { not_equals: false } },
              access: { read: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion', 'kasse') },
              admin: {
                width: '50%',
                description: 'Verknüpfen, sobald die Person ein Konto hat: „Nachricht senden“ geht dann per E-Mail direkt an sie (die Adresse sieht niemand), und ihr Name bleibt aktuell.',
              },
            },
            {
              name: 'fotoAusKonto',
              label: 'Profilfoto aus dem Konto auf der Vereinsseite zeigen',
              type: 'checkbox',
              access: { read: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion', 'kasse') },
              admin: {
                width: '50%',
                condition: (_, s) => Boolean(s?.konto) && !s?.foto,
                description: 'Nur mit Einverständnis der Person – Profilfotos sind sonst nie öffentlich. Ein Foto im Feld darunter hat Vorrang.',
              },
            },
          ],
        },
        { name: 'foto', label: 'Foto (optional)', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'kontaktAnliegen',
      label: 'Kontaktformular: Worum geht es?',
      labels: { singular: 'Anliegen', plural: 'Anliegen' },
      type: 'array',
      defaultValue: STANDARD_ANLIEGEN.map((titel) => ({ titel })),
      admin: {
        initCollapsed: true,
        description:
          'Diese Auswahl sehen Besucher im Kontaktformular – bewusst ohne Namen. Pro Anliegen legt ein Admin fest, wer die Nachricht per E-Mail bekommt (unsichtbar für Besucher). Reihenfolge per Ziehen ändern. Leer gelassen = Standardliste. Ohne Empfänger geht die Nachricht an die Empfänger von „Allgemeine Frage“ (bzw. das erste Anliegen); unter „Kontaktanfragen“ steht sie immer.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'titel', label: 'Anliegen (sichtbar)', type: 'text', required: true, maxLength: 80, admin: { width: '45%', placeholder: 'z. B. Mitgliedschaft & Beiträge' } },
            {
              name: 'empfaenger',
              label: 'Geht per E-Mail an (nur Admins)',
              type: 'text',
              maxLength: 500,
              access: { read: isAdminField, update: isAdminField, create: isAdminField },
              admin: { width: '55%', placeholder: 'vorstand@…, kasse@…', description: 'Eine oder mehrere Adressen, mit Komma getrennt. Funktioniert, sobald der E-Mail-Versand eingerichtet ist.' },
            },
          ],
        },
      ],
    },
    { name: 'downloadsSchutz', type: 'ui', admin: { components: { Field: '@/Verein/DownloadsSchutz' } } },
    {
      name: 'downloads',
      label: 'Satzung & Downloads',
      labels: { singular: 'Download', plural: 'Downloads' },
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'titel', label: 'Titel', type: 'text', required: true },
            { name: 'hinweis', label: 'Hinweis', type: 'text', admin: { placeholder: 'PDF · 2026' } },
          ],
        },
        {
          name: 'nurMitglieder',
          label: 'Nur für Mitglieder',
          type: 'checkbox',
          admin: { description: 'Dann ist die Datei geschützt: nur angemeldete Mitglieder können sie öffnen – auch nicht mit dem Link.' },
        },
        {
          name: 'datei',
          label: 'Datei (öffentlich)',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, s) => !s?.nurMitglieder || Boolean(s?.datei && !s?.dokument), description: 'Für alle sichtbar, z. B. die Satzung.' },
        },
        {
          name: 'dokument',
          label: 'Geschützte Datei (nur Mitglieder)',
          type: 'upload',
          relationTo: 'dokumente',
          admin: { condition: (_, s) => Boolean(s?.nurMitglieder) },
        },
      ],
    },
    {
      name: 'dsgvo',
      label: 'Informationspflichten (DSGVO)',
      type: 'array',
      fields: [
        { name: 'frage', label: 'Überschrift', type: 'text', required: true },
        { name: 'antwort', label: 'Text', type: 'textarea', required: true },
      ],
    },
    {
      type: 'group',
      name: 'startseite',
      label: 'Startseite',
      // Veraltet: wird beim Start nach „Startseite & Bilder“ (Website-Aufbau) übernommen – nur noch als Sicherung gespeichert
      admin: { condition: () => false },
      fields: [
        { name: 'heroBilder', label: 'Bilder oben (4 Stück)', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 4 },
        {
          type: 'row',
          fields: [
            { name: 'heroTag1', label: 'Schild 1', type: 'text', defaultValue: 'Tanzmäuse · 3–6 J.' },
            { name: 'heroTag2', label: 'Schild 2', type: 'text', defaultValue: 'Mädchenfußball' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'bildFussball', label: 'Kachel Fußball', type: 'upload', relationTo: 'media' },
            { name: 'bildKids', label: 'Kachel BSV Kids', type: 'upload', relationTo: 'media' },
            { name: 'bildFitness', label: 'Kachel Fitness', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'bildBreitensport1', label: 'Breitensport-Seite Bild 1', type: 'upload', relationTo: 'media' },
            { name: 'bildBreitensport2', label: 'Bild 2', type: 'upload', relationTo: 'media' },
            { name: 'bildBreitensport3', label: 'Bild 3', type: 'upload', relationTo: 'media' },
          ],
        },
        { name: 'bildVerein', label: 'Vereinsseite Titelbild', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      type: 'group',
      name: 'aktion',
      label: 'Aktion auf der Startseite (grüne Box)',
      // Veraltet: wird beim Start nach „Startseite & Bilder“ (Website-Aufbau) übernommen – nur noch als Sicherung gespeichert
      admin: { condition: () => false },
      fields: [
        { name: 'aktiv', label: 'Anzeigen', type: 'checkbox', defaultValue: true },
        { name: 'kicker', label: 'Überzeile', type: 'text', defaultValue: 'Kunstrasen 2026' },
        { name: 'titel', label: 'Titel', type: 'text', defaultValue: 'Eröffnet – mit Schalke 04.' },
        { name: 'text', label: 'Text', type: 'textarea' },
        {
          type: 'row',
          fields: [
            { name: 'linkText', label: 'Button-Text', type: 'text', defaultValue: 'Mehr zum Projekt' },
            { name: 'linkUrl', label: 'Button-Link', type: 'text', defaultValue: '/kunstrasen' },
          ],
        },
        { name: 'bild', label: 'Bild (z. B. Plakat)', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      type: 'group',
      name: 'social',
      label: 'Social Media',
      // Wird jetzt unter „Menü & Fußzeile → Kontakt-Spalte“ gepflegt (dient nur noch als Startwert)
      admin: { condition: () => false },
      fields: [
        { name: 'instagram', type: 'text', defaultValue: 'https://www.instagram.com/buedericher_spielverein/' },
        { name: 'facebook', type: 'text', defaultValue: 'https://www.facebook.com/bsv1919ev/' },
      ],
    },
  ],
}
