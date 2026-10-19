import type { Field, GlobalConfig } from 'payload'

import { hasRole } from '@/access/roles'
import { rechteLaden, SCHALTER } from '@/access/rollenRechte'

const ROLLEN_NAME: Record<string, string> = {
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  passwesen: 'Passwesen',
  uebungsleitung: 'Trainer',
  teamredaktion: 'Team-Redaktion',
}

/** Zusatzrechte pro Rolle – nur der Web-Admin kann sie ändern */
export const RollenRechte: GlobalConfig = {
  slug: 'rollenRechte',
  label: 'Rollen-Rechte',
  access: {
    read: ({ req }) => hasRole(req.user as never, 'admin'),
    update: ({ req }) => hasRole(req.user as never, 'webadmin'),
  },
  admin: {
    group: 'Einstellungen',
    // In der Seitenleiste ausgeblendet (CSS) – erreichbar über „Rollen & Rechte“ → Reiter „Rechte anpassen“
    hidden: ({ user }) => !hasRole(user as never, 'admin'),
    description:
      'Was darf welche Rolle zusätzlich? Häkchen setzen, speichern – gilt sofort (spätestens nach 30 Sekunden). Ändern kann nur ein Web-Admin. Benutzerverwaltung, Admin-Rechte und Bankdaten sind bewusst nicht einstellbar. Wie sich das auswirkt, zeigt der Reiter „Übersicht“ unter „Was darf welche Rolle?“.',
  },
  hooks: { afterChange: [async ({ req }) => void (await rechteLaden(req.payload, true))] },
  fields: [
    // Reiter „Übersicht · Rechte anpassen“ – zurück zur Rollen-Übersicht
    { name: 'reiter', type: 'ui', admin: { components: { Field: '@/components/Admin/Rollen/Reiter' } } },
    ...Object.entries(SCHALTER).map(
      ([rolle, liste]): Field => ({
        name: rolle,
        label: ROLLEN_NAME[rolle] ?? rolle,
        type: 'group',
        fields: liste.map((s) => ({ name: s.key, label: s.label, type: 'checkbox', defaultValue: s.standard })),
      }),
    ),
  ],
}
