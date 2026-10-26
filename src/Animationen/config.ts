import type { GlobalConfig } from 'payload'

import { ausblendenAusserBereich, bereichZugriff } from '@/access/roles'

import { anyone } from '../access/anyone'
import { revalidateAllesGlobal } from '../hooks/revalidateAlles'

const haken = (name: string, label: string, description?: string) =>
  ({ name, label, type: 'checkbox', defaultValue: true, admin: { width: '50%', ...(description ? { description } : {}) } }) as const

/**
 * Website-Aufbau → Animationen: bewegte Effekte und die Spielecke ein- und ausschalten.
 * Das Layout setzt für ausgeschaltete Effekte data-anim-…="aus" am <body>; CSS und Komponenten richten sich danach.
 * Gleiche Berechtigung wie „Texte & Bilder“ (Bereich Seiten).
 */
export const Animationen: GlobalConfig = {
  slug: 'animationen',
  label: 'Animationen',
  access: { read: anyone, update: bereichZugriff('seiten') },
  admin: {
    group: 'Website-Aufbau',
    hidden: ausblendenAusserBereich('seiten'),
    description:
      'Bewegte Effekte und Spiele auf der Website. Alle sind dezent und starten erst, wenn man hinscrollt. Wer im Handy oder am PC „Bewegung reduzieren“ eingestellt hat, sieht die Effekte nicht.',
  },
  hooks: { afterChange: [revalidateAllesGlobal] },
  fields: [
    {
      name: 'alle',
      label: 'Animationen auf der Website',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Haken raus = die ganze Website ohne Bewegung (auch Einblenden, Laufband, Handy, Spielfeld). Inhalte bleiben gleich. Die Spielecke hat eigene Schalter (unten).' },
    },
    {
      type: 'collapsible',
      label: 'Einzelne Effekte',
      admin: { condition: (d) => d?.alle !== false, initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            haken('reglerBall', 'Altersregler: Ball rollt mit'),
            haken('countdown', 'Countdown: Ziffern klappen um, Konfetti am Tag selbst'),
            haken('pulslinie', 'Startseite, Kachel Fitness: Pulslinie'),
            haken('kreide', 'Große Überschriften: Kreidestrich'),
            haken('fehlerseite', '„Seite nicht gefunden“: Ball geht daneben'),
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Spielecke (/spielecke)',
      admin: { initCollapsed: false, description: 'Kleine Spiele für die BSV Kids. Es wird nichts gespeichert – keine Namen, keine Bestenliste; die Punkte gelten nur, solange die Seite offen ist.' },
      fields: [
        {
          type: 'row',
          fields: [
            haken('elfmeter', 'Spiel „Elfmeterschießen“'),
            haken('hochhalten', 'Spiel „Ball hochhalten“'),
          ],
        },
      ],
    },
  ],
}
