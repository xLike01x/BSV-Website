import type { CollectionConfig, GlobalConfig } from 'payload'

import { hatRecht } from '@/access/einzelrechte'
import { ausblendenAusserBereich, bereichZugriff, canUseAdminPanel, hasRole, isAdmin } from '@/access/roles'

/** Rückmeldungen lesen: Admins und wer das Zusatzrecht „hilfe“ hat */
const rueckmeldungenLesen = (user: unknown) => hasRole(user as never, 'admin') || hatRecht(user, 'hilfe')
import { HILFE } from '@/components/Admin/Hilfe/texte'

const BEREICHE = Object.entries(HILFE).map(([value, t]) => ({ label: t.titel, value }))

/**
 * Hilfe-Texte, die die Redaktion selbst ergänzen kann – ohne Code.
 * Die eingebauten Texte bleiben erhalten; hier Eingetragenes kommt dazu bzw. ersetzt die Einleitung.
 */
export const HilfeInhalte: GlobalConfig = {
  slug: 'hilfe',
  label: 'Hilfe-Texte',
  admin: {
    group: 'Einstellungen',
    hidden: ausblendenAusserBereich('hilfe'),
    description:
      'Eigene Ergänzungen für den „? Hilfe“-Knopf und das Hilfe-Center. Die eingebauten Texte bleiben erhalten – was du hier einträgst, kommt dazu.',
  },
  access: { read: canUseAdminPanel, update: bereichZugriff('hilfe') },
  fields: [
    {
      name: 'ansprechperson',
      label: 'Ansprechperson bei Fragen',
      type: 'text',
      admin: { description: 'Steht unten in jeder Hilfe, z. B. „Thomas Wilms (Admin)“.', placeholder: 'Name (Funktion)' },
    },
    {
      name: 'bereiche',
      label: 'Ergänzungen je Bereich',
      type: 'array',
      labels: { singular: 'Bereich', plural: 'Bereiche' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'bereich', label: 'Bereich', type: 'select', required: true, options: BEREICHE },
        {
          name: 'kurz',
          label: 'Einleitung (ersetzt den eingebauten ersten Satz)',
          type: 'textarea',
          admin: { description: 'Leer lassen, um den eingebauten Text zu behalten.' },
        },
        {
          name: 'tipps',
          label: 'Zusätzliche Tipps',
          type: 'textarea',
          admin: { description: 'Eine Zeile = ein Tipp. Erscheint unter „Gut zu wissen“.' },
        },
        {
          name: 'anleitungen',
          label: 'Zusätzliche Anleitungen',
          type: 'array',
          labels: { singular: 'Anleitung', plural: 'Anleitungen' },
          fields: [
            { name: 'titel', label: 'Titel', type: 'text', required: true, admin: { placeholder: 'z. B. Spielbericht schreiben' } },
            {
              name: 'schritte',
              label: 'Schritte',
              type: 'textarea',
              required: true,
              admin: { description: 'Eine Zeile = ein Schritt. Die Nummerierung kommt automatisch.' },
            },
            {
              name: 'video',
              label: 'Video (optional)',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Kurzes Bildschirmvideo (MP4 oder WebM).' },
            },
          ],
        },
      ],
    },
    {
      name: 'faq',
      label: 'Häufige Fragen',
      type: 'array',
      labels: { singular: 'Frage', plural: 'Fragen' },
      admin: { initCollapsed: true, description: 'Ergänzt die eingebauten Fragen im Hilfe-Center.' },
      fields: [
        { name: 'frage', label: 'Frage', type: 'text', required: true },
        { name: 'antwort', label: 'Antwort', type: 'textarea', required: true },
        { name: 'bereich', label: 'Passt zu Bereich (optional)', type: 'select', options: BEREICHE },
      ],
    },
  ],
}

/** Rückmeldungen „Hat dir das geholfen?“ – nur Admins (und Zusatzrecht „hilfe“) sehen sie. */
export const HilfeFeedback: CollectionConfig = {
  slug: 'hilfe-feedback',
  labels: { singular: 'Hilfe-Rückmeldung', plural: 'Hilfe-Rückmeldungen' },
  admin: {
    group: 'Einstellungen',
    hidden: ({ user }) => !rueckmeldungenLesen(user),
    description: 'Was Nutzer über die Hilfetexte gesagt haben. Viele 👎 bei einem Bereich = Text verbessern.',
    defaultColumns: ['bereich', 'hilfreich', 'kommentar', 'createdAt'],
    useAsTitle: 'bereich',
  },
  access: { create: canUseAdminPanel, read: ({ req }) => rueckmeldungenLesen(req.user), update: isAdmin, delete: isAdmin },
  defaultSort: '-createdAt',
  fields: [
    { name: 'bereich', label: 'Bereich', type: 'text', required: true, maxLength: 60 },
    { name: 'hilfreich', label: 'Hilfreich', type: 'checkbox' },
    { name: 'kommentar', label: 'Kommentar', type: 'textarea', maxLength: 1000 },
    { name: 'benutzer', label: 'Von', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create') data.benutzer = req.user?.id
        return data
      },
    ],
  },
  timestamps: true,
}
