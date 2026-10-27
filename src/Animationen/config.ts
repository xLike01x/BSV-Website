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
      label: 'Vereinswappen',
      admin: {
        initCollapsed: false,
        description: 'Gestaltung mit dem BSV-Wappen. Jeder Teil einzeln abschaltbar. Bei „Bewegung reduzieren“ im Gerät steht alles still bzw. das Intro entfällt.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            haken('wappenIntro', 'Startseite: Wappen zeichnet sich beim ersten Besuch auf', 'Etwa 2 Sekunden, nur einmal pro Besuch (neuer Tab = neuer Besuch). Ein Klick überspringt es. Entfällt, wenn oben „Animationen auf der Website“ aus ist.'),
            haken('wappenStreifen', 'Schrägstreifen aus dem Wappen als Gestaltungselement', 'Große, ganz zarte Streifen im Hintergrund der Startseite und drei kleine Streifen vor den grauen bzw. farbigen Überschriften-Zeilen (z. B. „Über uns“).'),
            haken('wappenGlanz', 'Vereinsseite: großes Wappen mit Lichtreflex', 'Über der Überschrift der Vereinsseite. Mit der Maus kippt es leicht und ein Lichtschimmer wandert darüber; am Handy zieht der Schimmer ab und zu von selbst darüber.'),
            haken('wappenFusszeile', 'Fußzeile: großes Wappen als Wasserzeichen', 'Angeschnitten unten rechts in der Fußzeile, ganz dezent – auf allen Seiten.'),
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Spielecke (/spielecke)',
      admin: { initCollapsed: false, description: 'Kleine Spiele für die BSV Kids. Gespeichert werden Tageszahlen ohne Namen und – wenn die Rangliste an ist – Spitzname, Ergebnis und Zeitpunkt (keine IP-Adressen, keine Konten).' },
      fields: [
        {
          type: 'row',
          fields: [
            haken('elfmeter', 'Spiel „Elfmeterschießen“'),
            haken('hochhalten', 'Spiel „Ball hochhalten“'),
            haken('memory', 'Spiel „Memory“ (6 × 6)'),
            haken('huetchen', 'Spiel „Hütchenspiel“ (für die Kleinen)'),
          ],
        },
        {
          type: 'row',
          fields: [
            haken('rangliste', 'Rangliste mit Spitznamen (7, 14, 30 Tage, Allzeit)', 'Kinder tippen selbst einen Spitznamen ein; ein Filter sperrt Schimpfwörter, Links und lange Zahlen. Einträge unter Website-Aufbau → „Spielecke-Rangliste“ prüfen und löschen.'),
            {
              name: 'ranglisteFreigabe',
              label: 'Spitznamen erst nach Freigabe zeigen',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '50%', condition: (d) => d?.rangliste !== false, description: 'Dann erscheint ein Eintrag erst, wenn ihn jemand unter „Spielecke-Rangliste“ auf „In der Rangliste sichtbar“ setzt.' },
            },
          ],
        },
      ],
    },
  ],
}
