/**
 * Ergänzende Hilfe: Schritt-für-Schritt-Anleitungen, Feld-Erklärungen,
 * Hinweise je Rolle, häufige Fragen und Rollenprofile (für Begrüßung und Kurzanleitung).
 * Alles bewusst in Alltagssprache.
 */

export type Anleitung = { id: string; titel: string; schritte: string[]; video?: string }
export type Feld = { name: string; text: string }
export type Faq = { frage: string; antwort: string; bereich?: string }

/** Rollen-Schlüssel wie in den Benutzerkonten */
export type RolleKey = 'admin' | 'redaktion' | 'kasse' | 'uebungsleitung' | 'teamredaktion' | 'mitglied'

/* ------------------------------------------------------------------ */
/* Schritt-für-Schritt-Anleitungen                                     */
/* ------------------------------------------------------------------ */
export const ANLEITUNGEN: Record<string, Anleitung[]> = {
  dashboard: [
    {
      id: 'erste-schritte',
      titel: 'Die ersten fünf Minuten',
      schritte: [
        'Unten links auf deinen Namen klicken und prüfen, ob Name und E-Mail stimmen.',
        'Oben rechts auf „? Hilfe“ klicken – das geht auf jeder Seite.',
        'Die Tour starten (Knopf „Tour starten“ auf der Übersicht), sie zeigt dir die wichtigsten Stellen.',
        'Zum Üben eine News als Entwurf anlegen. Entwürfe sieht niemand außer euch.',
      ],
    },
  ],
  posts: [
    {
      id: 'news-schreiben',
      titel: 'Eine News mit Bild schreiben',
      video: '/hilfe/news-schreiben.mp4',
      schritte: [
        'Links auf „News“ und dann oben auf „Neu erstellen“ klicken.',
        'Bei „Titel“ eine kurze Überschrift eingeben, z. B. „F1 gewinnt Hallenturnier“.',
        'Bei „Titelbild“ auf „Aus vorhandenen auswählen“ klicken – oder mit „Neu erstellen“ ein Foto vom Rechner hochladen.',
        'Ins große Textfeld darunter klicken und den Text schreiben. Die Werkzeugleiste darüber macht Text fett, kursiv oder zu einer Zwischenüberschrift.',
        'Rechts bei „Team / Kurs“ das passende Team wählen (oder leer lassen für Vereins-News).',
        'Oben rechts „Entwurf speichern“ – dann ist nichts verloren.',
        'Wenn alles passt: „Änderungen veröffentlichen“. Fertig!',
      ],
    },
    {
      id: 'news-aendern',
      titel: 'Eine veröffentlichte News korrigieren',
      schritte: [
        'In der Liste „News“ auf den Titel klicken.',
        'Den Fehler korrigieren.',
        '„Änderungen veröffentlichen“ klicken – die Website zeigt sofort die neue Fassung.',
        'Über „Versionen“ oben siehst du frühere Fassungen und kannst sie wiederherstellen.',
      ],
    },
    {
      id: 'news-offline',
      titel: 'Eine News wieder offline nehmen',
      schritte: [
        'Die News öffnen.',
        'Oben rechts auf die drei Punkte (⋮) klicken.',
        '„Veröffentlichung aufheben“ wählen – die News wird wieder zum Entwurf und verschwindet von der Website.',
      ],
    },
  ],
  media: [
    {
      id: 'bild-hochladen',
      titel: 'Fotos hochladen',
      video: '/hilfe/bilder-hochladen.mp4',
      schritte: [
        'Links auf „Mediathek“ und dann auf „Neu erstellen“ klicken.',
        'Das Foto in das Feld ziehen oder „Datei auswählen“ klicken.',
        'Bei „Bildbeschreibung“ kurz beschreiben, was zu sehen ist, z. B. „Die F1 jubelt mit dem Pokal“.',
        'Optional: Team wählen und „In Galerie zeigen“ anhaken.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'mehrere-bilder',
      titel: 'Viele Fotos auf einmal hochladen',
      schritte: [
        'In der Mediathek oben auf „Mehrere Dateien hochladen“ klicken.',
        'Alle Fotos auf einmal auswählen oder hineinziehen.',
        'Für jedes Foto die Bildbeschreibung ausfüllen und speichern.',
      ],
    },
  ],
  pages: [
    {
      id: 'seite-erstellen',
      titel: 'Eine neue Seite anlegen',
      schritte: [
        'Links auf „Seiten“ und dann auf „Neu erstellen“ klicken.',
        'Einen Titel eingeben, z. B. „Sommerfest 2027“.',
        'Im Reiter „Inhalt“ auf „Baustein hinzufügen“ klicken und z. B. „Inhalt“ (Text) oder „Medien“ (Bild) wählen.',
        'Mit dem Bildschirm-Symbol oben die Vorschau öffnen und prüfen.',
        '„Änderungen veröffentlichen“ klicken. Die Seite ist jetzt unter /sommerfest-2027 erreichbar.',
      ],
    },
    {
      id: 'seite-ins-menue',
      titel: 'Die Seite ins Menü bringen',
      schritte: [
        'Die Seite muss veröffentlicht sein.',
        'Links auf „Menü“ klicken.',
        'Unter „Links in der Menüleiste“ auf „Eintrag hinzufügen“ klicken.',
        'Text eingeben, „Seite aus ‚Seiten‘“ wählen und die Seite aussuchen.',
        'Oben rechts „Speichern“.',
      ],
    },
  ],
  menue: [
    {
      id: 'menue-link',
      titel: 'Einen Link ins Menü einfügen',
      schritte: [
        'Unter „Links in der Menüleiste“ auf „Eintrag hinzufügen“ klicken.',
        '„Text im Menü“ ausfüllen – so heißt der Link auf der Website.',
        'Bei „Ziel“ entweder eine Seite auswählen oder eine Adresse eintragen (z. B. /termine oder https://…).',
        'Mit dem Griff links (sechs Punkte) an die richtige Stelle ziehen.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'menue-zuruecksetzen',
      titel: 'Zurück zum Standardmenü',
      schritte: ['Alle Einträge einer Liste über die drei Punkte rechts entfernen.', 'Speichern – die Website zeigt dann wieder das Standardmenü.'],
    },
  ],
  angebote: [
    {
      id: 'team-zeiten',
      titel: 'Trainingszeiten ändern',
      schritte: [
        'Links auf „Teams & Kurse“ und das Team anklicken.',
        'Nach unten zu „Trainingszeiten“ scrollen.',
        'Einen Eintrag ändern oder mit „Termin hinzufügen“ einen neuen anlegen: Tag, Uhrzeit, Ort.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'team-verantwortliche',
      titel: 'Einer Übungsleitung ein Team zuordnen',
      schritte: [
        'Zuerst muss die Person ein Benutzerkonto mit der Rolle „Übungsleitung“ oder „Team-Redaktion“ haben (Bereich „Benutzer“).',
        'Dann das Team unter „Teams & Kurse“ öffnen.',
        'Bei „Verantwortliche“ die Person auswählen.',
        'Speichern. Ab sofort kann die Person News, Bilder und Ausfälle für dieses Team pflegen.',
      ],
    },
    {
      id: 'team-neu',
      titel: 'Ein neues Team oder einen neuen Kurs anlegen',
      schritte: [
        '„Neu erstellen“ klicken.',
        'Name, Bereich (Fußball, Kids oder Erwachsene) und Altersangabe eintragen.',
        'Beschreibung, Titelbild und Trainingszeiten ergänzen.',
        '„Aktiv“ anhaken und speichern – das Angebot erscheint automatisch im Menü und im Mitgliedsantrag.',
      ],
    },
  ],
  ausfaelle: [
    {
      id: 'ausfall-melden',
      titel: 'Einen Trainingsausfall melden',
      video: '/hilfe/ausfall-melden.mp4',
      schritte: [
        'Links auf „Trainingsausfälle“ und dann auf „Neu erstellen“ klicken.',
        'Bei „Angebot“ dein Team wählen.',
        'Das Datum eintragen und den Grund auswählen, z. B. „Halle belegt“. Optional einen Hinweis ergänzen.',
        'Oben rechts „Speichern“ – der Hinweis steht sofort auf der Teamseite.',
      ],
    },
  ],
  termine: [
    {
      id: 'termin-anlegen',
      titel: 'Einen Termin eintragen',
      schritte: [
        '„Neu erstellen“ klicken.',
        'Titel, Beginn und (optional) Ende eintragen – mit Uhrzeit.',
        'Ort und eine kurze Beschreibung ergänzen.',
        'Den Bereich wählen und speichern.',
      ],
    },
  ],
  mitgliedsantraege: [
    {
      id: 'antrag-bearbeiten',
      titel: 'Einen Mitgliedsantrag bearbeiten',
      schritte: [
        'In der Liste auf den Antrag mit Status „Neu“ klicken.',
        'Angaben prüfen: Personen, gewählte Angebote, Beitrag, Bankverbindung.',
        'Bei Unklarheiten Status „Rückfrage“ setzen und die Person kontaktieren.',
        'Nach der Übernahme in die Mitgliederverwaltung Status „Aufgenommen“ setzen und speichern.',
      ],
    },
  ],
  probetraining: [
    {
      id: 'probe-bearbeiten',
      titel: 'Eine Probetraining-Anfrage beantworten',
      schritte: [
        'Die Anfrage öffnen – dort stehen Name, Kontakt und gewünschtes Angebot.',
        'Die Person anrufen oder anschreiben.',
        'Status auf „Zugesagt“, „Anderer Termin vorgeschlagen“ oder „Erledigt“ setzen und speichern.',
      ],
    },
  ],
  users: [
    {
      id: 'konto-anlegen',
      titel: 'Ein Konto für eine neue Übungsleitung anlegen',
      schritte: [
        '„Neu erstellen“ klicken.',
        'Name und E-Mail eintragen, ein vorläufiges Passwort vergeben.',
        'Bei „Rollen“ „Übungsleitung“ (oder „Team-Redaktion“) wählen und speichern.',
        'Unter „Teams & Kurse“ die Person beim Team als „Verantwortliche“ eintragen.',
        'Der Person E-Mail und Passwort persönlich mitteilen. Beim ersten Anmelden richtet sie die Zwei-Faktor-App ein.',
      ],
    },
    {
      id: 'handy-verloren',
      titel: 'Jemand hat das Handy (Zwei-Faktor) verloren',
      schritte: [
        'Erst fragen: Hat die Person noch ihre Wiederherstellungscodes? Damit kann sie sich selbst anmelden.',
        'Falls nicht: das Konto öffnen und den Haken bei „Zwei-Faktor-Anmeldung eingerichtet“ entfernen.',
        'Speichern. Beim nächsten Anmelden richtet die Person die App neu ein.',
      ],
    },
  ],
  verein: [
    {
      id: 'vorstand',
      titel: 'Den Vorstand aktualisieren',
      schritte: [
        'Nach unten zu „Vorstand und Ansprechpersonen“ scrollen.',
        'Mit „Person hinzufügen“ jemanden ergänzen: Name und Funktion.',
        'Mit dem Griff links die Reihenfolge ändern, über die drei Punkte rechts jemanden entfernen.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'satzung',
      titel: 'Die Satzung hochladen',
      schritte: [
        'Bei „Satzung & Downloads“ auf „Download hinzufügen“ klicken.',
        'Titel eingeben, z. B. „Satzung (Stand 2026)“.',
        'Bei „Datei“ das PDF hochladen und speichern.',
      ],
    },
  ],
  texte: [
    {
      id: 'text-aendern',
      titel: 'Eine Überschrift der Website ändern',
      schritte: [
        'Oben den passenden Reiter wählen, z. B. „Startseite“.',
        'Das Feld suchen – der Name verrät, wo der Text steht.',
        'Text ändern. Platzhalter in geschweiften Klammern stehen lassen.',
        'Oben rechts „Speichern“.',
      ],
    },
  ],
  forms: [
    {
      id: 'formular-bauen',
      titel: 'Ein Anmeldeformular bauen',
      schritte: [
        '„Neu erstellen“ klicken und einen Titel vergeben.',
        'Mit „Feld hinzufügen“ Felder wie Name, E-Mail oder Anzahl Personen anlegen.',
        'Bei „Bestätigungsnachricht“ eintragen, was nach dem Absenden erscheint.',
        'Speichern. Auf einer Seite den Baustein „Formular“ einfügen und dieses Formular auswählen.',
      ],
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Was bedeuten die Felder?                                            */
/* ------------------------------------------------------------------ */
export const FELDER: Record<string, Feld[]> = {
  posts: [
    { name: 'Titel', text: 'Die Überschrift. Kurz und konkret – sie steht groß über der News und in der Übersicht.' },
    { name: 'Titelbild', text: 'Das große Bild oben. Ohne Bild wirkt die News in Übersichten leer.' },
    { name: 'Text', text: 'Der eigentliche Beitrag. Mit „/“ öffnest du eine Auswahl, z. B. für Zwischenüberschriften.' },
    { name: 'Team / Kurs', text: 'Zu welchem Team die News gehört. Sie erscheint dann auf dessen Seite. Leer = Vereins-News.' },
    { name: 'Auf Startseite', text: 'Zeigt die News zusätzlich auf der Startseite und unter „News“. Entscheidet die Redaktion.' },
    { name: 'Veröffentlicht am', text: 'Das Datum, das über der News steht. Leer = Tag der Veröffentlichung.' },
    { name: 'Autor:in', text: 'Wer die News geschrieben hat. Wird automatisch mit deinem Namen vorbelegt.' },
    { name: 'Slug', text: 'Der Teil der Adresse, z. B. /news/f1-gewinnt. Entsteht automatisch aus dem Titel.' },
    { name: 'Zuordnung / SEO', text: 'Kategorien, passende News und Angaben für Google. Kann man meistens so lassen.' },
  ],
  angebote: [
    { name: 'Name', text: 'So heißt das Team oder der Kurs überall auf der Website.' },
    { name: 'Bereich', text: 'Fußball, BSV Kids oder Erwachsene – bestimmt, in welchem Menü das Angebot erscheint.' },
    { name: 'Gruppe (Fußball)', text: 'Junioren, Juniorinnen, Senioren oder Damen – Spalte im Fußball-Menü.' },
    { name: 'Alter (Anzeige)', text: 'Kurzer Text wie „Herren ab 32“ oder „4–6 Jahre“. Erscheint im Menü und auf Karten.' },
    { name: 'Alter von / bis', text: 'Zahlen für den Angebotsfinder („Wie alt bist du?“).' },
    { name: 'Kurzbeschreibung', text: 'Ein Satz für Übersichtskarten.' },
    { name: 'Beschreibung', text: 'Ausführlicher Text auf der Seite des Teams.' },
    { name: 'Trainingszeiten', text: 'Tag, Uhrzeit und Ort. Erscheinen auf der Teamseite.' },
    { name: 'Verantwortliche', text: 'Benutzerkonten, die dieses Team pflegen dürfen (News, Bilder, Ausfälle).' },
    { name: 'Reihenfolge', text: 'Kleinere Zahl = weiter vorne in Listen und Menüs.' },
    { name: 'Aktiv', text: 'Nur aktive Angebote sind auf der Website sichtbar.' },
  ],
  media: [
    { name: 'Bildbeschreibung', text: 'Beschreibt, was zu sehen ist. Wichtig für Menschen, die sich Seiten vorlesen lassen.' },
    { name: 'Team / Kurs', text: 'Ordnet das Bild einem Team zu.' },
    { name: 'In Galerie zeigen', text: 'Das Bild erscheint in der Fotogalerie auf der Seite des Teams.' },
  ],
  pages: [
    { name: 'Titel', text: 'Name der Seite, steht auch im Browser-Tab.' },
    { name: 'Hero / Kopfbereich', text: 'Der große Bereich ganz oben, oft mit Bild und Überschrift.' },
    { name: 'Inhalt (Bausteine)', text: 'Die Seite besteht aus Bausteinen untereinander: Text, Bilder, Buttons, Formulare.' },
    { name: 'Slug', text: 'Die Adresse der Seite, z. B. /sommerfest. Besser nicht mehr ändern, wenn schon verlinkt.' },
    { name: 'SEO', text: 'Titel und Beschreibung für Google. Optional.' },
  ],
  termine: [
    { name: 'Titel', text: 'Name der Veranstaltung.' },
    { name: 'Beginn / Ende', text: 'Datum und Uhrzeit. Ende ist optional.' },
    { name: 'Ort', text: 'Wo der Termin stattfindet.' },
    { name: 'Bereich', text: 'Bestimmt Farbe und Zuordnung im Kalender.' },
    { name: 'Nur für Mitglieder', text: 'Nur nach dem Login sichtbar.' },
  ],
  ausfaelle: [
    { name: 'Angebot', text: 'Welches Team oder welcher Kurs ausfällt.' },
    { name: 'Datum', text: 'An welchem Tag. Danach verschwindet der Hinweis automatisch.' },
    { name: 'Grund', text: 'Zur Auswahl: Krankheit, Halle belegt, Ferien, Wetter, Sonstiges.' },
    { name: 'Hinweis', text: 'Optionaler Zusatz, z. B. ein Nachholtermin.' },
  ],
  users: [
    { name: 'Name', text: 'Erscheint in der Verwaltung und als Autor:in von News.' },
    { name: 'E-Mail', text: 'Damit meldet sich die Person an.' },
    { name: 'Rollen', text: 'Was die Person darf. Mehrere Rollen sind möglich.' },
    { name: 'Zwei-Faktor-Anmeldung eingerichtet', text: 'Haken entfernen setzt die Handy-App zurück (z. B. bei verlorenem Handy).' },
  ],
  menue: [
    { name: 'Text im Menü', text: 'So heißt der Link auf der Website.' },
    { name: 'Ziel', text: 'Eine eurer Seiten oder eine eigene Adresse.' },
    { name: 'Adresse', text: 'Intern mit „/“ (z. B. /termine), extern mit „https://“.' },
    { name: 'In neuem Tab öffnen', text: 'Sinnvoll für fremde Websites wie den Fan-Shop.' },
  ],
  verein: [
    { name: 'Mitgliederzahl', text: 'Erscheint auf der Startseite und in Texten mit {mitglieder}.' },
    { name: 'Mitgliedsbeiträge', text: 'Beträge pro Quartal – gelten für den Online-Antrag.' },
    { name: 'SEPA-Gläubiger-ID', text: 'Steht im Lastschriftmandat des Antrags.' },
    { name: 'Vorstand', text: 'Name, Funktion, optional Foto. Erscheint auf der Vereinsseite.' },
    { name: 'Satzung & Downloads', text: 'Dateien zum Herunterladen auf der Vereinsseite.' },
    { name: 'Startseite', text: 'Die großen Bilder und Kacheln der Startseite.' },
  ],
}

/* ------------------------------------------------------------------ */
/* Hinweise je Rolle                                                   */
/* ------------------------------------------------------------------ */
export const ROLLEN_HINWEIS: Record<string, Partial<Record<RolleKey, string>>> = {
  posts: {
    uebungsleitung: 'Du kannst News für deine eigenen Teams schreiben. Ob sie auch auf die Startseite kommen, entscheidet die Redaktion.',
    teamredaktion: 'Du kannst News für deine eigenen Teams schreiben. Ob sie auch auf die Startseite kommen, entscheidet die Redaktion.',
    redaktion: 'Du kannst alle News bearbeiten und entscheidest mit „Auf Startseite“, was groß erscheint.',
    admin: 'Du kannst alle News bearbeiten und entscheidest mit „Auf Startseite“, was groß erscheint.',
  },
  media: {
    uebungsleitung: 'Du kannst Bilder hochladen und deinen Teams zuordnen. Bilder anderer Teams kannst du nicht ändern.',
    teamredaktion: 'Du kannst Bilder hochladen und deinen Teams zuordnen. Bilder anderer Teams kannst du nicht ändern.',
  },
  angebote: {
    uebungsleitung: 'Du siehst alle Angebote, kannst aber nur deine eigenen bearbeiten – z. B. Trainingszeiten und Beschreibung.',
    teamredaktion: 'Du siehst alle Angebote, kannst aber nur deine eigenen bearbeiten – z. B. Trainingszeiten und Beschreibung.',
  },
  ausfaelle: {
    uebungsleitung: 'Du kannst Ausfälle nur für deine eigenen Teams melden.',
    teamredaktion: 'Du kannst Ausfälle nur für deine eigenen Teams melden.',
  },
  mitgliedsantraege: { kasse: 'Als Kasse bist du hier hauptverantwortlich. Bitte Anträge zeitnah bearbeiten.' },
  users: { admin: 'Nur Admins sehen diesen Bereich. Vergib Rollen so sparsam wie möglich.' },
}

/* ------------------------------------------------------------------ */
/* Häufige Fragen                                                      */
/* ------------------------------------------------------------------ */
export const FAQ: Faq[] = [
  {
    frage: 'Warum sehe ich meine News nicht auf der Startseite?',
    antwort:
      'Team-News erscheinen zuerst nur auf der Seite des Teams. Auf die Startseite kommen sie, wenn die Redaktion „Auf Startseite“ anhakt. Prüfe außerdem, ob die News veröffentlicht ist und nicht nur als Entwurf gespeichert.',
    bereich: 'posts',
  },
  {
    frage: 'Ich habe etwas geändert, aber die Website zeigt noch das Alte.',
    antwort: 'Manche Seiten werden nur jede Minute aktualisiert. Kurz warten und die Seite neu laden (F5). Hilft das nicht: Wurde wirklich „Veröffentlichen“ bzw. „Speichern“ geklickt?',
  },
  {
    frage: 'Ich habe mein Handy verloren / eine neue Handy-Nummer.',
    antwort:
      'Melde dich mit einem deiner Wiederherstellungscodes an (die zehn Codes, die du beim Einrichten bekommen hast). Hast du die nicht mehr, kann ein Admin die Zwei-Faktor-Anmeldung zurücksetzen. Danach richtest du die App neu ein.',
    bereich: 'users',
  },
  {
    frage: 'Ich habe mein Passwort vergessen.',
    antwort: 'Auf der Anmeldeseite auf „Passwort vergessen?“ klicken. Kommt keine E-Mail an, hilft ein Admin weiter.',
  },
  {
    frage: 'Ich habe aus Versehen etwas gelöscht.',
    antwort:
      'Bei News und Seiten gibt es „Versionen“ – solange der Eintrag noch da ist, kannst du frühere Fassungen wiederherstellen. Ganz gelöschte Einträge kann ein Admin unter Umständen aus einer Sicherung zurückholen – sag am besten sofort Bescheid.',
  },
  {
    frage: 'Wie lösche ich ein Bild?',
    antwort:
      'In der Mediathek das Bild anklicken, oben rechts die drei Punkte (⋮) und „Löschen“. Achtung: Wird das Bild noch in einer News benutzt, fehlt es dort danach.',
    bereich: 'media',
  },
  {
    frage: 'Darf ich Fotos von Kindern hochladen?',
    antwort:
      'Nur, wenn die Eltern zugestimmt haben (Einverständniserklärung). Im Zweifel lieber ein Foto, auf dem die Kinder nicht erkennbar sind, oder ein Gruppenbild von hinten.',
    bereich: 'media',
  },
  {
    frage: 'Warum kann ich ein Team nicht bearbeiten?',
    antwort: 'Du kannst nur Teams bearbeiten, bei denen du unter „Verantwortliche“ eingetragen bist. Ein Admin kann dich dort hinzufügen.',
    bereich: 'angebote',
  },
  {
    frage: 'Was ist der Unterschied zwischen „Entwurf speichern“ und „Veröffentlichen“?',
    antwort: 'Ein Entwurf ist nur in der Verwaltung sichtbar – zum Vorbereiten. „Veröffentlichen“ stellt den Inhalt auf die Website.',
  },
  {
    frage: 'Wie bekomme ich eine neue Seite ins Menü?',
    antwort: 'Seite veröffentlichen, dann unter „Menü“ einen Eintrag hinzufügen und die Seite auswählen. Die Anleitung steht in der Hilfe zu „Menü“.',
    bereich: 'menue',
  },
  {
    frage: 'Wer sieht die Mitgliedsanträge und Bankdaten?',
    antwort: 'Nur Personen mit der Rolle Kasse oder Admin. Alle anderen sehen diesen Bereich gar nicht.',
    bereich: 'mitgliedsantraege',
  },
  {
    frage: 'Ein Training fällt aus – wo trage ich das ein?',
    antwort: 'Unter „Trainingsausfälle“ – nicht bei „Termine“. Der Hinweis steht sofort auf der Teamseite und verschwindet nach dem Datum von selbst.',
    bereich: 'ausfaelle',
  },
  {
    frage: 'Kann ich die Verwaltung auch am Handy benutzen?',
    antwort: 'Ja. Die Seitenleiste öffnest du über das Menü-Symbol oben links. Für längere Texte ist ein Computer angenehmer.',
  },
]

/* ------------------------------------------------------------------ */
/* Rollenprofile: Begrüßung auf dem Dashboard und Kurzanleitung        */
/* ------------------------------------------------------------------ */
export type RollenProfil = {
  label: string
  kurz: string
  darf: string[]
  darfNicht: string[]
  /** Anleitungen (Bereich + ID), die in der Kurzanleitung stehen */
  anleitungen: [string, string][]
}

export const ROLLEN_PROFIL: Record<RolleKey, RollenProfil> = {
  admin: {
    label: 'Admin',
    kurz: 'Du darfst alles – inklusive Benutzer und Rollen.',
    darf: ['Alle Inhalte bearbeiten', 'Benutzer anlegen und Rollen vergeben', 'Zwei-Faktor zurücksetzen', 'Technische Einstellungen (Weiterleitungen)'],
    darfNicht: [],
    anleitungen: [
      ['users', 'konto-anlegen'],
      ['angebote', 'team-verantwortliche'],
      ['users', 'handy-verloren'],
      ['menue', 'menue-link'],
    ],
  },
  redaktion: {
    label: 'Redaktion',
    kurz: 'Du kümmerst dich um News, Termine, Seiten und Texte der Website.',
    darf: ['Alle News schreiben und auf die Startseite holen', 'Termine, Seiten, Menü und Website-Texte pflegen', 'Bilder verwalten', 'Kontakt- und Probetraining-Anfragen bearbeiten'],
    darfNicht: ['Mitgliedsanträge mit Bankdaten sehen', 'Benutzer und Rollen verwalten'],
    anleitungen: [
      ['posts', 'news-schreiben'],
      ['pages', 'seite-erstellen'],
      ['pages', 'seite-ins-menue'],
      ['texte', 'text-aendern'],
    ],
  },
  kasse: {
    label: 'Kasse',
    kurz: 'Du bearbeitest die Mitgliedsanträge und pflegst die Beiträge.',
    darf: ['Mitgliedsanträge (inkl. Bankdaten) bearbeiten', 'Beiträge in den Vereinsdaten pflegen'],
    darfNicht: ['News und Seiten veröffentlichen', 'Benutzer verwalten'],
    anleitungen: [
      ['mitgliedsantraege', 'antrag-bearbeiten'],
      ['verein', 'vorstand'],
    ],
  },
  uebungsleitung: {
    label: 'Übungsleitung',
    kurz: 'Du pflegst deine eigenen Teams oder Kurse.',
    darf: ['News für deine Teams schreiben', 'Fotos hochladen und deinen Teams zuordnen', 'Trainingsausfälle melden', 'Trainingszeiten und Beschreibung deiner Teams ändern'],
    darfNicht: ['News auf die Startseite holen (macht die Redaktion)', 'Andere Teams bearbeiten', 'Mitgliedsanträge sehen'],
    anleitungen: [
      ['ausfaelle', 'ausfall-melden'],
      ['posts', 'news-schreiben'],
      ['media', 'bild-hochladen'],
      ['angebote', 'team-zeiten'],
    ],
  },
  teamredaktion: {
    label: 'Team-Redaktion',
    kurz: 'Du schreibst News und lädst Fotos für deine Teams hoch.',
    darf: ['News für deine Teams schreiben', 'Fotos hochladen und deinen Teams zuordnen', 'Trainingsausfälle melden', 'Beschreibung deiner Teams ändern'],
    darfNicht: ['News auf die Startseite holen (macht die Redaktion)', 'Andere Teams bearbeiten', 'Mitgliedsanträge sehen'],
    anleitungen: [
      ['posts', 'news-schreiben'],
      ['media', 'bild-hochladen'],
      ['ausfaelle', 'ausfall-melden'],
    ],
  },
  mitglied: {
    label: 'Mitglied',
    kurz: 'Du nutzt den Mitgliederbereich der Website.',
    darf: ['Mitgliederbereich nutzen'],
    darfNicht: ['Die Verwaltung bearbeiten'],
    anleitungen: [],
  },
}

export const ROLLEN_REIHENFOLGE: RolleKey[] = ['admin', 'redaktion', 'kasse', 'uebungsleitung', 'teamredaktion']

/** Wichtigste Rolle eines Kontos (für Begrüßung und Hinweise) */
export function hauptRolle(rollen: string[] | undefined | null): RolleKey {
  return (ROLLEN_REIHENFOLGE.find((r) => rollen?.includes(r)) ?? 'mitglied') as RolleKey
}

export function anleitungFinden(bereich: string, id: string): Anleitung | undefined {
  return ANLEITUNGEN[bereich]?.find((a) => a.id === id)
}
