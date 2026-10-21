import { type EinzelrechtKey, hatRecht } from '@/access/einzelrechte'

/** Sonderseiten, die Payload nicht von selbst in die Gruppen der Seitenleiste setzt */
export type Eintrag = { key: string; gruppe: string; href: string; label: string; rollen: string[]; recht?: EinzelrechtKey; zaehler?: string; auch?: string[] }

export const EINTRAEGE: Eintrag[] = [
  { key: 'registrierungen', gruppe: 'Posteingang', href: '/admin/registrierungen', label: 'Registrierungen', rollen: ['admin', 'kasse'], recht: 'registrierungen', zaehler: 'registrierungen' },
  { key: 'saisonwechsel', gruppe: 'Sport', href: '/admin/saisonwechsel', label: 'Saisonwechsel', rollen: ['admin', 'redaktion'], recht: 'saisonwechsel' },
  { key: 'rollen', gruppe: 'Einstellungen', href: '/admin/rollen', label: 'Rollen & Rechte', rollen: ['admin'], auch: ['/admin/globals/rollenRechte'] },
  { key: 'statistik', gruppe: 'Einstellungen', href: '/admin/statistik', label: 'Besucherstatistik', rollen: ['webadmin'], recht: 'statistik' },
  { key: 'papierkorb', gruppe: 'Einstellungen', href: '/admin/papierkorb', label: 'Papierkorb', rollen: ['webadmin'], recht: 'papierkorb' },
  { key: 'sicherung', gruppe: 'Einstellungen', href: '/admin/sicherung', label: 'Datensicherung', rollen: ['webadmin'] },
]

/** Sieht diese Person den Eintrag? (Rolle oder passendes Einzelrecht) */
export const eintragSichtbar = (e: Eintrag, user: unknown) =>
  ((user as { roles?: string[] | null } | null)?.roles ?? []).some((r) => e.rollen.includes(r)) || (e.recht ? hatRecht(user, e.recht) : false)

/** Feste Reihenfolge innerhalb der Gruppen (wie nav-zusatz.scss); alles andere folgt danach */
export const REIHENFOLGE = ['statistik', 'papierkorb', 'verein', 'rollen', 'datenschutz', 'sicherung', 'hilfe', 'hilfe-feedback', 'pages', 'menue', 'texte', 'forms']

/** Nicht als eigener Eintrag zeigen – erreichbar über „Rollen & Rechte“ */
export const VERSTECKT = ['rollenRechte']
