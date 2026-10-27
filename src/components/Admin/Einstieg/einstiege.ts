import type { Schritt } from '../Hilfe/Zusammenhang'
import { VORLAGEN as FORMULAR_VORLAGEN } from '../Formulare/vorlagen'
import { heuteText, inTagen, naechsterSamstag, richText } from './lexical'

/**
 * Einstiegs-Kästen über den Listen: Wozu ist der Bereich da, wie läuft es ab – und (wo sinnvoll)
 * mit einer Vorlage in einem Klick starten. Texte hier pflegen.
 *
 * Vorlagen-Arten:
 * - anlegen:   legt sofort einen Eintrag an (bei News/Seiten als Entwurf) und öffnet ihn
 * - vorfuellen: öffnet „Neu erstellen“ mit vorausgefüllten Feldern – gespeichert wird erst beim Klick auf Speichern
 */
export type Vorlage = {
  key: string
  symbol: string
  titel: string
  text: string
  art: 'anlegen' | 'vorfuellen'
  /** Felder (bei „vorfuellen“ Feldpfade wie „title“) */
  daten: () => Record<string, unknown>
}

export type Einstieg = {
  titel: string
  text: string
  /** Zusatzsatz nur für Team-Rollen (Übungsleitung/Team-Redaktion) */
  textTeam?: string
  ablauf?: Schritt[]
  ablaufTitel?: string
  aktiv?: string
  vorlagen?: Vorlage[]
  vorlagenTitel?: string
  /** Vorlagen brauchen ein Team (Team-Rollen mit mehreren Teams wählen es vorher) */
  teamFeld?: string
  /** Sonder-Baustein im Kasten */
  extra?: 'ausfall-schnell'
}

const L = (s: string) => `/admin/collections/${s}`

