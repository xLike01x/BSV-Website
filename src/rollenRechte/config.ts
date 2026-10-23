import type { Field, GlobalConfig } from 'payload'

import { hasRole } from '@/access/roles'
import { rechteUebernehmen, SCHALTER } from '@/access/rollenRechte'

const ROLLEN_NAME: Record<string, string> = {
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  passwesen: 'Passwesen',
  uebungsleitung: 'Trainer',
  teamredaktion: 'Team-Redaktion',
  lesen: 'Nur ansehen',
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
    group: 'Mitglieder',
    // In der Seitenleiste ausgeblendet (CSS) – erreichbar über „Rollen & Rechte“ → Reiter „Rechte anpassen“
    hidden: ({ user }) => !hasRole(user as never, 'admin'),
    description:
      'Was darf welche Rolle zusätzlich? Häkchen setzen, speichern – gilt sofort (spätestens nach 30 Sekunden). Ändern kann nur ein Web-Admin. Admin-Rechte sind bewusst nicht einstellbar. Bei „Nur ansehen“ schaltet ein entfernter Haken den Bereich für diese Rolle ganz aus. Wie sich das auswirkt, zeigt der Reiter „Übersicht“ unter „Was darf welche Rolle?“.',
  },
  // Gespeicherten Stand sofort übernehmen (nicht neu lesen – die Transaktion ist hier noch offen)
  hooks: { afterChange: [({ doc }) => rechteUebernehmen(doc)] },
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
