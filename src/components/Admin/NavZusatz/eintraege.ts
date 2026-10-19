/** Sonderseiten, die Payload nicht von selbst in die Gruppen der Seitenleiste setzt */
export type Eintrag = { key: string; gruppe: string; href: string; label: string; rollen: string[]; zaehler?: string; auch?: string[] }

export const EINTRAEGE: Eintrag[] = [
  { key: 'registrierungen', gruppe: 'Posteingang', href: '/admin/registrierungen', label: 'Registrierungen', rollen: ['admin', 'kasse'], zaehler: 'registrierungen' },
  { key: 'rollen', gruppe: 'Einstellungen', href: '/admin/rollen', label: 'Rollen & Rechte', rollen: ['admin'], auch: ['/admin/globals/rollenRechte'] },
  { key: 'sicherung', gruppe: 'Einstellungen', href: '/admin/sicherung', label: 'Datensicherung', rollen: ['webadmin'] },
]

/** Feste Reihenfolge innerhalb der Gruppen (wie nav-zusatz.scss); alles andere folgt danach */
export const REIHENFOLGE = ['verein', 'rollen', 'datenschutz', 'sicherung', 'hilfe', 'hilfe-feedback', 'pages', 'menue', 'texte', 'forms']

/** Nicht als eigener Eintrag zeigen – erreichbar über „Rollen & Rechte“ */
export const VERSTECKT = ['rollenRechte']
