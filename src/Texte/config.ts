import { ausblendenAusserBereich, bereichZugriff } from '@/access/roles'
import type { Field, GlobalConfig } from 'payload'

import { anyone } from '../access/anyone'
import { revalidateAllesGlobal } from '../hooks/revalidateAlles'
import { standardTexte, zusammenfuehren } from './standard'
import { sichereAdresse } from '@/fields/sichereAdresse'

/**
 * Alle festen Überschriften und Texte der Website an einer Stelle.
 * Platzhalter in geschweiften Klammern werden automatisch ersetzt:
 * {mitglieder}, {teams}, {kurse}, {angebote}, {kinder}, {gruendung}, {abMonat}
 */
// Unter jedem Feld: „Auf der Website zeigen ↗“ (öffnet die Seite und markiert den Text)
const zeigen = { components: { afterInput: ['@/Texte/WoSteht'] } }
const text = (name: string, label: string, defaultValue: string, lang = false): Field =>
  lang ? { name, label, type: 'textarea', defaultValue, admin: zeigen } : { name, label, type: 'text', defaultValue, admin: zeigen }

/** Bild aus der Mediathek (wird beim Speichern auf der Website sichtbar) */
const bild = (name: string, label: string, description?: string): Field => ({ name, label, type: 'upload', relationTo: 'media', ...(description ? { admin: { description } } : {}) })

const gruppe = (name: string, label: string, fields: Field[]): Field => ({
  type: 'group',
  name,
  label,
  admin: { hideGutter: true },
  fields,
})

