import { type EinzelrechtKey, hatRecht } from '@/access/einzelrechte'
import { schalter, type SCHALTER } from '@/access/rollenRechte'

/** Sonderseiten, die Payload nicht von selbst in die Gruppen der Seitenleiste setzt */
type LeseHaken = (typeof SCHALTER)['lesen'][number]['key']
/** lesen: auch für „Nur ansehen“ sichtbar, solange dieser Haken unter Rollen-Rechte gesetzt ist */
export type Eintrag = { key: string; gruppe: string; href: string; label: string; rollen: string[]; recht?: EinzelrechtKey; zaehler?: string; auch?: string[]; lesen?: LeseHaken }

export const EINTRAEGE: Eintrag[] = [
  { key: 'registrierungen', gruppe: 'Posteingang', href: '/admin/registrierungen', label: 'Registrierungen', rollen: ['admin', 'kasse'], recht: 'registrierungen', zaehler: 'registrierungen', lesen: 'benutzer' },
  { key: 'saisonwechsel', gruppe: 'Sport', href: '/admin/saisonwechsel', label: 'Saisonwechsel', rollen: ['admin', 'redaktion'], recht: 'saisonwechsel' },
  { key: 'rollen', gruppe: 'Mitglieder', href: '/admin/rollen', label: 'Rollen & Rechte', rollen: ['admin'], auch: ['/admin/globals/rollenRechte'], lesen: 'benutzer' },
  { key: 'statistik', gruppe: 'Technik', href: '/admin/statistik', label: 'Besucherstatistik', rollen: ['webadmin'], recht: 'statistik', lesen: 'statistik' },
  { key: 'papierkorb', gruppe: 'Technik', href: '/admin/papierkorb', label: 'Papierkorb', rollen: ['webadmin'], recht: 'papierkorb' },
  { key: 'sicherung', gruppe: 'Technik', href: '/admin/sicherung', label: 'Datensicherung', rollen: ['webadmin'] },
  { key: 'updates', gruppe: 'Technik', href: '/admin/updates', label: 'Sicherheit', rollen: ['webadmin'], auch: ['/admin/globals/sicherheit'] },
]

/**
 * Sieht diese Person den Eintrag? (Rolle, passendes Einzelrecht oder „Nur ansehen“ mit Haken)
 * Im Browser kennt `schalter` nur die Standardwerte – dort blendet die Antwort von /api/posteingang (`_aus`) nach.
 */
export const eintragSichtbar = (e: Eintrag, user: unknown) => {
  const rollen = (user as { roles?: string[] | null } | null)?.roles ?? []
  if (rollen.some((r) => e.rollen.includes(r)) || (e.recht ? hatRecht(user, e.recht) : false)) return true
  return Boolean(e.lesen && rollen.includes('lesen') && schalter('lesen', e.lesen))
}

/** Feste Reihenfolge innerhalb der Gruppen (wie nav-zusatz.scss); alles andere folgt danach */
export const REIHENFOLGE = ['users', 'rollen', 'sicherung', 'updates', 'papierkorb', 'statistik', 'search', 'redirects', 'verein', 'datenschutz', 'mailVorlagen', 'hilfe', 'hilfe-feedback', 'pages', 'menue', 'texte', 'forms']

/** Nicht als eigener Eintrag zeigen – erreichbar über „Rollen & Rechte“ bzw. „Sicherheit“ (Reiter) bzw. im Passantrag */
export const VERSTECKT = ['rollenRechte', 'sicherheit', 'passdokumente', 'kuendigungsdokumente']
