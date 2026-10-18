import { hasRole, istMitgliedOderMehr } from '@/access/roles'
import { ausblendenAusser } from '@/access/roles'
import type { GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { revalidateAllesGlobal } from '../hooks/revalidateAlles'

/** Vereinsdaten an einer Stelle: Adressen, Kennzahlen, Beiträge, Hauptsponsor. */
export const Verein: GlobalConfig = {
  slug: 'verein',
  label: 'Vereinsdaten',
  // Redaktion (Vorstand, Bilder, Aktion) und Kasse (Beiträge) pflegen die Vereinsdaten mit
  access: { read: anyone, update: ({ req }) => hasRole(req.user as never, 'admin', 'redaktion', 'kasse') },
  admin: { group: 'Verwaltung', description: 'Grunddaten des Vereins: Zahlen, Adressen, Beiträge, Vorstand, Downloads und Bilder der Startseite.', hidden: ausblendenAusser('admin', 'redaktion', 'kasse') },
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
        { name: 'name', label: 'Name', type: 'text', defaultValue: 'Dachdeckerbetrieb Kutscher-Remy' },
        { name: 'url', label: 'Website', type: 'text', defaultValue: 'https://remy-dach.de' },
        { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'glaeubigerId', label: 'SEPA-Gläubiger-ID', type: 'text', admin: { description: 'Erscheint im Mitgliedsantrag beim SEPA-Mandat.' } },
    {
      name: 'vorstand',
      label: 'Vorstand und Ansprechpersonen',
      labels: { singular: 'Person', plural: 'Personen' },
      type: 'array',
      admin: { description: 'Wird auf der Vereinsseite angezeigt. Kontakt läuft über das Formular, keine Telefonnummern.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'rolle', label: 'Funktion', type: 'text', required: true },
          ],
        },
        { name: 'foto', label: 'Foto (optional)', type: 'upload', relationTo: 'media' },
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