export const Texte: GlobalConfig = {
  slug: 'texte',
  label: 'Texte & Bilder',
  access: { read: anyone, update: bereichZugriff('seiten') },
  admin: {
    group: 'Website-Aufbau',
    hidden: ausblendenAusserBereich('seiten'),
    description: 'Texte und Bilder der Website – ein Reiter pro Seite, von oben nach unten. Platzhalter: {mitglieder}, {teams}, {kurse}, {angebote}, {kinder}, {gruendung}, {abMonat} (günstigster Monatsbeitrag aus den Vereinsdaten). Ein Zeilenumbruch in Überschriften wird übernommen.',
  },
  hooks: {
    // Leere Felder zeigen in der Verwaltung den Text, der auch auf der Website steht
    afterRead: [({ doc, global }) => zusammenfuehren(standardTexte(global.fields as Field[]), doc as Record<string, unknown>)],
    afterChange: [revalidateAllesGlobal],
  },
  fields: [
    // Einmalige Übernahme der Bilder und der Aktions-Box (früher „Vereinsdaten“ bzw. „Startseite & Bilder“) erledigt?
    { name: 'bilderUebernommen', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Startseite',
          description:
            'Alles auf der Startseite – von oben nach unten: Bilder, Texte und die grüne Aktions-Box. Die Zahlen (Mitglieder, Kinder, Gründungsjahr) stehen unter „Vereinsdaten“; die Anzahl der Teams & Kurse wird automatisch gezählt. Menü und Fußzeile: „Menü & Fußzeile“.',
          fields: [
            {
              type: 'collapsible',
              label: 'Bilder oben und Kachel-Bilder',
              admin: { initCollapsed: false },
              fields: [
                { name: 'heroBilder', label: 'Bilder oben (bis zu 4)', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 4, admin: { description: 'Querformat sieht am besten aus. Bild entfernen: ×, neues wählen: „Aus vorhandenen auswählen“.' } },
                {
                  type: 'row',
                  fields: [
                    { name: 'heroTag1', label: 'Schild 1 (auf den Bildern)', type: 'text', defaultValue: 'Tanzmäuse · 3–6 J.' },
                    { name: 'heroTag2', label: 'Schild 2', type: 'text', defaultValue: 'Mädchenfußball' },
                  ],
                },
                {
                  type: 'row',
                  fields: [bild('bildFussball', 'Kachel Fußball', 'Auch das Titelbild der Fußball-Seite.'), bild('bildKids', 'Kachel BSV Kids'), bild('bildFitness', 'Kachel Fitness')],
                },
              ],
            },
            text('heroTitel', 'Große Überschrift', 'Bewegung\nfür alle.', true),
            text('heroHand', 'Handschrift darunter', 'von 1 bis 99 Jahren'),
            text('heroText', 'Einleitung', 'Tanzen, Turnen, Fußball, Fitness, Yoga und Walking am Rhein – in Büderich, mit über {mitglieder} Mitgliedern und ganz viel Herz. Schnuppern ist überall erwünscht!', true),
            text('alterFrage', 'Altersregler: Frage', 'Wie alt bist du?'),
            text('alterKeinTreffer', 'Altersregler: wenn nichts passt', 'Schreib uns – wir finden etwas Passendes.'),
            {
              type: 'row',
              fields: [
                text('zahlMitglieder', 'Zahlen-Leiste: unter Mitgliederzahl', 'Mitglieder'),
                text('zahlAngebote', 'unter Anzahl Teams & Kurse', 'Teams und Kurse'),
                text('zahlKinder', 'unter Kinderzahl', 'Kinder in der Fußballjugend'),
                text('zahlGruendung', 'unter Gründungsjahr', 'gegründet'),
              ],
            },
            text('weltenTitel', 'Überschrift „Welten“', 'Ein Verein.\nDrei Welten.', true),
            gruppe('kachelFussball', 'Kachel Fußball', [
              text('label', 'Kleine Überschrift', 'Fußball'),
              text('titel', 'Titel', '{teams} Teams. Ein neuer Kunstrasen.'),
              text('text', 'Text', 'Von Buddy’s Fußballzwergen ab 3 Jahren bis zu den Alten Herren – dazu Damen und Mädchenteams.', true),
              text('link', 'Link-Text', 'Teams entdecken ›'),
            ]),
            gruppe('kachelKids', 'Kachel BSV Kids', [text('label', 'Kleine Überschrift', 'BSV Kids'), text('titel', 'Titel', 'Hüpfen. Tanzen. Turnen.')]),
            gruppe('kachelFitness', 'Kachel Fitness', [
              text('label', 'Kleine Überschrift', 'Fitness & Gesundheit'),
              text('titel', 'Titel', 'Dein Puls. Dein Tempo.'),
              text('text', 'Text', 'Step & Burn, Zumba, Pilates, Yoga, Spinning, Rehasport und mehr.'),
            ]),
            gruppe('kachelMitglieder', 'Kachel Mitgliederbereich', [
              text('label', 'Kleine Überschrift', 'Mitgliederbereich'),
              text('titel', 'Titel', 'Training fällt aus?\nDu weißt es zuerst.', true),
              text('text', 'Text', 'Ausfälle deiner Kurse, Vereinstermine und deine Anmeldungen – alles an einem Ort, auch auf dem Handy.', true),
              text('link', 'Link-Text', 'Zum Mitgliederbereich ›'),
              text('handyTitel', 'Handy-Bild: Absender', 'BSV 1919 · jetzt'),
              text('handyText', 'Handy-Bild: Nachricht', 'Spinning fällt heute aus. Nächster Termin wie gewohnt.'),
            ]),
            text('finderTitel', 'Angebotsfinder: Überschrift', 'Finde deinen Sport.'),
            text('finderLink', 'Angebotsfinder: Text auf den Karten', 'Probetraining ›'),
            // Name bewusst nicht „newsTitel“: der kollidierte in der Datenbank mit Gruppe „news“ → „titel“
            text('newsUeberschrift', 'News: Überschrift', 'Neues aus dem BSV.'),
            text('newsLink', 'News: Link-Text', 'Alle News ›'),
            {
              name: 'newsAutomatisch',
              label: 'News-Leiste läuft von selbst weiter',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Alle 6 Sekunden zur nächsten News – Pause, sobald jemand mit der Maus darauf zeigt oder wischt. Ohne Haken blättert man nur selbst (Punkte, Pfeile, Wischen).' },
            },
            text('mitgliedTitel', 'Mitglied werden: Überschrift', 'In fünf Minuten\nMitglied.', true),
            text('mitgliedText', 'Mitglied werden: Text', 'Ab {abMonat} € im Monat, alle Kurse inklusive. Antrag, Beitragsrechner und SEPA-Mandat – alles online.', true),
            gruppe('schritte', 'Mitglied werden: drei Schritte', [
              { type: 'row', fields: [text('t1', 'Schritt 1: Titel', 'Probetraining'), text('d1', 'Schritt 1: Text', 'Angebot wählen, Termin anfragen, vorbeikommen.')] },
              { type: 'row', fields: [text('t2', 'Schritt 2: Titel', 'Online-Antrag'), text('d2', 'Schritt 2: Text', 'Teams und Kurse auswählen, Beitrag berechnen, fertig.')] },
              { type: 'row', fields: [text('t3', 'Schritt 3: Titel', 'Loslegen'), text('d3', 'Schritt 3: Text', 'Zugang zum Mitgliederbereich inklusive.')] },
              text('button', 'Text auf dem Button', 'Jetzt Mitglied werden'),
            ]),
            {
              type: 'group',
              name: 'aktion',
              label: 'Grüne Aktions-Box',
              admin: { description: 'Ein großer grüner Hinweis auf der Startseite – z. B. für ein Projekt, ein Fest oder eine Spendenaktion.' },
              fields: [
                { name: 'aktiv', label: 'Anzeigen', type: 'checkbox', defaultValue: true, admin: { description: 'Haken entfernen = Box ausblenden. Der Inhalt bleibt für später gespeichert.' } },
                { name: 'kicker', label: 'Überzeile', type: 'text', defaultValue: 'Kunstrasen 2026' },
                { name: 'titel', label: 'Titel', type: 'text', defaultValue: 'Eröffnet – mit Schalke 04.' },
                { name: 'text', label: 'Text', type: 'textarea' },
                {
                  type: 'row',
                  fields: [
                    { name: 'linkText', label: 'Button-Text', type: 'text', defaultValue: 'Mehr zum Projekt' },
                    { name: 'linkUrl', label: 'Button-Link', type: 'text', defaultValue: '/kunstrasen', validate: sichereAdresse, admin: { description: 'z. B. /kunstrasen oder https://…' } },
                  ],
                },
                bild('bild', 'Bild (z. B. Plakat)', 'Hochformat sieht am besten aus.'),
              ],
            },
            {
              type: 'group',
              name: 'countdown',
              label: 'Veranstaltungs-Countdown',
              admin: {
                description:
                  'Welche Veranstaltung heruntergezählt wird, stellst du beim Termin ein: Inhalte → Termine → Termin öffnen → rechts Haken „Countdown auf der Startseite“. Hier stehen nur die Wörter, die bei jedem Countdown gleich sind.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [text('kicker', 'Überzeile', 'Bald im BSV'), text('linkText', 'Button-Text', 'Alle Infos zum Termin ›')],
                },
              ],
            },
          ],
        },
        {
          label: 'Fußball',
          name: 'fussball',
          description: 'Das Titelbild der Fußball-Seite ist die „Kachel Fußball“ im Reiter „Startseite“.',
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
            { type: 'row', fields: [bild('bild1', 'Bild 1 (oben)'), bild('bild2', 'Bild 2'), bild('bild3', 'Bild 3')] },
            text('titel', 'Überschrift', '{kurse} Kurse.\nFür jedes Alter.', true),
            text('text', 'Einleitung', 'Von den Nappy Dancers ab 1,5 Jahren bis zum Seniorenturnen. Unsere Trainerinnen und Trainer sind zum Teil lizenziert – und Schnuppern ist ausdrücklich erwünscht.', true),
            text('schnupperTitel', 'Abschluss: Titel', 'Erst schnuppern.\nDann entscheiden.', true),
            text('schnupperText', 'Abschluss: Text', 'Unsere Angebote richten sich an Mitglieder. Zum Ausprobieren bist du trotzdem jederzeit willkommen – auf jeder Kursseite kannst du ein Probetraining anfragen.', true),
          ],
        },
        {
          label: 'Verein',
          name: 'verein',
          fields: [
            bild('titelbild', 'Titelbild der Vereinsseite'),
            text('titel', 'Überschrift', 'Seit {gruendung}\nin Büderich.', true),
            text('text', 'Einleitung', '{mitglieder} Mitglieder, ein Verein für Fußball und Breitensport – getragen von Ehrenamtlichen, Trainerinnen und Trainern und vielen helfenden Händen.', true),
            text('vorstandText', 'Vorstand: Text', 'Ansprechpersonen für alles rund um den Verein. Kontakt läuft über das Formular – E-Mail-Adressen und Telefonnummern bleiben geschützt.', true),
            text('beitraegeText', 'Beiträge: Text', 'Vierteljährlich per Lastschrift, jeweils zum 1. eines Quartals. Alle Kurse und Teams inklusive.', true),
            text('shopTitel', 'Shop: Überschrift', 'Zeig, wo du hingehörst.'),
          ],
        },
        {
          label: 'Weitere Seiten',
          fields: [
            gruppe('fusszeile', 'Fußzeile (unten auf jeder Seite)', [
              { type: 'row', fields: [text('sponsor', 'Text vor dem Sponsor-Logo', 'Hauptsponsor'), text('sponsorLink', 'Link „Sponsor werden“', 'Sponsor werden ›')] },
            ]),
            {
              type: 'group',
              name: 'webApp',
              label: 'Web-App (für alle Besucher)',
              admin: {
                hideGutter: true,
                description: 'Hinweise zum Installieren der Website als App: Kachel auf der Startseite, Zeile bei den Trainingszeiten und Link in der Fußzeile. In der installierten App werden sie automatisch ausgeblendet.',
              },
              fields: [
                { type: 'row', fields: [text('label', 'Kachel: Kleine Überschrift', 'Web-App'), text('titel', 'Kachel: Titel', 'Der BSV auf\ndeinem Startbildschirm.', true)] },
                text('text', 'Kachel: Text', 'Trainingszeiten, Termine und News mit einem Tipp – kostenlos, ohne App-Store und ohne Anmeldung. Benachrichtigungen bei Ausfällen folgen in Kürze.', true),
                { type: 'row', fields: [text('knopf', 'Kachel: Knopf', 'App installieren'), text('fusszeile', 'Link in der Fußzeile', 'Als App installieren')] },
                text('trainingszeiten', 'Zeile bei den Trainingszeiten', 'Immer griffbereit: Trainingszeiten als App auf dem Startbildschirm.'),
              ],
            },
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
              text('text', 'Text', 'Wähle deine Teams und Kurse, gib deine Daten ein, fertig. Die Trainer werden automatisch informiert.', true),
            ]),
            gruppe('sponsoren', 'Sponsoren', [
              text('titel', 'Überschrift', 'Danke an unsere Partner.'),
              text('text', 'Text', 'Ohne sie gäbe es keinen Kunstrasen, keine Trikots und keine Turniere. Du möchtest den BSV auch unterstützen? Wir freuen uns auf dich.', true),
            ]),
            gruppe('galerie', 'Galerie', [
              text('titel', 'Überschrift', 'Momente im BSV.'),
              text('text', 'Text', 'Feste, Turniere und Training – Fotos aus dem Vereinsleben.'),
            ]),
            gruppe('mitmachen', 'Mitmachen / Ehrenamt', [
              text('titel', 'Überschrift', 'Mach mit!'),
              text('text', 'Text', 'Der BSV lebt vom Ehrenamt. Ob eine Stunde im Monat oder jede Woche auf dem Platz – jede Hilfe zählt. Schau, was gerade gebraucht wird.', true),
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