export const EINSTIEGE: Record<string, Einstieg> = {
  posts: {
    titel: 'Wozu sind News da?',
    text: 'News erzählen, was im Verein passiert: Spielberichte, Ankündigungen, Rückblicke. Vereins-News erscheinen im Newsroom und auf der Startseite. Die Überschrift „Newsroom“ und den Satz darunter änderst du unter Texte & Bilder → Reiter „Weitere Seiten“ → News.',
    textTeam: 'Deine Team-News erscheinen auf der Seite deines Teams. Soll eine auch auf die Startseite, hakst du rechts „Für die Startseite vorschlagen“ an – die Redaktion entscheidet.',
    ablauf: [
      { key: 'schreiben', titel: 'Schreiben', text: 'Titel und Text – kurz und konkret.', wo: 'News → Neu erstellen' },
      { key: 'bild', titel: 'Titelbild wählen', text: 'Ein Foto macht die News sichtbar.', href: L('media'), wo: 'aus der Mediathek' },
      { key: 'team', titel: 'Team auswählen', text: 'Leer lassen für Vereins-News.', wo: 'rechts „Team / Kurs“' },
      { key: 'veroeffentlichen', titel: 'Veröffentlichen', text: 'Oder als Entwurf speichern bzw. für später planen.', wo: 'oben rechts' },
      { key: 'website', titel: 'Erscheint auf der Website', text: 'Teamseite, Newsroom – und auf Wunsch der Redaktion auf der Startseite.', wo: 'Website' },
    ],
    vorlagenTitel: 'Mit einer Vorlage starten',
    teamFeld: 'team',
    vorlagen: [
      {
        key: 'spielbericht',
        symbol: '⚽',
        titel: 'Spielbericht',
        text: 'Ergebnis, Spielverlauf, Ausblick aufs nächste Spiel.',
        art: 'anlegen',
        daten: () => ({
          title: `Spielbericht vom ${heuteText()}`,
          content: richText([
            { p: 'Ergebnis: [z. B. BSV – Gegner 3:1]' },
            { h: 'h2', p: 'So lief das Spiel' },
            { p: '[Zwei, drei Sätze zum Spielverlauf: Tore, starke Szenen, Stimmung.]' },
            { h: 'h2', p: 'Ausblick' },
            { p: '[Nächstes Spiel: Datum, Gegner, Ort.]' },
          ]),
        }),
      },
      {
        key: 'ankuendigung',
        symbol: '📣',
        titel: 'Ankündigung',
        text: 'Was, wann, wo – und was man mitbringen muss.',
        art: 'anlegen',
        daten: () => ({
          title: 'Ankündigung: [Was passiert?]',
          content: richText([
            { p: '[Worum geht es? Ein Satz.]' },
            { liste: ['Wann: [Datum, Uhrzeit]', 'Wo: [Ort]', 'Wer: [für wen?]', 'Mitbringen: [falls nötig]'] },
            { p: 'Fragen? [Ansprechperson]' },
          ]),
        }),
      },
      {
        key: 'rueckblick',
        symbol: '📸',
        titel: 'Rückblick mit Fotos',
        text: 'Für Feste, Turniere und Ausflüge – Text plus Bilder.',
        art: 'anlegen',
        daten: () => ({
          title: 'Rückblick: [Veranstaltung]',
          content: richText([
            { p: '[Was war los? Zwei, drei Sätze.]' },
            { h: 'h2', p: 'Danke' },
            { p: '[An Helferinnen, Helfer und Sponsoren.]' },
            { p: 'Tipp: Bilder fügst du über das Plus-Zeichen im Text („Bild oder Video“) ein.' },
          ]),
        }),
      },
      {
        key: 'angebot',
        symbol: '🆕',
        titel: 'Neues Angebot',
        text: 'Neuer Kurs oder neue Mannschaft – mit Zeiten und Probetraining.',
        art: 'anlegen',
        daten: () => ({
          title: 'Neu im BSV: [Name des Angebots]',
          content: richText([
            { p: '[Ab wann gibt es das Angebot? Für wen ist es gedacht?]' },
            { liste: ['Wann: [Wochentag, Uhrzeit]', 'Wo: [Halle/Platz]', 'Für wen: [Alter, Vorkenntnisse]', 'Leitung: [Name]'] },
            { p: 'Einfach vorbeikommen und kostenlos mitmachen – Probetraining über die Seite des Angebots anfragen.' },
          ]),
        }),
      },
      {
        key: 'glueckwunsch',
        symbol: '🏅',
        titel: 'Glückwunsch & Ehrung',
        text: 'Meisterschaft, Aufstieg, Jubiläum oder Ehrung.',
        art: 'anlegen',
        daten: () => ({
          title: 'Herzlichen Glückwunsch: [Wer und wofür?]',
          content: richText([
            { p: '[Was wurde erreicht? Ein, zwei Sätze.]' },
            { h: 'h2', p: 'So kam es dazu' },
            { p: '[Kurzer Rückblick: Saison, Weg, besondere Momente.]' },
            { p: 'Der ganze Verein gratuliert!' },
          ]),
        }),
      },
      {
        key: 'hinweis',
        symbol: '⚠️',
        titel: 'Wichtiger Hinweis',
        text: 'Platzsperre, geänderte Zeiten, Hallenschließung.',
        art: 'anlegen',
        daten: () => ({
          title: 'Wichtig: [Was ändert sich?]',
          content: richText([
            { p: '[Was genau ändert sich – und warum?]' },
            { liste: ['Betrifft: [Teams/Kurse]', 'Ab: [Datum]', 'Bis: [Datum oder „bis auf Weiteres“]'] },
            { p: 'Fragen? [Ansprechperson]' },
          ]),
        }),
      },
      {
        key: 'helfer',
        symbol: '🙋',
        titel: 'Helfer gesucht',
        text: 'Aufruf für Fest, Turnier oder Arbeitseinsatz.',
        art: 'anlegen',
        daten: () => ({
          title: 'Helfer gesucht: [Wofür?]',
          content: richText([
            { p: '[Wofür brauchen wir Unterstützung? Wann und wo?]' },
            { liste: ['Aufgaben: [z. B. Grill, Kuchentheke, Aufbau]', 'Zeit: [z. B. zwei Stunden]'] },
            { p: 'Wer helfen mag: einfach über die Seite „Mitmachen“ oder das Kontaktformular melden. Danke!' },
          ]),
        }),
      },
      {
        key: 'leer',
        symbol: '➕',
        titel: 'Leere News',
        text: 'Alles selbst schreiben.',
        art: 'anlegen',
        daten: () => ({ title: 'Neue News', content: richText([{ p: '' }]) }),
      },
    ],
  },

  termine: {
    titel: 'Wozu sind Termine da?',
    text: 'Termine erscheinen im Kalender der Website (Seite „Termine“), die nächsten auch im Mitgliederbereich. Trainingszeiten gehören nicht hierher – die stehen beim Team.',
    ablauf: [
      { key: 'titel', titel: 'Titel und Datum', text: 'Z. B. „Sommerfest“, Beginn und optional Ende.' },
      { key: 'ort', titel: 'Ort und Bereich', text: 'Der Bereich bestimmt die Farbe im Kalender.' },
      { key: 'sichtbar', titel: 'Für wen?', text: 'Optional nur für Mitglieder sichtbar.' },
      { key: 'countdown', titel: 'Countdown (optional)', text: 'Zählt auf der Startseite bis zur Veranstaltung herunter – nur bei Terminen, die alle sehen dürfen.', wo: 'rechts' },
      { key: 'speichern', titel: 'Speichern', text: 'Sofort sichtbar – ohne Veröffentlichen.', wo: 'oben rechts' },
      { key: 'website', titel: 'Im Kalender', text: 'Nach dem Tag verschwindet er automatisch aus dem Kalender. Mit „Wiederholen“ erscheint eine Serie einzeln.', href: '/termine', wo: 'Website → Termine' },
    ],
    vorlagenTitel: 'Mit einer Vorlage starten (wird erst beim Speichern angelegt)',
    vorlagen: [
      {
        key: 'fest',
        symbol: '🎉',
        titel: 'Vereinsfest',
        text: 'Samstag ab 14 Uhr am Sportpark.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Sommerfest', beginn: naechsterSamstag(14), ende: naechsterSamstag(20), bereich: 'verein', beschreibung: 'Für Groß und Klein: Essen, Getränke, Spiele. Alle sind herzlich eingeladen!' }),
      },
      {
        key: 'versammlung',
        symbol: '🗳️',
        titel: 'Versammlung',
        text: 'Abends, nur für Mitglieder.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Jahreshauptversammlung', beginn: inTagen(14, 19), bereich: 'verein', nurMitglieder: true, beschreibung: 'Tagesordnung folgt per E-Mail.' }),
      },
      {
        key: 'turnier',
        symbol: '🏆',
        titel: 'Turnier',
        text: 'Samstag ab 10 Uhr, Bereich Fußball.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Turnier', beginn: naechsterSamstag(10), ende: naechsterSamstag(17), bereich: 'fussball', beschreibung: 'Zuschauer willkommen – für Essen und Getränke ist gesorgt.' }),
      },
      {
        key: 'arbeitseinsatz',
        symbol: '🛠️',
        titel: 'Arbeitseinsatz',
        text: 'Samstag 9–13 Uhr, Platz und Heim auf Vordermann.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Arbeitseinsatz am Sportpark', beginn: naechsterSamstag(9), ende: naechsterSamstag(13), bereich: 'verein', beschreibung: 'Gemeinsam machen wir Platz und Vereinsheim fit. Bitte Arbeitshandschuhe mitbringen – für Getränke und Verpflegung ist gesorgt.' }),
      },
      {
        key: 'weihnachtsfeier',
        symbol: '🎄',
        titel: 'Weihnachtsfeier',
        text: 'Abends im Vereinsheim, für Mitglieder.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Weihnachtsfeier', beginn: inTagen(21, 18), ende: inTagen(21, 22), bereich: 'verein', nurMitglieder: true, beschreibung: 'Gemütliches Beisammensein zum Jahresabschluss. Bitte kurz Bescheid geben, wer kommt.' }),
      },
      {
        key: 'kinder',
        symbol: '🧸',
        titel: 'Kinderfest',
        text: 'Spiele und Mitmach-Aktionen, Bereich BSV Kids.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Kinderfest', beginn: naechsterSamstag(11), ende: naechsterSamstag(15), bereich: 'kids', beschreibung: 'Hüpfburg, Torwandschießen, Kinderschminken und vieles mehr. Eltern und Geschwister sind herzlich willkommen!' }),
      },
      {
        key: 'kurs',
        symbol: '🧘',
        titel: 'Schnupperkurs',
        text: 'Neuer Kurs zum Ausprobieren, Bereich Breitensport.',
        art: 'vorfuellen',
        daten: () => ({ title: 'Schnupperkurs: [Name]', beginn: inTagen(7, 19), ende: inTagen(7, 20), bereich: 'erwachsene', beschreibung: 'Einfach vorbeikommen und kostenlos ausprobieren. Bitte Sportkleidung und etwas zu trinken mitbringen.' }),
      },
      {
        key: 'leer',
        symbol: '➕',
        titel: 'Leerer Termin',
        text: 'Alles selbst eintragen.',
        art: 'vorfuellen',
        daten: () => ({ beginn: inTagen(1, 18) }),
      },
    ],
  },

  ausfaelle: {
    titel: 'Training fällt aus?',
    text: 'Hier meldest du ausgefallene Trainings. Der Hinweis erscheint sofort auf der Seite des Teams und verschwindet nach dem Tag automatisch.',
    ablauf: [
      { key: 'melden', titel: 'Melden', text: 'Team, Tag und Grund wählen.', wo: 'links im Kasten „Schnell melden“' },
      { key: 'website', titel: 'Sofort sichtbar', text: 'Roter Hinweis auf der Teamseite.', wo: 'Website → Teamseite' },
      { key: 'weg', titel: 'Verschwindet von selbst', text: 'Nach dem Tag ist der Hinweis weg.' },
    ],
    extra: 'ausfall-schnell',
  },

  pages: {
    titel: 'Wozu sind eigene Seiten da?',
    text: 'Für alles, was nicht News, Termin oder Team ist: eine Seite mit eigener Adresse (z. B. /sommerfest), die du frei aus Bausteinen zusammensetzt.',
    ablauf: [
      { key: 'anlegen', titel: 'Seite anlegen', text: 'Titel vergeben – daraus entsteht die Adresse.' },
      { key: 'bausteine', titel: 'Bausteine einfügen', text: 'Text, Bild, Hinweis-Kasten, News-Liste, Formular.', wo: 'Reiter „Inhalt (Bausteine)“' },
      { key: 'veroeffentlichen', titel: 'Veröffentlichen', text: 'Vorher mit „Vorschau“ ansehen.', wo: 'oben rechts' },
      { key: 'menue', titel: 'Im Menü verlinken', text: 'Sonst findet die Seite kaum jemand.', href: '/admin/globals/menue', wo: 'Website-Aufbau → Menü & Fußzeile' },
    ],
    vorlagenTitel: 'Mit einer Vorlage starten (als Entwurf)',
    vorlagen: [
      {
        key: 'info',
        symbol: 'ℹ️',
        titel: 'Infoseite',
        text: 'Überschrift, Text in zwei Spalten.',
        art: 'anlegen',
        daten: () => ({
          title: 'Neue Infoseite',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: '[Überschrift der Seite]' }, { p: '[Ein Satz, worum es geht.]' }]) },
          layout: [
            {
              blockType: 'content',
              columns: [
                { size: 'half', richText: richText([{ h: 'h3', p: '[Abschnitt 1]' }, { p: '[Text]' }]) },
                { size: 'half', richText: richText([{ h: 'h3', p: '[Abschnitt 2]' }, { p: '[Text]' }]) },
              ],
            },
          ],
        }),
      },
      {
        key: 'veranstaltung',
        symbol: '🎪',
        titel: 'Veranstaltung',
        text: 'Infos und grüner Kasten „Jetzt anmelden“.',
        art: 'anlegen',
        daten: () => ({
          title: 'Sommerfest',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: 'Sommerfest' }, { p: '[Datum, Uhrzeit, Ort]' }]) },
          layout: [
            { blockType: 'content', columns: [{ size: 'full', richText: richText([{ p: '[Was erwartet die Gäste? Programm, Essen, Spiele …]' }]) }] },
            {
              blockType: 'cta',
              richText: richText([{ h: 'h3', p: 'Dabei sein?' }, { p: 'Melde dich kurz an, damit wir planen können.' }]),
              links: [{ link: { type: 'custom', url: '/kontakt', label: 'Jetzt anmelden', appearance: 'default' } }],
            },
          ],
        }),
      },
      {
        key: 'abteilung',
        symbol: '🏟️',
        titel: 'Abteilung vorstellen',
        text: 'Text, Ansprechperson, neueste News, Kasten „Probetraining“.',
        art: 'anlegen',
        daten: () => ({
          title: '[Name der Abteilung]',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: '[Name der Abteilung]' }, { p: '[Ein Satz: Was macht die Abteilung besonders?]' }]) },
          layout: [
            {
              blockType: 'content',
              columns: [
                { size: 'twoThirds', richText: richText([{ h: 'h3', p: 'Über uns' }, { p: '[Wer trainiert hier? Seit wann gibt es die Abteilung? Was erwartet neue Mitglieder?]' }]) },
                { size: 'oneThird', richText: richText([{ h: 'h3', p: 'Ansprechperson' }, { p: '[Name]' }, { p: '[Funktion]' }, { p: 'Kontakt über das Kontaktformular' }]) },
              ],
            },
            { blockType: 'archive', populateBy: 'collection', relationTo: 'posts', limit: 3, introContent: richText([{ h: 'h3', p: 'Neues aus der Abteilung' }]) },
            {
              blockType: 'cta',
              richText: richText([{ h: 'h3', p: 'Lust mitzumachen?' }, { p: 'Komm zum kostenlosen Probetraining vorbei.' }]),
              links: [{ link: { type: 'custom', url: '/kontakt', label: 'Probetraining anfragen', appearance: 'default' } }],
            },
          ],
        }),
      },
      {
        key: 'faq',
        symbol: '❓',
        titel: 'Häufige Fragen',
        text: 'Fragen und Antworten untereinander.',
        art: 'anlegen',
        daten: () => ({
          title: 'Häufige Fragen',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: 'Häufige Fragen' }, { p: 'Hier findest du Antworten auf die wichtigsten Fragen.' }]) },
          layout: [
            {
              blockType: 'content',
              columns: [
                {
                  size: 'full',
                  richText: richText([
                    { h: 'h3', p: 'Wie werde ich Mitglied?' },
                    { p: 'Über die Seite „Mitglied werden“ – der Antrag dauert nur wenige Minuten.' },
                    { h: 'h3', p: 'Kann ich vorher ein Probetraining machen?' },
                    { p: 'Ja, bei jedem Team und Kurs kostenlos. Anfragen geht direkt auf der Seite des Angebots.' },
                    { h: 'h3', p: '[Weitere Frage]' },
                    { p: '[Antwort]' },
                    { h: 'h3', p: '[Weitere Frage]' },
                    { p: '[Antwort]' },
                  ]),
                },
              ],
            },
          ],
        }),
      },
      {
        key: 'ansprechpartner',
        symbol: '👥',
        titel: 'Ansprechpersonen',
        text: 'Drei Spalten mit Name, Aufgabe und Kontakt.',
        art: 'anlegen',
        daten: () => ({
          title: 'Ansprechpersonen',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: 'Ansprechpersonen' }, { p: 'Wer hilft bei welcher Frage weiter?' }]) },
          layout: [
            {
              blockType: 'content',
              columns: [1, 2, 3].map((n) => ({ size: 'oneThird', richText: richText([{ h: 'h3', p: `[Name ${n}]` }, { p: '[Aufgabe, z. B. Jugendleitung]' }, { p: '[Erreichbar über das Kontaktformular]' }]) })),
            },
          ],
        }),
      },
      {
        key: 'chronik',
        symbol: '📜',
        titel: 'Vereinsgeschichte',
        text: 'Chronik mit Jahreszahlen untereinander.',
        art: 'anlegen',
        daten: () => ({
          title: 'Unsere Geschichte',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: 'Unsere Geschichte' }, { p: 'Seit 1919 ein Verein für alle.' }]) },
          layout: [
            {
              blockType: 'content',
              columns: [
                {
                  size: 'full',
                  richText: richText([
                    { h: 'h3', p: '1919' },
                    { p: '[Gründung: Wer, wo, warum?]' },
                    { h: 'h3', p: '[Jahr]' },
                    { p: '[Wichtiges Ereignis]' },
                    { h: 'h3', p: '[Jahr]' },
                    { p: '[Wichtiges Ereignis]' },
                    { h: 'h3', p: 'Heute' },
                    { p: '[Wie viele Mitglieder, welche Abteilungen?]' },
                  ]),
                },
              ],
            },
          ],
        }),
      },
      {
        key: 'unterstuetzen',
        symbol: '💚',
        titel: 'Unterstützen & Spenden',
        text: 'Warum helfen, wie helfen – mit Kasten „Kontakt aufnehmen“.',
        art: 'anlegen',
        daten: () => ({
          title: 'Unterstützen',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: 'Unterstütze den BSV' }, { p: '[Ein Satz: Wofür braucht der Verein Unterstützung?]' }]) },
          layout: [
            {
              blockType: 'content',
              columns: [
                { size: 'half', richText: richText([{ h: 'h3', p: 'Spenden' }, { p: '[Wofür wird das Geld verwendet? Spendenquittung möglich?]' }]) },
                { size: 'half', richText: richText([{ h: 'h3', p: 'Mitanpacken' }, { p: '[Helfer bei Festen, Arbeitseinsätzen, Fahrdiensten – jede Stunde hilft.]' }]) },
              ],
            },
            {
              blockType: 'cta',
              richText: richText([{ h: 'h3', p: 'Fragen oder Ideen?' }, { p: 'Wir freuen uns über jede Nachricht.' }]),
              links: [{ link: { type: 'custom', url: '/kontakt', label: 'Kontakt aufnehmen', appearance: 'default' } }],
            },
          ],
        }),
      },
      {
        key: 'newsliste',
        symbol: '🗞️',
        titel: 'Seite mit News-Liste',
        text: 'Kurzer Text und die neuesten News darunter.',
        art: 'anlegen',
        daten: () => ({
          title: 'Aktuelles',
          hero: { type: 'lowImpact', richText: richText([{ h: 'h2', p: '[Überschrift]' }, { p: '[Ein Satz zur Seite]' }]) },
          layout: [{ blockType: 'archive', populateBy: 'collection', relationTo: 'posts', limit: 6 }],
        }),
      },
      {
        key: 'leer',
        symbol: '➕',
        titel: 'Leere Seite',
        text: 'Alles selbst zusammenbauen.',
        art: 'anlegen',
        daten: () => ({ title: 'Neue Seite', hero: { type: 'lowImpact' }, layout: [{ blockType: 'content', columns: [{ size: 'full', richText: richText([{ p: '' }]) }] }] }),
      },
    ],
  },

  forms: {
    titel: 'Wozu sind eigene Formulare da?',
    text: 'Damit fragt ihr auf der Website etwas ab, das es noch nicht gibt: Anmeldungen, Helferlisten, Bestellungen. Die Antworten landen gesammelt unter „Formular-Eingänge“. Mitgliedsantrag, Probetraining und Kontakt gibt es schon fertig – die braucht ihr hier nicht.',
    aktiv: 'forms',
    vorlagenTitel: 'Mit einer Vorlage starten',
    vorlagen: FORMULAR_VORLAGEN.map((v) => ({ key: v.key, symbol: v.symbol, titel: v.titel, text: v.text, art: 'anlegen' as const, daten: () => v.daten })),
  },

  'form-submissions': {
    titel: 'Was sind Formular-Eingänge?',
    text: 'Alles, was Besucher über eure eigenen Formulare abgeschickt haben – wie eine Liste, die sich von selbst füllt. Filtern nach Formular: oben „Filter“ → „Formular“.',
    aktiv: 'form-submissions',
  },

  angebote: {
    titel: 'Wozu sind Teams & Kurse da?',
    text: 'Jedes Team und jeder Kurs bekommt automatisch eine eigene Seite auf der Website – mit Zeiten, Ort, Ansprechpartnern, News, Bildern und Ausfällen.',
    textTeam: 'Du kannst deine eigenen Teams bearbeiten, z. B. Trainingszeiten und Beschreibung.',
    ablauf: [
      { key: 'anlegen', titel: 'Team anlegen', text: 'Name, Bereich, Altersgruppe.' },
      { key: 'zeiten', titel: 'Zeiten und Ort', text: 'Wann und wo trainiert wird.' },
      { key: 'leute', titel: 'Verantwortliche', text: 'Wer das Team pflegen darf – hier beim Team unter „Verantwortliche“ oder (Admins) beim Benutzer unter „Team-Berechtigungen“.' },
      { key: 'bild', titel: 'Titelbild', text: 'Großes Bild oben auf der Teamseite.' },
      { key: 'website', titel: 'Teamseite ist da', text: 'Erscheint automatisch im Menü „Fußball“ bzw. „Breitensport“.', wo: 'Website' },
      { key: 'saison', titel: 'Jede Saison prüfen', text: 'Fußball: vor jeder Saison alle Teams auf einen Blick durchgehen und abhaken (Admin und Redaktion).', wo: 'Sport → Saisonwechsel' },
    ],
  },

  probetraining: {
    titel: 'Was passiert mit Probetraining-Anfragen?',
    text: 'Interessierte melden sich auf der Website für ein Probetraining an. Hier siehst du die Anfragen – Trainer nur die für ihre eigenen Teams.',
    ablauf: [
      { key: 'anfrage', titel: 'Anfrage kommt rein', text: 'Status „Neu“, Trainer bekommen eine E-Mail.', wo: 'Website → Probetraining' },
      { key: 'kuemmern', titel: 'Ich kümmere mich', text: 'Oben im Eintrag – dann sehen alle, wer dran ist.' },
      { key: 'melden', titel: 'Melden', text: '„✉️ Antworten“ oder „📞 Anrufen“, danach kurz notieren.' },
      { key: 'status', titel: 'Status setzen', text: '„Zugesagt“ oder „Anderer Termin vorgeschlagen“.' },
      { key: 'erledigt', titel: 'Erledigt', text: 'Nach dem Training auf „Erledigt“. Gelöscht wird automatisch nach der Datenschutz-Frist (Standard 6 Monate).' },
    ],
  },

  mitgliedsantraege: {
    titel: 'Was passiert mit Mitgliedsanträgen?',
    text: 'Online-Anträge von „Mitglied werden“ – inklusive Bankdaten für das Lastschrift-Mandat. Bearbeiten dürfen Kasse und Admin (mit Zusatzrecht auch ohne Bankdaten); „Nur ansehen“ sieht sie, solange der Haken unter Rollen & Rechte gesetzt ist.',
    ablauf: [
      { key: 'antrag', titel: 'Antrag kommt rein', text: 'Status „Neu“, die Kasse bekommt eine E-Mail.', wo: 'Website → Mitglied werden' },
      { key: 'pruefen', titel: 'Prüfen', text: '„Ich kümmere mich“, dann den Kasten „Antrag prüfen“ lesen.' },
      { key: 'aufnehmen', titel: 'Entscheiden', text: '„Aufnehmen“, „Rückfrage“ oder „Ablehnen“ – mit fertiger E-Mail. Ausweis entsteht automatisch.' },
      { key: 'export', titel: 'Exportieren', text: 'Oben „📥 … neue exportieren“ für das DFBnet (ohne Bankdaten).' },
      { key: 'loeschen', titel: 'Aufräumen', text: 'Nach der Übernahme löschen lassen – Datenschutz-Fristen räumen automatisch auf.' },
    ],
  },

  kuendigungen: {
    titel: 'Was passiert mit Kündigungen?',
    text: 'Kündigungen aus dem Mitgliederbereich mit unterschriebenem Schreiben. Laut Satzung wirksam zum Ende des Quartals, in dem sie eingehen.',
    ablauf: [
      { key: 'eingang', titel: 'Kündigung kommt rein', text: 'Status „Eingegangen“, die Kasse bekommt eine E-Mail, das Mitglied eine Eingangsbestätigung.', wo: 'Website → Mein BSV → Mitgliedschaft kündigen' },
      { key: 'pruefen', titel: 'Schreiben prüfen', text: '„Ich kümmere mich“, dann „Unterschriebenes Schreiben öffnen“.' },
      { key: 'bestaetigen', titel: 'Bestätigen', text: '„✓ Bestätigen“ setzt „Gültig bis“ aufs Quartalsende – mit fertiger E-Mail.' },
      { key: 'dfbnet', titel: 'Im DFBnet austragen', text: 'Von Hand im DFBnet, danach „✓ Im DFBnet ausgetragen“ klicken (nur dein Haken – die Website ist nicht mit dem DFBnet verbunden).' },
      { key: 'wirksam', titel: 'Automatisch wirksam', text: 'Am Tag nach dem Quartalsende zeigt der Ausweis „nicht gültig“.' },
    ],
  },

  mitgliedschaften: {
    titel: 'Wozu sind Mitgliedschaften da?',
    text: 'Daraus entsteht der digitale Mitgliedsausweis, den jedes Mitglied nach dem Login sieht – mit Nummer, Eintrittsdatum, Art und Kursen. Er aktualisiert sich automatisch.',
    ablauf: [
      { key: 'antrag', titel: 'Antrag aufgenommen', text: 'Eintrag entsteht automatisch – auch für Familienmitglieder.', href: '/admin/collections/mitgliedsantraege', wo: 'Posteingang → Mitgliedsanträge' },
      { key: 'nummer', titel: 'Nummer ergänzen', text: 'Mitgliedsnummer eintragen, ggf. Kurse.' },
      { key: 'ausweis', titel: 'Ausweis ist da', text: 'Im verknüpften Konto – verknüpft wird bei der Freigabe einer Registrierung mit gleicher E-Mail.' },
    ],
  },

  passantraege: {
    titel: 'Wie laufen Passanträge?',
    text: 'Mitglieder beantragen im Mitgliederbereich einen Spielerpass – auch für ihre Kinder – und laden die Unterlagen hoch. Du prüfst, reichst im DFBnet ein und setzt den Status.',
    textTeam: 'Du siehst nur die Passanträge deiner eigenen Teams.',
    ablauf: [
      { key: 'antrag', titel: 'Antrag kommt rein', text: 'Status „Eingereicht“, Unterlagen hängen dran.', wo: 'Mitgliederbereich → Spielerpass' },
      { key: 'pruefen', titel: 'Prüfen', text: 'Fehlt etwas? „Unterlagen fehlen“ + Hinweis – die Person reicht nach.' },
      { key: 'verband', titel: 'DFBnet', text: 'Einreichen, Status „Beim Verband“.' },
      { key: 'fertig', titel: 'Fertig', text: '„Spielerlaubnis erteilt“ – Ausweis & Foto nach 30 Tagen gelöscht, der unterschriebene Antrag nach 2 Jahren.' },
    ],
  },

  kontaktanfragen: {
    titel: 'Was sind Kontaktanfragen?',
    text: 'Nachrichten aus dem Kontaktformular der Website und Fragen aus der Hilfe („Frage an den Admin“).',
    ablauf: [
      { key: 'neu', titel: 'Nachricht kommt rein', text: 'Status „Neu“. Im Feld „Anliegen“ steht, worum es geht.' },
      { key: 'kuemmern', titel: 'Ich kümmere mich', text: 'Oben im Eintrag – in der Liste steht dann dein Name.' },
      { key: 'antworten', titel: 'Antworten', text: '„✉️ Antworten“ öffnet dein E-Mail-Programm. Kurz notieren, Status „In Bearbeitung“.' },
      { key: 'erledigt', titel: 'Erledigt', text: 'Status „Erledigt“. Gelöscht wird automatisch nach der Datenschutz-Frist (Standard 6 Monate).' },
    ],
  },

  sponsoren: {
    titel: 'Wozu ist die Sponsoren-Liste da?',
    text: 'Alle Sponsoren und Partner – auch der Hauptsponsor – erscheinen auf der Seite /sponsoren, nach Art gruppiert. Der Hauptsponsor steht zusätzlich unten in der Fußzeile jeder Seite. Mit Logo und Haken „Im Laufband auf der Startseite“ laufen sie zusätzlich unten über die Startseite (ab drei Logos).',
    ablauf: [
      { key: 'anlegen', titel: 'Sponsor anlegen', text: 'Name, Website und Logo (am besten PNG mit transparentem Hintergrund).' },
      { key: 'art', titel: 'Art wählen', text: 'Hauptsponsor, Premium-Partner, Partner oder Förderer & Freunde – bestimmt Gruppe und Größe.' },
      { key: 'website', titel: 'Erscheint auf der Website', text: 'Seite „Sponsoren“ und Logo-Laufband auf der Startseite.', href: '/sponsoren', wo: 'Website → Sponsoren' },
    ],
  },

  alben: {
    titel: 'Wozu sind Fotoalben da?',
    text: 'Ein Album sammelt die Fotos einer Veranstaltung – z. B. „Sommerfest 2026“. Alben erscheinen in der Galerie und, wenn ein Team gewählt ist, auch auf der Teamseite.',
    textTeam: 'Du kannst Alben für deine eigenen Teams anlegen.',
    ablauf: [
      { key: 'hochladen', titel: 'Fotos hochladen', text: 'Am einfachsten direkt im Album über „Bilder“ – mehrere auf einmal.', href: '/admin/collections/media', wo: 'oder vorher in die Mediathek' },
      { key: 'album', titel: 'Album anlegen', text: 'Titel, Datum, optional Team. Das erste Bild ist das Titelbild.' },
      { key: 'website', titel: 'Erscheint in der Galerie', text: 'Großansicht zum Durchblättern, auch am Handy.', href: '/galerie', wo: 'Website → Galerie' },
    ],
  },

  gesuche: {
    titel: 'Wozu ist „Ehrenamt & Mitmachen“ da?',
    text: 'Hier trägst du ein, wen der Verein gerade sucht – Trainer, Helfer fürs Fest, Schiris, Kassenprüfer. Die Gesuche erscheinen auf der Seite /mitmachen mit einem Knopf „Ich bin dabei“, der direkt zum Kontaktformular führt.',
    ablauf: [
      { key: 'anlegen', titel: 'Gesuch anlegen', text: 'Wen suchen wir? Was ist zu tun? Wie viel Zeit?' },
      { key: 'website', titel: 'Erscheint auf „Mitmachen“', text: 'Besucher können es auch per WhatsApp teilen.', href: '/mitmachen', wo: 'Website → Mitmachen' },
      { key: 'melden', titel: 'Meldungen kommen an', text: 'Als Kontaktanfrage mit dem Betreff des Gesuchs.', href: '/admin/collections/kontaktanfragen', wo: 'Posteingang → Kontaktanfragen' },
      { key: 'aus', titel: 'Gefunden?', text: 'Haken „Auf der Website zeigen“ entfernen – oder löschen.' },
    ],
    vorlagenTitel: 'Mit einer Vorlage starten (wird erst beim Speichern angelegt)',
    vorlagen: [
      { key: 'trainer', symbol: '⚽', titel: 'Trainer/in', text: 'Für eine Mannschaft oder einen Kurs.', art: 'vorfuellen', daten: () => ({ titel: 'Trainer/in für [Team/Kurs]', text: 'Du hast Spaß an Sport und am Umgang mit Kindern oder Erwachsenen? Wir suchen Verstärkung für unser Trainerteam. Vorkenntnisse sind willkommen, aber kein Muss – Lizenzen fördern wir gern.', aufwand: '1–2 Termine pro Woche', symbol: '⚽' }) },
      { key: 'fest', symbol: '🎉', titel: 'Helfer fürs Fest', text: 'Grill, Kuchen, Aufbau – ein paar Stunden.', art: 'vorfuellen', daten: () => ({ titel: 'Helfer/innen für [Fest]', text: 'Für unser Fest brauchen wir helfende Hände: am Grill, an der Kuchentheke, beim Auf- und Abbau. Jede Stunde hilft!', aufwand: 'ca. 2 Stunden', symbol: '🎉' }) },
      { key: 'schiri', symbol: '🧑‍⚖️', titel: 'Schiedsrichter/in', text: 'Ausbildung übernimmt der Verein.', art: 'vorfuellen', daten: () => ({ titel: 'Schiedsrichter/in', text: 'Ohne Schiris kein Spiel: Wir suchen Menschen ab 12 Jahren, die Lust haben, Spiele zu leiten. Die Ausbildung bezahlt der Verein.', aufwand: 'nach Absprache', symbol: '🧑‍⚖️' }) },
      { key: 'kasse', symbol: '🧾', titel: 'Kassenprüfer/in', text: 'Einmal im Jahr die Kasse prüfen.', art: 'vorfuellen', daten: () => ({ titel: 'Kassenprüfer/in', text: 'Einmal im Jahr schaust du gemeinsam mit einer zweiten Person auf die Vereinskasse und berichtest in der Jahreshauptversammlung.', aufwand: 'ca. 1 Abend pro Jahr', symbol: '🧾' }) },
      { key: 'foto', symbol: '📸', titel: 'Fotograf/in', text: 'Bilder von Spielen und Festen.', art: 'vorfuellen', daten: () => ({ titel: 'Fotograf/in für Spiele und Feste', text: 'Du fotografierst gern? Dann halte unsere Spiele, Turniere und Feste fest – die Bilder erscheinen in Galerie und News.', aufwand: 'nach Lust und Laune', symbol: '📸' }) },
      { key: 'leer', symbol: '➕', titel: 'Leeres Gesuch', text: 'Alles selbst eintragen.', art: 'vorfuellen', daten: () => ({}) },
    ],
  },

  users: {
    titel: 'Wozu sind Benutzer da?',
    text: 'Jeder, der sich anmelden soll, braucht ein Konto. Die Rolle bestimmt, was die Person darf. Wer welche Rolle für welches Team hat, siehst du unter Mitglieder → „Rollen & Rechte“. Mitglieder können sich auch selbst registrieren – die warten dann unter „Posteingang → Registrierungen“ auf Freigabe.',
    ablauf: [
      { key: 'anlegen', titel: 'Konto anlegen', text: 'Name, E-Mail, vorläufiges Passwort.' },
      { key: 'rolle', titel: 'Rolle wählen', text: 'Z. B. Trainer oder Redaktion.' },
      { key: 'team', titel: 'Team zuordnen', text: 'Direkt unter den Rollen bei „Team-Berechtigungen“ – ohne Team-Rolle wird „Trainer“ gesetzt.', wo: 'Benutzer → Team-Berechtigungen' },
      { key: 'mitteilen', titel: 'Zugang mitteilen', text: 'Persönlich – nicht per Gruppenchat.' },
      { key: 'zfa', titel: 'Erster Login', text: 'Die Person richtet die Zwei-Faktor-App ein.' },
    ],
  },
}
