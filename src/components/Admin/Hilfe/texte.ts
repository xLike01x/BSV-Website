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
  /** Wozu brauche ich das überhaupt? Mit Beispielen aus dem Vereinsalltag */
  wozu?: { text: string; beispiele?: string[] }
}

export const HILFE: Record<string, HilfeText> = {
  dashboard: {
    titel: 'Übersicht',
    kurz: 'Deine Startseite in der Verwaltung. Hier siehst du auf einen Blick, was im Verein gerade los ist.',
    tun: [
      'Oben siehst du Zahlen, z. B. neue Mitgliedsanträge. Ein Klick darauf öffnet direkt die passende Liste.',
      'Unter „Schnellzugriff“ startest du die häufigsten Aufgaben, z. B. eine News schreiben.',
      '„Letzte Aktivitäten“ zeigt, was zuletzt geändert wurde.',
      'Links in der Seitenleiste findest du alle Bereiche, die du bearbeiten darfst – sortiert nach Posteingang, Inhalte, Website-Aufbau, Sport, Mitglieder und Einstellungen.',
      'Eine orange Zahl im „Posteingang“ zeigt, wie viele neue Anträge und Anfragen auf dich warten.',
    ],
    wirkung: ['Auf dieser Seite änderst du nichts – sie ist nur zum Nachschauen und Loslegen.'],
    tipps: ['Du siehst nur die Bereiche, die zu deiner Rolle passen. Fehlt dir etwas, frag einen Admin.'],
  },

  posts: {
    titel: 'News',
    kurz: 'Hier schreibst du Neuigkeiten aus dem Verein – vom Spielbericht bis zur Einladung zum Sommerfest.',
    wozu: {
      text: 'Damit Mitglieder, Eltern und Fans mitbekommen, was im Verein passiert.',
      beispiele: ['Spielbericht vom Wochenende', '„Neue Trainingszeiten ab September“', 'Rückblick aufs Sommerfest mit Fotos'],
    },
    tun: [
      'Oben in der Liste eine Vorlage wählen (Spielbericht, Ankündigung, Rückblick) – die News wird als Entwurf angelegt und geöffnet.',
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
    wozu: {
      text: 'Damit alle wissen, wann was stattfindet. Termine erscheinen im Kalender und auf der Startseite.',
      beispiele: ['Jahreshauptversammlung', 'Sommerfest', 'Hallenturnier der E-Jugend'],
    },
    tun: [
      'Oben in der Liste eine Vorlage wählen (Vereinsfest, Versammlung, Turnier) – die Felder sind dann schon ausgefüllt. Gespeichert wird erst mit „Speichern“.',
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
    wozu: {
      text: 'Hier liegen alle Bilder und Dateien – sortiert in Ordner je Team. Was hier liegt, kannst du in News, auf Seiten und bei Teams auswählen. Trainer sehen nur die Ordner ihrer Teams und „Verein allgemein“.',
      beispiele: ['Mannschaftsfoto für die Teamseite', 'Plakat zum Sommerfest', 'Satzung als PDF'],
    },
    tun: [
      'Bilder oder PDFs hochladen – einfach per Drag & Drop oder über „Neu erstellen“.',
      'Eine kurze Bildbeschreibung eingeben: Was ist auf dem Bild zu sehen?',
      'Pflicht beim Hochladen: angeben, ob Personen zu erkennen sind – und wenn ja, dass die Einwilligung vorliegt (bei Kindern von den Eltern).',
      'Ein Team zuordnen und „In Galerie zeigen“ anhaken, damit das Bild in der Galerie des Teams erscheint.',
      'Oben im Kasten „Ordner“ ein Team anklicken, um nur dessen Bilder zu sehen.',
      'Verschieben: ein Bild unten in der Liste mit der Maus auf einen Ordner ziehen. Angehakte Bilder wandern zusammen. Danach kannst du es mit „Rückgängig“ zurücknehmen.',
      'Oder: Bild öffnen → rechts „Ordner (Team / Kurs)“. Bilder ohne Team für alle Trainer freigeben: Haken „Verein allgemein“.',
      'Sponsor-Logos landen automatisch im Ordner „🤝 Sponsoren“, sobald sie bei einem Sponsor gespeichert werden (oder Haken „Sponsoren-Logo“).',
      'Viele Bilder auf einmal: links anhaken → oben „Bearbeiten“ → Feld „Ordner (Team / Kurs)“ wählen.',
      'Redaktion: „Automatisch zuordnen“ schlägt für Bilder ohne Ordner das passende Team vor – erst Vorschau, dann „Übernehmen“.',
    ],
    wirkung: [
      'Hochgeladene Bilder kannst du überall auswählen – in News, Seiten, bei Teams und Kursen.',
      'Bilder mit „In Galerie zeigen“ erscheinen auf der Seite des Teams.',
      'Trainer können nur Bilder ihrer Teams und aus „Verein allgemein“ auswählen. „Verein allgemein“ dürfen sie benutzen, aber nicht ändern.',
      'Verschieben ändert nichts auf der Website: Ein Bild bleibt in jeder News, auf jeder Seite und bei jedem Team, wo es schon eingebaut ist.',
      'Einzige Ausnahme: Hat das Bild den Haken „In der Bildergalerie des Teams zeigen“, erscheint es danach in der Galerie des neuen Teams.',
      'Die Ordner gelten nur in der Verwaltung – auf der Website sind die Bilder für alle sichtbar, wo sie eingebaut sind.',
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
    wozu: {
      text: 'Für alles, was nicht News, Termin oder Team ist: eine eigene Seite mit eigener Adresse, die ihr frei aus Bausteinen zusammensetzt.',
      beispiele: ['Seite „Sommerfest 2027“ mit Infos, Bild und Anmeldeformular', 'Seite „Helfer gesucht“', 'Feste Seiten wie Impressum oder Kunstrasen'],
    },
    tun: [
      'Oben in der Liste eine Vorlage wählen (Infoseite, Veranstaltung) – die Seite wird als Entwurf mit passenden Bausteinen angelegt.',
      '„Neu erstellen“ anklicken und einen Titel vergeben.',
      'Reiter „Kopfbereich“: der große Bereich ganz oben (Art, Überschrift, Buttons, Bild).',
      'Reiter „Inhalt (Bausteine)“: die Seite aus Bausteinen zusammenstellen – Text, Bild, Hinweis-Kasten mit Button, News-Liste, Formular.',
      'Bei „Baustein hinzufügen“ zeigt jedes Vorschaubild, wie der Baustein später auf der Website ungefähr aussieht.',
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
    wozu: {
      text: 'Optional: Themen, nach denen News sortiert werden können. Für Teams braucht ihr das nicht – die werden direkt beim News-Eintrag gewählt.',
      beispiele: ['„Vereinsleben“', '„Jugend“', '„Sponsoren“'],
    },
    tun: ['Neue Kategorie anlegen oder vorhandene umbenennen.', 'In einer News kannst du dann eine oder mehrere Kategorien auswählen.'],
    wirkung: ['Auf der News-Seite können Besucher nach diesen Kategorien filtern.'],
    tipps: ['Lieber wenige, klare Kategorien als viele ähnliche.'],
  },

  angebote: {
    titel: 'Teams & Kurse',
    kurz: 'Alle Fußballteams und Breitensportkurse des Vereins – jedes mit eigener Seite.',
    wozu: {
      text: 'Jedes Team und jeder Kurs bekommt automatisch eine eigene Seite mit Zeiten, Ort, Ansprechpartnern, News und Bildern.',
      beispiele: ['„E-Jugend“ mit Trainingszeiten', 'Kurs „Rückenfit“', '„Tanzmäuse“'],
    },
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
    wozu: {
      text: 'Damit niemand umsonst zum Training kommt. Der Ausfall erscheint sofort auf der Teamseite.',
      beispiele: ['„Training fällt aus – Halle belegt“', 'Ferienpause', 'Platz gesperrt nach Unwetter'],
    },
    tun: ['Team oder Kurs wählen, Datum eintragen und den Grund auswählen.', 'Ist der Ausfall vorbei, verschwindet er von selbst.'],
    wirkung: [
      'Der Ausfall erscheint sofort gut sichtbar auf der Seite des Teams und im Mitgliederbereich.',
      'Eltern und Mitglieder sehen so schnell, dass sie nicht kommen müssen.',
    ],
    tipps: ['Als Trainer siehst du nur deine eigenen Teams.'],
  },

  probetraining: {
    titel: 'Probetraining-Anfragen',
    kurz: 'Anfragen von Interessierten, die über die Website ein Probetraining angefragt haben.',
    wozu: {
      text: 'Hier landen Anfragen von Leuten, die ein Team oder einen Kurs ausprobieren möchten.',
      beispiele: ['Eltern melden ihr Kind zum Schnuppertraining an', 'Erwachsene fragen nach einer Probestunde'],
    },
    tun: [
      'Am schnellsten: oben „Schnell melden“ – Team, Tag (Heute/Morgen) und Grund wählen, fertig.',
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
    wozu: {
      text: 'Online-Mitgliedsanträge von der Website – inklusive Bankdaten fürs Lastschrift-Mandat.',
      beispiele: ['Neues Mitglied über „Mitglied werden“'],
    },
    tun: [
      'Neue Anträge prüfen.',
      'Den Status setzen: „Rückfrage“, „Aufgenommen“ oder „Abgelehnt“.',
      'Die Daten in die Mitgliederverwaltung übernehmen.',
      'Bei „Aufgenommen“ entsteht automatisch der Eintrag für den digitalen Mitgliedsausweis (unter „Mitgliedschaften“) – dort nur noch die Mitgliedsnummer ergänzen.',
    ],
    wirkung: ['Der Status ist intern. Die Zahl der offenen Anträge siehst du auch auf der Übersicht.'],
    tipps: [
      'Hier stehen Bankdaten. Nur Kasse und Vorstand haben Zugriff – bitte nichts ausdrucken oder weiterleiten.',
      'Übernommene Anträge nach der vorgeschriebenen Frist löschen.',
    ],
  },

  passantraege: {
    titel: 'Passanträge (Fußball)',
    kurz: 'Anträge auf Spielerlaubnis aus dem Mitgliederbereich – mit allen Unterlagen für das DFBnet.',
    wozu: {
      text: 'Wer in Meisterschaft, Pokal oder Turnieren mit Passpflicht spielen will, braucht einen Spielerpass. Mitglieder stellen den Antrag online – auch für ihre Kinder – und laden Ausweis, Passfoto & Co. hoch.',
      beispiele: ['Neues Kind bei den Bambini', 'Spieler wechselt von einem anderen Verein', 'Wechsel aus dem Ausland'],
    },
    tun: [
      'Neue Anträge öffnen (Status „Eingereicht“) und die Unterlagen anklicken – sie öffnen sich in einem neuen Fenster.',
      'Fehlt etwas: Status „Unterlagen fehlen“ und beim „Hinweis an die antragstellende Person“ schreiben, was fehlt. Die Person sieht das im Mitgliederbereich und kann nachreichen.',
      'Passt alles: Antrag im DFBnet einreichen, Status „Beim Verband“, die Vorgangsnummer in die interne Notiz.',
      'Kommt die Spielerlaubnis: Status „Spielerlaubnis erteilt“.',
    ],
    wirkung: [
      'Die antragstellende Person sieht den Status und deinen Hinweis im Mitgliederbereich.',
      'Nach „Spielerlaubnis erteilt“ oder „Abgelehnt“ werden Ausweis, Passfoto und Erklärungen automatisch gelöscht (Standard 30 Tage). Der unterschriebene Passantrag wird 2 Jahre aufbewahrt und dann samt Antrag gelöscht. Beide Fristen stehen unter „Datenschutz-Fristen“.',
    ],
    tipps: [
      'Sehen dürfen die Anträge: Admin, die Rolle „Passwesen“ (alle Teams) und die Trainer des jeweiligen Teams. Team-Redaktion und andere Trainer sehen sie nicht.',
      'Es sind Ausweiskopien von Kindern dabei – bitte nichts herunterladen, ausdrucken oder weiterleiten, was nicht für das DFBnet nötig ist.',
      'Der Link zum offiziellen Formular (WDFV) ist unter „Vereinsdaten“ → „Fußball: Passantrag“ hinterlegt – dort auch änderbar.',
    ],
  },

  mitgliedschaften: {
    titel: 'Mitgliedschaften (digitaler Ausweis)',
    kurz: 'Die Daten, die auf dem digitalen Mitgliedsausweis im Mitgliederbereich stehen.',
    wozu: {
      text: 'Jedes Mitglied sieht nach dem Login seinen Ausweis – mit Mitgliedsnummer, Eintrittsdatum, Art der Mitgliedschaft und Kursen. Eltern sehen auch die Ausweise ihrer Kinder.',
      beispiele: ['Ausweis beim Vereinsfest vorzeigen', 'Rabatt bei Partnern', 'Nachweis bei Turnieren'],
    },
    tun: [
      'Wird ein Mitgliedsantrag auf „Aufgenommen“ gesetzt, entsteht der Eintrag automatisch (auch für Familienmitglieder). Du ergänzt nur noch die Mitgliedsnummer.',
      'Für Mitglieder ohne Online-Antrag: „Neu erstellen“, Name, Nummer, „Mitglied seit“, Art und die E-Mail eintragen.',
      'Sichtbar wird der Ausweis im verknüpften Benutzerkonto. Das passiert automatisch, wenn du eine Registrierung mit gleicher E-Mail freigibst – oder du wählst das Konto bei „Benutzerkonto“ selbst aus.',
      'Bei Kindern das Konto der Eltern verknüpfen – dann erscheinen alle Ausweise der Familie dort.',
      'Austritt: „Gültig bis“ setzen oder den Haken „Mitgliedschaft gültig“ entfernen.',
    ],
    wirkung: [
      'Der Ausweis aktualisiert sich sofort – Kurse, Gültigkeit und Daten kommen immer frisch aus diesen Einträgen.',
      'Der QR-Code auf dem Ausweis führt zu einer Prüfseite, die live „gültig“ oder „nicht gültig“ zeigt – nur mit Vorname, Anfangsbuchstabe des Nachnamens und Nummer.',
    ],
    tipps: ['Die laufende Uhr und der schimmernde Streifen zeigen beim Vorzeigen, dass es kein Screenshot ist.'],
  },

  kontaktanfragen: {
    titel: 'Kontaktanfragen',
    kurz: 'Nachrichten, die über das Kontaktformular der Website geschickt wurden.',
    wozu: {
      text: 'Nachrichten aus dem Kontaktformular und Fragen aus der Hilfe.',
      beispiele: ['Frage zu Beiträgen', 'Sponsoring-Anfrage', 'Frage an den Admin'],
    },
    tun: ['Nachricht lesen, beantworten und den Status auf „Erledigt“ setzen.', 'Im Feld „Anliegen“ steht, worum es geht (Auswahl „Worum geht es?“ im Formular).'],
    wirkung: ['Der Status ist nur intern sichtbar.', 'Neue Nachrichten gehen zusätzlich per E-Mail an die Empfänger des Anliegens (festgelegt unter Vereinsdaten). Auf die E-Mail antworten = Antwort direkt an den Absender.'],
    tipps: ['Erledigte Anfragen regelmäßig löschen – es sind persönliche Daten.'],
  },

  users: {
    titel: 'Benutzer',
    kurz: 'Alle Personen, die sich anmelden können – vom Mitglied bis zum Admin.',
    wozu: {
      text: 'Jeder, der sich anmelden soll, braucht ein Konto. Die Rolle legt fest, was die Person darf.',
      beispiele: ['Konto für einen neuen Trainer', 'Pressewart einer Mannschaft als Team-Redaktion'],
    },
    tun: [
      'Oben steht „🔎 Was darf diese Person?“: in Klartext, was die Person bearbeiten und ansehen darf – live berechnet, sobald du Rollen anklickst. So siehst du vor dem Speichern, was passiert.',
      'Rollen wählst du per Kachel mit Häkchen. Jede Kachel erklärt in einer Zeile, wofür die Rolle gedacht ist.',
      'Neue Konten anlegen und Rollen vergeben.',
      'Schnell sehen, wer welche Rolle für welches Team hat: links unter „Einstellungen“ → „Rollen & Rechte“.',
      'Einzelne Rechte nur für diese Person: beim Benutzer unten „Zusatzrechte nur für diese Person“ – Häkchen setzen, speichern (nur Web-Admin). Für Ausnahmen, wenn eine ganze Rolle zu viel wäre.',
      'Über die Rolle legst du fest, was jemand darf:',
      '• Web-Admin: alles inkl. Technik und Admin-Rechte vergeben · Admin: alles andere',
      '• Redaktion: News, Seiten, Menü, Texte · Kasse: Mitgliedsanträge',
      '• Trainer / Team-Redaktion: nur die eigenen Teams · Mitglied: nur der Mitgliederbereich',
      'Bei Teams & Kursen unter „Verantwortliche“ legst du fest, welche Teams jemand pflegt.',
      'Mitglieder können sich auch selbst registrieren (E-Mail + Passwort). Nach Klick auf den Link in der Bestätigungs-E-Mail warten sie unter „Posteingang → Registrierungen“ auf deine Freigabe – die Teams & Kurse, die sie angekreuzt haben, sind dort schon vorausgewählt.',
    ],
    wirkung: [
      'Alle außer „Mitglied“ müssen beim Anmelden zusätzlich einen Code aus einer Handy-App eingeben (Zwei-Faktor). Vorher öffnet sich weder die Verwaltung noch der Mitgliederbereich.',
      'Hat jemand sein Handy verloren, entfernt ein Admin in seinem Konto den Haken bei „Zwei-Faktor-Anmeldung eingerichtet“ – dann richtet die Person es neu ein.',
    ],
    tipps: [
      'Rollen sparsam vergeben: Jeder bekommt nur, was er wirklich braucht.',
      'Wer den Verein verlässt, dessen Konto bitte löschen – das Profilfoto wird dabei mit gelöscht.',
      'Profilfotos laden Mitglieder selbst hoch. Sehen können sie nur das Mitglied, Admin/Kasse und die Trainer seiner Kurse.',
    ],
  },

  menue: {
    titel: 'Menü & Fußzeile',
    kurz: 'Hier legst du fest, was oben im Menü und unten in der Fußzeile der Website steht – und in welcher Reihenfolge.',
    wozu: {
      text: 'Damit Besucher eure Seiten finden. Eine Seite, die nirgends verlinkt ist, findet kaum jemand.',
      beispiele: ['Seite „Sommerfest“ oben ins Menü', '„Fan-Shop“ als Link auf eine fremde Website', 'YouTube-Kanal in der Fußzeile'],
    },
    tun: [
      'Oben prüft ein Kasten automatisch: Sind alle verlinkten Seiten veröffentlicht? Sind es zu viele Einträge?',
      'Reiter „Hauptmenü oben“: alle Einträge der Menüleiste, von links nach rechts.',
      'Reihenfolge ändern: einen Eintrag am Griff links (sechs Punkte) nach oben oder unten ziehen. Oben = weiter links auf der Website.',
      'Entfernen: rechts am Eintrag auf die drei Punkte (⋯) → „Entfernen“.',
      'Hinzufügen: unten „Eintrag hinzufügen“, Text eingeben und wählen, was er tun soll: Seite öffnen, Adresse öffnen oder Aufklappmenü zeigen.',
      'Reiter „Aufklappmenü Verein“: die beiden Spalten, die beim Darüberfahren über „Verein“ erscheinen.',
      'Reiter „Fußzeile unten“: die Spalten mit Links ganz unten auf jeder Seite.',
      'Darunter „Kontakt-Spalte“: Überschrift, Adresse ein/aus und beliebig viele Links – z. B. Instagram, Facebook, YouTube oder WhatsApp-Kanal.',
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
    kurz: 'Die Grunddaten des Vereins: Zahlen, Adressen, Beiträge, Vorstand, Kontaktformular und Downloads.',
    wozu: {
      text: 'Grunddaten, die an mehreren Stellen der Website auftauchen – einmal ändern, überall aktuell.',
      beispiele: ['Neue Mitgliederzahl', 'Vorstand nach der Wahl aktualisieren', 'Beiträge anpassen'],
    },
    tun: [
      'Mitgliederzahl und Gründungsjahr aktualisieren.',
      'Beiträge pflegen – sie erscheinen im Mitgliedsantrag und auf der Vereinsseite.',
      'Vorstand und Ansprechpersonen eintragen, mit Funktion und optional Foto.',
      'Satzung und andere Dokumente zum Herunterladen hinterlegen.',
      'Unter „Kontaktformular: Worum geht es?“ die Auswahl im Kontaktformular pflegen (ohne Namen). Admins legen pro Anliegen fest, wer die Nachricht per E-Mail bekommt.',
      'Bilder der Website und die grüne Aktions-Box stehen jetzt unter Website-Aufbau → „Startseite & Bilder“.',
      'Der Hauptsponsor wird unter „Sponsoren“ gepflegt (Art „Hauptsponsor“), die Links der Fußzeile unter „Menü & Fußzeile“.',
    ],
    wirkung: [
      'Die Zahlen tauchen auf der Startseite und in Texten auf.',
      'Der Vorstand erscheint auf der Vereinsseite. Im Kontaktformular stehen keine Namen, sondern Anliegen.',
      'Geänderte Beiträge gelten sofort für neue Online-Anträge.',
    ],
    tipps: ['Fotos vom Vorstand nur mit Einverständnis.', 'Keine privaten Telefonnummern eintragen – Kontakt läuft über das Formular.'],
  },

  startseite: {
    titel: 'Startseite & Bilder',
    kurz: 'Die grüne Aktions-Box auf der Startseite und die Fotos der Startseite, der Bereichsseiten und der Vereinsseite.',
    wozu: {
      text: 'Alles, was die Website optisch ausmacht, an einer Stelle. Die Texte dazu stehen unter „Website-Texte“.',
      beispiele: ['Neues Foto oben auf der Startseite', 'Aktions-Box für das Sommerfest', 'Titelbild der Fußball-Seite tauschen'],
    },
    tun: [
      'Reiter „Aktion (grüne Box)“: Überzeile, Titel, Text, Button und optional ein Bild. Mit „Anzeigen“ ein- oder ausblenden.',
      'Reiter „Bilder“: bis zu 4 Fotos oben auf der Startseite, zwei kleine Schilder darauf, die Kachel-Bilder (Fußball, BSV Kids, Fitness), drei Bilder der Breitensport-Seite und das Titelbild der Vereinsseite.',
      'Bild tauschen: über das × entfernen, mit „Aus vorhandenen auswählen“ ein neues aus der Mediathek wählen.',
      'Oben rechts „Speichern“.',
    ],
    wirkung: ['Nach etwa einer Minute ist die Website aktualisiert.', 'Ausgeblendete Aktions-Box: Der Inhalt bleibt für später gespeichert.'],
    tipps: ['Querformat-Fotos für die Bilder oben, Hochformat für das Aktions-Bild (z. B. ein Plakat).', 'Kinderfotos nur mit Einverständnis der Eltern.'],
  },

  sicherheit: {
    titel: 'Automatisch abmelden',
    kurz: 'Nach wie vielen Minuten ohne Aktivität die Verwaltung automatisch abmeldet – nur für Web-Admins.',
    wozu: {
      text: 'Schützt, wenn jemand vergisst, sich abzumelden – z. B. am Computer im Vereinsheim.',
      beispiele: ['Nach 30 Minuten abmelden', '5 Minuten vorher warnen'],
    },
    tun: ['Minuten eintragen, Warnzeit eintragen, oben rechts „Speichern“.'],
    wirkung: ['Gilt für alle in der Verwaltung, ab dem nächsten Seitenaufruf.', 'Vor der Abmeldung erscheint „Bist du noch da?“ mit „Angemeldet bleiben“.', 'Unabhängig davon endet jede Anmeldung spätestens nach 8 Stunden.'],
    tipps: ['30 Minuten sind ein guter Kompromiss zwischen Sicherheit und Bequemlichkeit.'],
  },

  texte: {
    titel: 'Website-Texte',
    kurz: 'Alle Überschriften, Texte und Link-Beschriftungen der Website – ohne Programmieren änderbar.',
    wozu: {
      text: 'Alle festen Überschriften und Texte der Website, z. B. auf der Startseite – ohne Programmieren änderbar.',
      beispiele: ['Begrüßung auf der Startseite', 'Text im Bereich „Mitglied werden“'],
    },
    tun: [
      'Unter jedem Text: „📍 Auf der Website zeigen“ öffnet die Seite und lässt genau diesen Text kurz grün aufleuchten.',
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
    wozu: {
      text: 'Wenn ihr von Besuchern etwas abfragen wollt, das es nicht schon gibt: Anmeldungen, Bestellungen, Umfragen. Ihr baut das Formular hier, setzt es auf eine Seite – und die Antworten landen gesammelt unter „Formular-Eingänge“. Mitgliedsantrag, Probetraining und Kontakt gibt es schon fertig.',
      beispiele: ['Anmeldung zum Sommerfest (Name, Anzahl Personen)', 'Helferliste fürs Turnier (Name, Schicht)', 'Sammelbestellung Trainingsanzüge (Name, Größe)', 'Abfrage für die Weihnachtsfeier'],
    },
    tun: [
      'Oben in der Liste eine Vorlage anklicken (Anmeldung, Helferliste, Sammelbestellung) – oder selbst ein Formular aus Feldern zusammenstellen: Name, E-Mail, Auswahl, Ankreuzfeld usw.',
      'Festlegen, welche Nachricht nach dem Absenden erscheint.',
      'Wichtig: Ein Formular allein ist noch nicht auf der Website. Du baust es auf einer Seite ein: Seiten → Seite öffnen oder neu anlegen → Reiter „Inhalt (Bausteine)“ → „Baustein hinzufügen“ → „Formular“ → dieses Formular auswählen → Veröffentlichen.',
      'Rechts im Formular zeigt der Kasten „Wo erscheint dieses Formular?“, auf welchen Seiten es schon eingebaut ist – und erstellt mit einem Klick eine neue Seite mit dem Formular.',
      'Damit Besucher die Seite finden: unter „Menü & Fußzeile“ einen Eintrag zur Seite anlegen.',
    ],
    wirkung: ['Ausgefüllte Formulare landen unter „Formular-Eingänge“ – der Kasten rechts verlinkt direkt dorthin.'],
    tipps: ['Mitgliedsantrag, Probetraining und Kontakt sind feste Formulare – die musst du hier nicht anlegen.', 'Nur abfragen, was ihr wirklich braucht (Datenschutz).'],
  },

  'form-submissions': {
    titel: 'Formular-Eingänge',
    kurz: 'Alles, was Besucher über eure eigenen Formulare abgeschickt haben.',
    wozu: {
      text: 'Die Antworten auf eure eigenen Formulare – wie eine Liste, die sich von selbst füllt.',
      beispiele: ['Alle Anmeldungen zum Sommerfest', 'Wer hat welche Größe bestellt?'],
    },
    tun: ['Einträge ansehen und nach Formular filtern.'],
    wirkung: ['Nur für euch sichtbar.'],
    tipps: ['Nach der Veranstaltung die Eingänge löschen – es sind persönliche Daten.'],
  },

  redirects: {
    titel: 'Weiterleitungen',
    kurz: 'Leitet alte Adressen auf neue Seiten um – z. B. Links von der alten Website.',
    wozu: {
      text: 'Technik: Wenn sich eine Adresse ändert, leitet ihr die alte Adresse auf die neue um – alte Links funktionieren dann weiter.',
      beispiele: ['/kunstrasen-projekt → /kunstrasen'],
    },
    tun: ['Eine alte Adresse eintragen und angeben, wohin sie führen soll.'],
    wirkung: ['Wer die alte Adresse aufruft, landet automatisch auf der neuen Seite.'],
    tipps: ['Nur nötig, wenn sich eine Adresse geändert hat. Im Zweifel einen Admin fragen.'],
  },

  search: {
    titel: 'Suchindex',
    kurz: 'Ein automatisch gepflegtes Verzeichnis für die Suche auf der Website.',
    wozu: {
      text: 'Technik: Der Suchindex wird automatisch gepflegt. Normalerweise müsst ihr hier nichts tun.',
      beispiele: [],
    },
    tun: ['Normalerweise nichts – die Einträge entstehen von selbst, wenn News veröffentlicht werden.'],
    wirkung: ['Änderungen hier beeinflussen nur die Suchergebnisse.'],
    tipps: ['Hier bitte nichts von Hand löschen.'],
  },

  rollen: {
    titel: 'Rollen & Rechte',
    kurz: 'Auf einen Blick: Wer hat welche Rolle – und für welche Teams ist jemand verantwortlich? Zu finden links unter „Einstellungen“.',
    wozu: {
      text: 'Damit ihr schnell seht, wer welche Rechte hat – und wo noch jemand fehlt.',
      beispiele: ['Wer pflegt die D-Jugend?', 'Hat der neue Trainer schon Zwei-Faktor?'],
    },
    tun: [
      'Admins sehen eine schlanke Ansicht: Suche, „Nach Person“ und „Nach Team“. Hinweise oben erscheinen nur, wenn es etwas zu tun gibt (z. B. Team ohne Verantwortliche).',
      'Web-Admins sehen zusätzlich die Reiter „Rechte anpassen“, „Nach Rolle“, „Rechte je Rolle“, „Testkonten“ und die Zusatzrechte einzelner Personen.',
      'Reiter „Nach Person“: jede Person mit ihren Rollen, ihren Teams und ob die Zwei-Faktor-Anmeldung eingerichtet ist.',
      'Reiter „Nach Team“: jedes Team und jeder Kurs mit den Verantwortlichen.',
      'Reiter „Nach Rolle“ (Web-Admin): alle Personen, gruppiert nach Rolle, mit Anzahl.',
      'Reiter „Rechte je Rolle“ (Web-Admin): Rolle anklicken und sehen, welche Bereiche sie sehen, anlegen, bearbeiten und löschen darf – berechnet aus den echten Regeln.',
      'Reiter „Testkonten“ (Web-Admin): Testkonten je Rolle, Abteilung und Team anlegen, um die Rechte auszuprobieren (nur lokal, ohne Zwei-Faktor).',
      'Kennzahlen oben anklicken („Anzeigen ›“, Web-Admin): Die Liste zeigt sofort z. B. nur die Personen mit Zusatzrechten oder nur Konten ohne Verwaltungs-Zugang.',
      'Orange gestrichelte Kästchen „+ …“ unter den Rollen (Web-Admin): Zusatzrechte, die nur diese Person hat (vergeben beim Benutzer).',
      'Spalte „Zuletzt da“: Wer sich seit über 6 Monaten nicht angemeldet hat, ist mit ⚠️ markiert – Rechte noch nötig?',
      'Oben suchen: Name, Team oder Rolle eintippen.',
      'Rolle ändern: bei der Person auf „Bearbeiten“. Team zuordnen: beim Team auf „Zuordnen“ und unter „Verantwortliche“ eintragen.',
    ],
    wirkung: [
      'Die Übersicht zeigt nur an – geändert wird beim Benutzer bzw. beim Team.',
      'Wer keinen Zugang zur Verwaltung hat, zeigt der Kasten „🚫 Kein Zugang zur Verwaltung“ unter „Rechte je Rolle“. Unter „Nach Person“ lassen sich Konten mit und ohne Verwaltungs-Zugang getrennt anzeigen.',
      '⚠️ markiert Lücken: Trainer ohne Team, Teams ohne Verantwortliche, Zugänge ohne Zwei-Faktor.',
    ],
    tipps: ['Einmal im Monat kurz durchschauen: Hat noch jemand Rechte, der nicht mehr dabei ist?', 'Nur Admins und Web-Admins sehen diese Seite.'],
  },

  sicherung: {
    titel: 'Datensicherung',
    kurz: 'Alle Inhalte und alle Bilder in einer einzigen Datei sichern – und im Notfall zurückholen.',
    wozu: {
      text: 'Wenn die Festplatte kaputtgeht oder aus Versehen viel gelöscht wurde, holst du mit einer Sicherung den alten Stand zurück.',
      beispiele: ['Einmal pro Woche sichern', 'Vor größeren Änderungen sichern', 'Sicherung zusätzlich auf einen USB-Stick legen'],
    },
    tun: [
      '„Sicherung jetzt erstellen“ klicken – nach etwa einer Minute ist sie fertig.',
      '„Herunterladen“ und an einem zweiten Ort speichern (USB-Stick, Cloud).',
      'Zurückholen: Anleitung unten auf der Seite (Befehl „pnpm sicherung:einspielen“).',
    ],
    wirkung: ['Die Sicherung ändert nichts an der Website.', 'Ist die letzte Sicherung älter als 7 Tage, erinnert das Dashboard.'],
    tipps: [
      'Nur Web-Admins sehen die Datensicherung – die Datei enthält alle Daten, auch die Zugänge.',
      'Die Datei enthält persönliche Daten – nicht per E-Mail verschicken.',
      'Nur selbst erstellte Sicherungen einspielen – nie eine Datei, die dir jemand schickt.',
      'IBANs lassen sich nur mit dem ENCRYPTION_KEY aus der .env lesen. Den Schlüssel getrennt aufbewahren.',
    ],
  },

  rollenRechte: {
    titel: 'Rollen-Rechte',
    kurz: 'Zusatzrechte pro Rolle ein- oder ausschalten – nur für Web-Admins. Zu finden unter Einstellungen → „Rollen & Rechte“ → Reiter „Rechte anpassen“.',
    wozu: {
      text: 'Jede Rolle hat feste Grundrechte. Hier lassen sich einzelne Zusatzrechte passend zu eurem Verein ein- oder ausschalten.',
      beispiele: ['Die Kasse soll Kontaktanfragen zu Beiträgen bearbeiten', 'Trainer sollen keine Mitgliederfotos sehen', 'Die Redaktion darf erledigte Anfragen löschen'],
    },
    tun: ['Häkchen bei der gewünschten Rolle setzen oder entfernen.', 'Oben rechts „Speichern“.', 'Zur Kontrolle: oben auf den Reiter „Übersicht“ → „Rechte je Rolle“.'],
    wirkung: ['Gilt sofort für alle mit dieser Rolle (spätestens nach 30 Sekunden).', 'Admins sehen die Seite, ändern kann sie nur ein Web-Admin.'],
    tipps: ['Benutzerverwaltung, Admin-Rechte und Bankdaten sind bewusst nicht einstellbar – das schützt vor versehentlichen Freigaben.', 'Weitere Schalter baut der Web-Admin bei Bedarf dazu.'],
  },

  datenschutz: {
    titel: 'Datenschutz-Fristen',
    kurz: 'Wie lange persönliche Daten gespeichert bleiben – und was gerade aufgeräumt werden kann.',
    wozu: {
      text: 'Die DSGVO verlangt, persönliche Daten nur so lange zu speichern, wie sie gebraucht werden. Hier legst du die Fristen fest.',
      beispiele: ['Erledigte Kontaktanfragen nach 6 Monaten', 'Mitgliedsanträge nach der Übernahme in die Mitgliederverwaltung', 'Anmeldungen zum Sommerfest nach einem Jahr'],
    },
    tun: [
      'Oben siehst du, was gerade über der Frist ist – „Jetzt in den Papierkorb verschieben“ räumt auf.',
      'Fristen in Monaten anpassen und speichern.',
      'Optional „Automatisch aufräumen“ anhaken – dann passiert das einmal täglich von selbst.',
    ],
    wirkung: ['Aufgeräumtes landet zuerst im Papierkorb und lässt sich 30 Tage zurückholen. Danach ist es endgültig weg.'],
    tipps: ['Mitgliedsanträge erst aufräumen, wenn die Daten in die Mitgliederverwaltung übernommen sind.'],
  },

  dokumente: {
    titel: 'Mitglieder-Dokumente',
    kurz: 'Geschützte Dateien, die nur angemeldete Mitglieder öffnen können – z. B. Protokolle.',
    wozu: {
      text: 'Normale Dateien in der Mediathek sind öffentlich: Wer den Link kennt, kann sie öffnen. Mitglieder-Dokumente sind wirklich geschützt.',
      beispiele: ['Protokoll der Jahreshauptversammlung', 'Interne Rundschreiben'],
    },
    tun: [
      'Am einfachsten unter „Vereinsdaten“ → „Satzung & Downloads“: Eintrag hinzufügen, „Nur für Mitglieder“ anhaken, bei „Geschützte Datei“ hochladen.',
      'Alte Einträge, deren Datei noch öffentlich liegt, zieht der Knopf „In den geschützten Bereich umziehen“ um.',
    ],
    wirkung: ['Die Datei erscheint im Mitgliederbereich der Website unter „Downloads“ – nur für Angemeldete.'],
  },

  sponsoren: {
    titel: 'Sponsoren',
    kurz: 'Alle Sponsoren und Partner des Vereins – für die Seite „Sponsoren“ und das Logo-Laufband auf der Startseite.',
    wozu: { text: 'Sponsoren freuen sich über Sichtbarkeit. Hier pflegst du sie an einer Stelle.', beispiele: ['Neuer Trikotsponsor', 'Bandenwerbung', 'Förderer der Jugend'] },
    tun: ['„Neu erstellen“: Name, Logo, Website, kurzer Text.', 'Rechts die Art wählen (Premium, Partner, Förderer) und die Reihenfolge.', '„Im Laufband“ anhaken, damit das Logo auf der Startseite mitläuft.'],
    wirkung: [
      'Ein Sponsor mit der Art „Hauptsponsor“ steht groß ganz oben auf /sponsoren und zusätzlich unten in der Fußzeile jeder Seite.',
      'Darunter alle anderen als Kacheln (Logo, Art, Name, Text, Link): erst Premium, dann Partner, dann Förderer.',
      'Das Laufband erscheint ab drei Logos unten auf der Startseite.',
      'Alle Logos wirken automatisch gleich groß: Der leere Rand wird entfernt und die Größe angeglichen – egal ob breiter Schriftzug oder rundes Logo.',
    ],
    tipps: [
      'Ideales Logo: PNG mit durchsichtigem (oder weißem) Hintergrund, mindestens 600 Pixel breit (am besten 1000–2000). Seitenverhältnis egal.',
      'Nur das Logo selbst – keine Linien, Rahmen oder Adressen drumherum, die gehören nicht zum Logo und machen es kleiner.',
      'Ohne Logo zeigt die Kachel die Anfangsbuchstaben des Namens.',
      'Hauptsponsoren können zusätzlich ein „Logo für die Fußzeile“ bekommen – eine kompakte, quere Variante (PNG, durchsichtig, mindestens 400 Pixel breit). Dort ist nur ca. 40 Pixel Höhe Platz. Leer = das normale Logo.',
    ],
  },

  alben: {
    titel: 'Fotoalben',
    kurz: 'Fotos einer Veranstaltung als Album – für die Galerie auf der Website.',
    wozu: { text: 'Statt einzelner Bilder zeigst du die schönsten Momente gesammelt.', beispiele: ['Sommerfest 2026', 'Hallenturnier der E-Jugend', 'Saisonabschluss'] },
    tun: ['„Neu erstellen“: Titel und Datum.', 'Bei „Bilder“ mehrere Fotos auswählen oder neu hochladen. Das erste ist das Titelbild.', 'Optional ein Team wählen – dann erscheint das Album auch auf der Teamseite.'],
    wirkung: ['Erscheint unter /galerie mit Großansicht zum Durchblättern.', 'Mit Team zusätzlich auf der Teamseite unter „Fotoalben“.'],
    tipps: ['Nur Fotos, bei denen die Einwilligung der abgebildeten Personen vorliegt – bei Kindern der Eltern.'],
  },

  gesuche: {
    titel: 'Ehrenamt & Mitmachen',
    kurz: 'Wen der Verein gerade sucht – erscheint auf der Seite „Mitmachen“.',
    wozu: { text: 'Ehrenamtliche findet man am besten, wenn klar ist, was gebraucht wird.', beispiele: ['Trainer/in für die F-Jugend', 'Helfer für den Grillstand', 'Schiedsrichter/in'] },
    tun: ['„Neu erstellen“: Wen suchen wir? Beschreibung, Aufwand, Symbol.', 'Gefunden? Haken „Auf der Website zeigen“ entfernen.'],
    wirkung: ['Erscheint unter /mitmachen mit Knopf „Ich bin dabei“ – Meldungen landen bei den Kontaktanfragen.'],
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
