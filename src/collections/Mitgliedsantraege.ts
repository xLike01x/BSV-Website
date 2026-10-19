import type { CollectionConfig } from 'payload'
import { APIError, ValidationError } from 'payload'

import { anyone } from '../access/anyone'
import { isFinance } from '../access/roles'
import { decrypt, encrypt, isValidIBAN } from '../utilities/crypto'
import { spamSchutz } from '../hooks/spamSchutz'
import { mitgliedschaftAusAntrag } from '@/mitgliedschaften/ausAntrag'

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
    defaultColumns: ['nachname', 'vorname', 'mitgliedsart', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
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
        { name: 'vorname', label: 'Vorname', type: 'text', required: true },
        { name: 'nachname', label: 'Nachname', type: 'text', required: true },
        { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date', required: true, admin: { date: { displayFormat: 'dd.MM.yyyy' } } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'E-Mail', type: 'email', required: true },
        { name: 'telefon', label: 'Telefon (optional)', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'strasse', label: 'Straße und Hausnummer', type: 'text', required: true },
        { name: 'plz', label: 'PLZ', type: 'text', required: true },
        { name: 'ort', label: 'Ort', type: 'text', required: true },
      ],
    },
    {
      name: 'mitgliedsart',
      label: 'Mitgliedsart',
      type: 'select',
      required: true,
      options: [
        { label: 'Jugendliche (0–17) · 15 € / Quartal', value: 'jugend' },
        { label: 'Erwachsene aktiv · 21 € / Quartal', value: 'aktiv' },
        { label: 'Familie · 36 € / Quartal', value: 'familie' },
        { label: 'Erwachsene passiv · 12 € / Quartal', value: 'passiv' },
      ],
    },
    {
      name: 'familienmitglieder',
      label: 'Weitere Familienmitglieder',
      type: 'array',
      admin: { condition: (d) => d?.mitgliedsart === 'familie' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'vorname', label: 'Vorname', type: 'text', required: true },
            { name: 'nachname', label: 'Nachname', type: 'text' },
            { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date' },
          ],
        },
      ],
    },
    { name: 'angebote', label: 'Gewünschte Teams & Kurse', type: 'relationship', relationTo: 'angebote', hasMany: true },
    {
      type: 'collapsible',
      label: 'SEPA-Lastschriftmandat',
      fields: [
        { name: 'kontoinhaber', label: 'Kontoinhaber/in', type: 'text', required: true },
        {
          name: 'iban',
          label: 'IBAN',
          type: 'text',
          required: true,
          admin: { description: 'Wird verschlüsselt gespeichert.' },
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
        { name: 'satzungAkzeptiert', label: 'Satzung und Datenschutz akzeptiert', type: 'checkbox', required: true },
        { name: 'fotoEinwilligung', label: 'Einwilligung Fotos (freiwillig)', type: 'checkbox' },
      ],
    },
    { name: 'notizen', label: 'Interne Notizen', type: 'textarea', access: { create: () => false } },
  ],
  hooks: {
    beforeValidate: [
      spamSchutz('antrag'),
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
    // Aufgenommen → automatisch Mitgliedschaft(en) für den digitalen Ausweis
    afterChange: [mitgliedschaftAusAntrag],
  },
  timestamps: true,
}
