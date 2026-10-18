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
    text: 'News erzählen, was im Verein passiert: Spielberichte, Ankündigungen, Rückblicke. Vereins-News erscheinen im Newsroom und auf der Startseite.',
    textTeam: 'Deine Team-News erscheinen auf der Seite deines Teams. Auf die Startseite kommen sie, wenn die Redaktion „Auch auf Startseite“ anhakt.',
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
    text: 'Termine erscheinen im Kalender der Website und die nächsten auch auf der Startseite. Trainingszeiten gehören nicht hierher – die stehen beim Team.',
    ablauf: [
      { key: 'titel', titel: 'Titel und Datum', text: 'Z. B. „Sommerfest“, Beginn und optional Ende.' },
      { key: 'ort', titel: 'Ort und Bereich', text: 'Der Bereich bestimmt die Farbe im Kalender.' },
      { key: 'sichtbar', titel: 'Für wen?', text: 'Optional nur für Mitglieder sichtbar.' },
      { key: 'speichern', titel: 'Speichern', text: 'Sofort sichtbar – ohne Veröffentlichen.', wo: 'oben rechts' },
      { key: 'website', titel: 'Im Kalender', text: 'Nach dem Termin verschwindet er automatisch aus „Kommende Termine“.', href: '/termine', wo: 'Website → Termine' },
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
      { key: 'melden', titel: 'Melden', text: 'Team, Tag und Grund wählen.', wo: 'gleich hier unten' },
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
      { key: 'menue', titel: 'Im Menü verlinken', text: 'Sonst findet die Seite kaum jemand.', href: '/admin/globals/menue', wo: 'Inhalte → Menü & Fußzeile' },
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
      { key: 'leute', titel: 'Verantwortliche', text: 'Wer das Team in der Verwaltung pflegen darf.', href: '/admin/rollen', wo: 'Rollen-Übersicht' },
      { key: 'bild', titel: 'Titelbild', text: 'Großes Bild oben auf der Teamseite.' },
      { key: 'website', titel: 'Teamseite ist da', text: 'Erscheint automatisch im Menü „Fußball“ bzw. „Breitensport“.', wo: 'Website' },
    ],
  },

  probetraining: {
    titel: 'Was passiert mit Probetraining-Anfragen?',
    text: 'Interessierte melden sich auf der Website für ein Probetraining an. Hier siehst du die Anfragen – Trainer nur die für ihre eigenen Teams.',
    ablauf: [
      { key: 'anfrage', titel: 'Anfrage kommt rein', text: 'Status „Neu“.', wo: 'Website → Probetraining' },
      { key: 'melden', titel: 'Melden', text: 'Per E-Mail oder Telefon antworten.' },
      { key: 'status', titel: 'Status setzen', text: '„Zugesagt“ oder „Anderer Termin vorgeschlagen“.' },
      { key: 'erledigt', titel: 'Erledigt', text: 'Nach dem Training auf „Erledigt“ – und später löschen.' },
    ],
  },

  mitgliedsantraege: {
    titel: 'Was passiert mit Mitgliedsanträgen?',
    text: 'Online-Anträge von „Mitglied werden“ – inklusive Bankdaten für das Lastschrift-Mandat. Nur Kasse und Admin sehen sie.',
    ablauf: [
      { key: 'antrag', titel: 'Antrag kommt rein', text: 'Status „Neu“.', wo: 'Website → Mitglied werden' },
      { key: 'pruefen', titel: 'Prüfen', text: 'Angaben vollständig? Sonst „Rückfrage“.' },
      { key: 'aufnehmen', titel: 'Aufnehmen', text: 'In die Mitgliederverwaltung übernehmen, Status „Aufgenommen“.' },
      { key: 'loeschen', titel: 'Aufräumen', text: 'Nach der Übernahme löschen – es sind Bankdaten.' },
    ],
  },

  kontaktanfragen: {
    titel: 'Was sind Kontaktanfragen?',
    text: 'Nachrichten aus dem Kontaktformular der Website und Fragen aus der Hilfe („Frage an den Admin“).',
    ablauf: [
      { key: 'neu', titel: 'Nachricht kommt rein', text: 'Status „Neu“. Im Feld „An“ steht, wen sie erreichen soll.' },
      { key: 'antworten', titel: 'Antworten', text: 'Per E-Mail – Status „In Bearbeitung“.' },
      { key: 'erledigt', titel: 'Erledigt', text: 'Status „Erledigt“ und regelmäßig löschen.' },
    ],
  },

  sponsoren: {
    titel: 'Wozu ist die Sponsoren-Liste da?',
    text: 'Alle Sponsoren und Partner – auch der Hauptsponsor – erscheinen auf der Seite /sponsoren, nach Art gruppiert. Der Hauptsponsor steht zusätzlich unten in der Fußzeile jeder Seite. Mit Logo und Haken „Im Laufband“ laufen sie zusätzlich unten über die Startseite (ab drei Logos).',
    ablauf: [
      { key: 'anlegen', titel: 'Sponsor anlegen', text: 'Name, Website und Logo (am besten PNG mit transparentem Hintergrund).' },
      { key: 'art', titel: 'Art wählen', text: 'Hauptsponsor, Premium-Partner, Partner oder Förderer – bestimmt Gruppe und Größe.' },
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
      { key: 'melden', titel: 'Meldungen kommen an', text: 'Als Kontaktanfrage mit dem Betreff des Gesuchs.', href: '/admin/collections/kontaktanfragen', wo: 'Verwaltung → Kontaktanfragen' },
      { key: 'aus', titel: 'Gefunden?', text: 'Haken „Auf der Website zeigen“ entfernen – oder löschen.' },
    ],
  },

  users: {
    titel: 'Wozu sind Benutzer da?',
    text: 'Jeder, der sich anmelden soll, braucht ein Konto. Die Rolle bestimmt, was die Person darf. Wer welche Rolle für welches Team hat, siehst du in der Rollen-Übersicht.',
    ablauf: [
      { key: 'anlegen', titel: 'Konto anlegen', text: 'Name, E-Mail, vorläufiges Passwort.' },
      { key: 'rolle', titel: 'Rolle wählen', text: 'Z. B. Übungsleitung oder Redaktion.' },
      { key: 'team', titel: 'Team zuordnen', text: 'Beim Team unter „Verantwortliche“.', href: '/admin/rollen', wo: 'Rollen-Übersicht → Nach Team' },
      { key: 'mitteilen', titel: 'Zugang mitteilen', text: 'Persönlich – nicht per Gruppenchat.' },
      { key: 'zfa', titel: 'Erster Login', text: 'Die Person richtet die Zwei-Faktor-App ein.' },
    ],
  },
}
