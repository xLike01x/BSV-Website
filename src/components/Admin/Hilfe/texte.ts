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
      'Ganz oben: „Du bist …“ – aufklappen zeigt, was deine Rolle darf, mit Knopf „Kurzanleitung“ zum Ausdrucken.',
      'Darunter Hinweise, was gerade zu tun ist (z. B. neue Anträge, fehlende Trainingszeiten) – „Prüfen ›“ öffnet die Stelle.',
      '„Erste Schritte“: eine kleine Checkliste für den Start.',
      'Redaktion: „⭐ Für die Startseite vorgeschlagen“ – mit „Auf die Startseite“ oder „Nein, danke“ entscheiden.',
      'Trainer und Team-Redaktion: „Mein Team“ mit Zeiten, Ausfällen, offenen Anfragen und News – Knöpfe „+ News“, „Ausfall melden“, „Zeiten & Infos“.',
      'Die Zahlen-Karten öffnen per Klick die passende Liste. Dazu „Schnellzugriff“ für die häufigsten Aufgaben, „Letzte Aktivitäten“ und ganz unten „Alle Bereiche“.',
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
      'Rechts im Kasten „Vor dem Veröffentlichen“ stehen Hinweise: fehlt ein Titelbild, ist der Text sehr kurz, steht der Titel in GROSSBUCHSTABEN? Rot unterstrichene Wörter mit der rechten Maustaste anklicken – der Browser schlägt die richtige Schreibweise vor.',
      'Trainer und Team-Redaktion: Soll die News auch auf die Startseite, rechts „Für die Startseite vorschlagen“ anhaken.',
      '„Entwurf speichern“ sichert deine Arbeit, ohne dass sie jemand sieht.',
      '„Veröffentlichen“ stellt die News online.',
    ],
    wirkung: [
      'Veröffentlichte News erscheinen auf der Seite des gewählten Teams.',
      'Ist „Auf Startseite“ angehakt, erscheint sie zusätzlich auf der Startseite und unter „News“. Das entscheidet die Redaktion.',
      'Vorgeschlagene News sieht die Redaktion oben auf ihrer Übersicht unter „Für die Startseite vorgeschlagen“ und holt sie mit „Auf die Startseite“ dorthin – oder lehnt mit „Nein, danke“ ab. Ein noch nicht veröffentlichter Entwurf bleibt dabei unveröffentlicht.',
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
      'Ein Team zuordnen und „In der Bildergalerie des Teams zeigen“ anhaken, damit das Bild in der Galerie des Teams erscheint.',
      'Oben im Kasten „Ordner“ ein Team anklicken, um nur dessen Bilder zu sehen.',
      'Verschieben: ein Bild unten in der Liste mit der Maus auf einen Ordner ziehen. Angehakte Bilder wandern zusammen. Danach kannst du es mit „Rückgängig“ zurücknehmen.',
      'Oder: Bild öffnen → rechts „Ordner (Team / Kurs)“. Bilder ohne Team für alle Trainer freigeben: Haken „Verein allgemein“.',
      'Sponsor-Logos landen automatisch im Ordner „🤝 Sponsoren“, sobald sie bei einem Sponsor gespeichert werden (oder Haken „Sponsoren-Logo“).',
      'Viele Bilder auf einmal: links anhaken → oben „Bearbeiten“ → Feld „Ordner (Team / Kurs)“ wählen.',
      'Redaktion: „Automatisch zuordnen“ schlägt für Bilder ohne Ordner das passende Team vor – erst Vorschau, dann „Übernehmen“.',
    ],
    wirkung: [
      'Hochgeladene Bilder kannst du überall auswählen – in News, Seiten, bei Teams und Kursen.',
      'Bilder mit „In der Bildergalerie des Teams zeigen“ erscheinen auf der Seite des Teams.',
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
      'Widerruft jemand eine Foto-Einwilligung: Bild löschen (Papierkorb genügt). Es ist dann sofort nicht mehr über die Website abrufbar; Browser der Besucher können es höchstens noch 10 Minuten aus ihrem eigenen Zwischenspeicher zeigen.',
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
    tipps: ['Lieber wenige, klare Kategorien als viele ähnliche.', 'In der Seitenleiste sehen Kategorien nur Admins (unter „Website-Aufbau“); die Redaktion wählt sie in der News aus.'],
  },

  saisonwechsel: {
    titel: 'Saisonwechsel',
    kurz: 'Vor jeder Fußball-Saison alle Fußballteams durchgehen – Namen, Trainer, Trainingszeiten, Fotos – und jedes abhaken. Breitensport-Kurse haben keine Saison und stehen hier nicht.',
    wozu: {
      text: 'Jede Saison wechseln im Fußball Jahrgänge, Trainer und Zeiten. Ohne festen Durchgang behalten Ehemalige ihre Rechte, Teamseiten zeigen alte Zeiten und Kinderfotos bleiben jahrelang online.',
      beispiele: ['Aus der D-Jugend wird die C-Jugend', 'Ein Trainer hört auf, eine neue Trainerin kommt', 'Neue Trainingszeiten zur neuen Saison'],
    },
    tun: [
      'Links unter „Sport“ auf „Saisonwechsel“.',
      '„🔄 Neue Saison beginnen“ – setzt die Häkchen vom letzten Jahr zurück.',
      'Team für Team: Namen und Alter anpassen, Verantwortliche aus- und eintragen, Trainingszeiten aktualisieren, alte Fotos ersetzen. Ein Klick auf den Namen öffnet das Team.',
      'Passt alles, links das Häkchen setzen. Oben nach Junioren, Juniorinnen, Senioren, Seniorinnen filtern; „Nur noch nicht geprüfte“ zeigt, was fehlt.',
      'Teams, die es nicht mehr gibt: im Team „Aktiv“ ausschalten.',
      'Zum Schluss „✓ Saisonwechsel abschließen“.',
    ],
    wirkung: [
      'Die Seite selbst ändert nichts an den Teams – sie zeigt nur an, was auffällt (⚠️), und merkt sich die Häkchen.',
      'Orange markiert: keine Verantwortlichen, Verantwortliche seit über 6 Monaten nicht angemeldet oder ohne Trainer-Rolle, keine Trainingszeiten, kein Titelbild, Fotos mit Personen älter als 2 Jahre.',
      'Breitensport (BSV Kids, Erwachsene & Senioren) steht hier nicht – dort meldet das Dashboard fehlende oder lange nicht geänderte Trainingszeiten und ungenutzte Zugänge.',
      'Vom 15. Juni bis 30. September erinnert das Dashboard, solange der Saisonwechsel in diesem Jahr nicht abgeschlossen ist.',
    ],
    tipps: [
      'Admin und Redaktion sehen die Seite. Häkchen setzen geht auch zu zweit gleichzeitig.',
      'Wer gar keinen Zugang mehr braucht: beim Benutzer die Rolle auf „Mitglied“ ändern – die Verwaltung ist dann gesperrt, das Konto bleibt für den Mitgliederbereich.',
      'Neue Fotos mit Personen nur mit Einwilligung (bei Kindern der Eltern).',
    ],
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
      'Unter „Verantwortliche“ die Benutzerkonten auswählen, die dieses Team pflegen dürfen (Admin und Redaktion; Admins auch beim Benutzer unter „Team-Berechtigungen“).',
      'Kurzer Hinweis oben auf der Teamseite (z. B. „Heute in Halle 2“): „Hinweis-Banner auf der Teamseite“.',
      'Mit „Aktiv (öffentlich sichtbar)“ blendest du ein Angebot ein oder aus (Admin und Redaktion).',
      'Rechts „Angaben zuletzt bestätigt“: Stimmt alles noch, auf „✓ Alles noch aktuell“ klicken.',
    ],
    wirkung: [
      'Jedes aktive Angebot hat eine eigene Seite und erscheint automatisch im Menü, im Angebotsfinder und im Mitgliedsantrag.',
      'Ein neues Team taucht also überall auf, ohne dass ihr woanders etwas ändern müsst.',
      'Verantwortliche können danach News, Bilder und Ausfälle für dieses Team pflegen.',
      'Auf der Teamseite steht „Stand der Trainingszeiten: Monat Jahr“ (nach über einem Jahr mit der Bitte, vorher nachzufragen). Hat 3 Monate niemand bestätigt, bekommen die Verantwortlichen eine „Passt noch?“-Mail. Wer die Trainingszeiten ändert, bestätigt automatisch.',
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
    tun: [
      'Am schnellsten: oben im Kasten „Schnell melden“ Team, Tag (Heute, Morgen oder Übermorgen) und Grund wählen und „Ausfall melden“ klicken.',
      'Oder „Neu erstellen“: Team oder Kurs wählen, Datum eintragen und den Grund auswählen – optional mit „Hinweis an die Teilnehmenden“.',
      'Vom Handy geht es auch im Mitgliederbereich: beim Team „Ausfall melden“.',
      'Ist der Ausfall vorbei, verschwindet er von selbst.',
    ],
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
      'Neue Anfragen öffnen und lesen. Oben im Kasten „Wer kümmert sich?“ auf „🙋 Ich kümmere mich“ klicken – dann sehen alle, dass du dran bist.',
      'Mit „✉️ Antworten“ öffnet sich dein E-Mail-Programm mit Adresse und Betreff. Danach kurz eine Notiz schreiben („Zugesagt für Dienstag“).',
      'Den Status ändern, z. B. auf „Zugesagt“ oder „Erledigt“.',
    ],
    wirkung: ['Der Status ist nur für euch intern – die anfragende Person sieht ihn nicht.', 'Notizen und Statuswechsel werden mit Name und Uhrzeit gespeichert und lassen sich nicht nachträglich ändern.'],
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
      'Neuen Antrag öffnen. Oben auf „🙋 Ich kümmere mich“ klicken – dann bearbeitet niemand denselben Antrag doppelt.',
      'Der Kasten „Antrag prüfen“ zeigt Alter, Beitrag, ob die IBAN gültig ist und ob es schon einen Antrag oder eine Mitgliedschaft dieser Person gibt.',
      'Unten im Kasten „✓ Aufnehmen“, „❓ Rückfrage“ oder „Ablehnen“ klicken. Es erscheint eine fertige E-Mail an die Person – Text anpassen (Stellen in [ECKIGEN KLAMMERN] ausfüllen) und bestätigen. Ohne Haken geht keine Mail raus.',
      'Bei „Aufgenommen“ entsteht automatisch der Eintrag für den digitalen Mitgliedsausweis (unter „Mitgliedschaften“) – dort nur noch die Mitgliedsnummer ergänzen.',
      'Mit dem Zusatzrecht „Mitgliedsanträge bearbeiten – ohne Bankdaten“ siehst und beantwortest du Anträge, aber IBAN, Kontoinhaber und SEPA-Mandat bleiben ausgeblendet. Löschen und „Für die Kasse exportieren“ macht die Kasse.',
      'Für DFBnet/Mitgliederliste: in der Liste oben „📥 … neue exportieren“ – du bekommst eine Excel-Datei (CSV) aller aufgenommenen, noch nicht exportierten Anträge, ohne Bankdaten.',
    ],
    wirkung: [
      'Neue Anträge melden sich per E-Mail bei der Kasse (nur ein Link, keine Daten in der Mail) und oben auf der Übersicht.',
      'Notizen, Statuswechsel, gesendete E-Mails und Exporte stehen mit Name und Uhrzeit im Verlauf – nachträglich nicht änderbar.',
      'Exportierte Anträge bekommen „Für die Kasse exportiert am …“ und landen beim nächsten Export nicht noch einmal in der Datei („alle aufgenommenen“ holt sie trotzdem).',
      'Die Texte der E-Mails änderst du unter Einstellungen → „E-Mail-Vorlagen Mitgliedsanträge“.',
    ],
    tipps: [
      'Hier stehen Bankdaten. Nur Kasse und Vorstand haben Zugriff – bitte nichts ausdrucken oder weiterleiten.',
      'Die Export-Datei enthält Namen und Adressen: nach dem Übertragen löschen und nicht per E-Mail verschicken.',
      '„Aufgenommen“ ist endgültig – danach gibt es keine Knöpfe mehr. Ein Austritt wird unter „Mitgliedschaften“ mit „Gültig bis“ eingetragen. Weitere Nachrichten an die Person über „✉️ Antworten“.',
      'Solange der E-Mail-Versand noch nicht eingerichtet ist, bietet der Antrag nach dem Bestätigen „Im E-Mail-Programm öffnen“ an – mit fertigem Text.',
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
      'Für Mitglieder ohne Online-Antrag: „Neu erstellen“, Name, Nummer, „Mitglied seit“, Art („Mitgliedschaft“) und die E-Mail eintragen.',
      'Sichtbar wird der Ausweis im verknüpften Benutzerkonto. Das passiert automatisch, wenn du eine Registrierung mit gleicher E-Mail freigibst – oder du wählst das Konto bei „Benutzerkonto“ selbst aus.',
      'Bei Kindern das Konto der Eltern verknüpfen – dann erscheinen alle Ausweise der Familie dort.',
      'Austritt: „Gültig bis (Austritt)“ setzen oder den Haken „Mitgliedschaft gültig“ entfernen.',
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
    tun: [
      'Nachricht öffnen und oben „🙋 Ich kümmere mich“ klicken.',
      'Mit „✉️ Antworten“ antworten (öffnet dein E-Mail-Programm), kurz notieren, was du geschrieben hast, und den Status auf „Erledigt“ setzen.',
      'Im Feld „Anliegen“ steht, worum es geht (Auswahl „Worum geht es?“ im Formular).',
    ],
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
      'Einzelne Rechte nur für diese Person: beim Benutzer unten den zugeklappten Abschnitt „Ausnahmen: Zusatzrechte nur für diese Person (Web-Admin)“ öffnen – Häkchen setzen, speichern. Vergeben kann das nur ein Web-Admin; Admins sehen den Abschnitt nur, wenn die Person schon Zusatzrechte hat. Es gibt sie für fast jeden Bereich (z. B. nur News, nur Sponsoren, nur Vereinsdaten, Mitgliedsanträge ohne Bankdaten) – nie für Benutzerverwaltung, Admin-Rechte, Bankdaten und Datensicherung.',
      'Über die Rolle legst du fest, was jemand darf:',
      '• Web-Admin: Technik, Admin-Konten, Datensicherung · Admin: alles im Verein außer Admin-Rechte',
      '• Redaktion: alle News, Termine, Seiten, Menü, Texte & Bilder, Sponsoren, Kontaktanfragen · Kasse: Mitgliedsanträge, Mitgliedschaften, Registrierungen · Passwesen: Passanträge aller Teams',
      '• Trainer / Team-Redaktion: nur die eigenen Teams · Mitglied: nur der Mitgliederbereich',
      'Welche Teams jemand pflegt, wählst du direkt unter den Rollen bei „Team-Berechtigungen“ (nur Admins) – oder beim Team unter „Verantwortliche“.',
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
      'Oben prüft ein Kasten automatisch: Sind alle verlinkten Seiten veröffentlicht? Sind es zu viele Einträge? Er zeigt auch Seiten, die noch nirgends verlinkt sind – „+ In die Fußzeile“ oder „+ Ins Menü „Verein““ trägt sie mit einem Klick ein.',
      'Reiter „Hauptmenü oben“: alle Einträge der Menüleiste, von links nach rechts.',
      'Reihenfolge ändern: einen Eintrag am Griff links (sechs Punkte) nach oben oder unten ziehen. Oben = weiter links auf der Website.',
      'Entfernen: rechts am Eintrag auf die drei Punkte (⋯) → „Entfernen“.',
      'Hinzufügen: unten „Eintrag hinzufügen“, Text eingeben und wählen, was er tun soll: „Seite aus „Seiten“ öffnen“, „Adresse öffnen“ oder „Aufklappmenü zeigen“.',
      'Reiter „Aufklappmenü „Fußball““ und „Aufklappmenü „Breitensport““: Die Teams kommen automatisch aus „Teams & Kurse“. Am Griff ziehen ändert die Reihenfolge sofort, dazu der Text links im Aufklappmenü.',
      'Reiter „Aufklappmenü Verein“: die beiden Spalten, die beim Darüberfahren über „Verein“ erscheinen.',
      'Reiter „Fußzeile unten“: die Spalten mit Links ganz unten auf jeder Seite.',
      'Darunter „Kontakt-Spalte (ganz rechts)“: „Kontakt-Spalte anzeigen“, Überschrift, „Adresse des Sportplatzes anzeigen“ und beliebig viele „Links unter der Adresse“ – z. B. Instagram, Facebook, YouTube oder WhatsApp-Kanal.',
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
      'Bilder der Website und die grüne Aktions-Box stehen unter Website-Aufbau → „Texte & Bilder“ beim jeweiligen Reiter.',
      'Der Hauptsponsor wird unter „Sponsoren“ gepflegt (Art „Hauptsponsor“), die Links der Fußzeile unter „Menü & Fußzeile“.',
    ],
    wirkung: [
      'Die Zahlen tauchen auf der Startseite und in Texten auf.',
      'Der Vorstand erscheint auf der Vereinsseite. Im Kontaktformular stehen keine Namen, sondern Anliegen.',
      'Geänderte Beiträge gelten sofort für neue Online-Anträge.',
    ],
    tipps: ['Fotos vom Vorstand nur mit Einverständnis.', 'Keine privaten Telefonnummern eintragen – Kontakt läuft über das Formular.'],
  },

  registrierungen: {
    titel: 'Registrierungen',
    kurz: 'Hier gibst du Personen frei, die sich selbst auf der Website registriert haben.',
    wozu: {
      text: 'Wer sich auf der Website registriert, kommt erst nach deiner Freigabe in den Mitgliederbereich – so bleiben Ausfälle, Termine und Ausweise unter Mitgliedern.',
      beispiele: ['Ein Elternteil möchte die Ausfälle der F1 sehen', 'Ein neues Mitglied will seinen digitalen Ausweis'],
    },
    tun: [
      'Prüfen, ob du die Person kennst und ob die E-Mail-Adresse bestätigt ist (✓). Der Hinweis „Mitgliedsantrag mit dieser E-Mail vorhanden“ hilft.',
      'Die Teams anhaken, in denen sie mitmacht – ihre Wünsche sind schon angehakt („Wunsch“). „Alle Teams & Kurse zeigen“ klappt den Rest auf.',
      '„Freigeben“ oder „Ablehnen“ klicken.',
    ],
    wirkung: [
      'Nach der Freigabe bekommt die Person eine E-Mail und kann sich anmelden – mit der Rolle „Mitglied“.',
      'Gibt es eine Mitgliedschaft mit derselben E-Mail, erscheint der Ausweis automatisch in ihrem Konto.',
      'Abgelehnte Registrierungen werden gelöscht.',
    ],
    tipps: ['Nicht freigegebene Registrierungen verschwinden nach 60 Tagen, unbestätigte nach 7 Tagen von selbst.', 'Unbekannte Namen oder seltsame Adressen lieber ablehnen – die Person kann sich jederzeit über das Kontaktformular melden.', 'Teams lassen sich später unter „Benutzer“ bei „Teams & Kurse“ ändern.'],
  },

  papierkorb: {
    titel: 'Papierkorb (Web-Admin)',
    kurz: 'Alles Gelöschte aus allen Bereichen an einer Stelle – filtern, ansehen, wiederherstellen oder endgültig löschen. Für Web-Admins; mit dem Zusatzrecht „Papierkorb“ nur wiederherstellen (ohne Bereiche mit persönlichen Daten).',
    wozu: {
      text: 'Ein Sicherheitsnetz: Was andere endgültig löschen, ist für sie weg – du kannst es aber noch zurückholen.',
      beispiele: ['Eine versehentlich gelöschte News zurückholen', 'Sehen, wer was endgültig gelöscht hat', 'Alte Einträge wirklich entfernen'],
    },
    tun: [
      'Oben filtern: „Im Papierkorb“ (gerade gelöscht, sehen auch andere), „Nur Web-Admin“ (von anderen endgültig gelöscht oder 30 Tage im Papierkorb), dazu Bereich, wer gelöscht hat und Titel.',
      'Titel anklicken: Eintrag ansehen.',
      '„↩ Wiederherstellen“: Der Eintrag ist wieder da, wo er war – mit Bildern, Dateien und Verknüpfungen.',
      '🗑 bzw. „Endgültig löschen“: wirklich weg, auch Bilder und Dateien. Nicht rückgängig zu machen.',
      'Mehrere Einträge: links ankreuzen, dann oben in der dunklen Leiste wiederherstellen oder löschen.',
    ],
    wirkung: [
      'Was jemand außer dir endgültig löscht oder 30 Tage im normalen Papierkorb lag, landet hier – für alle anderen ist es weg.',
      'Endgültig gelöscht wird automatisch: persönliche Daten nach der Frist unter Einstellungen → „Datenschutz-Fristen“ (Standard 30 Tage), alles andere nach der Frist unter „Sicherheit“ → Reiter „Einstellungen“ (Standard 1 Jahr).',
    ],
    tipps: ['Was du selbst endgültig löschst, ist sofort weg.', 'Anträge und Anfragen enthalten persönliche Daten – nicht unnötig lange aufheben.'],
  },

  statistik: {
    titel: 'Besucherstatistik',
    kurz: 'Wie viele Menschen die Website besuchen, was sie anschauen und woher sie kommen – ohne Cookies. Für Web-Admins und Personen mit dem Zusatzrecht „Besucherstatistik“.',
    wozu: {
      text: 'Damit ihr seht, was auf der Website ankommt: welche Seiten beliebt sind, welche Teams gesucht werden und ob der Mitgliedsantrag gut funktioniert.',
      beispiele: ['Kommen nach einem Instagram-Post mehr Besucher?', 'Wird die neue Kursseite angeschaut?', 'Wonach suchen Leute vergeblich?'],
    },
    tun: [
      'Oben den Zeitraum wählen: 7 Tage, 30 Tage, 3 Monate oder 12 Monate.',
      'Die Kacheln zeigen Besuche, Seitenaufrufe, Seiten pro Besuch und den Handy-Anteil – mit Vergleich zum Zeitraum davor.',
      'Im Diagramm über einen Balken fahren (am Handy antippen) zeigt die genaue Zahl. „Als Tabelle anzeigen“ listet alle Werte.',
      'Darunter: beliebteste Seiten, Herkunft, Teams & Kurse, Geräte, der Weg durch den Mitgliedsantrag und die Suchbegriffe (auch die ohne Treffer).',
    ],
    wirkung: ['Die Seite zeigt nur an – sie verändert nichts.', 'Neue Besuche erscheinen sofort.'],
    tipps: [
      'Ein „Besuch“ ist eine Person an einem Tag. Wer an drei Tagen kommt, zählt dreimal.',
      'Angemeldete Mitarbeitende, Suchmaschinen-Roboter und Browser mit „Nicht verfolgen“ werden nicht gezählt.',
      'Suchbegriffe ohne Treffer sind gute Ideen für neue Inhalte.',
      'Links in Instagram oder Flyern mit ?utm_source=flyer am Ende zeigen, woher Besucher kommen – z. B. https://…/mitglied-werden?utm_source=flyer.',
    ],
  },

  sicherheit: {
    titel: 'Sicherheit: Einstellungen',
    kurz: 'Automatisches Abmelden nach Inaktivität und wie lange der Web-Admin-Papierkorb Einträge aufhebt – nur für Web-Admins. Der Reiter „Updates“ daneben zeigt alle verfügbaren Updates.',
    wozu: {
      text: 'Schützt, wenn jemand vergisst, sich abzumelden – z. B. am Computer im Vereinsheim.',
      beispiele: ['Nach 30 Minuten abmelden', '5 Minuten vorher warnen'],
    },
    tun: [
      'Minuten bis zum Abmelden und die Warnzeit eintragen.',
      'Bei „Web-Admin-Papierkorb: endgültig löschen nach … Tagen“ festlegen, wie lange Gelöschtes (außer persönlichen Daten) zurückholbar bleibt.',
      'Oben rechts „Speichern“.',
    ],
    wirkung: ['Gilt für alle in der Verwaltung, ab dem nächsten Seitenaufruf.', 'Vor der Abmeldung erscheint „Bist du noch da?“ mit „Angemeldet bleiben“.', 'Unabhängig davon endet jede Anmeldung spätestens nach 8 Stunden.'],
    tipps: ['30 Minuten sind ein guter Kompromiss zwischen Sicherheit und Bequemlichkeit.', '„Automatisches Abmelden ausschalten“ ist nicht empfohlen.'],
  },

  texte: {
    titel: 'Texte & Bilder',
    kurz: 'Alle Überschriften, Texte, Bilder und die grüne Aktions-Box der Website – ein Reiter pro Seite, ohne Programmieren änderbar.',
    wozu: {
      text: 'Alles, was auf den festen Seiten der Website steht – Texte, Bilder und die grüne Aktions-Box – an einer Stelle, sortiert nach Seite.',
      beispiele: ['Begrüßung auf der Startseite', 'Neues Foto oben auf der Startseite', 'Aktions-Box für das Sommerfest'],
    },
    tun: [
      'Unter jedem Text: „📍 Auf der Website zeigen“ öffnet die Seite und lässt genau diesen Text kurz grün aufleuchten.',
      'Oben einen Reiter wählen: Startseite, Fußball, Breitensport, Verein oder Weitere Seiten (News, Termine, Kontakt, Antrag, Probetraining, Fußzeile).',
      'Im Reiter „Startseite“ stehen die Felder in derselben Reihenfolge wie auf der Seite: ganz oben die Bilder (Bilder oben, zwei Schilder, Kachel-Bilder), dann Kopfbereich, Zahlen-Leiste, Kacheln, Angebotsfinder, News, „Mitglied werden“ und ganz unten die grüne Aktions-Box.',
      'Bild tauschen: über das × entfernen, mit „Aus vorhandenen auswählen“ ein neues aus der Mediathek wählen. Die Reiter „Breitensport“ und „Verein“ haben oben ihre Seitenbilder.',
      'Text im Feld ändern und oben rechts speichern.',
      'Platzhalter wie {mitglieder} oder {teams} werden automatisch durch die aktuelle Zahl ersetzt.',
    ],
    wirkung: ['Nach dem Speichern steht der neue Text nach etwa einer Minute auf der Website.'],
    tipps: [
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
      'Kennzahlen oben anklicken („Anzeigen ›“): Die Liste zeigt sofort nur die passenden Konten – z. B. Zugänge noch ohne Zwei-Faktor, seit 6 Monaten ungenutzte Zugänge oder (Web-Admin) Personen mit Zusatzrechten und Konten ohne Verwaltungs-Zugang.',
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

  updates: {
    titel: 'Sicherheit: Updates',
    kurz: 'Alles, was aktualisiert werden kann, an einem Ort: Node.js, Datenbank, Website-Pakete und Server – nur für Web-Admins. Der Reiter „Einstellungen“ daneben regelt automatisches Abmelden und die Papierkorb-Frist.',
    wozu: {
      text: 'Software bekommt laufend Fehler- und Sicherheitskorrekturen. Hier siehst du auf einen Blick, ob etwas zu tun ist – und was.',
      beispiele: ['Next.js meldet eine kritische Sicherheitslücke', 'Node.js hat ein Sicherheitsupdate', 'Der Server braucht nach Updates einen Neustart'],
    },
    tun: [
      'Oben steht, ob etwas zu tun ist: 🚨 Sicherheitsupdate (zeitnah), ⬆️ Update (beim nächsten Update-Tag), 🧭 neue Hauptversion (größerer Umbau, planen), ✓ aktuell.',
      'In der Tabelle „Zu erledigen“ steht unter „So geht’s“, was zu tun ist – je nachdem, ob die Seite am PC oder auf dem Server läuft (für alle Website-Pakete einmal unter der Tabelle).',
      '„⚠️ Prüfung unvollständig“: Eine Quelle war nicht erreichbar und wurde noch nie abgerufen – dann gibt es bewusst keine Entwarnung. Ist eine Quelle nur gerade nicht erreichbar, gelten ihre Angaben vom letzten erfolgreichen Abruf.',
      '„🔄 Jetzt prüfen“ prüft sofort (sonst täglich und nach jedem Start; höchstens einmal pro Minute).',
      'Website-Pakete (Next.js, Payload …) nicht selbst aktualisieren: Update in Auftrag geben, testen lassen, dann BSV-Website-Update.bat bzw. ./deploy/update.sh.',
    ],
    wirkung: ['Die Seite zeigt nur an – sie installiert nichts von selbst.', 'Sicherheitsupdates erscheinen zusätzlich oben im Dashboard und im Monatsbericht.'],
    tipps: [
      'Übertragen werden nur Paketnamen und Versionsnummern an npm, endoflife.date und nodejs.org – keine Daten des Vereins.',
      'Abschalten (z. B. ohne Internet): BSV_PAKETPRUEFUNG=aus in der .env.',
      'Indirekt genutzte Pakete prüft zusätzlich GitHub jeden Tag und schickt bei Funden eine E-Mail.',
    ],
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
      'Kasten „Wartung“: Einmal im Jahr ausprobieren, ob sich eine Sicherung wirklich einspielen lässt (am besten am PC), danach „✓ Heute erfolgreich getestet“ klicken.',
      'In der Tabelle darunter steht, bis wann Node.js und PostgreSQL Sicherheits-Updates bekommen, wie voll der Speicher ist und wie alt die installierte Version ist. Orange heißt: bald handeln. Alle verfügbaren Updates stehen unter Einstellungen → „Sicherheit“ (Reiter „Updates“).',
    ],
    wirkung: [
      'Die Sicherung ändert nichts an der Website.',
      'Ist die letzte Sicherung älter als 7 Tage, erinnert das Dashboard.',
      'Das Dashboard erinnert außerdem, wenn der Speicher zu 80 % voll ist, Node.js oder PostgreSQL in den nächsten 6 Monaten keine Updates mehr bekommen, die Website seit 3 Monaten nicht aktualisiert wurde oder der Wiederherstellungs-Test über ein Jahr her ist.',
    ],
    tipps: [
      'Nur Web-Admins sehen die Datensicherung – die Datei enthält alle Daten, auch die Zugänge.',
      'Die Datei enthält persönliche Daten – nicht per E-Mail verschicken.',
      'Nur selbst erstellte Sicherungen einspielen – nie eine Datei, die dir jemand schickt.',
      'Die ganze Sicherungsdatei (Endung .tar.gz.enc) ist verschlüsselt und lässt sich nur mit dem ENCRYPTION_KEY aus der .env öffnen. Den Schlüssel getrennt aufbewahren.',
      'Den ENCRYPTION_KEY nie einfach austauschen – sonst sind IBANs, Zwei-Faktor und alle Sicherungen unlesbar. Muss er gewechselt werden (z. B. weil er bekannt geworden ist): Befehl „pnpm schluessel:wechseln“, Anleitung in deploy/README.md unter „Schlüssel wechseln“.',
      'Auf der Live-Website wird jeden Tag automatisch gesichert.',
    ],
  },

  rollenRechte: {
    titel: 'Rollen-Rechte',
    kurz: 'Zusatzrechte pro Rolle ein- oder ausschalten – nur für Web-Admins. Zu finden unter Einstellungen → „Rollen & Rechte“ → Reiter „Rechte anpassen“.',
    wozu: {
      text: 'Jede Rolle hat feste Grundrechte. Hier lassen sich einzelne Zusatzrechte passend zu eurem Verein ein- oder ausschalten.',
      beispiele: ['Die Kasse soll Kontaktanfragen zu Beiträgen bearbeiten', 'Trainer sollen keine Mitgliederfotos sehen', 'Die Redaktion darf erledigte Anfragen löschen', '„Nur ansehen“ (z. B. Kassenprüfung) soll keine Bankdaten oder Benutzerkonten sehen'],
    },
    tun: ['Häkchen bei der gewünschten Rolle setzen oder entfernen.', 'Oben rechts „Speichern“.', 'Zur Kontrolle: oben auf den Reiter „Übersicht“ → „Rechte je Rolle“.'],
    wirkung: ['Gilt sofort nach dem Speichern für alle mit dieser Rolle.', 'Bei „Nur ansehen“ schaltet ein entfernter Haken den ganzen Bereich für diese Rolle aus – er verschwindet auch aus der Seitenleiste.', 'Admins sehen die Seite, ändern kann sie nur ein Web-Admin.'],
    tipps: ['Admin-Rechte sind bewusst nicht einstellbar – das schützt vor versehentlichen Freigaben. Benutzerkonten und Bankdaten gibt es nur als Lese-Haken für „Nur ansehen“.', 'Weitere Schalter baut der Web-Admin bei Bedarf dazu.'],
  },

  datenschutz: {
    titel: 'Datenschutz-Fristen',
    kurz: 'Wie lange persönliche Daten gespeichert bleiben – und was gerade aufgeräumt werden kann.',
    wozu: {
      text: 'Die DSGVO verlangt, persönliche Daten nur so lange zu speichern, wie sie gebraucht werden. Hier legst du die Fristen fest.',
      beispiele: ['Erledigte Kontaktanfragen nach 6 Monaten', 'Mitgliedsanträge nach der Übernahme in die Mitgliederverwaltung', 'Anmeldungen zum Sommerfest nach einem Jahr'],
    },
    tun: [
      'Oben siehst du, was gerade über der Frist ist – „🧹 Jetzt aufräumen“ verschiebt es in den Papierkorb.',
      'Fristen in Monaten anpassen und speichern.',
      'Optional „Automatisch aufräumen“ anhaken – dann passiert das einmal täglich von selbst.',
      'Unten „Auskunft für eine Person“ (Admins): E-Mail eingeben, „📄 Auskunft herunterladen“.',
    ],
    wirkung: ['Aufgeräumtes landet zuerst im Papierkorb und lässt sich 30 Tage zurückholen. Danach liegt es im Web-Admin-Papierkorb und wird nach der Frist „Web-Admin-Papierkorb – persönliche Daten“ (Standard 30 Tage) endgültig gelöscht.'],
    tipps: ['Mitgliedsanträge erst aufräumen, wenn die Daten in die Mitgliederverwaltung übernommen sind.'],
  },

  mailVorlagen: {
    titel: 'E-Mail-Vorlagen Mitgliedsanträge',
    kurz: 'Die Texte, die beim Aufnehmen, Nachfragen oder Ablehnen eines Mitgliedsantrags vorgeschlagen werden.',
    wozu: {
      text: 'Damit die Kasse nicht jedes Mal neu formulieren muss – und alle Antworten gleich freundlich klingen.',
      beispiele: ['Willkommens-Mail nach der Aufnahme', 'Rückfrage, wenn eine Unterschrift fehlt', 'Freundliche Absage'],
    },
    tun: [
      'Betreff und Text je Fall anpassen und speichern.',
      'Platzhalter werden automatisch ersetzt: {vorname}, {nachname}, {mitgliedsart} und {meinName} (Name der Person, die antwortet).',
      'Stellen in [ECKIGEN KLAMMERN] muss man vor dem Senden ausfüllen – sonst lässt sich die Mail nicht abschicken.',
    ],
    wirkung: ['Beim Klick auf „Aufnehmen“, „Rückfrage“ oder „Ablehnen“ im Antrag steht der Text fertig da und kann vor dem Senden noch geändert werden.'],
    tipps: ['Keine Bankdaten oder Beitragsnummern in die Vorlage schreiben – E-Mails sind nicht verschlüsselt.'],
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
    tun: ['„Neu erstellen“: Name, Logo, Website, kurzer Text.', 'Rechts die Art wählen (Hauptsponsor, Premium-Partner, Partner, Förderer & Freunde) und die Reihenfolge.', '„Im Laufband auf der Startseite“ anhaken, damit das Logo auf der Startseite mitläuft.'],
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

  profilbilder: {
    titel: 'Profilfotos',
    kurz: 'Fotos, die Mitglieder im Mitgliederbereich von sich hochladen – nie öffentlich.',
    tun: ['Nur ansehen oder bei Bedarf löschen. Hochladen und ändern macht das Mitglied selbst.'],
    wirkung: ['Sichtbar für das Mitglied, Admin und Kasse sowie die Trainer seiner Kurse (im Team unter „Mitglieder in diesem Team / Kurs“).'],
    tipps: ['Auf der Vereinsseite erscheint ein Profilfoto nur, wenn beim Vorstand „Profilfoto aus dem Konto auf der Vereinsseite zeigen“ angehakt ist – und nur mit Einverständnis.', 'Gelöschte Profilfotos sind sofort weg (kein Papierkorb).'],
  },

  passdokumente: {
    titel: 'Pass-Unterlagen',
    kurz: 'Die einzelnen Dateien zu den Passanträgen (Ausweis, Passfoto, Erklärungen).',
    tun: ['Normalerweise öffnest du sie direkt im Passantrag unter „Unterlagen“.'],
    wirkung: ['Ausweis, Foto und Erklärungen werden nach Abschluss automatisch gelöscht (Standard 30 Tage), der unterschriebene Antrag nach 2 Jahren.'],
    tipps: ['Nichts herunterladen oder weiterleiten, was nicht für das DFBnet nötig ist.'],
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
    tipps: ['Schaut unter „Hilfe-Rückmeldungen“ (nur Admins), welche Hilfen als nicht hilfreich markiert wurden.'],
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
    tun: [
      'Namen und E-Mail-Adresse ändern.',
      '„Passwort ändern“: neues Passwort zweimal und dein aktuelles Passwort eingeben.',
      '„E-Mail-Benachrichtigungen“: Haken entfernen, wenn du keine Mails zu neuen Anfragen willst.',
      'Dein Profilfoto lädst du im Mitgliederbereich hoch („Zum Mitgliederbereich“ im Menü oben rechts).',
    ],
    wirkung: ['Der Name erscheint unten links in der Seitenleiste.'],
    tipps: ['Ein gutes Passwort ist lang – z. B. ein Satz mit mehreren Wörtern.'],
  },
}

/** Zusatzhinweis, wenn ein einzelner Eintrag geöffnet ist (Bearbeiten-Ansicht) */
export const HILFE_BEARBEITEN = [
  'Pflichtfelder sind mit einem roten Sternchen markiert.',
  'Erst mit „Speichern“ bzw. „Veröffentlichen“ oben rechts wird etwas übernommen.',
  'Über das Drei-Punkte-Menü oben rechts kannst du einen Eintrag löschen und – außer bei Einträgen mit persönlichen Daten – duplizieren.',
]

/** Zusatzhinweis in Listen */
export const HILFE_LISTE = [
  'Mit „Neu erstellen“ legst du einen Eintrag an, mit einem Klick auf den Titel bearbeitest du ihn.',
  'Über das Suchfeld und „Filter“ findest du Einträge schneller.',
  'Mehrere Einträge auf einmal: links die Kästchen anhaken.',
  'Im Posteingang filtern die Reiter oben nach Status: Neu, In Arbeit, Erledigt, Alle.',
  'Oben rechts „Papierkorb“ zeigt Gelöschtes der letzten 30 Tage – dort lässt es sich wiederherstellen.',
]
