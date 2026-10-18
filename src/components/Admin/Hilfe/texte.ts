/**
 * Hilfetexte für die Verwaltung – bewusst einfach formuliert.
 * Schlüssel = Kurzname des Bereichs (wie in der Adresse: /admin/collections/<name> bzw. /admin/globals/<name>).
 * Texte hier ändern, wenn sich Abläufe im Verein ändern.
 */
export type HilfeText = {
  titel: string
  /** Ein Satz: Was ist das hier? */
  kurz: string
  /** Was kann ich hier machen? */
  tun: string[]
  /** Was passiert dann auf der Website? */
  wirkung: string[]
  /** Kleine Tipps und Stolperfallen */
  tipps?: string[]
}

export const HILFE: Record<string, HilfeText> = {
  dashboard: {
    titel: 'Übersicht',
    kurz: 'Deine Startseite in der Verwaltung. Hier siehst du auf einen Blick, was im Verein gerade los ist.',
    tun: [
      'Oben siehst du Zahlen, z. B. neue Mitgliedsanträge. Ein Klick darauf öffnet direkt die passende Liste.',
      'Unter „Schnellzugriff“ startest du die häufigsten Aufgaben, z. B. eine News schreiben.',
      '„Letzte Aktivitäten“ zeigt, was zuletzt geändert wurde.',
      'Links in der Seitenleiste findest du alle Bereiche, die du bearbeiten darfst.',
    ],
    wirkung: ['Auf dieser Seite änderst du nichts – sie ist nur zum Nachschauen und Loslegen.'],
    tipps: ['Du siehst nur die Bereiche, die zu deiner Rolle passen. Fehlt dir etwas, frag einen Admin.'],
  },

  posts: {
    titel: 'News',
    kurz: 'Hier schreibst du Neuigkeiten aus dem Verein – vom Spielbericht bis zur Einladung zum Sommerfest.',
    tun: [
      '„Neu erstellen“ anklicken. Alles steht auf einer Seite: Titel, Titelbild, Text.',
      'Rechts das Team oder den Kurs wählen – wer nur ein Team betreut, hat es schon vorausgewählt. Leer = Vereins-News.',
      '„Entwurf speichern“ sichert deine Arbeit, ohne dass sie jemand sieht.',
      '„Veröffentlichen“ stellt die News online.',
    ],
    wirkung: [
      'Veröffentlichte News erscheinen auf der Seite des gewählten Teams.',
      'Ist „Auf Startseite“ angehakt, erscheint sie zusätzlich auf der Startseite und unter „News“. Das entscheidet die Redaktion.',
      'Die Google-Vorschau (wie die News bei Google und beim Teilen aussieht) wird automatisch aus Titel, Text und Titelbild erzeugt.',
      'Entwürfe sieht niemand außer euch in der Verwaltung.',
    ],
    tipps: [
      'Bilder mit Kindern nur verwenden, wenn die Eltern zugestimmt haben.',
      'Kurze, klare Überschriften funktionieren am besten.',
      'Redaktion: Kategorie, Datum, Autor:in und Slug stehen rechts; ganz unten eingeklappt „Für Fortgeschrittene“ (Google-Vorschau, passende News). Alles davon ist optional.',
    ],
  },

  termine: {
    titel: 'Termine',
    kurz: 'Der Vereinskalender: Feste, Turniere, Versammlungen und andere Veranstaltungen.',
    tun: [
      'Einen Termin mit Titel, Beginn, Ende und Ort anlegen.',
      'Den Bereich wählen (Verein, Fußball, Kids, Breitensport) – davon hängt die Farbe ab.',
      'Mit „nur für Mitglieder“ ist der Termin nur nach dem Login sichtbar.',
    ],
    wirkung: [
      'Termine erscheinen auf der Seite „Termine“, nach Monaten sortiert.',
      'Vergangene Termine verschwinden automatisch von der Website.',
    ],
    tipps: ['Trainingsausfälle gehören nicht hierher, sondern unter „Trainingsausfälle“.'],
  },

  media: {
    titel: 'Mediathek',
    kurz: 'Alle Bilder und Dateien der Website an einem Ort.',
    tun: [
      'Bilder oder PDFs hochladen – einfach per Drag & Drop oder über „Neu erstellen“.',
      'Eine kurze Bildbeschreibung eingeben: Was ist auf dem Bild zu sehen?',
      'Ein Team zuordnen und „In Galerie zeigen“ anhaken, damit das Bild in der Galerie des Teams erscheint.',
    ],
    wirkung: [
      'Hochgeladene Bilder kannst du überall auswählen – in News, Seiten, bei Teams und Kursen.',
      'Bilder mit „In Galerie zeigen“ erscheinen auf der Seite des Teams.',
      'Wer den Link zu einer Datei kennt, kann sie öffnen. Keine vertraulichen Unterlagen hochladen.',
    ],
    tipps: [
      'Fotos von Kindern nur mit Einverständnis der Eltern hochladen.',
      'Die Bildbeschreibung hilft Menschen, die die Seite vorgelesen bekommen – und Google.',
      'Ein Bild löschen, das noch irgendwo benutzt wird, hinterlässt dort eine Lücke.',
    ],
  },

  pages: {
    titel: 'Seiten',
    kurz: 'Eigene Seiten, die ihr selbst zusammenbaut – z. B. „Kunstrasen“, „Impressum“ oder eine Seite fürs Sommerfest.',
    tun: [
      '„Neu erstellen“ anklicken und einen Titel vergeben.',
      'Reiter „Kopfbereich“: der große Bereich ganz oben (Art, Überschrift, Buttons, Bild).',
      'Reiter „Inhalt (Bausteine)“: die Seite aus Bausteinen zusammenstellen – Text, Bild, Hinweis-Kasten mit Button, News-Liste, Formular.',
      'Reiter „Google-Vorschau“: optional, wird sonst automatisch erzeugt.',
      'Mit der Vorschau (Bildschirm-Symbol oben) siehst du die Seite, bevor sie online geht.',
      '„Veröffentlichen“ stellt die Seite online.',
    ],
    wirkung: [
      'Die Seite ist unter eurer Domain mit dem Kurznamen erreichbar, z. B. /sommerfest.',
      'Im Menü erscheint sie erst, wenn ihr sie unter „Menü & Fußzeile“ eintragt.',
      'Entwürfe sind nicht öffentlich.',
    ],
    tipps: [
      'Den Kurznamen (Slug) besser nicht mehr ändern, wenn die Seite schon verlinkt wurde – sonst führen alte Links ins Leere.',
      'Impressum und Datenschutz bitte nur in Absprache mit dem Vorstand ändern.',
    ],
  },

  categories: {
    titel: 'Kategorien',
    kurz: 'Schlagworte für News, z. B. „Fußball“, „Kids“ oder „Verein“.',
    tun: ['Neue Kategorie anlegen oder vorhandene umbenennen.', 'In einer News kannst du dann eine oder mehrere Kategorien auswählen.'],
    wirkung: ['Auf der News-Seite können Besucher nach diesen Kategorien filtern.'],
    tipps: ['Lieber wenige, klare Kategorien als viele ähnliche.'],
  },

  angebote: {
    titel: 'Teams & Kurse',
    kurz: 'Alle Fußballteams und Breitensportkurse des Vereins – jedes mit eigener Seite.',
    tun: [
      'Name, Altersangabe, Beschreibung und Titelbild pflegen.',
      'Unter „Trainingszeiten“ Tag, Uhrzeit und Ort eintragen.',
      'Unter „Verantwortliche“ die Benutzerkonten auswählen, die dieses Team pflegen dürfen.',
      'Mit „Aktiv“ blendest du ein Angebot ein oder aus.',
    ],
    wirkung: [
      'Jedes aktive Angebot hat eine eigene Seite und erscheint automatisch im Menü, im Angebotsfinder und im Mitgliedsantrag.',
      'Ein neues Team taucht also überall auf, ohne dass ihr woanders etwas ändern müsst.',
      'Verantwortliche können danach News, Bilder und Ausfälle für dieses Team pflegen.',
    ],
    tipps: [
      '„Reihenfolge“: Kleinere Zahlen stehen weiter vorne.',
      'Ein Angebot lieber auf „nicht aktiv“ setzen statt zu löschen – so bleiben News und Bilder erhalten.',
    ],
  },

  ausfaelle: {
    titel: 'Trainingsausfälle',
    kurz: 'Hier meldest du, wenn ein Training ausfällt – z. B. weil die Halle belegt ist.',
    tun: ['Team oder Kurs wählen, Datum eintragen und den Grund auswählen.', 'Ist der Ausfall vorbei, verschwindet er von selbst.'],
    wirkung: [
      'Der Ausfall erscheint sofort gut sichtbar auf der Seite des Teams und im Mitgliederbereich.',
      'Eltern und Mitglieder sehen so schnell, dass sie nicht kommen müssen.',
    ],
    tipps: ['Als Übungsleitung siehst du nur deine eigenen Teams.'],
  },

  probetraining: {
    titel: 'Probetraining-Anfragen',
    kurz: 'Anfragen von Interessierten, die über die Website ein Probetraining angefragt haben.',
    tun: [
      'Neue Anfragen öffnen und lesen.',
      'Die Person kontaktieren und danach den Status ändern, z. B. auf „Zugesagt“ oder „Erledigt“.',
    ],
    wirkung: ['Der Status ist nur für euch intern – die anfragende Person sieht ihn nicht.'],
    tipps: [
      'Bitte zeitnah antworten – das ist oft der erste Kontakt mit dem Verein.',
      'Die Daten sind persönlich. Nicht weitergeben und erledigte Anfragen regelmäßig löschen.',
    ],
  },

  mitgliedsantraege: {
    titel: 'Mitgliedsanträge',
    kurz: 'Online gestellte Anträge auf Mitgliedschaft – inklusive SEPA-Lastschriftmandat.',
    tun: [
      'Neue Anträge prüfen.',
      'Den Status setzen: „Rückfrage“, „Aufgenommen“ oder „Abgelehnt“.',
      'Die Daten in die Mitgliederverwaltung übernehmen.',
    ],
    wirkung: ['Der Status ist intern. Die Zahl der offenen Anträge siehst du auch auf der Übersicht.'],
    tipps: [
      'Hier stehen Bankdaten. Nur Kasse und Vorstand haben Zugriff – bitte nichts ausdrucken oder weiterleiten.',
      'Übernommene Anträge nach der vorgeschriebenen Frist löschen.',
    ],
  },

  kontaktanfragen: {
    titel: 'Kontaktanfragen',
    kurz: 'Nachrichten, die über das Kontaktformular der Website geschickt wurden.',
    tun: ['Nachricht lesen, beantworten und den Status auf „Erledigt“ setzen.', 'Im Feld „An“ steht, wen die Person erreichen wollte.'],
    wirkung: ['Der Status ist nur intern sichtbar.'],
    tipps: ['Erledigte Anfragen regelmäßig löschen – es sind persönliche Daten.'],
  },

  users: {
    titel: 'Benutzer',
    kurz: 'Alle Personen, die sich anmelden können – vom Mitglied bis zum Admin.',
    tun: [
      'Neue Konten anlegen und Rollen vergeben.',
      'Schnell sehen, wer welche Rolle für welches Team hat: links unten „Rollen-Übersicht“.',
      'Über die Rolle legst du fest, was jemand darf:',
      '• Web-Admin: alles inkl. Technik und Admin-Rechte vergeben · Admin: alles andere',
      '• Redaktion: News, Seiten, Menü, Texte · Kasse: Mitgliedsanträge',
      '• Übungsleitung / Team-Redaktion: nur die eigenen Teams · Mitglied: nur der Mitgliederbereich',
      'Bei Teams & Kursen unter „Verantwortliche“ legst du fest, welche Teams jemand pflegt.',
    ],
    wirkung: [
      'Alle außer „Mitglied“ müssen beim Anmelden zusätzlich einen Code aus einer Handy-App eingeben (Zwei-Faktor).',
      'Hat jemand sein Handy verloren, entfernt ein Admin in seinem Konto den Haken bei „Zwei-Faktor-Anmeldung eingerichtet“ – dann richtet die Person es neu ein.',
    ],
    tipps: ['Rollen sparsam vergeben: Jeder bekommt nur, was er wirklich braucht.', 'Wer den Verein verlässt, dessen Konto bitte löschen.'],
  },

  menue: {
    titel: 'Menü & Fußzeile',
    kurz: 'Hier legst du fest, was oben im Menü und unten in der Fußzeile der Website steht – und in welcher Reihenfolge.',
    tun: [
      'Reiter „Hauptmenü oben“: alle Einträge der Menüleiste, von links nach rechts.',
      'Reihenfolge ändern: einen Eintrag am Griff links (sechs Punkte) nach oben oder unten ziehen. Oben = weiter links auf der Website.',
      'Entfernen: rechts am Eintrag auf die drei Punkte (⋯) → „Entfernen“.',
      'Hinzufügen: unten „Eintrag hinzufügen“, Text eingeben und wählen, was er tun soll: Seite öffnen, Adresse öffnen oder Aufklappmenü zeigen.',
      'Reiter „Aufklappmenü Verein“: die beiden Spalten, die beim Darüberfahren über „Verein“ erscheinen.',
      'Reiter „Fußzeile unten“: die Spalten mit Links ganz unten auf jeder Seite.',
    ],
    wirkung: [
      'Nach dem Speichern ist das neue Menü nach kurzer Zeit auf der ganzen Website sichtbar.',
      'Die Aufklappmenüs „Fußball“ und „Breitensport“ füllen sich automatisch aus „Teams & Kurse“.',
      'Wird eine Liste ganz geleert, zeigt die Website wieder den Standard.',
    ],
    tipps: ['Höchstens etwa acht Einträge in der Menüleiste, sonst wird es auf kleineren Bildschirmen eng.', 'Ausgewählte Seiten müssen veröffentlicht sein.'],
  },

  verein: {
    titel: 'Vereinsdaten',
    kurz: 'Die Grunddaten des Vereins: Zahlen, Adressen, Beiträge, Vorstand, Downloads und Startseiten-Bilder.',
    tun: [
      'Mitgliederzahl und Gründungsjahr aktualisieren.',
      'Beiträge pflegen – sie erscheinen im Mitgliedsantrag und auf der Vereinsseite.',
      'Vorstand und Ansprechpersonen eintragen, mit Funktion und optional Foto.',
      'Satzung und andere Dokumente zum Herunterladen hinterlegen.',
      'Unter „Startseite“: die Bilder oben, die zwei Schilder, die Kachel-Bilder und die grüne Aktions-Box.',
      'Hauptsponsor und Social-Media-Links für die Fußzeile pflegen.',
    ],
    wirkung: [
      'Die Zahlen tauchen auf der Startseite und in Texten auf.',
      'Der Vorstand erscheint auf der Vereinsseite und als Empfänger im Kontaktformular.',
      'Geänderte Beiträge gelten sofort für neue Online-Anträge.',
    ],
    tipps: ['Fotos vom Vorstand nur mit Einverständnis.', 'Keine privaten Telefonnummern eintragen – Kontakt läuft über das Formular.'],
  },

  texte: {
    titel: 'Website-Texte',
    kurz: 'Alle Überschriften, Texte und Link-Beschriftungen der Website – ohne Programmieren änderbar.',
    tun: [
      'Oben einen Reiter wählen: Startseite, Fußball, Breitensport, Verein oder Weitere Seiten (News, Termine, Kontakt, Antrag, Probetraining, Fußzeile).',
      'Im Reiter „Startseite“ stehen die Felder in derselben Reihenfolge wie auf der Seite: Kopfbereich, Zahlen-Leiste, Kacheln, Angebotsfinder, News, „Mitglied werden“ mit den drei Schritten.',
      'Text im Feld ändern und oben rechts speichern.',
      'Platzhalter wie {mitglieder} oder {teams} werden automatisch durch die aktuelle Zahl ersetzt.',
    ],
    wirkung: ['Nach dem Speichern steht der neue Text nach etwa einer Minute auf der Website.'],
    tipps: [
      'Bilder, die Schilder im Kopfbereich und die grüne Aktions-Box der Startseite stehen unter „Vereinsdaten“.',
      'Die Zahlen selbst (Mitglieder, Kinder, Gründungsjahr) ebenfalls unter „Vereinsdaten“. Die Anzahl der Teams & Kurse zählt die Website automatisch.',
      'Menü und Fußzeilen-Links: unter „Menü & Fußzeile“.',
      'Platzhalter in geschweiften Klammern bitte genau so stehen lassen.',
      'Ein Zeilenumbruch in einer Überschrift macht die zweite Zeile grün.',
    ],
  },

  forms: {
    titel: 'Formulare',
    kurz: 'Eigene Formulare für Seiten, z. B. eine Anmeldung zum Sommerfest.',
    tun: [
      'Ein Formular aus Feldern zusammenstellen: Name, E-Mail, Auswahl, Ankreuzfeld usw.',
      'Festlegen, welche Nachricht nach dem Absenden erscheint.',
      'Auf einer Seite den Baustein „Formular“ einfügen und dieses Formular auswählen.',
    ],
    wirkung: ['Ausgefüllte Formulare landen unter „Formular-Eingänge“.'],
    tipps: ['Mitgliedsantrag, Probetraining und Kontakt sind feste Formulare – die musst du hier nicht anlegen.', 'Nur abfragen, was ihr wirklich braucht (Datenschutz).'],
  },

  'form-submissions': {
    titel: 'Formular-Eingänge',
    kurz: 'Alles, was Besucher über eure eigenen Formulare abgeschickt haben.',
    tun: ['Einträge ansehen und nach Formular filtern.'],
    wirkung: ['Nur für euch sichtbar.'],
    tipps: ['Nach der Veranstaltung die Eingänge löschen – es sind persönliche Daten.'],
  },

  redirects: {
    titel: 'Weiterleitungen',
    kurz: 'Leitet alte Adressen auf neue Seiten um – z. B. Links von der alten Website.',
    tun: ['Eine alte Adresse eintragen und angeben, wohin sie führen soll.'],
    wirkung: ['Wer die alte Adresse aufruft, landet automatisch auf der neuen Seite.'],
    tipps: ['Nur nötig, wenn sich eine Adresse geändert hat. Im Zweifel einen Admin fragen.'],
  },

  search: {
    titel: 'Suchindex',
    kurz: 'Ein automatisch gepflegtes Verzeichnis für die Suche auf der Website.',
    tun: ['Normalerweise nichts – die Einträge entstehen von selbst, wenn News veröffentlicht werden.'],
    wirkung: ['Änderungen hier beeinflussen nur die Suchergebnisse.'],
    tipps: ['Hier bitte nichts von Hand löschen.'],
  },

  rollen: {
    titel: 'Rollen-Übersicht',
    kurz: 'Auf einen Blick: Wer hat welche Rolle – und für welche Teams ist jemand verantwortlich?',
    tun: [
      'Reiter „Nach Person“: jede Person mit ihren Rollen, ihren Teams und ob die Zwei-Faktor-Anmeldung eingerichtet ist.',
      'Reiter „Nach Team“: jedes Team und jeder Kurs mit den Verantwortlichen.',
      'Reiter „Nach Rolle“: alle Personen, gruppiert nach Rolle, mit Anzahl.',
      'Oben suchen: Name, Team oder Rolle eintippen.',
      'Rolle ändern: bei der Person auf „Bearbeiten“. Team zuordnen: beim Team auf „Zuordnen“ und unter „Verantwortliche“ eintragen.',
    ],
    wirkung: [
      'Die Übersicht zeigt nur an – geändert wird beim Benutzer bzw. beim Team.',
      '⚠️ markiert Lücken: Übungsleitungen ohne Team, Teams ohne Verantwortliche, Zugänge ohne Zwei-Faktor.',
    ],
    tipps: ['Einmal im Monat kurz durchschauen: Hat noch jemand Rechte, der nicht mehr dabei ist?', 'Nur Admins und Web-Admins sehen diese Seite.'],
  },

  'hilfe-center': {
    titel: 'Hilfe-Center',
    kurz: 'Alle Anleitungen und häufigen Fragen an einem Ort – mit Suche.',
    tun: [
      'Oben ins Suchfeld tippen, z. B. „Bild“ oder „Ausfall“.',
      'Eine Anleitung anklicken, um die Schritte zu sehen.',
      'Die Kurzanleitung für deine Rolle ausdrucken oder als PDF speichern.',
    ],
    wirkung: ['Hier änderst du nichts – es ist nur zum Nachlesen.'],
  },
  hilfe: {
    titel: 'Hilfe-Texte',
    kurz: 'Hier ergänzt ihr die Hilfe selbst – eigene Tipps, Anleitungen und häufige Fragen.',
    tun: [
      'Bei „Ergänzungen je Bereich“ einen Bereich wählen und Tipps oder Anleitungen hinzufügen.',
      'Bei Anleitungen gilt: eine Zeile = ein Schritt.',
      'Bei „Häufige Fragen“ neue Fragen mit Antwort anlegen.',
      'Oben die Ansprechperson eintragen, die bei Fragen hilft.',
    ],
    wirkung: [
      'Eure Ergänzungen erscheinen sofort im „? Hilfe“-Fenster und im Hilfe-Center.',
      'Die eingebauten Texte bleiben immer erhalten.',
    ],
    tipps: ['Schaut unter „Hilfe-Rückmeldungen“, welche Hilfen als nicht hilfreich markiert wurden.'],
  },
  'hilfe-feedback': {
    titel: 'Hilfe-Rückmeldungen',
    kurz: 'Was Nutzer unter „Hat dir das geholfen?“ angeklickt und geschrieben haben.',
    tun: ['Rückmeldungen lesen und unklare Hilfetexte unter „Hilfe-Texte“ verbessern.'],
    wirkung: ['Nur Admins sehen diese Liste.'],
  },

  account: {
    titel: 'Mein Konto',
    kurz: 'Deine eigenen Kontodaten.',
    tun: ['Namen und E-Mail-Adresse ändern.', 'Ein neues Passwort setzen.'],
    wirkung: ['Der Name erscheint unten links in der Seitenleiste.'],
    tipps: ['Ein gutes Passwort ist lang – z. B. ein Satz mit mehreren Wörtern.'],
  },
}

/** Zusatzhinweis, wenn ein einzelner Eintrag geöffnet ist (Bearbeiten-Ansicht) */
export const HILFE_BEARBEITEN = [
  'Pflichtfelder sind mit einem roten Sternchen markiert.',
  'Erst mit „Speichern“ bzw. „Veröffentlichen“ oben rechts wird etwas übernommen.',
  'Über das Drei-Punkte-Menü oben rechts kannst du einen Eintrag duplizieren oder löschen.',
]

/** Zusatzhinweis in Listen */
export const HILFE_LISTE = [
  'Mit „Neu erstellen“ legst du einen Eintrag an, mit einem Klick auf den Titel bearbeitest du ihn.',
  'Über das Suchfeld und „Filter“ findest du Einträge schneller.',
  'Mehrere Einträge auf einmal: links die Kästchen anhaken.',
]
