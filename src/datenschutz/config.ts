import type { Field, GlobalConfig, GlobalBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { hatRecht } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'
import { darf, rechteLaden } from '@/access/rollenRechte'

/** Nur über das Zusatzrecht hier (nicht Admin, nicht Kasse mit eingeschaltetem Schalter)? */
const nurZusatzrecht = (user: unknown) => !hasRole(user as never, 'admin') && !darf(user, 'kasse', 'datenschutz') && hatRecht(user, 'datenschutz')

/** Alle Zahlenfelder mit Standardwert (Fristen) – auch in Zeilen */
const fristFelder = (felder: Field[]): { name: string; standard: number }[] =>
  felder.flatMap((f) =>
    'fields' in f && !('name' in f) ? fristFelder(f.fields) : f.type === 'number' && 'name' in f && typeof f.defaultValue === 'number' ? [{ name: f.name, standard: f.defaultValue }] : [],
  )

/**
 * Mit dem Zusatzrecht „datenschutz“ dürfen Fristen verlängert, aber nicht unter den Standardwert gekürzt werden –
 * sonst ließen sich darüber Daten aus Bereichen löschen, die die Person gar nicht sehen darf. Kürzer: nur Admins.
 */
const nichtUnterStandard: GlobalBeforeChangeHook = async ({ data, originalDoc, req }) => {
  await rechteLaden(req.payload)
  if (!nurZusatzrecht(req.user)) return data
  const vorher = (originalDoc ?? {}) as Record<string, unknown>
  for (const { name, standard } of fristFelder(Datenschutz.fields)) {
    const v = (data as Record<string, unknown>)[name]
    if (typeof v === 'number' && v < standard && v !== vorher[name]) throw new APIError(`Kürzer als der Standard (${standard}) darf nur ein Admin einstellen.`, 403)
  }
  return data
}

/** Datenschutz-Fristen: Wie lange bleiben persönliche Daten gespeichert? */
export const Datenschutz: GlobalConfig = {
  slug: 'datenschutz',
  label: 'Datenschutz-Fristen',
  access: {
    read: ({ req }) => hasRole(req.user as never, 'admin', 'kasse') || hatRecht(req.user, 'datenschutz'),
    update: async ({ req }) => (await rechteLaden(req.payload), hasRole(req.user as never, 'admin') || darf(req.user, 'kasse', 'datenschutz') || hatRecht(req.user, 'datenschutz')),
  },
  hooks: { beforeChange: [nichtUnterStandard] },
  admin: {
    group: 'Einstellungen',
    hidden: ({ user }) => !(hasRole(user as never, 'admin') || darf(user, 'kasse', 'datenschutz') || hatRecht(user, 'datenschutz')),
    description: 'Persönliche Daten nur so lange speichern, wie sie gebraucht werden (DSGVO). Hier legst du fest, wann erledigte Einträge aufgeräumt werden.',
  },
  fields: [
    { name: 'uebersicht', type: 'ui', admin: { components: { Field: '@/datenschutz/Uebersicht' } } },
    { name: 'auskunft', type: 'ui', admin: { components: { Field: '@/datenschutz/Auskunft' }, condition: (_d, _s, { user }) => hasRole(user as never, 'admin') } },
    {
      type: 'row',
      fields: [
        { name: 'probetrainingMonate', label: 'Probetraining-Anfragen (erledigt) – nach Monaten', type: 'number', min: 1, defaultValue: 6, admin: { width: '50%' } },
        { name: 'kontaktMonate', label: 'Kontaktanfragen (erledigt) – nach Monaten', type: 'number', min: 1, defaultValue: 6, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'antraegeMonate',
          label: 'Mitgliedsanträge (aufgenommen/abgelehnt) – nach Monaten',
          type: 'number',
          min: 1,
          defaultValue: 3,
          admin: { width: '50%', description: 'Erst löschen, wenn die Daten in die Mitgliederverwaltung übernommen sind.' },
        },
        { name: 'eingaengeMonate', label: 'Formular-Eingänge – nach Monaten', type: 'number', min: 1, defaultValue: 12, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'offeneMonate',
          label: 'Nie erledigte Anfragen und Anträge – nach Monaten',
          type: 'number',
          min: 3,
          defaultValue: 12,
          admin: { width: '50%', description: 'Probetraining, Kontakt und Mitgliedsanträge, die nie auf „erledigt“ bzw. „aufgenommen/abgelehnt“ gesetzt wurden (letzte Änderung zählt).' },
        },
        {
          name: 'austrittMonate',
          label: 'Mitgliedschaften (digitaler Ausweis) – Monate nach Austritt',
          type: 'number',
          min: 1,
          defaultValue: 12,
          admin: { width: '50%', description: 'Gilt für Einträge mit „Gültig bis (Austritt)“. Die Mitgliederverwaltung des Vereins (z. B. DFBnet) ist davon nicht betroffen.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'statistikMonate',
          label: 'Besucherstatistik – nach Monaten',
          type: 'number',
          min: 1,
          max: 36,
          defaultValue: 14,
          admin: { width: '50%', description: 'Wird immer automatisch gelöscht. Enthält keine Namen und keine IP-Adressen, nur eine täglich wechselnde Kennung. 14 Monate = Vergleich mit dem Vorjahr.' },
        },
        {
          name: 'suchbegriffMonate',
          label: 'Suchbegriffe in der Statistik – nach Monaten',
          type: 'number',
          min: 1,
          max: 14,
          defaultValue: 3,
          admin: { width: '50%', description: 'Freitext kann Namen enthalten – deshalb kürzer als die übrige Statistik. Läuft immer automatisch.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'passUnterlagenTage',
          label: 'Passanträge: Ausweis, Foto, Erklärungen löschen – Tage nach Abschluss',
          type: 'number',
          min: 1,
          defaultValue: 30,
          admin: { width: '50%', description: 'Läuft immer automatisch. Der unterschriebene Passantrag bleibt (siehe rechts).' },
        },
        {
          name: 'passAntragMonate',
          label: 'Passanträge: Antrag aufbewahren – Monate nach Abschluss',
          type: 'number',
          min: 24,
          defaultValue: 24,
          admin: { width: '50%', description: 'Der unterschriebene Antrag muss 2 Jahre aufbewahrt werden. Danach werden Antrag und Formular automatisch gelöscht.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'passOffenMonate',
          label: 'Nie abgeschlossene Passanträge – nach Monaten',
          type: 'number',
          min: 1,
          defaultValue: 6,
          admin: { width: '50%', description: 'Status „eingereicht“ oder „Unterlagen fehlen“ ohne Änderung. Wird samt Ausweiskopie direkt gelöscht (kein Papierkorb).' },
        },
        {
          name: 'kontenMonate',
          label: 'Hinweis auf Mitgliedskonten ohne Anmeldung – nach Monaten',
          type: 'number',
          min: 6,
          defaultValue: 24,
          admin: { width: '50%', description: 'Wird nur angezeigt, nie automatisch gelöscht: Bitte selbst prüfen, ob die Person noch Mitglied ist.' },
        },
      ],
    },
    {
      name: 'personenPapierkorbTage',
      label: 'Web-Admin-Papierkorb – persönliche Daten nach Tagen endgültig löschen',
      type: 'number',
      min: 1,
      max: 90,
      defaultValue: 30,
      admin: {
        description:
          'Für Mitgliedsanträge, Mitgliedschaften, Kontakt- und Probetraining-Anfragen und Formular-Eingänge. Andere Inhalte (News, Seiten, Bilder …) bleiben so lange, wie unter Technik → Sicherheit eingestellt.',
      },
    },
    {
      name: 'automatisch',
      label: 'Automatisch aufräumen (einmal täglich in den Papierkorb verschieben)',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Empfohlen. Ohne Haken erinnert nur das Dashboard. Ablauf: Papierkorb (30 Tage zurückholbar) → Web-Admin-Papierkorb (Frist oben) → endgültig gelöscht. Liegengebliebene Passanträge werden direkt gelöscht.',
      },
    },
    // Einmalig: neue Standardwerte vom Oktober 2026 (u. a. „automatisch aufräumen“ an) für bestehende Installationen setzen
    { name: 'standardsOktober2026', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
}
