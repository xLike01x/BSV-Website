import type { CollectionConfig } from 'payload'
import { APIError, ValidationError } from 'payload'

import { anyone } from '../access/anyone'
import { isFinance } from '../access/roles'
import { decrypt, encrypt, isValidIBAN } from '../utilities/crypto'
import { antragRegeln, geburtsdatumPruefen, plzPruefen, telefonPruefen } from '@/hooks/formularPruefung'
import { spamSchutz } from '../hooks/spamSchutz'
import { mitgliedschaftAusAntrag } from '@/mitgliedschaften/ausAntrag'
import { antragEndpunkte } from '@/antraege/endpunkte'
import { neuerAntragMelden } from '@/antraege/melden'
import { nurUeberEndpunkt, posteingangFelder, statusImVerlauf, zustaendigNameSetzen } from '@/posteingang/felder'
import { posteingangEndpunkte } from '@/posteingang/endpunkte'

const STATUS_LABEL: Record<string, string> = { neu: 'Neu', rueckfrage: 'Rückfrage', aufgenommen: 'Aufgenommen', abgelehnt: 'Abgelehnt' }

/**
 * Online-Mitgliedsantrag. Anlegen darf jeder (öffentliches Formular),
 * lesen/bearbeiten nur Admin und Kasse. Die IBAN wird verschlüsselt gespeichert.
 */
