import type { Field, GlobalConfig } from 'payload'

import { hatRecht } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'
import { type Entscheidung, ENTSCHEIDUNG_LABEL, STANDARD_VORLAGEN } from './texte'

export const PLATZHALTER = '{vorname} {nachname} {mitgliedsart} {meinName}'

const vorlage = (name: Entscheidung): Field => ({
  name,
  label: ENTSCHEIDUNG_LABEL[name],
  type: 'group',
  fields: [
    { name: 'betreff', label: 'Betreff', type: 'text', required: true, maxLength: 200, defaultValue: STANDARD_VORLAGEN[name].betreff },
    { name: 'text', label: 'Text', type: 'textarea', required: true, maxLength: 5000, defaultValue: STANDARD_VORLAGEN[name].text, admin: { rows: 12 } },
  ],
})

/**
 * Vorlagen für die Antwort-Mails bei Mitgliedsanträgen (Aufnehmen, Rückfrage, Ablehnen).
 * Beim Klick auf den Knopf im Antrag wird die Vorlage eingesetzt und kann vor dem Senden noch geändert werden.
 */
export const MailVorlagen: GlobalConfig = {
  slug: 'mailVorlagen',
  label: 'E-Mail-Vorlagen Mitgliedsanträge',
  access: {
    // Lesen (Vorlage beim Antworten einsetzen) auch mit Zusatzrecht „antraege“; ändern nur Kasse/Admin
    read: ({ req }) => hasRole(req.user as never, 'admin', 'kasse') || hatRecht(req.user, 'antraege'),
    update: ({ req }) => hasRole(req.user as never, 'admin', 'kasse'),
  },
  admin: {
    group: 'Einstellungen',
    hidden: ({ user }) => !hasRole(user as never, 'admin', 'kasse'),
    description: `Texte für die Antwort an Antragsteller/innen. Platzhalter werden automatisch ersetzt: ${PLATZHALTER}. Vor dem Senden kannst du den Text im Antrag noch anpassen. Stellen in [ECKIGEN KLAMMERN] musst du vor dem Senden ausfüllen.`,
  },
  fields: [vorlage('aufgenommen'), vorlage('rueckfrage'), vorlage('abgelehnt')],
}
