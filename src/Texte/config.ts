import type { Field, GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isEditor } from '../access/roles'
import { revalidateAllesGlobal } from '../hooks/revalidateAlles'

/**
 * Alle festen Überschriften und Texte der Website an einer Stelle.
 * Platzhalter in geschweiften Klammern werden automatisch ersetzt:
 * {mitglieder}, {teams}, {kurse}, {angebote}, {kinder}, {gruendung}
 */
const text = (name: string, label: string, defaultValue: string, lang = false): Field =>
  lang ? { name, label, type: 'textarea', defaultValue } : { name, label, type: 'text', defaultValue }

const gruppe = (name: string, label: string, fields: Field[]): Field => ({
  type: 'group',
  name,
  label,
  admin: { hideGutter: true },
  fields,
})

export const Texte: GlobalConfig = {
  slug: 'texte',
  label: 'Website-Texte',
  access: { read: anyone, update: isEditor },
  admin: {
    group: 'Inhalte',
    description: 'Überschriften und Texte der Website. Platzhalter: {mitglieder}, {teams}, {kurse}, {angebote}, {kinder}, {gruendung}. Ein Zeilenumbruch in Überschriften wird übernommen.',
  },
  hooks: { afterChange: [revalidateAllesGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Startseite',
          fields: [
            text('heroTitel', 'Große Überschrift', 'Bewegung\nfür alle.', true),
            text('heroHand', 'Handschrift darunter', 'von 1 bis 99 Jahren'),
            text('heroText', 'Einleitung', 'Tanzen, Turnen, Fußball, Fitness, Yoga und Walking am Rhein – in Büderich, mit über {mitglieder} Mitgliedern und ganz viel Herz. Schnuppern ist überall erwünscht!', true),
            text('alterFrage', 'Altersregler: Frage', 'Wie alt bist du?'),
            text('weltenTitel', 'Überschrift „Welten“', 'Ein Verein.\nDrei Welten.', true),
            gruppe('kachelFussball', 'Kachel Fußball', [
              text('titel', 'Titel', '{teams} Teams. Ein neuer Kunstrasen.'),
              text('text', 'Text', 'Von Buddy’s Fußballzwergen ab 3 Jahren bis zu den Alten Herren – dazu Damen und Mädchenteams.', true),
            ]),
            gruppe('kachelKids', 'Kachel BSV Kids', [text('titel', 'Titel', 'Hüpfen. Tanzen. Turnen.')]),
            gruppe('kachelFitness', 'Kachel Fitness', [
              text('titel', 'Titel', 'Dein Puls. Dein Tempo.'),
              text('text', 'Text', 'Step & Burn, Zumba, Pilates, Yoga, Spinning, Rehasport und mehr.'),
            ]),
            gruppe('kachelMitglieder', 'Kachel Mitgliederbereich', [
              text('titel', 'Titel', 'Training fällt aus?\nDu weißt es zuerst.', true),
              text('text', 'Text', 'Ausfälle deiner Kurse, Vereinstermine und deine Anmeldungen – alles an einem Ort, auch auf dem Handy.', true),
            ]),
            text('finderTitel', 'Angebotsfinder: Überschrift', 'Finde deinen Sport.'),
            text('newsTitel', 'News: Überschrift', 'Neues aus dem BSV.'),
            text('mitgliedTitel', 'Mitglied werden: Überschrift', 'In fünf Minuten\nMitglied.', true),
            text('mitgliedText', 'Mitglied werden: Text', 'Ab 5 € im Monat, alle Kurse inklusive. Antrag, Beitragsrechner und SEPA-Mandat – alles online.', true),
          ],
        },
        {
          label: 'Fußball',
          name: 'fussball',
          fields: [
            text('titel', 'Überschrift', '{teams} Teams.\nEine Leidenschaft.', true),
            text('text', 'Einleitung', '{kinder} Kinder in der Jugend, Damen- und Mädchenfußball, und die Erste stand erstmals im Kreispokal-Finale. Trainiert wird im Kutscher-Remy-Sportpark – seit 2026 auf Kunstrasen.', true),
            text('mitspielenTitel', 'Box „Mitspielen“: Titel', 'Lust mitzuspielen?'),
          ],
        },
        {
          label: 'Breitensport',
          name: 'breitensport',
          fields: [
            text('titel', 'Überschrift', '{kurse} Kurse.\nFür jedes Alter.', true),
            text('text', 'Einleitung', 'Von den Nappy Dancers ab 1,5 Jahren bis zum Seniorenturnen. Unsere Übungsleitenden sind zum Teil lizenziert – und Schnuppern ist ausdrücklich erwünscht.', true),
            text('schnupperTitel', 'Abschluss: Titel', 'Erst schnuppern.\nDann entscheiden.', true),
            text('schnupperText', 'Abschluss: Text', 'Unsere Angebote richten sich an Mitglieder. Zum Ausprobieren bist du trotzdem jederzeit willkommen – auf jeder Kursseite kannst du ein Probetraining anfragen.', true),
          ],
        },
        {
          label: 'Verein',
          name: 'verein',
          fields: [
            text('titel', 'Überschrift', 'Seit {gruendung}\nin Büderich.', true),
            text('text', 'Einleitung', '{mitglieder} Mitglieder, ein Verein für Fußball und Breitensport – getragen von Ehrenamtlichen, Übungsleitenden und vielen helfenden Händen.', true),
            text('vorstandText', 'Vorstand: Text', 'Ansprechpersonen für alles rund um den Verein. Kontakt läuft über das Formular – E-Mail-Adressen und Telefonnummern bleiben geschützt.', true),
            text('beitraegeText', 'Beiträge: Text', 'Vierteljährlich per Lastschrift, jeweils zum 1. eines Quartals. Alle Kurse und Teams inklusive.', true),
            text('shopTitel', 'Shop: Überschrift', 'Zeig, wo du hingehörst.'),
          ],
        },
        {
          label: 'Weitere Seiten',
          fields: [
            gruppe('news', 'News', [
              text('titel', 'Überschrift', 'Newsroom'),
              text('text', 'Text', 'Was im BSV los ist – auf dem Platz, in der Halle, im Verein.'),
            ]),
            gruppe('termine', 'Termine', [
              text('titel', 'Überschrift', 'Termine'),
              text('text', 'Text', 'Feste, Turniere, Versammlungen – alles, was im BSV ansteht.'),
            ]),
            gruppe('kontakt', 'Kontakt', [
              text('titel', 'Überschrift', 'Sag Hallo.'),
              text('text', 'Text', 'Fragen zu Teams, Kursen, Mitgliedschaft oder Sponsoring? Schreib uns – die Nachricht landet direkt bei der richtigen Person.', true),
            ]),
            gruppe('antrag', 'Mitglied werden', [
              text('titel', 'Überschrift', 'Anmelden beim BSV.'),
              text('text', 'Text', 'Wähle deine Teams und Kurse, gib deine Daten ein, fertig. Die Übungsleitungen werden automatisch informiert.', true),
            ]),
            gruppe('probetraining', 'Probetraining (auf jeder Team-/Kursseite)', [
              text('titel', 'Überschrift', 'Einfach mal reinschnuppern.'),
            ]),
          ],
        },
      ],
    },
  ],
}