export const Mitgliedsantraege: CollectionConfig = {
  slug: 'mitgliedsantraege',
  labels: { singular: 'Mitgliedsantrag', plural: 'Mitgliedsanträge' },
  access: {
    create: anyone,
    read: isFinance,
    update: isFinance,
    delete: isFinance,
  },
  admin: {
    components: {
      beforeList: [
        '@/components/Admin/Einstieg',
        // „Für die Kasse exportieren“ (ohne Bankdaten)
        '@/antraege/Export',
        // Reiter „Neu · Rückfrage · Erledigt · Alle“ mit Anzahl – neue Anträge leuchten orange
        {
          path: '@/components/Admin/StatusReiter',
          serverProps: {
            sammlung: 'mitgliedsantraege',
            reiter: [
              { key: 'neu', titel: 'Neu', symbol: '🆕', status: ['neu'], hervorheben: true },
              { key: 'rueckfrage', titel: 'Rückfrage', symbol: '⏳', status: ['rueckfrage'] },
              { key: 'erledigt', titel: 'Erledigt', symbol: '✓', status: ['aufgenommen', 'abgelehnt'] },
              { key: 'alle', titel: 'Alle', symbol: '🗂️', status: null },
            ],
          },
        },
      ],
    },
    description: 'Online gestellte Mitgliedsanträge mit Bankdaten – vertraulich behandeln. Oben: „Neu“ leuchtet orange, sobald ein neuer Antrag da ist. Erledigt = aufgenommen oder abgelehnt.',
    group: 'Posteingang',
    useAsTitle: 'nachname',
    defaultColumns: ['nachname', 'vorname', 'mitgliedsart', 'status', 'zustaendig', 'createdAt'],
  },
  defaultSort: '-createdAt',
  endpoints: [...antragEndpunkte, ...posteingangEndpunkte('mitgliedsantraege')],
  fields: [
    ...posteingangFelder(),
    // Prüfhilfe mit Knöpfen „Aufnehmen · Rückfrage · Ablehnen“
    { name: 'pruefung', type: 'ui', admin: { components: { Field: '@/antraege/Pruefung' } } },
    {
      name: 'aufgenommenAm',
      label: 'Aufgenommen am',
      type: 'date',
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, condition: (d) => Boolean(d?.aufgenommenAm), date: { displayFormat: 'dd.MM.yyyy HH:mm' } },
    },
    {
      name: 'exportiertAm',
      label: 'Für die Kasse exportiert am',
      type: 'date',
      index: true,
      access: { create: () => false, update: nurUeberEndpunkt },
      admin: { position: 'sidebar', readOnly: true, condition: (d) => Boolean(d?.exportiertAm), date: { displayFormat: 'dd.MM.yyyy HH:mm' } },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      index: true,
      defaultValue: 'neu',
      options: [
        { label: 'Neu', value: 'neu' },
        { label: 'Rückfrage', value: 'rueckfrage' },
        { label: 'Aufgenommen', value: 'aufgenommen' },
        { label: 'Abgelehnt', value: 'abgelehnt' },
      ],
      admin: {
        position: 'sidebar',
        components: {
          Cell: {
            path: '@/components/Admin/StatusReiter/Pille',
            clientProps: {
              farben: {
                neu: { text: '🆕 Neu', klasse: 'neu' },
                rueckfrage: { text: '⏳ Rückfrage', klasse: 'warten' },
                aufgenommen: { text: '✓ Aufgenommen', klasse: 'ok' },
                abgelehnt: { text: 'Abgelehnt', klasse: 'aus' },
              },
            },
          },
        },
      },
      access: { create: () => false },
    },
    {
      type: 'row',
      fields: [
        { name: 'vorname', label: 'Vorname', type: 'text', required: true, maxLength: 80 },
        { name: 'nachname', label: 'Nachname', type: 'text', required: true, maxLength: 80 },
        { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date', required: true, validate: geburtsdatumPruefen(), admin: { date: { displayFormat: 'dd.MM.yyyy' } } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'E-Mail', type: 'email', required: true },
        { name: 'telefon', label: 'Telefon (optional)', type: 'text', maxLength: 30, validate: telefonPruefen },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'strasse', label: 'Straße und Hausnummer', type: 'text', required: true, maxLength: 120 },
        { name: 'plz', label: 'PLZ', type: 'text', required: true, maxLength: 5, validate: plzPruefen },
        { name: 'ort', label: 'Ort', type: 'text', required: true, maxLength: 80 },
      ],
    },
    {
      name: 'mitgliedsart',
      label: 'Mitgliedsart',
      type: 'select',
      required: true,
      options: [
        // Beträge stehen in Vereinsdaten → Mitgliedsbeiträge (und beim Antrag unter „Beitrag laut Antrag“)
        { label: 'Jugendliche (0–17)', value: 'jugend' },
        { label: 'Erwachsene aktiv', value: 'aktiv' },
        { label: 'Familie', value: 'familie' },
        { label: 'Erwachsene passiv', value: 'passiv' },
      ],
    },
    {
      name: 'beitragQuartal',
      label: 'Beitrag laut Antrag (€ pro Quartal)',
      type: 'number',
      access: { create: () => false, update: () => false },
      admin: {
        readOnly: true,
        description: 'Wird beim Absenden automatisch aus Vereinsdaten → Mitgliedsbeiträge übernommen – so bleibt sichtbar, welcher Betrag zum Zeitpunkt des Antrags galt.',
      },
    },
    {
      name: 'familienmitglieder',
      label: 'Weitere Familienmitglieder',
      type: 'array',
      maxRows: 10,
      admin: { condition: (d) => d?.mitgliedsart === 'familie' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'vorname', label: 'Vorname', type: 'text', required: true, maxLength: 80 },
            { name: 'nachname', label: 'Nachname', type: 'text', maxLength: 80 },
            { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date', validate: geburtsdatumPruefen(false) },
          ],
        },
      ],
    },
    { name: 'angebote', label: 'Gewünschte Teams & Kurse', type: 'relationship', relationTo: 'angebote', hasMany: true },
    {
      type: 'collapsible',
      label: 'SEPA-Lastschriftmandat',
      fields: [
        { name: 'kontoinhaber', label: 'Kontoinhaber/in', type: 'text', required: true, maxLength: 120 },
        {
          name: 'iban',
          label: 'IBAN',
          type: 'text',
          required: true,
          // Beim Absenden Pflicht. Später darf sie leer sein: Beim Wechsel in den Web-Admin-Papierkorb wird sie
          // aus Datenschutzgründen entfernt – ein wiederhergestellter Antrag soll trotzdem speicherbar bleiben.
          validate: (v: unknown, { operation }: { operation?: string }) => operation !== 'create' || (typeof v === 'string' && v.trim() !== '') || 'Bitte die IBAN angeben.',
          admin: { description: 'Wird verschlüsselt gespeichert. Leer = aus Datenschutzgründen entfernt (Antrag lag im Web-Admin-Papierkorb).' },
          hooks: {
            // Hinweis: In Payload laufen Feld-Hooks vor der Validierung. Deshalb
            // prüfen wir die IBAN hier im Klartext und verschlüsseln erst danach.
            beforeChange: [
              ({ value, collection, operation, originalDoc }) => {
                if (typeof value !== 'string' || !value) return value
                // Bereits verschlüsselt: nur beim Ändern eines bestehenden Antrags mit unverändertem Wert –
                // niemals von außen eingeschmuggelt (sonst ungeprüfter Inhalt, der die Liste der Kasse kaputt macht)
                if (value.startsWith('enc:')) {
                  if (operation === 'update' && originalDoc && (originalDoc as { iban?: string }).iban === value) return value
                  throw new ValidationError({ collection: collection?.slug, errors: [{ path: 'iban', message: 'Die IBAN ist ungültig. Bitte prüfen.' }] })
                }
                const iban = value.replace(/\s+/g, '').toUpperCase()
                if (!isValidIBAN(iban)) {
                  throw new ValidationError({
                    collection: collection?.slug,
                    errors: [{ path: 'iban', message: 'Die IBAN ist ungültig. Bitte prüfen.' }],
                  })
                }
                return encrypt(iban)
              },
            ],
            afterRead: [
              ({ value }) => {
                if (typeof value !== 'string') return value
                try {
                  return decrypt(value)
                } catch {
                  return '⚠ nicht lesbar'
                }
              },
            ],
          },
        },
        { name: 'sepaMandat', label: 'SEPA-Mandat erteilt', type: 'checkbox', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'satzungAkzeptiert', label: 'Satzung anerkannt, Datenschutzhinweise zur Kenntnis genommen', type: 'checkbox', required: true },
        { name: 'fotoEinwilligung', label: 'Einwilligung Fotos (freiwillig)', type: 'checkbox' },
      ],
    },
    // Früheres Notizfeld – nur noch sichtbar, wenn dort etwas steht (neue Notizen oben im Kasten „Wer kümmert sich?“)
    {
      name: 'notizen',
      label: 'Frühere Notizen',
      type: 'textarea',
      access: { create: () => false },
      admin: { condition: (d) => Boolean(d?.notizen), description: 'Aus der Zeit vor dem Notizen-Verlauf. Neue Notizen bitte oben im Kasten schreiben.' },
    },
  ],
  hooks: {
    beforeValidate: [
      spamSchutz('antrag'),
      antragRegeln,
      ({ data }) => {
        if (data && typeof data.email === 'string') data.email = data.email.trim().toLowerCase()
        return data
      },
      ({ data, operation }) => {
        if (operation === 'create' && data && (!data.sepaMandat || !data.satzungAkzeptiert)) {
          throw new APIError('SEPA-Mandat und Satzung müssen bestätigt werden.', 400)
        }
        return data
      },
    ],
    beforeChange: [
      zustaendigNameSetzen,
      statusImVerlauf(STATUS_LABEL),
      // Zeitpunkt der Aufnahme festhalten (für den Export)
      ({ data, originalDoc, operation }) => {
        if (operation === 'update' && data?.status === 'aufgenommen' && originalDoc?.status !== 'aufgenommen' && !originalDoc?.aufgenommenAm) data.aufgenommenAm = new Date().toISOString()
        return data
      },
      // Betrag zum Zeitpunkt des Antrags festhalten (aus Vereinsdaten → Mitgliedsbeiträge)
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data
        const verein = (await req.payload.findGlobal({ slug: 'verein', depth: 0, req }).catch(() => null)) as { beitraege?: { key?: string; quartal?: number }[] } | null
        const b = verein?.beitraege?.find((x) => x.key === data.mitgliedsart)
        if (b?.quartal != null) data.beitragQuartal = Number(b.quartal)
        return data
      },
    ],
    // Aufgenommen → automatisch Mitgliedschaft(en) für den digitalen Ausweis
    afterChange: [mitgliedschaftAusAntrag, neuerAntragMelden],
  },
  timestamps: true,
}
