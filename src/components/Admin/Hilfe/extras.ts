/**
 * Ergänzende Hilfe: Schritt-für-Schritt-Anleitungen, Feld-Erklärungen,
 * Hinweise je Rolle, häufige Fragen und Rollenprofile (für Begrüßung und Kurzanleitung).
 * Alles bewusst in Alltagssprache.
 */

export type Anleitung = { id: string; titel: string; schritte: string[]; video?: string }
export type Feld = { name: string; text: string }
export type Faq = { frage: string; antwort: string; bereich?: string }

/** Rollen-Schlüssel wie in den Benutzerkonten */
export type RolleKey = 'webadmin' | 'admin' | 'redaktion' | 'kasse' | 'passwesen' | 'uebungsleitung' | 'teamredaktion' | 'lesen' | 'mitglied'

/* ------------------------------------------------------------------ */
/* Schritt-für-Schritt-Anleitungen                                     */
/* ------------------------------------------------------------------ */
export const ANLEITUNGEN: Record<string, Anleitung[]> = {
  dashboard: [
    {
      id: 'handy',
      titel: 'Die Verwaltung als App aufs Handy',
      schritte: [
        'Die Verwaltung im Handy-Browser öffnen und anmelden.',
        'iPhone (Safari): unten auf das Teilen-Symbol □↑ → „Zum Home-Bildschirm“.',
        'Android (Chrome): oben rechts ⋮ → „Zum Startbildschirm hinzufügen“ bzw. „App installieren“.',
        'Jetzt startet die Verwaltung mit dem BSV-Symbol wie eine App – ganz oben liegt der Schnellzugriff, z. B. „Ausfall melden“.',
      ],
    },
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
        'Rechts im Kasten „Vor dem Veröffentlichen“ nachsehen: Steht da noch ein ⚠️, kurz nachbessern.',
        'Trainer und Team-Redaktion: Soll die News auch auf die Startseite? „Für die Startseite vorschlagen“ anhaken.',
        'Oben rechts „Entwurf speichern“ – dann ist nichts verloren.',
        'Wenn alles passt: „Veröffentlichen“. Fertig!',
      ],
    },
    {
      id: 'vorschlag-annehmen',
      titel: 'Vorschläge für die Startseite annehmen (Redaktion)',
      video: '/hilfe/vorschlag-annehmen.mp4',
      schritte: [
        'Auf der Übersicht (Startseite der Verwaltung) steht oben „⭐ Für die Startseite vorgeschlagen“, sobald ein Trainer etwas vorschlägt.',
        'Auf den Titel klicken, um die News zu lesen.',
        'Passt sie: „Auf die Startseite“. Sonst „Nein, danke“ – die News bleibt dann auf der Teamseite.',
        'Ist die News noch ein Entwurf, erscheint sie auf der Startseite, sobald der Trainer sie veröffentlicht.',
      ],
    },
    {
      id: 'startseite-vorschlagen',
      titel: 'Eine Team-News für die Startseite vorschlagen (Trainer, Team-Redaktion)',
      schritte: [
        'News schreiben und rechts bei „Team / Kurs“ dein Team wählen.',
        'Rechts „Für die Startseite vorschlagen“ anhaken.',
        '„Veröffentlichen“ – die Redaktion sieht den Vorschlag auf ihrer Übersicht und entscheidet.',
        'Bis dahin steht die News auf der Seite deines Teams.',
      ],
    },
    {
      id: 'news-aendern',
      titel: 'Eine veröffentlichte News korrigieren',
      schritte: [
        'In der Liste „News“ auf den Titel klicken.',
        'Den Fehler korrigieren.',
        '„Veröffentlichen“ klicken – die Website zeigt sofort die neue Fassung.',
        'Über „Versionen“ oben siehst du frühere Fassungen und kannst sie wiederherstellen.',
      ],
    },
    {
      id: 'news-planen',
      titel: 'Eine News zu einem späteren Zeitpunkt veröffentlichen',
      schritte: [
        'Die News fertig schreiben und „Entwurf speichern“.',
        'Auf den kleinen Pfeil rechts neben „Veröffentlichen“ klicken.',
        '„Veröffentlichungsplanung“ wählen, Datum und Uhrzeit eintragen und bestätigen.',
        'Die News geht dann automatisch zur gewählten Zeit online.',
      ],
    },
    {
      id: 'news-versionen',
      titel: 'Eine frühere Fassung wiederherstellen',
      schritte: [
        'Die News öffnen und oben auf „Versionen“ klicken.',
        'Die gewünschte Fassung anklicken – Änderungen sind farbig markiert.',
        '„Diese Version wiederherstellen“ klicken.',
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
      id: 'ordner',
      titel: 'Bilder in Ordner sortieren',
      schritte: [
        'Links auf „Mediathek“. Oben siehst du die Ordner – je Team einer, dazu „Verein allgemein“ und „Noch nicht zugeordnet“.',
        'Auf „Noch nicht zugeordnet“ klicken.',
        'Bilder, die zum selben Team gehören, links anhaken und mit der Maus auf den Ordner des Teams ziehen (oder oben „Bearbeiten“ → „Ordner (Team / Kurs)“).',
        'Bilder für den ganzen Verein (Logo, Sportplatz, Vorstand): öffnen und rechts „Verein allgemein“ anhaken.',
        'Tipp für den Anfang: „Automatisch zuordnen“ macht den Großteil – danach nur noch Fehler korrigieren.',
      ],
    },
    {
      id: 'auto-zuordnen',
      titel: 'Vorhandene Bilder automatisch zuordnen (Redaktion)',
      schritte: [
        'In der Mediathek oben auf „✨ Automatisch zuordnen“ klicken.',
        'Die Vorschau zeigt für jedes Bild ohne Ordner, wohin es kommt – und warum (z. B. „In einer News dieses Teams benutzt“).',
        'Passt es? Auf „Übernehmen“ klicken. Bereits zugeordnete Bilder werden nie verändert.',
        'Danach stichprobenartig prüfen und Falsches im Bild rechts bei „Ordner (Team / Kurs)“ ändern.',
      ],
    },
    {
      id: 'bild-hochladen',
      titel: 'Fotos hochladen',
      video: '/hilfe/bilder-hochladen.mp4',
      schritte: [
        'Links auf „Mediathek“ und dann auf „Neu erstellen“ klicken.',
        'Das Foto in das Feld ziehen oder „Datei auswählen“ klicken.',
        'Bei „Bildbeschreibung“ kurz beschreiben, was zu sehen ist, z. B. „Die F1 jubelt mit dem Pokal“.',
        'Pflicht: Bei „Sind Personen zu erkennen?“ „Nein“ oder „Ja – und die Einwilligung liegt vor“ wählen. Bei Kindern nur mit Einwilligung der Eltern.',
        'Rechts bei „Ordner (Team / Kurs)“ dein Team wählen. Optional „In der Bildergalerie des Teams zeigen“ anhaken.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'bild-zuschneiden',
      titel: 'Ein Bild zuschneiden oder den wichtigsten Bereich festlegen',
      schritte: [
        'Das Bild in der Mediathek öffnen.',
        'Auf „Bild bearbeiten“ klicken.',
        'Zum Zuschneiden die Ecken des Rahmens ziehen.',
        'Mit „Wichtigster Bildbereich“ auf das Wichtigste tippen, z. B. das Gesicht – kleine Vorschaubilder richten sich danach.',
        'Übernehmen und speichern.',
      ],
    },
    {
      id: 'mehrere-bilder',
      titel: 'Viele Fotos auf einmal hochladen',
      schritte: [
        'In der Mediathek oben auf „Mehrere Dateien hochladen“ klicken.',
        'Alle Fotos auf einmal auswählen oder hineinziehen.',
        'Für jedes Foto Bildbeschreibung und „Sind Personen zu erkennen?“ ausfüllen und speichern.',
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
        'Im Reiter „Inhalt (Bausteine)“ auf „Baustein hinzufügen“ klicken und z. B. „Text (in Spalten)“ oder „Bild oder Video“ wählen.',
        'Mit dem Bildschirm-Symbol oben die Vorschau öffnen und prüfen.',
        '„Veröffentlichen“ klicken. Die Seite ist jetzt unter /sommerfest-2027 erreichbar.',
      ],
    },
    {
      id: 'seite-bausteine',
      titel: 'Mit Bausteinen arbeiten',
      video: '/hilfe/seite-bausteine.mp4',
      schritte: [
        'Reiter „Inhalt (Bausteine)“ öffnen und auf „Baustein hinzufügen“ klicken.',
        'Eine Art wählen, z. B. „Text (in Spalten)“, „Bild oder Video“ oder „Hinweis-Kasten mit Button“.',
        'Den Baustein ausfüllen. Mit dem kleinen Pfeil rechts klappst du ihn auf und zu.',
        'Reihenfolge ändern: am Griff links (sechs Punkte) nach oben oder unten ziehen.',
        'Kopieren oder löschen: über die drei Punkte rechts am Baustein.',
      ],
    },
    {
      id: 'seite-kopfbereich',
      titel: 'Den Kopfbereich gestalten',
      schritte: [
        'Reiter „Kopfbereich“ öffnen.',
        'Bei „Art des Kopfbereichs“ wählen: groß mit Bild, mittel mit Bild, schlicht oder keiner.',
        'Überschrift und einen kurzen Satz darunter schreiben.',
        'Optional „Button hinzufügen“: Ziel wählen und den Text auf dem Button eingeben.',
        'Bei „Groß“ oder „Mittel“ ein Bild aus der Mediathek wählen.',
      ],
    },
    {
      id: 'seite-ins-menue',
      titel: 'Die Seite ins Menü bringen',
      video: '/hilfe/menue-link.mp4',
      schritte: [
        'Die Seite muss veröffentlicht sein.',
        'Links auf „Menü & Fußzeile“ klicken.',
        'Im Reiter „Hauptmenü oben“ bei „Einträge in der Menüleiste“ auf „Eintrag hinzufügen“ klicken.',
        'Text eingeben, „Seite aus ‚Seiten‘“ wählen und die Seite aussuchen.',
        'Oben rechts „Speichern“.',
      ],
    },
  ],
  menue: [
    {
      id: 'menue-link',
      titel: 'Einen Eintrag ins Menü einfügen',
      video: '/hilfe/menue-link.mp4',
      schritte: [
        'Links auf „Menü & Fußzeile“ klicken – der Reiter „Hauptmenü oben“ ist schon offen.',
        'Ganz unten auf „Eintrag hinzufügen“ klicken.',
        '„Text im Menü“ ausfüllen – so heißt der Eintrag auf der Website.',
        'Wählen, was er tun soll: „Seite aus ‚Seiten‘ öffnen“ (dann Seite aussuchen) oder „Adresse öffnen“ (z. B. /termine oder https://…).',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'menue-reihenfolge',
      titel: 'Die Reihenfolge ändern (z. B. „News“ weiter nach links)',
      video: '/hilfe/menue-reihenfolge.mp4',
      schritte: [
        'Links auf „Menü & Fußzeile“ klicken.',
        'Den Eintrag am Griff links (sechs Punkte ⋮⋮) anfassen und nach oben ziehen. Oben in der Liste = links auf der Website.',
        'Loslassen und oben rechts „Speichern“.',
      ],
    },
    {
      id: 'menue-entfernen',
      titel: 'Einen Eintrag entfernen (z. B. „Kunstrasen“)',
      schritte: [
        'Links auf „Menü & Fußzeile“ klicken.',
        'Rechts neben dem Eintrag auf die drei Punkte (⋯) klicken.',
        '„Entfernen“ wählen.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'aufklapp-verein',
      titel: 'Einen Link ins Aufklappmenü „Verein“ setzen (z. B. „Spielecke“)',
      schritte: [
        'Links auf „Menü & Fußzeile“ klicken und oben den Reiter „Aufklappmenü ‚Verein‘“ wählen.',
        'Die linke Spalte („Über uns“) oder die rechte Spalte („Mehr“) aufklappen und unten auf „Eintrag hinzufügen“ klicken.',
        '„Text im Menü“ ausfüllen, z. B. „Spielecke“.',
        'Bei „Was soll der Eintrag tun?“ wählen: „Seite aus ‚Seiten‘ öffnen“ für selbst angelegte Seiten – oder „Adresse öffnen“ für feste Seiten der Website wie /spielecke, /termine oder /trainingszeiten (die stehen nicht in der Liste „Seiten“).',
        'Bei „Adresse“ z. B. /spielecke eintragen (mit Schrägstrich, ohne localhost oder www).',
        'Mit dem Griff links (⋮⋮) an die gewünschte Stelle ziehen und oben rechts „Speichern“. Auf der Website mit der Maus über „Verein“ fahren und prüfen.',
      ],
    },
    {
      id: 'fusszeile',
      titel: 'Links in der Fußzeile ändern',
      schritte: [
        'Links auf „Menü & Fußzeile“ und oben den Reiter „Fußzeile unten“ wählen.',
        'Eine Spalte aufklappen – Überschrift ändern oder Links hinzufügen, verschieben, entfernen.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'social-links',
      titel: 'YouTube, TikTok oder einen anderen Link bei „Kontakt“ hinzufügen',
      schritte: [
        'Links auf „Menü & Fußzeile“ und oben den Reiter „Fußzeile unten“ wählen.',
        'Nach unten zu „Kontakt-Spalte (ganz rechts)“ scrollen.',
        'Bei „Links unter der Adresse“ auf „Link hinzufügen“ klicken.',
        'Text eingeben, z. B. „YouTube ↗“. Bei „Was soll der Eintrag tun?“ „Adresse öffnen“ wählen.',
        'Die komplette Adresse einfügen (mit https://) und „In neuem Tab öffnen“ anhaken.',
        'Reihenfolge am Griff links ändern, oben rechts „Speichern“.',
      ],
    },
  ],
  angebote: [
    {
      id: 'angaben-bestaetigen',
      titel: '„Passt noch?“ – Angaben eines Teams bestätigen',
      schritte: [
        'Am schnellsten vom Handy: Website → Mitgliederbereich → bei deinem Team auf „✓ Passt noch“.',
        'Oder in der Verwaltung das Team öffnen → rechts im Kasten „Angaben zuletzt bestätigt“ auf „✓ Alles noch aktuell“.',
        'Oder in der „Passt noch?“-Mail beim Team auf „Prüfen und bestätigen“ und auf der Seite „✓ Ja, passt noch“ (ohne Anmeldung, der Link gilt 30 Tage).',
        'Stimmt etwas nicht, einfach die Trainingszeiten ändern und speichern – das zählt automatisch als bestätigt.',
        'Auf der Teamseite steht danach „Stand der Trainingszeiten: Monat Jahr“.',
      ],
    },
    {
      id: 'team-zeiten',
      titel: 'Trainingszeiten ändern',
      video: '/hilfe/trainingszeiten.mp4',
      schritte: [
        'Links auf „Teams & Kurse“ und das Team anklicken.',
        'Nach unten zu „Trainingszeiten“ scrollen.',
        'Einen Eintrag ändern oder mit „Termin hinzufügen“ einen neuen anlegen: Tag, Uhrzeit, Ort.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'team-verantwortliche',
      titel: 'Einem Trainer ein Team zuordnen',
      video: '/hilfe/team-verantwortliche.mp4',
      schritte: [
        'Admins: links unter „Mitglieder“ auf „Benutzer“ und die Person öffnen.',
        'Bei „Rollen“ die Kachel „Trainer“ (oder „Team-Redaktion“ für Pressewarte) ankreuzen.',
        'Direkt darunter bei „Team-Berechtigungen“ das Team auswählen (ohne Team-Rolle wird beim Speichern automatisch „Trainer“ gesetzt).',
        'Speichern. Ab sofort kann die Person News, Bilder und Ausfälle für dieses Team pflegen.',
        'Redaktion und Admins geht es auch von der anderen Seite: das Team unter „Teams & Kurse“ öffnen und bei „Verantwortliche“ die Person wählen – gleiches Ergebnis.',
        'Achtung: „Teams & Kurse“ weiter unten beim Benutzer heißt nur „spielt dort mit“ (für den Ausweis) und gibt keine Rechte.',
      ],
    },
    {
      id: 'hinweis-banner',
      titel: 'Einen kurzen Hinweis auf die Teamseite setzen (z. B. „Heute in Halle 2“)',
      schritte: [
        'Im Mitgliederbereich beim Team „Hinweis setzen“ – oder in der Verwaltung beim Team „Hinweis-Banner auf der Teamseite“.',
        'Text eingeben und „ℹ️ Info“ oder „⚠️ Wichtig“ wählen.',
        'Optional „Anzeigen bis einschließlich“ – danach verschwindet der Hinweis von selbst.',
        '„Hinweis speichern“ bzw. oben rechts „Speichern“.',
      ],
    },
    {
      id: 'team-neu',
      titel: 'Ein neues Team oder einen neuen Kurs anlegen',
      schritte: [
        '„Neu erstellen“ klicken.',
        'Name, Bereich (Fußball, BSV Kids oder Erwachsene & Senioren) und Altersangabe eintragen.',
        'Beschreibung, Titelbild und Trainingszeiten ergänzen.',
        'Haken „Aktiv (öffentlich sichtbar)“ prüfen (ist schon gesetzt) und speichern – das Angebot erscheint automatisch im Menü und im Mitgliedsantrag.',
      ],
    },
  ],
  ausfaelle: [
    {
      id: 'ausfall-melden',
      titel: 'Einen Trainingsausfall melden',
      video: '/hilfe/ausfall-melden.mp4',
      schritte: [
        'Links auf „Trainingsausfälle“ klicken.',
        'Oben im Kasten „Schnell melden“: Team wählen (bei nur einem Team schon gewählt).',
        'Tag antippen – Heute, Morgen, Übermorgen oder ein anderes Datum.',
        'Den Grund auswählen, z. B. „Halle belegt“, und „Ausfall melden“ klicken – der Hinweis steht sofort auf der Teamseite und im Mitgliederbereich.',
        'Nachholtermin oder Hinweis ergänzen: den Eintrag in der Liste öffnen, Text eintragen, speichern.',
      ],
    },
    {
      id: 'ausfall-handy',
      titel: 'Einen Ausfall vom Handy melden (Mitgliederbereich)',
      schritte: [
        'Auf der Website anmelden und den Mitgliederbereich öffnen.',
        'Im Kasten „Meine Teams & Kurse zum Pflegen“ beim Team auf „Ausfall melden“ tippen.',
        'Tag antippen (die nächsten Trainingstage stehen schon da) und den Grund antippen.',
        '„Ausfall jetzt melden“ – er steht sofort auf der Teamseite. Versehentlich gemeldet? Daneben „zurücknehmen“.',
      ],
    },
  ],
  termine: [
    {
      id: 'termin-anlegen',
      titel: 'Einen Termin eintragen',
      video: '/hilfe/termin-anlegen.mp4',
      schritte: [
        'Oben in der Liste eine Vorlage wählen (z. B. „Vereinsfest“, „Versammlung“) – oder „Neu erstellen“.',
        'Titel, Beginn und (optional) Ende eintragen – mit Uhrzeit.',
        'Ort und eine kurze Beschreibung ergänzen, den Bereich wählen.',
        'Rechts steht, ob der Termin für alle oder nur für Mitglieder sichtbar ist.',
        '„Speichern“ – der Termin steht sofort im Kalender.',
      ],
    },
    {
      id: 'zu-absage',
      titel: 'Zu- und Absagen der Mitglieder einsammeln (z. B. Weihnachtsfeier)',
      schritte: [
        'Den Termin öffnen oder anlegen. Er darf sich nicht wiederholen.',
        'Haken „Zu-/Absage im Mitgliederbereich“ setzen.',
        'Optional: „Anmeldeschluss“ wählen (bis einschließlich diesem Tag änderbar) und „Begleitperson erlaubt“ anhaken, wenn Partnerin oder Partner mitkommen dürfen.',
        'Speichern. Mitglieder sehen den Termin nach dem Login unter „Mein BSV“ ganz oben und antworten mit „Ich komme“ oder „Ich komme nicht“ – auf Wunsch mit Bemerkung (z. B. „vegetarisch“).',
        'Auf der Seite „Termine“ steht automatisch der Hinweis „Zu- oder Absage für Mitglieder bis … im Mitgliederbereich“.',
        'Die Liste steht unten im Termin: Zusagen, Personen, Absagen, Bemerkungen – mit „Drucken“ und „Als Tabelle herunterladen (Excel)“.',
        'Nach dem Termin wird die Liste automatisch gelöscht (Standard: 30 Tage, einstellbar unter Datenschutz-Fristen). Vorher bei Bedarf drucken oder herunterladen.',
      ],
    },
    {
      id: 'veranstaltung-komplett',
      titel: 'Eine Veranstaltung komplett vorbereiten (Termin, Anmeldung, Seite, Countdown)',
      schritte: [
        'Termin: Inhalte → Termine → Vorlage „Vereinsfest“ oder „Neu erstellen“. Titel, Beginn mit Uhrzeit und Ort eintragen (der Ort ist mit dem Sportpark vorbelegt – überschreiben, wenn woanders gefeiert wird). In die Beschreibung: Preis, was enthalten ist, Anmeldeschluss. Speichern.',
        'Nur für Mitglieder (z. B. Weihnachtsfeier)? Dann statt eines Formulars im Termin den Haken „Zu-/Absage im Mitgliederbereich“ setzen (eigene Anleitung) und mit dem Schritt „Countdown“ weitermachen. Für alle Besucher: Anmeldeformular: Website-Aufbau → Formulare → Vorlage „Anmeldung zu einer Veranstaltung“. Bei „Name des Formulars“ gleich den späteren Seitennamen eintragen (z. B. „Weihnachtsfeier 2026“) – daraus entsteht im nächsten Schritt die Adresse der Seite. Felder anpassen, z. B. eine Auswahlliste „Teilnahme“ mit „Ich komme“ / „Ich komme nicht“. Danke-Nachricht prüfen. Speichern.',
        'Seite: im Formular rechts „Neue Seite mit diesem Formular erstellen“. Die Seite heißt wie das Formular (später umbenennen ändert die Adresse nicht mehr). Über dem Formular einen Baustein „Text (in Spalten)“ mit allen Infos einfügen, Vorschau prüfen, „Veröffentlichen“.',
        'Ansehen: rechts in der Seite steht die Adresse als Link (z. B. /weihnachtsfeier-2026 ↗). Ins Menü kommt die Seite nicht von selbst – nur wenn du sie unter „Menü & Fußzeile“ einträgst.',
        'Countdown (optional): den Termin wieder öffnen, rechts den Haken „Countdown auf der Startseite“ setzen und bei „Countdown-Button führt zu“ die Seite wählen. Speichern.',
        'Antworten lesen: Posteingang → Formular-Eingänge. Zum Anmeldeschluss das Formular von der Seite nehmen (Baustein löschen und „Veröffentlichen“) – es schließt nicht von selbst.',
        'Nach der Veranstaltung: Der Countdown verschwindet am Folgetag von selbst. Seite auf „Entwurf“ zurücksetzen oder löschen, Formular-Eingänge löschen, sobald sie nicht mehr gebraucht werden.',
      ],
    },
  ],
  passantraege: [
    {
      id: 'passantrag-bearbeiten',
      titel: 'Einen Passantrag bearbeiten',
      schritte: [
        'Links unter „Posteingang“ auf „Passanträge“ klicken und einen Antrag mit Status „Eingereicht“ öffnen.',
        'Die Angaben zur Spielerin / zum Spieler prüfen und unter „Unterlagen“ jede Datei anklicken.',
        'Fehlt etwas oder ist unleserlich: Status „Unterlagen fehlen“, beim Hinweis kurz schreiben, was fehlt, und speichern.',
        'Alles da: Antrag im DFBnet einreichen, Status „Beim Verband“ und die Vorgangsnummer in die interne Notiz.',
        'Spielerlaubnis erteilt: Status „Spielerlaubnis erteilt“ und speichern. Ausweis, Foto & Co. werden nach 30 Tagen automatisch gelöscht, der unterschriebene Antrag nach 2 Jahren.',
      ],
    },
  ],
  mitgliedsantraege: [
    {
      id: 'antrag-bearbeiten',
      titel: 'Einen Mitgliedsantrag bearbeiten',
      video: '/hilfe/antrag-bearbeiten.mp4',
      schritte: [
        'In der Liste auf den Antrag mit Status „Neu“ klicken und oben „🙋 Ich kümmere mich“ wählen.',
        'Den Kasten „Antrag prüfen“ lesen: Alter, Beitrag, IBAN, doppelte Anträge oder bestehende Mitgliedschaft.',
        'Unklar? „❓ Rückfrage“ klicken, in der vorbereiteten E-Mail [HIER DEINE FRAGE] ersetzen und bestätigen.',
        'Passt alles: „✓ Aufnehmen“ klicken, Willkommens-Mail prüfen und bestätigen – die Mitgliedschaft für den Ausweis wird automatisch angelegt.',
        'Später in der Liste „📥 … neue exportieren“ für die Übernahme ins DFBnet.',
      ],
    },
    {
      id: 'antraege-exportieren',
      titel: 'Aufgenommene Anträge für das DFBnet exportieren',
      video: '/hilfe/antraege-exportieren.mp4',
      schritte: [
        'Links unter „Posteingang“ auf „Mitgliedsanträge“.',
        'Oben im Kasten „Für die Kasse“ auf „📥 … neue exportieren“ klicken.',
        'Die Datei (CSV) mit Excel öffnen: eine Zeile pro Person, Familienmitglieder einzeln, ohne Bankdaten.',
        'Daten ins DFBnet bzw. die Mitgliederliste übernehmen, danach die Datei löschen.',
        'Beim nächsten Export kommen nur neue Anträge. Alles noch einmal: „alle aufgenommenen (auch schon exportierte)“.',
      ],
    },
    {
      id: 'antrag-vorlagen',
      titel: 'Die Texte der Antwort-Mails ändern',
      schritte: [
        'Links unter „Einstellungen“ auf „E-Mail-Vorlagen“.',
        'Für „Aufgenommen“, „Rückfrage“ und „Abgelehnt“ Betreff und Text anpassen.',
        'Platzhalter wie {vorname} stehen lassen – sie werden automatisch ersetzt. Stellen in [ECKIGEN KLAMMERN] füllt man später im Antrag aus.',
        'Speichern.',
      ],
    },
  ],
  probetraining: [
    {
      id: 'probe-bearbeiten',
      titel: 'Eine Probetraining-Anfrage beantworten',
      video: '/hilfe/anfrage-beantworten.mp4',
      schritte: [
        'Die Anfrage öffnen – dort stehen Name, Kontakt und gewünschtes Angebot. Oben „🙋 Ich kümmere mich“ klicken.',
        'Die Person mit „📞 Anrufen“ oder „✉️ Antworten“ kontaktieren und kurz notieren, was ausgemacht ist.',
        'Status auf „Zugesagt“, „Anderer Termin vorgeschlagen“ oder „Erledigt“ setzen und speichern.',
      ],
    },
  ],
  kontaktanfragen: [
    {
      id: 'kontakt-beantworten',
      titel: 'Eine Kontaktanfrage beantworten',
      video: '/hilfe/kontakt-beantworten.mp4',
      schritte: [
        'Links unter „Posteingang“ auf „Kontaktanfragen“ und die Nachricht mit Status „Neu“ öffnen.',
        'Oben „🙋 Ich kümmere mich“ klicken.',
        '„✉️ Antworten“ öffnet dein E-Mail-Programm mit Adresse und Betreff – oder direkt auf die Benachrichtigungs-Mail antworten.',
        'Kurz notieren, was du geantwortet hast, und „Notiz speichern“.',
        'Status auf „Erledigt“ setzen und speichern.',
      ],
    },
    {
      id: 'papierkorb-zurueck',
      titel: 'Etwas Gelöschtes zurückholen',
      video: '/hilfe/papierkorb.mp4',
      schritte: [
        'Die Liste des Bereichs öffnen, z. B. „Kontaktanfragen“ oder „News“.',
        'Oben rechts auf „Papierkorb“ klicken.',
        'Den Eintrag öffnen und „Wiederherstellen“ klicken.',
        'Das geht 30 Tage lang. Danach kann ein Web-Admin den Eintrag noch eine Zeit lang zurückholen.',
      ],
    },
  ],
  registrierungen: [
    {
      id: 'registrierung-freigeben',
      titel: 'Eine Registrierung freigeben',
      video: '/hilfe/registrierung-freigeben.mp4',
      schritte: [
        'Links unter „Posteingang“ auf „Registrierungen“ (die orange Zahl zeigt, wie viele warten).',
        'Prüfen: Kennst du die Person? Ist die E-Mail-Adresse bestätigt (✓)? Der Hinweis „Mitgliedsantrag mit dieser E-Mail vorhanden“ hilft.',
        'Die Teams anhaken, in denen die Person mitmacht – ihre Wünsche sind schon angehakt. „Alle Teams & Kurse zeigen“ klappt den Rest auf.',
        '„Freigeben“ klicken: Die Person bekommt eine E-Mail und kann sich anmelden. Unbekannt oder Spam: „Ablehnen“.',
        'Gibt es unter „Mitgliedschaften“ einen Eintrag mit derselben E-Mail, wird der Ausweis automatisch verknüpft.',
      ],
    },
  ],
  mitgliedschaften: [
    {
      id: 'ausweis-pflegen',
      titel: 'Eine Mitgliedschaft (Ausweis) pflegen',
      schritte: [
        'Links unter „Mitglieder“ auf „Mitgliedschaften“.',
        'Den Eintrag öffnen – nach „Aufnehmen“ eines Antrags entsteht er automatisch.',
        '„Mitgliedsnummer“ eintragen.',
        'Prüfen, ob bei „Benutzerkonto“ das richtige Konto steht (bei Kindern das der Eltern).',
        'Speichern.',
        'Austritt: „Gültig bis (Austritt)“ setzen – danach zeigt der Ausweis „nicht mehr gültig“.',
      ],
    },
  ],
  alben: [
    {
      id: 'album-anlegen',
      titel: 'Ein Fotoalbum anlegen',
      schritte: [
        'Links unter „Inhalte“ auf „Fotoalben“, dann „Neu erstellen“.',
        'Titel und Datum eintragen, optional „Team / Kurs (optional)“ wählen.',
        'Bei „Bilder“ Fotos auswählen oder hochladen – bei jedem neuen Foto „Sind Personen zu erkennen?“ ausfüllen. Das erste Bild ist das Titelbild.',
        'Speichern.',
      ],
    },
  ],
  sponsoren: [
    {
      id: 'sponsor-anlegen',
      titel: 'Einen Sponsor eintragen',
      schritte: [
        'Links unter „Inhalte“ auf „Sponsoren“, dann „Neu erstellen“.',
        'Name, Logo (PNG mit durchsichtigem Hintergrund, mindestens 600 px breit), Website und kurzen Text eintragen.',
        'Rechts „Art“ wählen (Hauptsponsor, Premium-Partner, Partner, Förderer & Freunde) und „Im Laufband auf der Startseite“ prüfen.',
        'Speichern.',
      ],
    },
  ],
  gesuche: [
    {
      id: 'gesuch-anlegen',
      titel: 'Helfer oder Ehrenamtliche suchen',
      schritte: [
        'Oben eine Vorlage wählen (z. B. „Trainer/in“) – oder „Neu erstellen“.',
        '„Wen suchen wir?“, „Beschreibung“, „Aufwand“ und „Symbol“ ausfüllen.',
        'Speichern – das Gesuch erscheint auf der Seite /mitmachen.',
        'Jemanden gefunden? Den Haken „Auf der Website zeigen“ entfernen.',
      ],
    },
  ],
  papierkorb: [
    {
      id: 'zurueckholen',
      titel: 'Etwas aus dem Web-Admin-Papierkorb zurückholen',
      schritte: [
        'Links unter „Technik“ auf „Papierkorb“.',
        'Oben „🗑️ Im Papierkorb“ oder „🔒 Nur Web-Admin“ wählen, dazu nach Bereich, Person oder Titel filtern.',
        '„↩ Wiederherstellen“ – der Eintrag ist wieder an seiner Stelle.',
        'Wirklich weg haben: „Endgültig löschen“. Das lässt sich nicht rückgängig machen.',
        'Vorher zeigt die Rückfrage, was noch verknüpft ist: „wird MITGELÖSCHT“ (z. B. die Eingänge eines Formulars, Ausfälle, Probetraining-Anfragen und Passanträge eines Teams – die gehen ohne den Eintrag nicht) und „wird noch verwendet in“ (z. B. ein Bild in einer News – dort fehlt es danach). Erst prüfen, dann bestätigen oder abbrechen.',
      ],
    },
  ],
  datenschutz: [
    {
      id: 'auskunft',
      titel: 'Jemand fragt, welche Daten wir gespeichert haben (Admin)',
      schritte: [
        'Links unter „Einstellungen“ auf „Datenschutz-Fristen“.',
        'Unten bei „Auskunft für eine Person“ die E-Mail-Adresse eingeben.',
        '„📄 Auskunft herunterladen“ – die Datei enthält alles von der Website, auch aus dem Papierkorb.',
        'Die Datei der Person geben (nicht per unverschlüsselter Mail an Dritte). Soll alles gelöscht werden: die gefundenen Einträge löschen und im Web-Admin-Papierkorb endgültig entfernen lassen.',
      ],
    },
  ],
  account: [
    {
      id: 'zwei-faktor-einrichten',
      titel: 'Die Zwei-Faktor-Anmeldung einrichten',
      schritte: [
        'Eine Authenticator-App aufs Handy laden (z. B. Google Authenticator oder Microsoft Authenticator).',
        'Beim Anmelden – oder auf der Übersicht unter „Erste Schritte“ → „Zwei-Faktor-Anmeldung einrichten“ – den QR-Code mit der App scannen.',
        'Den 6-stelligen Code aus der App eingeben und „Einrichtung abschließen“.',
        'Die Wiederherstellungscodes kopieren oder ausdrucken und sicher aufbewahren, dann „Ich habe die Codes gesichert – weiter“.',
      ],
    },
    {
      id: 'benachrichtigungen-aus',
      titel: 'Keine E-Mails zu neuen Anfragen mehr bekommen',
      schritte: [
        'Oben rechts auf dein Symbol → „Mein Konto“.',
        'Den Haken „E-Mail-Benachrichtigungen“ entfernen.',
        'Speichern.',
      ],
    },
  ],
  sicherung: [
    {
      id: 'sicherung-erstellen',
      titel: 'Eine Sicherung erstellen und aufbewahren',
      schritte: [
        'Links unter „Technik“ auf „Datensicherung“ klicken.',
        '„Sicherung jetzt erstellen“ – etwa eine Minute warten.',
        'Bei der neuen Sicherung „Herunterladen“ klicken.',
        'Die Datei zusätzlich auf einen USB-Stick oder in eine Cloud kopieren.',
      ],
    },
    {
      id: 'sicherung-einspielen',
      titel: 'Eine Sicherung zurückholen (Notfall)',
      schritte: [
        'Per SSH am Server anmelden. Die Datei muss im Ordner /srv/bsv/backups liegen (hochladen mit scp, siehe Seite „Datensicherung“).',
        'Website anhalten: sudo systemctl stop bsv',
        'Einspielen: sudo -u bsv -H bash -c \'cd /srv/bsv && NODE_ENV=production pnpm sicherung:einspielen DATEINAME\' – „JA“ eintippen und warten, bis „Fertig“ erscheint. Der vorherige Stand wird vorher automatisch gesichert; ohne Dateinamen wird die neueste Sicherung genommen.',
        'Website starten: sudo systemctl start bsv',
        'Die Befehle stehen auch unten auf der Seite „Datensicherung“.',
      ],
    },
    {
      id: 'wiederherstellung-testen',
      titel: 'Einmal im Jahr: Wiederherstellung testen',
      schritte: [
        'Auf der Live-Website unter „Datensicherung“ die neueste Sicherung herunterladen.',
        'Auf einem Testrechner einspielen – nicht auf der Live-Website. Der Testrechner braucht denselben ENCRYPTION_KEY wie der Server.',
        'Kurz durchklicken: Sind News, Teams und Bilder da? Lässt sich eine IBAN in einem Mitgliedsantrag anzeigen?',
        'Danach die Testdaten auf dem Testrechner wieder entfernen – dort sollen keine echten Mitgliederdaten bleiben.',
        'Auf der Live-Website unter „Datensicherung“ im Kasten „Wartung“ auf „✓ Heute erfolgreich getestet“ klicken.',
      ],
    },
  ],
  saisonwechsel: [
    {
      id: 'saisonwechsel',
      titel: 'Den Saisonwechsel machen (Fußball)',
      video: '/hilfe/saisonwechsel.mp4',
      schritte: [
        'Links unter „Sport“ auf „Saisonwechsel“.',
        '„🔄 Neue Saison beginnen“ klicken und bestätigen.',
        'Oben eine Gruppe wählen (z. B. „Junioren“) und das erste Team öffnen (Klick auf den Namen).',
        'Im Team Namen, Alter, Trainingszeiten und Verantwortliche anpassen, speichern, zurück zum Saisonwechsel.',
        'Beim Team das Häkchen setzen. Mit „Nur noch nicht geprüfte“ siehst du, was fehlt.',
        'Wenn alle abgehakt sind: „✓ Saisonwechsel abschließen“.',
      ],
    },
    {
      id: 'trainer-hoert-auf',
      titel: 'Ein Trainer hört auf',
      schritte: [
        'Im Saisonwechsel (oder unter „Teams & Kurse“) das Team öffnen.',
        'Unter „Verantwortliche“ die Person entfernen und speichern.',
        'Betreut sie kein anderes Team mehr: Links unter „Mitglieder“ → „Benutzer“ die Person öffnen und bei „Rollen“ nur „Mitglied“ lassen. Speichern.',
        'Ab sofort kommt sie nicht mehr in die Verwaltung. News und Bilder, die sie geschrieben hat, bleiben erhalten.',
      ],
    },
  ],
  rollen: [
    {
      id: 'testkonten',
      titel: 'Rechte mit Testkonten ausprobieren (nur lokal)',
      schritte: [
        '„Rollen & Rechte“ öffnen → Reiter „Testkonten“ → „Testkonten anlegen“.',
        'Es entsteht je ein Konto pro Rolle (Admin, Redaktion, Kasse, Passwesen, Mitglied), pro Abteilung (Abteilungsleitung, Pressewart) und pro Team (Trainer). Alle mit demselben Passwort, das dort angezeigt wird.',
        'Abmelden oder ein privates Browserfenster öffnen und mit einem Testkonto anmelden – ohne Zwei-Faktor.',
        'Prüfen: Was sieht die Person? Was darf sie ändern? Welche Bilder kann sie auswählen?',
        'Fertig? „Alle Testkonten löschen“. Echte Konten bleiben unberührt.',
        'Testkonten funktionieren nur auf dem lokalen Server, nicht auf der Live-Website.',
      ],
    },
    {
      id: 'rollen-pruefen',
      titel: 'Prüfen, wer für ein Team zuständig ist',
      schritte: [
        'Links unter „Mitglieder“ auf „Rollen & Rechte“ klicken.',
        'Reiter „Nach Team“ wählen oder den Teamnamen oben ins Suchfeld tippen.',
        'Neben dem Team stehen die Verantwortlichen mit ihren Rollen.',
        'Niemand eingetragen? Auf „Zuordnen“ klicken und die Person unter „Verantwortliche“ auswählen. Speichern.',
      ],
    },
    {
      id: 'rollen-aufraeumen',
      titel: 'Rechte aufräumen, wenn jemand aufhört',
      schritte: [
        'Unter „Rollen & Rechte“ die Person suchen.',
        'Auf „Bearbeiten“ klicken.',
        'Bei „Rollen“ alle Kacheln außer „Mitglied“ abhaken (oder das Konto löschen) und speichern.',
        'Bei „Team-Berechtigungen“ alle Teams entfernen (oder beim Team unter „Verantwortliche“).',
      ],
    },
  ],
  users: [
    {
      id: 'konto-anlegen',
      titel: 'Ein Konto für einen neuen Trainer anlegen',
      video: '/hilfe/konto-anlegen.mp4',
      schritte: [
        'Links unter „Mitglieder“ auf „Benutzer“, dann „Neu erstellen“ klicken.',
        'Name und E-Mail eintragen, ein vorläufiges Passwort vergeben (mindestens 10 Zeichen mit Groß- und Kleinbuchstaben, Zahl und Sonderzeichen; keine Allerweltswörter wie „Sommer2026!“, keine Reihen wie „12345“, nicht der eigene Name – unter dem Feld steht live, was noch fehlt).',
        'Bei „Rollen“ die passende Kachel ankreuzen, z. B. „Trainer“ (mehrere möglich).',
        'Direkt darunter bei „Team-Berechtigungen“ die Teams auswählen. Oben zeigt „Was darf diese Person?“ in Klartext, was die Rollen erlauben.',
        'Speichern.',
        'Der Person E-Mail und Passwort persönlich mitteilen. Beim ersten Anmelden richtet sie die Zwei-Faktor-App ein.',
      ],
    },
    {
      id: 'admin-rechte',
      titel: 'Jemanden zum Admin oder Web-Admin machen (nur Web-Admin)',
      schritte: [
        'Unter „Benutzer“ das Konto öffnen.',
        'Bei „Rollen“ die Kachel „Admin“ oder „Web-Admin“ ankreuzen.',
        'Speichern. Web-Admins bekommen „Admin“ automatisch mit dazu.',
        'Tipp: Es sollte immer mindestens zwei Web-Admins geben, damit niemand ausgesperrt wird. Den letzten Web-Admin kann man nicht entfernen.',
      ],
    },
    {
      id: 'zusatzrechte',
      titel: 'Einer Person ein einzelnes Recht geben (nur Web-Admin)',
      schritte: [
        'Links unter „Mitglieder“ auf „Benutzer“ und die Person öffnen.',
        'Unten den zugeklappten Abschnitt „Ausnahmen: Zusatzrechte nur für diese Person (Web-Admin)“ öffnen.',
        'Die gewünschten Häkchen setzen, z. B. „Kontaktanfragen sehen und bearbeiten“ oder „News aller Teams schreiben und bearbeiten“. Unter jedem Häkchen steht, was genau dazugehört.',
        'Oben bei „🔎 Was darf diese Person?“ prüfen, ob das Ergebnis passt (rechnet sofort mit, auch vor dem Speichern).',
        'Speichern. Die Person kommt damit in die Verwaltung, sieht nur die passenden Bereiche und braucht die Zwei-Faktor-Anmeldung.',
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
      video: '/hilfe/vorstand.mp4',
      schritte: [
        'Nach unten zu „Vorstand und Ansprechpersonen“ scrollen.',
        'Mit „Person hinzufügen“ jemanden ergänzen: Name und Funktion.',
        'Hat die Person ein Konto auf der Website (selbst registriert und freigegeben)? Dann bei „Benutzerkonto“ auswählen: „Nachricht senden“ geht per E-Mail direkt an sie, und der Name bleibt automatisch aktuell (Feld „Name“ darf dann leer bleiben). Ihr Profilfoto erscheint nur mit Haken „Profilfoto aus dem Konto auf der Vereinsseite zeigen“ – und nur mit ihrem Einverständnis: dann bei „Einverständnis zum Foto erteilt am“ das Datum eintragen.',
        'Mit dem Griff links die Reihenfolge ändern, über die drei Punkte rechts jemanden entfernen.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'beitraege',
      titel: 'Die Mitgliedsbeiträge ändern (Kasse)',
      schritte: [
        'Links unter „Einstellungen“ auf „Vereinsdaten“.',
        'Bei „Mitgliedsbeiträge“ je Mitgliedsart den Betrag bei „€ pro Quartal“ eintragen.',
        'Oben rechts „Speichern“ – gilt sofort für neue Anträge und die Vereinsseite. Bestehende Anträge behalten ihren Betrag.',
      ],
    },
    {
      id: 'satzung',
      titel: 'Die Satzung hochladen',
      schritte: [
        'Bei „Satzung & Downloads“ auf „Download hinzufügen“ klicken.',
        'Titel eingeben, z. B. „Satzung (Stand 2026)“.',
        'Bei „Datei (öffentlich)“ das PDF hochladen und speichern.',
        'Nur für Mitglieder? Haken „Nur für Mitglieder“ setzen und die Datei bei „Geschützte Datei (nur Mitglieder)“ hochladen.',
      ],
    },
  ],
  texte: [
    {
      id: 'startseite-bilder',
      titel: 'Die Bilder der Startseite austauschen',
      video: '/hilfe/startseite-bilder.mp4',
      schritte: [
        'Website-Aufbau → „Texte & Bilder“ öffnen, Reiter „Startseite“ – ganz oben „Bilder oben und Kachel-Bilder“.',
        'Bei „Bilder oben“ ein Bild über das × entfernen und mit „Aus vorhandenen auswählen“ ein neues wählen.',
        'Die Kachel-Bilder darunter genauso austauschen.',
        'Oben rechts „Speichern“ – nach etwa einer Minute ist die Startseite aktualisiert.',
      ],
    },
    {
      id: 'aktion',
      titel: 'Die grüne Aktions-Box auf der Startseite ändern',
      schritte: [
        'Website-Aufbau → „Texte & Bilder“ öffnen, Reiter „Startseite“ – ganz unten „Grüne Aktions-Box“.',
        'Überzeile, Titel, Text, Button-Text und Button-Link anpassen, optional ein Bild wählen.',
        'Zum Ausblenden den Haken bei „Anzeigen“ entfernen.',
        'Speichern.',
      ],
    },
    {
      id: 'text-aendern',
      titel: 'Eine Überschrift der Website ändern',
      video: '/hilfe/website-texte.mp4',
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
      video: '/hilfe/formular-bauen.mp4',
      schritte: [
        'Am schnellsten: oben in der Formular-Liste eine Vorlage anklicken (Anmeldung, Helferliste, Sammelbestellung) – das Formular ist sofort angelegt.',
        'Oder „Neu erstellen“ klicken und einen Titel vergeben.',
        'Mit „Feld hinzufügen“ Felder wie Name, E-Mail oder Anzahl Personen anlegen.',
        'Bei „Nach dem Absenden …“ die Danke-Nachricht wählen und bei „Danke-Nachricht“ den Text eintragen.',
        'Speichern. Auf einer Seite den Baustein „Formular“ einfügen und dieses Formular auswählen.',
      ],
    },
    {
      id: 'formular-einbauen',
      titel: 'Das Formular auf der Website zeigen',
      schritte: [
        'Am einfachsten: im Formular rechts auf „Neue Seite mit diesem Formular erstellen“ klicken. Die Seite ist dann schon fertig – nur noch prüfen und „Veröffentlichen“.',
        'Oder von Hand: links auf „Seiten“. Eine bestehende Seite öffnen oder „Neu erstellen“ (z. B. „Sommerfest“).',
        'Oben den Reiter „Inhalt (Bausteine)“ wählen.',
        '„Baustein hinzufügen“ → „Formular“ anklicken.',
        'Bei „Formular“ dein Formular auswählen. Optional eine kurze Einleitung darüber schreiben.',
        'Oben rechts „Veröffentlichen“. Die Seite ist jetzt unter ihrer Adresse erreichbar (z. B. /sommerfest).',
        'Ins Menü aufnehmen: „Menü & Fußzeile“ → Eintrag hinzufügen → „Seite aus ‚Seiten‘ öffnen“ → Seite wählen → Speichern.',
      ],
    },
  ],
}

// Die Vorlagen-Anleitung auch auf der Seite „E-Mail-Vorlagen“ selbst zeigen
ANLEITUNGEN.mailVorlagen = ANLEITUNGEN.mitgliedsantraege!.filter((a) => a.id === 'antrag-vorlagen')

/* ------------------------------------------------------------------ */
/* Was bedeuten die Felder?                                            */
/* ------------------------------------------------------------------ */
export const FELDER: Record<string, Feld[]> = {
  posts: [
    { name: 'Titel', text: 'Die Überschrift. Kurz und konkret – sie steht groß über der News und in der Übersicht.' },
    { name: 'Titelbild', text: 'Das große Bild oben. Ohne Bild wirkt die News in Übersichten leer.' },
    { name: 'Text', text: 'Der eigentliche Beitrag. Text markieren → fett, kursiv oder Link. Mit „/“ oder „+“ kommen Überschriften, Listen, Bilder oder ein farbiger Hinweis dazu.' },
    { name: 'Team / Kurs', text: 'Zu welchem Team die News gehört. Sie erscheint dann auf dessen Seite. Leer = Vereins-News. Wer nur ein Team betreut, hat es schon vorausgewählt.' },
    { name: 'Kategorie (nur Redaktion)', text: 'Filter auf der News-Seite, z. B. „Fußball“ oder „Kids“. Mehrere sind möglich.' },
    { name: 'Auf Startseite (nur Redaktion)', text: 'Zeigt die News zusätzlich auf der Startseite und unter „News“.' },
    { name: 'Veröffentlicht am (nur Redaktion)', text: 'Das Datum über der News. Leer = Zeitpunkt der Veröffentlichung. Ein Datum in der Zukunft plant die News nicht automatisch ein – dafür gibt es „Veröffentlichungsplanung“ im Pfeil neben „Veröffentlichen“.' },
    { name: 'Autor:in (nur Redaktion)', text: 'Wer die News geschrieben hat. Wird automatisch mit deinem Namen vorbelegt.' },
    { name: 'Slug (nur Redaktion)', text: 'Der Teil der Adresse, z. B. /news/f1-gewinnt. Entsteht automatisch aus dem Titel. Mit „Entsperren“ kannst du ihn ändern – nach dem Veröffentlichen besser nicht mehr.' },
    { name: 'Für Fortgeschrittene (nur Redaktion)', text: 'Eingeklappt unten: „Passende News“ (bis zu 3 News unter dem Artikel, leer = die 3 neuesten) und die Google-Vorschau. Beides musst du nicht ausfüllen.' },
    { name: 'Google-Vorschau (SEO)', text: 'Titel, Beschreibung und Bild, die Google und WhatsApp & Co. beim Teilen anzeigen. Wird automatisch aus Titel, Text und Titelbild erzeugt. Nur ändern, wenn du einen anderen Text möchtest.' },
  ],
  angebote: [
    { name: 'Angaben zuletzt bestätigt', text: 'Wann jemand zuletzt bestätigt hat, dass Zeiten und Infos stimmen (Knopf „✓ Alles noch aktuell“, „Passt noch?“-Mail oder Trainingszeiten geändert). Steht als „Stand“ auf der Teamseite. Orange, wenn es über ein Jahr her ist.' },
    { name: 'Name', text: 'So heißt das Team oder der Kurs überall auf der Website.' },
    { name: 'Bereich', text: 'Fußball, BSV Kids oder Erwachsene & Senioren – bestimmt, in welchem Menü das Angebot erscheint.' },
    { name: 'Gruppe (Fußball)', text: 'Junioren, Juniorinnen, Senioren oder Seniorinnen – Spalte im Fußball-Menü.' },
    { name: 'Kategorie', text: 'Art des Angebots (z. B. Tanzen, Fitness, Ausdauer) – für Filter und Angebotsfinder.' },
    { name: 'Titelbild', text: 'Großes Bild oben auf der Teamseite und auf den Karten.' },
    { name: 'Hinweis-Banner auf der Teamseite', text: 'Kurzer Hinweis oben auf der Teamseite, z. B. „Training heute in Halle 2“. Art „ℹ️ Info“ oder „⚠️ Wichtig“, optional „Anzeigen bis einschließlich“ – danach verschwindet er von selbst.' },
    { name: 'Alter (Anzeige)', text: 'Kurzer Text wie „Herren ab 32“ oder „4–6 Jahre“. Erscheint im Menü und auf Karten.' },
    { name: 'Alter von / bis', text: 'Zahlen für den Angebotsfinder („Wie alt bist du?“).' },
    { name: 'Kurzbeschreibung', text: 'Ein Satz für Übersichtskarten.' },
    { name: 'Beschreibung', text: 'Ausführlicher Text auf der Seite des Teams.' },
    { name: 'Trainingszeiten', text: 'Tag, Uhrzeit und Ort. Erscheinen auf der Teamseite.' },
    { name: 'Verantwortliche', text: 'Benutzerkonten, die dieses Team pflegen dürfen (News, Bilder, Ausfälle). Ändern dürfen das Admin und Redaktion; Admins auch beim Benutzer unter „Team-Berechtigungen“.' },
    { name: 'Trainer- und Betreuerteam', text: 'Nur zur Anzeige auf der Teamseite (Name, Rolle, optional Foto). Wer bearbeiten darf, steht bei „Verantwortliche“.' },
    { name: 'Kursplätze', text: 'Eingeklappt: Haken „Plätze begrenzt (Reservierung im Mitgliederbereich)“ setzen und bei „Max. Plätze“ die Höchstzahl eintragen.' },
    { name: 'Fußball-Widgets', text: 'Nur bei Fußball: Spielklasse, FuPa-Widget und FUSSBALL.DE-Nummer (Spielplan/Tabelle). FuPa: im Widget-Builder auf fupa.net das Widget zusammenstellen (Kader, Tabelle, Spielplan), als „URL der Webseite“ die echte Vereinsadresse eintragen, „Speichern“ und den kompletten Code einfügen – die ID wird automatisch herausgelesen. Besucher sehen die Widgets erst nach einem Klick (Datenschutz): „Einmal laden“ oder „Immer laden“ – Letzteres merkt sich ihr Browser, dann erscheinen die Widgets künftig sofort.' },
    { name: 'Reihenfolge', text: 'Kleinere Zahl = weiter vorne – im Aufklappmenü Fußball/Breitensport, auf den Übersichtsseiten und im Mitgliedsantrag. Neue Teams bekommen 100 und stehen damit hinten; gleiche Zahl = alphabetisch. Bequemer per Ziehen: Menü & Fußzeile → Reiter „Aufklappmenü …“.' },
    { name: 'Aktiv (öffentlich sichtbar)', text: 'Nur aktive Angebote sind auf der Website sichtbar. Ändern dürfen das Admin und Redaktion.' },
  ],
  media: [
    { name: 'Bildbeschreibung', text: 'Beschreibt, was zu sehen ist. Wichtig für Menschen, die sich Seiten vorlesen lassen.' },
    { name: 'Sind Personen zu erkennen?', text: 'Pflicht beim Hochladen. „Ja“ nur, wenn die Einwilligung vorliegt – bei Kindern von den Eltern. In der Mediathek zeigt der Ordner „Angabe zu Personen fehlt“ alte Bilder ohne Angabe.' },
    { name: 'Ordner (Team / Kurs)', text: 'Der einzige Ordner, den es gibt: das Team, zu dem das Bild gehört. Nur Verantwortliche dieses Teams (und die Redaktion) sehen und benutzen es. Oben in der Mediathek siehst du alle Ordner als Kacheln – Bilder in der Liste anhaken und auf eine Kachel ziehen sortiert sie um.' },
    { name: 'Verein allgemein', text: 'Für Bilder ohne Team, z. B. Logo oder Sportplatz. Alle Trainer dürfen sie benutzen, aber nicht ändern. Setzen kann das nur die Redaktion.' },
    { name: 'Noch nicht zugeordnet', text: 'Bilder ohne Team und ohne „Verein allgemein“. Nur die Redaktion sieht sie – Trainer können sie nicht benutzen.' },
    { name: 'In der Bildergalerie des Teams zeigen', text: 'Das Bild erscheint in der Fotogalerie auf der Seite des Teams.' },
    { name: 'Wo liegt die Einwilligung? (optional, empfohlen)', text: 'Z. B. „Foto-Einwilligung im Mitgliedsantrag“ oder „Formular vom 03.05., Ordner Vorstand“. Hilft, wenn jemand widerruft. Nicht öffentlich.' },
    { name: 'Sponsoren-Logo', text: 'Legt das Bild in den Ordner „Sponsoren“ (nur Redaktion). Passiert automatisch, sobald es bei einem Sponsor als Logo gespeichert wird.' },
    { name: 'Bildunterschrift (optional)', text: 'Text, der unter dem Bild erscheinen kann, z. B. Fotograf oder Anlass.' },
    { name: 'Bild bearbeiten', text: 'Nach dem Hochladen: zuschneiden und den „wichtigsten Bildbereich“ setzen – dann bleibt z. B. ein Gesicht auch in kleinen Vorschaubildern sichtbar.' },
    { name: 'Bildgrößen', text: 'Die Website erzeugt automatisch kleinere Versionen für schnelle Ladezeiten. Darum musst du dich nicht kümmern.' },
  ],
  pages: [
    { name: 'Titel', text: 'Name der Seite, steht auch im Browser-Tab. Daraus entsteht die Adresse.' },
    { name: 'Reiter „Kopfbereich“', text: 'Der große Bereich ganz oben. Art wählen: groß mit Bild (bildschirmfüllend), mittel mit Bild, schlicht nur Text – oder kein Kopfbereich. Dazu Überschrift, Einleitung und bis zu zwei Buttons.' },
    { name: 'Reiter „Inhalt (Bausteine)“', text: 'Öffnet zuerst – hier steht der Text der Seite (z. B. bei Datenschutz und Impressum). Die Seite besteht aus Bausteinen untereinander, alle aufgeklappt. „Baustein hinzufügen“ → Art wählen. Mit dem Griff links verschieben, über die drei Punkte kopieren oder löschen, mit dem Pfeil rechts zuklappen.' },
    { name: 'Baustein „Text (in Spalten)“', text: 'Normaler Text – auch nebeneinander in Spalten (volle, halbe, Drittel-Breite). Die Werkzeugleiste macht Text fett, kursiv, zur Zwischenüberschrift oder zur Aufzählung (Punkte oder 1., 2., 3.). Pro Spalte optional ein Link.' },
    { name: 'Baustein „Bild oder Video“', text: 'Ein Bild oder Video aus der Mediathek in voller Breite.' },
    { name: 'Baustein „Hinweis-Kasten mit Button“', text: 'Ein hervorgehobener Kasten mit kurzem Text und ein bis zwei Buttons, z. B. „Jetzt anmelden“.' },
    { name: 'Baustein „News-Liste“', text: 'Zeigt automatisch die neuesten News (optional nur aus bestimmten Kategorien) oder ausgewählte News.' },
    { name: 'Baustein „Formular“', text: 'Bindet ein Formular aus „Eigene Formulare → Formulare“ ein, z. B. eine Anmeldung.' },
    { name: 'Reiter „Google-Vorschau“', text: 'Titel und Beschreibung für Google und beim Teilen. Leer lassen = wird automatisch erzeugt.' },
    { name: 'Buttons / Links', text: 'Linkziel: „Eigene Seite/News“ (aus der Liste wählen) oder „Adresse eingeben“ (z. B. /termine oder https://…). Dazu der Text auf dem Button und die Optik: grüner oder heller Button.' },
    { name: 'Slug', text: 'Die Adresse der Seite, z. B. /sommerfest. Besser nicht mehr ändern, wenn schon verlinkt.' },
    { name: 'Live-Vorschau', text: 'Bildschirm-Symbol oben: zeigt die Seite neben dem Formular und jede Änderung sofort. Seiten speichern zwischendurch automatisch als Entwurf.' },
  ],
  termine: [
    { name: 'Titel', text: 'Name der Veranstaltung.' },
    { name: 'Beginn / Ende', text: 'Datum und Uhrzeit (24-Stunden-Format, z. B. 19:00 Uhr). Eintippen geht auch: „12.12.2026 19:00“. Ende ist optional.' },
    { name: 'Ort', text: 'Wo der Termin stattfindet.' },
    { name: 'Bereich', text: 'Bestimmt Farbe und Zuordnung im Kalender.' },
    { name: 'Wiederholen', text: 'Für regelmäßige Termine: „Jede Woche“, „Alle 2 Wochen“ oder „Jeden Monat (gleicher Tag)“.' },
    { name: 'Wiederholen bis einschließlich', text: 'Letzter Tag der Wiederholung (höchstens 2 Jahre).' },
    { name: 'Einzelne Termine auslassen', text: 'Ferien oder Feiertage, an denen der Termin ausfällt – je ein Datum.' },
    { name: 'Nur für Mitglieder sichtbar', text: 'Nur nach dem Login sichtbar.' },
    { name: 'Zu-/Absage im Mitgliederbereich', text: 'Mitglieder sagen nach dem Login unter „Mein BSV“ zu oder ab. Die Liste steht unten im Termin. Nur bei Terminen, die sich nicht wiederholen.' },
    { name: 'Anmeldeschluss', text: 'Erscheint mit dem Haken. Bis einschließlich diesem Tag können Mitglieder antworten oder ändern. Leer = bis zum Beginn.' },
    { name: 'Begleitperson erlaubt', text: 'Erscheint mit dem Haken. Mitglieder wählen dann „1 Person“ oder „2 Personen (mit Begleitung)“.' },
    { name: 'Countdown auf der Startseite', text: 'Rechts. Zählt auf der Startseite bis zum Beginn herunter und verschwindet danach von selbst. Mehrere Termine mit Haken: der nächste kommt dran. Nicht zusammen mit „Nur für Mitglieder“.' },
    { name: 'Countdown-Button führt zu', text: 'Erscheint mit dem Haken. Eigene veröffentlichte Seite, z. B. mit Anmeldeformular. Leer = zum Termin im Kalender.' },
    { name: 'Countdown-Text', text: 'Erscheint mit dem Haken. Kurzer Satz unter dem Datum. Leer = Ort des Termins.' },
    { name: 'Beschreibung', text: 'Weitere Infos zum Termin. Zeilenumbrüche werden übernommen.' },
  ],
  ausfaelle: [
    { name: 'Angebot', text: 'Welches Team oder welcher Kurs ausfällt.' },
    { name: 'Datum', text: 'An welchem Tag. Danach verschwindet der Hinweis automatisch.' },
    { name: 'Grund', text: 'Zur Auswahl: Krankheit, Halle belegt, Ferien / Feiertag, Wetter, Sonstiges.' },
    { name: 'Hinweis an die Teilnehmenden', text: 'Optionaler Zusatz, z. B. ein Nachholtermin.' },
    { name: 'Teilnehmende per E-Mail/Push benachrichtigen', text: 'Ist schon angehakt. Sobald E-Mail-Versand und Push-Nachrichten eingerichtet sind (nach der Generalprobe), bekommen alle Bescheid, die dieses Team in der App gewählt haben – bis dahin wird noch nichts verschickt. Haken raus = nur auf der Website eintragen, ohne Nachricht. Siehe auch „Was löst eine Push-Nachricht auf dem Handy aus?“.' },
  ],
  rollen: [
    { name: 'Verantwortlich für', text: 'Teams, die die Person pflegen darf. Ändern: beim Benutzer unter „Team-Berechtigungen“ oder beim Team unter „Verantwortliche“.' },
    { name: 'Zwei-Faktor', text: 'Ob die Handy-App für die Anmeldung eingerichtet ist. Pflicht für alle außer „Mitglied“; Mitglieder können sie freiwillig einschalten.' },
    { name: '⚠️', text: 'Hier fehlt etwas: z. B. ein Trainer ohne Team oder ein Team ohne Verantwortliche.' },
    { name: 'Verwaltung', text: 'Ob die Person überhaupt in die Verwaltung kommt (Rolle außer „Mitglied“ oder ein Zusatzrecht).' },
    { name: 'Zuletzt da', text: 'Wann sich die Person zuletzt angemeldet hat. Lange nicht da? Rechte prüfen.' },
  ],
  users: [
    { name: 'Name', text: 'Erscheint in der Verwaltung und als Autor:in von News.' },
    { name: 'E-Mail', text: 'Damit meldet sich die Person an.' },
    { name: 'Rollen', text: 'Was die Person darf. Mehrere Rollen sind möglich.' },
    { name: 'Zwei-Faktor-Anmeldung eingerichtet', text: 'Haken entfernen setzt die Handy-App zurück (z. B. bei verlorenem Handy). Bei Mitgliedern (freiwillig) ist sie danach aus.' },
    { name: 'Teams & Kurse', text: 'In welchen Angeboten die Person selbst mitmacht (als Mitglied). Gibt keine Bearbeitungsrechte.' },
    { name: 'Freigegeben', text: 'Ohne Haken: selbst registriert und wartet auf Freigabe – sieht noch keinen Mitgliederbereich. Freigeben geht auch unter „Registrierungen“. Nur Admins.' },
    { name: 'E-Mail-Benachrichtigungen', text: 'Mail bei neuer Probetraining-Anfrage oder neuem Passantrag für die eigenen Teams, alle 3 Monate „Passt noch?“ für die eigenen Teams, (Kasse) bei neuem Mitgliedsantrag und (Admins) einmal im Monat der Monatsbericht. Haken entfernen = keine Mails.' },
    { name: 'Team-Berechtigungen', text: 'Welche Teams die Person betreut. Mit Rolle „Trainer“ ist sie dort Trainer, mit „Team-Redaktion“ Pressewart; ohne eine der beiden wird automatisch „Trainer“ gesetzt. „Trainer“ enthält alle Rechte der Team-Redaktion – beide anzukreuzen ist nicht nötig. Steht gleichzeitig beim Team unter „Verantwortliche“.' },
  ],
  menue: [
    { name: 'Text im Menü', text: 'So heißt der Eintrag auf der Website.' },
    { name: 'Was soll der Eintrag tun?', text: '„Seite aus „Seiten“ öffnen“ (eine eurer Seiten), „Adresse öffnen“ (z. B. /news oder eine fremde Website) oder „Aufklappmenü zeigen“ (Fußball, Breitensport oder Verein).' },
    { name: 'Adresse', text: 'Intern mit „/“: /news, /termine, /kontakt, /verein, /fussball, /breitensport, /mitglied-werden. Extern mit „https://“.' },
    { name: 'In neuem Tab öffnen', text: 'Sinnvoll für fremde Websites wie den Fan-Shop.' },
    { name: 'Kontakt-Spalte', text: 'Die Spalte ganz rechts in der Fußzeile. Haken „Kontakt-Spalte anzeigen“ entfernen blendet sie aus. Die Adresse kommt aus Vereinsdaten → „Sportplatz“; ein- und ausblenden mit „Adresse des Sportplatzes anzeigen“.' },
    { name: 'Links unter der Adresse', text: 'Für Social Media und andere fremde Seiten: „Adresse öffnen“ wählen, komplette Adresse mit https:// einfügen, „In neuem Tab öffnen“ anhaken.' },
    { name: 'Griff (sechs Punkte)', text: 'Daran ziehst du einen Eintrag nach oben oder unten.' },
  ],
  verein: [
    { name: 'Mitgliederzahl', text: 'Erscheint auf der Startseite und in Texten mit {mitglieder}.' },
    { name: 'Mitgliedsbeiträge', text: 'Beträge pro Quartal – gelten für den Online-Antrag.' },
    { name: 'SEPA-Gläubiger-ID', text: 'Steht im Lastschriftmandat des Antrags.' },
    { name: 'Vorstand', text: 'Name, Funktion, optional Foto. Erscheint auf der Vereinsseite.' },
    { name: 'Satzung & Downloads', text: 'Dateien zum Herunterladen auf der Vereinsseite.' },
    { name: 'Bilder und Aktions-Box', text: 'Stehen unter Website-Aufbau → „Texte & Bilder“.' },
    { name: 'Social Media', text: 'Steht nicht mehr hier: Menü & Fußzeile → Reiter „Fußzeile unten“ → „Kontakt-Spalte“ → „Links unter der Adresse“.' },
    { name: 'Kontaktformular: Worum geht es?', text: 'Die Auswahl im Kontaktformular. Pro Anliegen trägt ein Admin rechts ein, wer die Nachricht per E-Mail bekommt.' },
    { name: 'Fußball: Passantrag – Link zum Formular', text: 'Link zum offiziellen WDFV-Formular – erscheint beim Passantrag im Mitgliederbereich.' },
    { name: 'Informationspflichten (DSGVO)', text: 'Abschnitte mit Überschrift und Text für die Datenschutz-Hinweise auf der Vereinsseite.' },
  ],
  forms: [
    { name: 'Name des Formulars', text: 'Nur intern, damit ihr es wiederfindet.' },
    { name: 'Felder', text: '„Feld hinzufügen“ → Art wählen: Text, E-Mail, Zahl, Auswahlliste, Ankreuzfeld, mehrzeiliger Text … Pro Feld: Bezeichnung und ob es Pflicht ist.' },
    { name: 'Text auf dem Absende-Button', text: 'z. B. „Anmelden“.' },
    { name: 'Nach dem Absenden …', text: 'Eine Danke-Nachricht zeigen oder auf eine Seite weiterleiten.' },
    { name: 'E-Mail-Benachrichtigungen', text: 'Kommt mit dem E-Mail-Versand – bis dahin stehen die Eingänge unter „Formular-Eingänge“.' },
  ],
  sponsoren: [
    { name: 'Art', text: 'Hauptsponsor, Premium-Partner, Partner oder Förderer & Freunde – bestimmt den Abschnitt auf der Sponsorenseite. Der Hauptsponsor steht zusätzlich in der Fußzeile.' },
    { name: 'Reihenfolge', text: 'Kleinere Zahl = weiter vorne innerhalb derselben Art (Sponsorenseite, Laufband). Neue Sponsoren bekommen 100; gleiche Zahl = alphabetisch.' },
  ],
  gesuche: [
    { name: 'Reihenfolge', text: 'Kleinere Zahl = weiter oben auf „Mitmachen“. Neue Gesuche bekommen 100; gleiche Zahl = alphabetisch.' },
  ],
  texte: [
    { name: 'Aktion (grüne Box)', text: 'Ein großer Hinweis auf der Startseite, z. B. für ein Projekt oder Fest. Mit „Anzeigen“ ein- oder ausblenden.' },
    { name: 'Bilder oben', text: 'Bis zu 4 Fotos im großen Bereich ganz oben. Dazu zwei kleine Schilder mit kurzem Text.' },
    { name: 'Kacheln', text: 'Die Bilder für die Kacheln Fußball, BSV Kids und Fitness. Das Fußball-Bild ist auch das Titelbild der Fußball-Seite.' },
    { name: 'Breitensport-Seite und Vereinsseite', text: 'Drei Bilder der Breitensport-Seite und das Titelbild der Vereinsseite.' },
    { name: 'Reiter', text: 'Oben nach Seiten sortiert: Startseite, Fußball, Breitensport, Verein, Weitere Seiten.' },
    { name: 'Platzhalter', text: '{mitglieder}, {teams}, {kurse}, {angebote}, {kinder}, {gruendung} werden automatisch durch aktuelle Zahlen ersetzt. Genau so stehen lassen.' },
    { name: 'Zeilenumbruch', text: 'Ein Umbruch im Feld wird auch auf der Website ein Umbruch – praktisch für zweizeilige Überschriften.' },
  ],
}

/* ------------------------------------------------------------------ */
/* Hinweise je Rolle                                                   */
/* ------------------------------------------------------------------ */
export const ROLLEN_HINWEIS: Record<string, Partial<Record<RolleKey, string>>> = {
  posts: {
    uebungsleitung: 'Du kannst News für deine eigenen Teams schreiben. Mit „Für die Startseite vorschlagen“ bittest du die Redaktion, sie auch auf die Startseite zu holen.',
    teamredaktion: 'Du kannst News für deine eigenen Teams schreiben. Mit „Für die Startseite vorschlagen“ bittest du die Redaktion, sie auch auf die Startseite zu holen.',
    redaktion: 'Du kannst alle News bearbeiten und entscheidest mit „Auf Startseite“, was groß erscheint.',
    admin: 'Du kannst alle News bearbeiten und entscheidest mit „Auf Startseite“, was groß erscheint.',
  },
  media: {
    uebungsleitung: 'Du siehst die Ordner deiner Teams und „Verein allgemein“. Neue Bilder landen im Ordner deines Teams. Bilder anderer Teams siehst und benutzt du nicht.',
    teamredaktion: 'Du siehst die Ordner deiner Teams und „Verein allgemein“. Neue Bilder landen im Ordner deines Teams. Bilder anderer Teams siehst und benutzt du nicht.',
  },
  angebote: {
    uebungsleitung: 'Du siehst alle Angebote, kannst aber nur deine eigenen bearbeiten – z. B. Trainingszeiten und Beschreibung.',
    teamredaktion: 'Du siehst alle Angebote, kannst aber nur deine eigenen bearbeiten – z. B. Trainingszeiten und Beschreibung.',
  },
  ausfaelle: {
    uebungsleitung: 'Du kannst Ausfälle nur für deine eigenen Teams melden.',
    teamredaktion: 'Du kannst Ausfälle nur für deine eigenen Teams melden.',
  },
  probetraining: {
    uebungsleitung: 'Du siehst nur Anfragen für deine eigenen Teams. Bitte zeitnah melden und danach den Status ändern.',
  },
  mitgliedsantraege: { kasse: 'Als Kasse bist du hier hauptverantwortlich. Bitte Anträge zeitnah bearbeiten.' },
  passantraege: {
    uebungsleitung: 'Du siehst nur die Passanträge deiner eigenen Teams.',
  },
  alben: {
    uebungsleitung: 'Du kannst Fotoalben für deine eigenen Teams anlegen und bearbeiten.',
    teamredaktion: 'Du kannst Fotoalben für deine eigenen Teams anlegen und bearbeiten.',
  },
  users: {
    admin: 'Du kannst Konten anlegen und Rollen vergeben – außer Admin und Web-Admin. Konten von Web-Admins kannst du nicht ändern.',
    webadmin: 'Nur du kannst Admin- und Web-Admin-Rechte vergeben. Vergib sie so sparsam wie möglich.',
  },
}

/* ------------------------------------------------------------------ */
/* Häufige Fragen                                                      */
/* ------------------------------------------------------------------ */
export const FAQ: Faq[] = [
  {
    frage: 'Wie funktioniert die Familienmitgliedschaft?',
    antwort: 'Im Mitgliedsantrag gibt es die Beitragsart „Familie“; dort trägt die antragstellende Person die weiteren Familienmitglieder ein. Wird der Antrag auf „Aufgenommen“ gesetzt, bekommt JEDE Person eine eigene Mitgliedschaft mit eigenem digitalen Ausweis – alle unter der E-Mail des Antrags. Wer sich mit dieser E-Mail anmeldet, sieht im Mitgliederbereich die Ausweise der ganzen Familie. Einen „Familien-Datensatz“ gibt es bewusst nicht: Trennen sich Eltern oder tritt ein Kind aus, endet nur die einzelne Mitgliedschaft (Datum „Gültig bis (Austritt)“), die anderen bleiben unberührt. Soll ein Kind seine Ausweise später selbst sehen, bei seiner Mitgliedschaft unter „Benutzerkonto“ das eigene Konto eintragen. Wer welchen Beitrag zahlt, führt weiter die Mitgliederverwaltung des Vereins (z. B. DFBnet).',
    bereich: 'mitgliedschaften',
  },
  {
    frage: 'Was passiert, wenn ein Mitglied austritt?',
    antwort: 'Kündigen über die Website geht bewusst nicht – ein Austritt hat Fristen laut Satzung und betrifft Beitrag und Lastschrift. Das Mitglied meldet sich per Kontaktformular oder E-Mail bei Kasse bzw. Vorstand. Dann: 1. Mitglieder → Mitgliedschaften → Person öffnen → „Gültig bis (Austritt)“ eintragen → Speichern (bei Familien nur die Person, die austritt). 2. Ab dem Tag danach zeigt der digitale Ausweis „nicht mehr gültig“. 3. Nach 12 Monaten (einstellbar unter Einstellungen → Datenschutz-Fristen) ist die Mitgliedschaft „fällig“ und kommt beim Aufräumen in den Papierkorb, danach wird sie endgültig gelöscht. 4. Der Mitgliedsantrag mit der IBAN ist schon 3 Monate nach der Bearbeitung fällig; beim Löschen wird die IBAN sofort entfernt. 5. Das Benutzerkonto bleibt bestehen (Anmeldung geht weiter, der Ausweis ist ungültig). Nach 24 Monaten ohne Anmeldung erscheint es als Hinweis bei den Datenschutz-Fristen. Soll es sofort weg: Benutzer öffnen → Löschen. Die Mitgliederverwaltung des Vereins (z. B. DFBnet) pflegt die Kasse wie bisher.',
    bereich: 'mitgliedschaften',
  },
  {
    frage: 'Was passiert, wenn ich einem Mitglied nachträglich eine Verwaltungsrolle gebe (z. B. Admin oder Trainer)?',
    antwort: 'Die Rolle gilt nach dem Speichern sofort – aber erst, wenn die Person die Zwei-Faktor-Anmeldung hat. Ohne 2FA hat sie beim nächsten Klick (auch in einer schon offenen Sitzung) vorübergehend gar keine Rechte, auch nicht im Mitgliederbereich, und wird zur Einrichtung geschickt: QR-Code mit einer Authenticator-App scannen, Code eingeben, Wiederherstellungscodes sichern – danach ist sie z. B. Admin. Hatte sie die 2FA als Mitglied schon freiwillig eingerichtet, fragt die Anmeldung höchstens nach dem Code. Tipp: der Person vorher Bescheid geben, damit sie sich gleich danach anmeldet und die 2FA selbst einrichtet (sonst könnte das jemand tun, der ihr Passwort kennt – eine Hinweis-Mail warnt sie dann).',
    bereich: 'users',
  },
  {
    frage: 'Was passiert, wenn ich jemandem eine Rolle wegnehme?',
    antwort: 'Die Rechte gelten ab der nächsten Anfrage nicht mehr – auch in einer gerade offenen Sitzung, ein neues Anmelden ist nicht nötig. Bleibt nur „Mitglied“, sieht die Person wieder nur den Mitgliederbereich. Was sie geschrieben oder hochgeladen hat (News, Bilder, Termine), bleibt erhalten. Bei Trainern zusätzlich beim Team unter „Verantwortliche“ austragen (siehe „Ein Trainer hört auf – was muss ich tun?“).',
    bereich: 'users',
  },
  {
    frage: 'Was passiert, wenn ich ein Benutzerkonto lösche?',
    antwort: 'Das Konto ist sofort und endgültig weg – Benutzerkonten haben keinen Papierkorb. Das Profilfoto wird mit gelöscht. Erhalten bleiben: News und Bilder der Person (ohne Autor:in), Mitgliedschaften und Ausweis-Daten (dann ohne verknüpftes Konto – niemand sieht den Ausweis, bis ein anderes Konto eingetragen ist) sowie Anträge und Anfragen. Bei Teams fällt die Person aus „Verantwortliche“ heraus. Admin- und Web-Admin-Konten kann nur ein Web-Admin löschen; der letzte Web-Admin lässt sich nicht löschen. Soll jemand nur vorübergehend nicht mehr in die Verwaltung: statt löschen die Rollen bis auf „Mitglied“ entfernen.',
    bereich: 'users',
  },
  {
    frage: 'Was passiert, wenn ich ein Team oder einen Kurs ausblende oder lösche?',
    antwort: 'Ausblenden (Haken „Aktiv (öffentlich sichtbar)“ entfernen): Das Angebot verschwindet von der Website, aus dem Menü, dem Angebotsfinder und dem Mitgliedsantrag – News, Bilder, Zeiten und Verantwortliche bleiben erhalten, Haken wieder setzen holt alles zurück. Löschen: Das Team kommt in den Papierkorb (30 Tage zurückholbar). Erst beim endgültigen Löschen gehen Trainingsausfälle, Probetraining-Anfragen und Passanträge dieses Teams mit – der Papierkorb zeigt vorher an, was noch damit verknüpft ist. Für eine Saisonpause ist Ausblenden fast immer die bessere Wahl.',
    bereich: 'angebote',
  },
  {
    frage: 'Was passiert, wenn ich eine Seite oder News lösche, die noch verlinkt ist?',
    antwort: 'Sie kommt zuerst in den Papierkorb und ist sofort nicht mehr auf der Website. Links darauf (Menü, Fußzeile, Knöpfe auf anderen Seiten) führen dann ins Leere. Vor dem endgültigen Löschen zeigt der Papierkorb unter „⚠️ Vorsicht – noch verknüpft“, wo der Eintrag noch verwendet wird. Am besten zuerst den Link im Menü bzw. auf der anderen Seite entfernen und dann löschen. Aus Versehen gelöscht? Aus dem Papierkorb wiederherstellen.',
    bereich: 'pages',
  },
  {
    frage: 'Was passiert, wenn zwei Personen gleichzeitig denselben Eintrag bearbeiten?',
    antwort: 'Wer einen Eintrag öffnet, „sperrt“ ihn für die Zeit der Bearbeitung. Öffnet ihn eine zweite Person, sieht sie, wer gerade daran arbeitet, und kann ihn nur ansehen – oder die Bearbeitung bewusst übernehmen (dann gehen nicht gespeicherte Änderungen der ersten Person verloren). Deshalb nach dem Bearbeiten immer speichern und den Eintrag schließen. Wer nur die Rolle „Nur ansehen“ hat, sperrt beim Ansehen nichts.',
    bereich: 'dashboard',
  },
  {
    frage: 'Was passiert, wenn ich einen Mitgliedsantrag aufnehme oder ablehne?',
    antwort: 'Im Kasten „Antrag prüfen“ stehen vorher Hinweise (Alter, Beitrag, doppelte Anträge, bestehende Mitgliedschaft). „Aufnehmen“ legt automatisch die Mitgliedschaft(en) mit digitalem Ausweis an – bei Familien eine je Person; die Mitgliedsnummer ergänzt die Kasse danach unter „Mitgliedschaften“. Aufgenommen ist endgültig; ein späterer Austritt läuft über „Gültig bis (Austritt)“ bei der Mitgliedschaft. „Ablehnen“ und „Rückfrage“ ändern nur den Status. Zu jeder Entscheidung lässt sich eine E-Mail an die antragstellende Person schicken – Betreff und Text sind vorausgefüllt und vor dem Senden änderbar. Drei Monate nach der Bearbeitung ist der Antrag mit der IBAN zum Löschen fällig (Datenschutz-Fristen).',
    bereich: 'mitgliedsantraege',
  },
  {
    frage: 'Was passiert, wenn ein Mitglied seine E-Mail-Adresse ändern möchte?',
    antwort: 'Die Anmelde-E-Mail ändert nur ein Admin: Benutzer öffnen → E-Mail ändern → Speichern (bei Admin- und Web-Admin-Konten nur ein Web-Admin). Mitglieder selbst können sie absichtlich nicht ändern – sonst könnte jemand eine fremde Adresse eintragen. Ausweise hängen am Benutzerkonto, nicht an der E-Mail, und bleiben deshalb sichtbar. In der Mitgliedschaft steht zusätzlich eine E-Mail-Adresse (darüber werden Ausweise neuen Konten zugeordnet) – die bei Bedarf ebenfalls anpassen.',
    bereich: 'users',
  },
  {
    frage: 'Wie erfahre ich von Sicherheitslücken und Updates (Next.js, Payload, Node.js, Datenbank)?',
    antwort: 'Alles steht an einem Ort: Technik → „Sicherheit“, Reiter „Updates“ (nur Web-Admins). Die Website prüft jeden Tag und kurz nach jedem Start: alle direkt genutzten Pakete gegen die Sicherheitsdatenbank von npm und auf neuere Versionen, Node.js (Sicherheitsversionen und Ende der Updates), die PostgreSQL-Datenbank und – live auf dem Server – ausstehende Betriebssystem-Updates und einen nötigen Neustart. Bei einer Sicherheitslücke erscheint oben im Dashboard „🚨 Sicherheitsupdate nötig …“, normale Updates als „⬆️ N Updates verfügbar“; „Ansehen“ führt direkt zur Übersicht mit Version, Schweregrad, Link zur Beschreibung und „So geht’s“. Mit „Jetzt prüfen“ startet man die Prüfung sofort. Zusätzlich prüft GitHub täglich auch indirekt genutzte Pakete und schickt bei Fund eine E-Mail. Was tun: Sicherheitsupdates zeitnah, alles andere beim Update-Tag – Update in Auftrag geben (aktualisieren und testen), dann deploy/update.sh auf dem Server; die Sicherung davor macht das Skript selbst. Übertragen werden nur Paketnamen und Versionsnummern, keine Vereinsdaten.',
    bereich: 'sicherung',
  },
  {
    frage: 'Gibt es eine Rolle, die nur ansehen darf?',
    antwort: 'Ja: „Nur ansehen“. Wer nur diese Rolle hat, sieht in der Verwaltung alles – News, Termine, Seiten, Teams, Bilder, Einstellungen, auch Entwürfe und frühere Versionen –, kann aber nichts anlegen, ändern, veröffentlichen oder löschen (die Formulare sind grau, Knöpfe zum Speichern fehlen; der Server lehnt Änderungen auch über direkte Aufrufe ab). Gedacht z. B. für Vorstand oder Kassenprüfung. Sensible Bereiche schaltet der Web-Admin unter Mitglieder → „Rollen & Rechte“ → Reiter „Rechte anpassen“ → „Nur ansehen“ einzeln ab, indem er den Haken entfernt: Posteingang, Passanträge, Mitgliedsanträge, Bankdaten (IBAN), Mitgliedschaften, Benutzerkonten (inkl. Registrierungen und Profilfotos) und Besucherstatistik. Ab Werk ist alles an. Nie sichtbar: Pass-Unterlagen (Ausweise, Fotos), Papierkorb, Datensicherung, Sicherheits-Einstellungen; Exporte (z. B. für die Kasse) und Datenschutz-Auskünfte gibt es für diese Rolle nicht. Das eigene Passwort und die Zwei-Faktor-Anmeldung kann die Person selbst ändern, die Zwei-Faktor-Anmeldung ist wie bei allen Verwaltungsrollen Pflicht. Auf der Website gilt sie wie alle anderen: Kontaktformular und Mitgliedsantrag gehen, und mit der Rolle „Mitglied“ dazu nutzt sie den Mitgliederbereich ganz normal (Ausweis, Profilfoto, Passantrag). Hat jemand zusätzlich eine andere Rolle (z. B. Kasse), darf er dort weiter arbeiten und sieht den Rest zum Lesen. Vergeben und entziehen kann die Rolle nur ein Web-Admin, weil sie auch Bereiche öffnet, die sonst nur Web-Admins sehen (z. B. Besucherstatistik).',
    bereich: 'users',
  },
  {
    frage: 'Welche Regeln gelten für Passwörter?',
    antwort: 'Überall gleich (Registrierung, „Passwort vergessen“, Mein Konto, Anlegen durch die Verwaltung): 10 bis 200 Zeichen, mindestens ein Großbuchstabe, ein Kleinbuchstabe, eine Zahl und ein Sonderzeichen (auch ein Leerzeichen zählt). Abgelehnt werden außerdem leicht zu erratende Passwörter – ein Allerweltswort oder Vereinsbegriff mit Zahlen dahinter wie „Sommer2026!“, „Passwort123!“, „BSV1919bsv!“ (auch als „P@ssw0rt“) –, Reihen wie „12345“, „abcde“, „qwert“ oder „aaaaa“ und Passwörter mit dem eigenen Namen oder der E-Mail-Adresse. Unter dem Passwortfeld steht beim Tippen, was noch fehlt, mit einer Stärke-Anzeige. Bestehende Passwörter bleiben gültig, die Regeln gelten beim nächsten Ändern. Tipp: ein kurzer Satz wie „Mein Hund frisst 3 Äpfel!“ ist sicher und gut zu merken.',
    bereich: 'users',
  },
  {
    frage: 'Was ist die „Passt noch?“-Mail?',
    antwort: 'Hat 3 Monate lang niemand bestätigt, dass die Angaben eines Teams stimmen, bekommen die Verantwortlichen (Trainer, Team-Redaktion) eine kurze E-Mail – alle eigenen Teams in einer Mail, mit Trainingszeiten. Pro Team ein Knopf „Prüfen und bestätigen“: Er öffnet eine Seite, auf der „✓ Ja, passt noch“ genügt (ohne Anmeldung, 30 Tage gültig). Stimmt etwas nicht, ändert man die Zeiten in der Verwaltung – das zählt automatisch als bestätigt. Auf der Teamseite steht dann „Stand der Trainingszeiten: …“. Verschickt wird nur von der echten Live-Website (nicht von Test-Installationen wie der Generalprobe). Abbestellen: „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“.',
    bereich: 'angebote',
  },
  {
    frage: 'Was ist der Monatsbericht?',
    antwort: 'Einmal im Monat bekommen alle Admins eine E-Mail: was im Posteingang offen ist, welche Teams keine Verantwortlichen oder keine Trainingszeiten haben, welche seit über 6 Monaten nicht bestätigt wurden („Passt noch?“), ungenutzte Zugänge, fehlende Zwei-Faktor-Anmeldung und fällige Datenschutz-Fristen. Web-Admins sehen zusätzlich Technik-Hinweise (Sicherung, Speicher, Versionen). Ist alles erledigt, steht „Alles in Ordnung“ drin – so sieht man, dass der Versand funktioniert. Verschickt wird nur von der echten Live-Website (nicht von Test-Installationen wie der Generalprobe). Abbestellen: „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“.',
    bereich: 'dashboard',
  },
  {
    frage: 'Ein Trainer hört auf – was muss ich tun?',
    antwort: 'Team öffnen (am einfachsten über Sport → „Saisonwechsel“) → unter „Verantwortliche“ die Person entfernen → Speichern. Betreut sie kein anderes Team mehr: unter Mitglieder → „Benutzer“ bei der Person nur die Rolle „Mitglied“ lassen. Dann kommt sie nicht mehr in die Verwaltung; ihre News und Bilder bleiben.',
    bereich: 'saisonwechsel',
  },
  {
    frage: 'Was ist der Saisonwechsel und wann mache ich ihn?',
    antwort: 'Vor jeder Fußball-Saison – meist im Sommer – gehen Admin oder Redaktion unter Sport → „Saisonwechsel“ alle Fußballteams durch: Namen, Verantwortliche, Trainingszeiten, alte Fotos. Breitensport-Kurse haben keine Saison und stehen dort nicht. Jedes Team wird abgehakt, am Ende „Saisonwechsel abschließen“. Vom 15. Juni bis 30. September erinnert das Dashboard daran.',
    bereich: 'saisonwechsel',
  },
  {
    frage: 'Das Dashboard sagt, Node.js oder PostgreSQL bekommt bald keine Sicherheits-Updates mehr. Was tun?',
    antwort: 'Das ist die Technik unter der Website. Rechtzeitig (der Hinweis kommt 6 Monate vorher) auf die nächste Version wechseln – das macht der Web-Admin bzw. wer den Server betreut, am besten an einem Update-Tag nach einer frischen Sicherung. Die Daten bleiben dabei erhalten. Details stehen unter „Datensicherung“ im Kasten „Wartung“.',
    bereich: 'sicherung',
  },
  {
    frage: 'Der Speicherplatz wird knapp. Was tun?',
    antwort: 'Ab 80 % belegt warnt das Dashboard. Möglichkeiten: in der Mediathek alte, nicht mehr genutzte Bilder löschen (Papierkorb leert sich nach 30 Tagen), alte Fotoalben aufräumen – oder beim Server-Anbieter mehr Speicher buchen. Auch die Sicherungen brauchen Platz; es bleiben automatisch nur die letzten 14 sowie je eine pro Woche und Monat.',
    bereich: 'sicherung',
  },
  {
    frage: 'Der ENCRYPTION_KEY ist vielleicht bekannt geworden (z. B. Laptop gestohlen). Was tun?',
    antwort: 'Nicht einfach austauschen – sonst sind IBANs, Zwei-Faktor und alle Sicherungen unlesbar. Stattdessen mit „pnpm schluessel:wechseln“ auf einen neuen Schlüssel umstellen: Die Anleitung Schritt für Schritt steht in deploy/README.md unter „Schlüssel wechseln“. Erst ein Probelauf, dann „ausfuehren“. Lag auch die Datenbank offen, zusätzlich „zwei-faktor-neu“. Danach den alten Schlüssel (ENCRYPTION_KEY_ALT) aus der .env löschen. Steht die ganze .env offen: auch PAYLOAD_SECRET und das E-Mail-Passwort wechseln.',
    bereich: 'sicherung',
  },
  {
    frage: 'Müssen Mitglieder die Zwei-Faktor-Anmeldung einrichten?',
    antwort:
      'Nein – für Mitglieder ist sie freiwillig: im Mitgliederbereich unter „Mein Konto“ → „Einschalten“ (Passwort, QR-Code scannen, Code eingeben, Wiederherstellungscodes sichern). Ausschalten geht dort nur mit Passwort und Code. Für alle mit Zugang zur Verwaltung (jede Rolle außer „Mitglied“ oder ein Zusatzrecht) ist sie Pflicht und lässt sich nicht abschalten – auch nicht von Admins oder Web-Admins. Hat jemand das Handy verloren: Wiederherstellungscode nutzen, sonst setzt ein Admin sie zurück (Haken „Zwei-Faktor-Anmeldung eingerichtet“ entfernen).',
    bereich: 'users',
  },
  {
    frage: 'Wie lege ich auf einem neuen Server das erste Konto an?',
    antwort:
      'Nicht im Browser: „Erstes Konto anlegen“ ist auf der Live-Website gesperrt – sonst könnte sich jemand, der die neue Adresse vor dir findet, selbst zum Web-Admin machen. Das Einrichtungs-Skript (deploy/einrichten.sh) fragt ohne Sicherung automatisch nach Name, E-Mail und Passwort. Nachholen auf dem Server: sudo -u bsv -H bash -c \'cd /srv/bsv && NODE_ENV=production pnpm konto:erstes\'. Mit eingespielter Sicherung sind die Konten schon da. Danach im Browser anmelden und die Zwei-Faktor-Anmeldung einrichten.',
    bereich: 'sicherung',
  },
  {
    frage: 'Was passiert, wenn der Web-Admin ausfällt? Wer kann übernehmen?',
    antwort: 'Dafür gibt es das Notfall-Handbuch (Ordner „Notizen“ bzw. im Projekt: „Notfall-Handbuch“): wem Server, Domain und Konten gehören, wo die Zugangsdaten liegen (Passwortmanager des Vorstands) und was eine Nachfolge braucht. Die Website läuft ohne Zutun weiter; nur Updates und Notfälle brauchen jemanden mit Server-Zugang.',
    bereich: 'sicherung',
  },
  {
    frage: 'Wie melde ich als Trainer schnell einen Ausfall – auch vom Handy?',
    antwort: 'Auf der Website anmelden → Mitgliederbereich → Kasten „Meine Teams & Kurse zum Pflegen“ → „Ausfall melden“. Tag antippen (die nächsten Trainingstage stehen schon da), Grund antippen, „Ausfall jetzt melden“. Er steht sofort auf der Teamseite. Versehentlich gemeldet? Daneben auf „zurücknehmen“ tippen.',
    bereich: 'ausfaelle',
  },
  {
    frage: 'Wie setze ich einen kurzen Hinweis auf die Teamseite (z. B. „Heute in Halle 2“)?',
    antwort: 'Im Mitgliederbereich beim Team auf „Hinweis setzen“ – oder in der Verwaltung beim Team unter „Hinweis-Banner auf der Teamseite“. Text eingeben, Info oder Wichtig wählen, optional „anzeigen bis“. Nach dem Datum verschwindet der Hinweis von selbst.',
    bereich: 'angebote',
  },
  {
    frage: 'Wie lege ich einen Termin an, der jede Woche stattfindet?',
    antwort: 'Termin wie gewohnt anlegen, bei „Wiederholen“ z. B. „Jede Woche“ wählen und „Wiederholen bis einschließlich“ eintragen (höchstens 2 Jahre). Ferien oder Feiertage unter „Einzelne Termine auslassen“ eintragen. Auf der Website und im Kalender-Abo erscheint jeder Termin einzeln – auch nach der Zeitumstellung zur richtigen Uhrzeit.',
    bereich: 'termine',
  },
  {
    frage: 'Bekomme ich eine E-Mail bei neuen Probetraining-Anfragen oder Passanträgen?',
    antwort: 'Ja, als Trainer für deine Teams (Passanträge zusätzlich an die Rolle „Passwesen“) – sobald der E-Mail-Versand eingerichtet ist. Dazu alle 3 Monate die Frage „Passt noch?“ zu deinen Teams. Abbestellen: oben rechts auf dein Symbol → „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“ entfernen und speichern.',
  },
  {
    frage: 'Wie melde ich mich ab oder wechsle in den Mitgliederbereich?',
    antwort: 'Oben rechts auf dein Symbol (Foto oder Anfangsbuchstaben) klicken. Im Menü: „Mein Konto“ (Name, E-Mail, Passwort, Benachrichtigungen), „Zum Mitgliederbereich“ (Ausfälle, Ausweis, Downloads – so, wie Mitglieder die Website sehen), „Website ansehen“, „Hilfe-Center“ und „Abmelden“.',
  },
  {
    frage: 'Was bedeutet „Vorzeigen genügt · QR-Code prüft live“ auf dem Mitgliedsausweis?',
    antwort:
      'Der Satz richtet sich an die Person, die den Ausweis kontrolliert (z. B. am Eingang eines Festes oder bei einem Rabatt).\n\n„Vorzeigen genügt“: Der Ausweis auf dem Handy reicht. Dass er echt ist und kein Screenshot, sieht man an der laufenden Uhrzeit unten links (die Sekunden zählen mit) und am schimmernden Streifen.\n\n„QR-Code prüft live“: Wer den QR-Code mit der Handy-Kamera scannt, landet auf einer Seite der Website, die in diesem Moment zeigt, ob die Mitgliedschaft gültig ist – ✅ „Gültige Mitgliedschaft“ mit Vorname, Anfangsbuchstabe des Nachnamens, Mitgliedsnummer, Art und Eintrittsjahr, oder ❌ „nicht mehr gültig“. Ist jemand ausgetreten („Gültig bis“ ist vorbei), zeigt der QR-Code das sofort – auch auf einem alten Screenshot oder Ausdruck. Der Code ist nicht fälschbar und nicht erratbar; mehr Daten (Adresse, Geburtsdatum, IBAN) zeigt die Prüfseite nie.',
    bereich: 'mitgliedschaften',
  },
  {
    frage: 'Warum sieht ein Mitglied keinen Ausweis?',
    antwort: 'Der Ausweis erscheint im Konto, das bei der Mitgliedschaft unter „Benutzerkonto“ eingetragen ist. Prüfe unter „Mitgliedschaften“, ob es einen Eintrag gibt und das Konto verknüpft ist (bei Kindern das der Eltern). Verknüpft wird automatisch bei der Freigabe einer Registrierung mit gleicher E-Mail.',
    bereich: 'mitgliedschaften',
  },
  {
    frage: 'Wer sieht die Passanträge und Ausweiskopien?',
    antwort: 'Die antragstellende Person (ihre eigenen), Admins, Konten mit der Rolle „Passwesen“ (alle Teams – auch ohne eigenes Team) und die Trainer des Teams, für das der Antrag gestellt wurde. Team-Redaktion, Kasse und Trainer anderer Teams sehen sie nicht. Die Rolle „Passwesen“ vergibst du unter „Benutzer“.',
    bereich: 'passantraege',
  },
  {
    frage: 'Jemand hat sich auf der Website registriert – was muss ich tun?',
    antwort: 'Links unter „Posteingang“ auf „Registrierungen“ (das Dashboard erinnert auch daran). Dort erscheinen nur Personen, die ihre E-Mail-Adresse schon bestätigt haben. 1. Teams & Kurse prüfen: Was die Person bei der Registrierung angekreuzt hat, ist schon angehakt (grün, „Wunsch“). Haken setzen oder entfernen; „Alle Teams & Kurse zeigen“ klappt den Rest auf. 2. Ist die Person Mitglied, auf „Freigeben“ klicken – sie bekommt automatisch eine E-Mail. Sonst „Ablehnen“, dann wird das Konto gelöscht. Nicht freigegebene Registrierungen verschwinden nach 60 Tagen, nie bestätigte nach 7 Tagen von selbst.',
    bereich: 'users',
  },
  {
    frage: 'Wie lege ich fest, wer Nachrichten aus dem Kontaktformular bekommt?',
    antwort: 'Vereinsdaten → „Kontaktformular: Worum geht es?“ aufklappen. Jede Zeile ist ein Anliegen, das Besucher auswählen (z. B. „Mitgliedschaft & Beiträge“) – bewusst ohne Namen. Rechts daneben trägt ein Admin die E-Mail-Adresse(n) ein, mit Komma getrennt. Ohne Adresse geht die Nachricht an die Empfänger von „Allgemeine Frage“. Neue Anliegen mit „Anliegen hinzufügen“, Reihenfolge per Ziehen. Jede Nachricht steht außerdem unter „Kontaktanfragen“. Die E-Mails kommen, sobald der E-Mail-Versand eingerichtet ist.',
    bereich: 'verein',
  },
  {
    frage: 'Warum erscheint eine Registrierung nicht unter „Registrierungen“?',
    antwort: 'Die Person hat den Link in der Bestätigungs-E-Mail noch nicht angeklickt. Oben auf der Seite steht, wie viele noch darauf warten. Tipp für die Person: im Spam-Ordner nachsehen oder auf der Anmeldeseite „Bestätigungs-E-Mail noch einmal senden“ nutzen. Auch „Passwort vergessen?“ zählt als Bestätigung.',
    bereich: 'users',
  },
  {
    frage: 'Wie schützt sich die Registrierung vor Bots?',
    antwort: 'Ohne „Ich bin kein Roboter“-Kästchen und ohne fremde Dienste (also auch ohne Daten an Google): 1. Der Browser löst im Hintergrund eine kleine Rechenaufgabe (meist unter 2 Sekunden, unter dem Knopf steht „Sicherheitsprüfung erledigt“). Für Menschen unsichtbar, für Massen-Bots teuer. 2. Wer schneller als 3 Sekunden absendet, wird abgewiesen. 3. Ein unsichtbares Fangfeld, das nur Bots ausfüllen. 4. Höchstens 5 Versuche pro Internetanschluss in kurzer Zeit. 5. Ohne bestätigte E-Mail erscheint niemand bei euch – und wird nach 7 Tagen gelöscht.',
    bereich: 'users',
  },
  {
    frage: 'Wie richte ich den E-Mail-Versand ein?',
    antwort: 'Nötig für Registrierung, „Passwort vergessen“ und Benachrichtigungen. In die .env eintragen (Daten vom E-Mail-Anbieter, z. B. SiteGround → Site Tools → E-Mail → Konten → „Mail-Konfiguration“): SMTP_HOST=… (Postausgangsserver), SMTP_PORT=465, SMTP_USER=website@eure-domain.de, SMTP_PASS=… (Passwort des Postfachs), SMTP_FROM=website@eure-domain.de. Danach die Website neu starten: sudo systemctl restart bsv. Ohne diese Einträge ist die Registrierung auf der Live-Website gesperrt.',
    bereich: 'users',
  },

  {
    frage: 'Wer sieht die Profilfotos der Mitglieder?',
    antwort: 'Nur das Mitglied selbst, Admin und Kasse sowie die Trainer der Kurse, in denen das Mitglied eingetragen ist (im Team unter „Mitglieder in diesem Team / Kurs“). Nie öffentlich. Das Mitglied kann sein Foto jederzeit selbst entfernen.',
    bereich: 'users',
  },
  {
    frage: 'Wie stelle ich ein, dass die News auf der Startseite von selbst weiterlaufen?',
    antwort: 'Unter „Texte & Bilder“ → Startseite den Haken „News-Leiste läuft von selbst weiter“ setzen oder entfernen. Mit Haken wechselt die Leiste alle 6 Sekunden und pausiert, sobald jemand mit der Maus darauf zeigt. Welche News dort erscheinen, bestimmt bei jeder News der Haken „Auf Startseite“.',
    bereich: 'texte',
  },
  {
    frage: 'Wie kommen die neuen Seiten (Trainingszeiten, Galerie, Sponsoren, Mitmachen) ins Menü?',
    antwort: 'Unter „Menü & Fußzeile“ zeigt der Kasten oben, welche Seiten noch nirgends verlinkt sind – ein Klick auf „+ In die Fußzeile“ oder „+ Ins Menü „Verein““ trägt sie ein.',
    bereich: 'menue',
  },
  {
    frage: 'Wo sehe ich genau, was eine Rolle darf?',
    antwort: 'Für eine bestimmte Person: Benutzer öffnen – oben steht „Was darf diese Person?“. Für eine ganze Rolle (Web-Admin): „Rollen & Rechte“ → Reiter „Rechte je Rolle“: Rolle anklicken, dann siehst du für jeden Bereich Sehen, Anlegen, Bearbeiten und Löschen. Die Tabelle wird aus den echten Regeln berechnet und stimmt deshalb immer.',
    bereich: 'users',
  },
  {
    frage: 'Ich habe aus Versehen etwas gelöscht. Ist es weg?',
    antwort:
      'Fast alles landet zuerst im Papierkorb des Bereichs (Liste → oben „Papierkorb“ → Eintrag öffnen → „Wiederherstellen“) und bleibt dort 30 Tage. Danach – oder wenn du es dort endgültig löschst – kann es nur noch ein Web-Admin zurückholen: Anträge, Anfragen und andere persönliche Daten 30 Tage lang, alles andere bis zu 1 Jahr. Sofort weg sind gelöschte Benutzerkonten, Passanträge, Pass-Unterlagen und Profilfotos. Bei News und Seiten gibt es außerdem „Versionen“ mit früheren Fassungen.',
    bereich: 'dashboard',
  },
  {
    frage: 'Kann ich die Verwaltung auf dem Handy nutzen?',
    antwort: 'Ja. Am besten als App-Symbol: Verwaltung im Handy-Browser öffnen und „Zum Startbildschirm hinzufügen“ wählen (iPhone: Teilen-Symbol → „Zum Home-Bildschirm“; Android: Menü ⋮ → „Zum Startbildschirm hinzufügen“). Ein Ausfall ist dann in drei Klicks gemeldet.',
  },
  {
    frage: 'Wie sichere ich alle Daten?',
    antwort: 'Links unter „Technik“ auf „Datensicherung“ (nur Web-Admins) → „Sicherung jetzt erstellen“ → „Herunterladen“ und zusätzlich auf einem USB-Stick oder in einer Cloud speichern. Am besten einmal pro Woche – das Dashboard erinnert nach 7 Tagen.',
  },
  {
    frage: 'Warum muss ich beim Hochladen angeben, ob Personen zu erkennen sind?',
    antwort: 'Fotos, auf denen Personen erkennbar sind, dürfen nur mit deren Einwilligung veröffentlicht werden – bei Kindern mit der Einwilligung der Eltern. Die Angabe schützt den Verein. Bewahre die schriftlichen Einwilligungen auf.',
    bereich: 'media',
  },
  {
    frage: 'Was ist der Kasten oben über den Listen?',
    antwort: 'Er erklärt, wozu der Bereich da ist, zeigt den Ablauf als Grafik und bietet – wo es passt – Vorlagen mit einem Klick (z. B. Spielbericht, Vereinsfest, Infoseite) oder eine Schnellmeldung für Trainingsausfälle. Brauchst du ihn nicht mehr: „Ausblenden“. Mit „Erklärung zeigen“ kommt er zurück.',
  },
  {
    frage: 'Was passiert mit einem Bild auf der Website, wenn ich es in einen anderen Ordner verschiebe?',
    antwort: 'Nichts – es bleibt überall, wo es eingebaut ist (News, Seiten, Teamseiten). Der Ordner bestimmt nur, wer es in der Verwaltung sehen und neu auswählen darf. Ausnahme: Ist „In der Bildergalerie des Teams zeigen“ angehakt, wandert es in die Galerie des neuen Teams.',
    bereich: 'media',
  },
  {
    frage: 'Warum sehe ich in der Mediathek nicht alle Bilder?',
    antwort: 'Trainer sehen nur die Ordner ihrer Teams und „Verein allgemein“. So landen keine Bilder versehentlich beim falschen Team. Fehlt dir ein Bild, frag die Redaktion, ob sie es deinem Team oder „Verein allgemein“ zuordnet.',
    bereich: 'media',
  },
  {
    frage: 'Was mache ich mit einem eigenen Formular überhaupt?',
    antwort: 'Damit sammelt ihr Angaben von Besuchern, z. B. Anmeldungen zum Sommerfest, eine Helferliste fürs Turnier oder eine Sammelbestellung. Ablauf: 1. Formular bauen (am besten mit Vorlage) 2. auf eine Seite setzen 3. Seite im Menü verlinken 4. Besucher füllen aus 5. Antworten unter „Formular-Eingänge“ lesen. Mitgliedsantrag, Probetraining und Kontakt gibt es schon fertig.',
    bereich: 'forms',
  },
  {
    frage: 'Ich habe ein Formular angelegt – wo sehe ich es?',
    antwort: 'Ein Formular erscheint erst, wenn du es auf einer Seite einbaust. Am einfachsten im Formular rechts auf „Neue Seite mit diesem Formular erstellen“ klicken. Von Hand: Seiten → Seite öffnen oder neu anlegen → „Inhalt (Bausteine)“ → „Baustein hinzufügen“ → „Formular“ → Formular auswählen → Veröffentlichen. Danach die Seite unter „Menü & Fußzeile“ ins Menü aufnehmen. Rechts im Formular siehst du, wo es schon eingebaut ist.',
    bereich: 'forms',
  },
  {
    frage: 'Wo ändere ich Instagram, Facebook und andere Links in der Fußzeile?',
    antwort: 'Unter „Menü & Fußzeile“ → Reiter „Fußzeile unten“ → „Kontakt-Spalte“. Dort kannst du beliebig viele Links hinzufügen, umsortieren oder entfernen. Die Adresse darüber kommt aus den Vereinsdaten.',
    bereich: 'menue',
  },
  {
    frage: 'Wie ist die Seitenleiste aufgebaut?',
    antwort: 'Posteingang: Mitgliedsanträge, Kontaktanfragen, Probetraining-Anfragen, Passanträge, Formular-Eingänge, Registrierungen. Inhalte: News, Termine, Fotoalben, Mediathek, Sponsoren, Ehrenamt & Mitmachen. Website-Aufbau: Seiten, Menü & Fußzeile, Texte & Bilder, Animationen, Spielecke-Rangliste, Formulare, Kategorien (nur Admins). Sport: Teams & Kurse, Trainingsausfälle, Saisonwechsel Fußball (Admin und Redaktion). Mitglieder: Benutzer, Rollen & Rechte, Mitgliedschaften, Profilfotos, Mitglieder-Dokumente. Einstellungen: Vereinsdaten, Datenschutz-Fristen, E-Mail-Vorlagen, Hilfe-Texte, Hilfe-Rückmeldungen. Technik (nur Web-Admins): Datensicherung, Sicherheit (Updates und automatisches Abmelden), Papierkorb, Besucherstatistik, Suchindex, Weiterleitungen. Die Ausweis- und Fotodateien zu Passanträgen öffnest du direkt im Passantrag. Ganz unten: Hilfe-Center, dein Konto und „Zur Website“. Jede Rolle sieht nur, was sie braucht.',
    bereich: 'dashboard',
  },
  {
    frage: 'Im Textfeld steht „Something went wrong“ oder „parseEditorState … not found“ – was tun?',
    antwort: 'Dann enthält der gespeicherte Text einen Baustein (z. B. eine Aufzählung oder Zwischenüberschrift), den dieser Editor nicht kennt. Das ist ein Fehler der Website, nicht deiner: nichts löschen und nicht weiter bearbeiten, sondern dem Web-Admin melden (Bereich, Eintrag, Screenshot). Der Text selbst ist nicht verloren. Ein automatischer Test prüft alle Vorlagen und gespeicherten Texte darauf, damit das nicht wieder vorkommt.',
    bereich: 'dashboard',
  },
  {
    frage: 'Was bedeutet die orange Zahl in der Seitenleiste?',
    antwort: 'So viele neue Einträge warten im Posteingang, z. B. 2 neue Kontaktanfragen. Die Zahl steht am Bereich und an der Überschrift „Posteingang“ (auch wenn die Gruppe zugeklappt ist). Sie verschwindet, sobald du den Status änderst, z. B. auf „In Bearbeitung“ oder „Erledigt“. Du siehst nur Zahlen für Einträge, die du auch öffnen darfst – Trainer z. B. nur für ihre Teams.',
    bereich: 'dashboard',
  },
  {
    frage: 'Kann ich einer Person ein einzelnes Recht geben, ohne ihr eine ganze Rolle zu geben?',
    antwort: 'Ja. Benutzer öffnen → unten den zugeklappten Abschnitt „Ausnahmen: Zusatzrechte nur für diese Person (Web-Admin)“ öffnen → Häkchen setzen → Speichern. Zur Wahl stehen fast alle Bereiche: Posteingang (Kontaktanfragen, Probetraining und Passanträge aller Teams, Registrierungen, Formular-Eingänge), Inhalte (News aller Teams, Termine, Ehrenamt, Bilder/Galerie/Dokumente, Sponsoren), Website-Aufbau (Seiten, Menü, Texte & Bilder, Formulare), Sport (alle Teams & Kurse, Ausfälle aller Teams, Saisonwechsel), Mitglieder (Mitgliedsanträge ohne Bankdaten, Mitgliedschaften nur lesen) Einstellungen (Vereinsdaten, Datenschutz-Fristen, Hilfe-Texte) und Technik (Besucherstatistik, Papierkorb nur wiederherstellen). Ein Bereichsrecht gibt genau die Rechte, die die zuständige Rolle dort hat – z. B. „News aller Teams“ = wie die Redaktion, aber nur für News. Wer ein Zusatzrecht hat, kommt in die Verwaltung, sieht dort nur die passenden Bereiche und braucht die Zwei-Faktor-Anmeldung. Vergeben kann das nur ein Web-Admin, Admins sehen die Häkchen nur. Bewusst nie einzeln vergebbar: Benutzerverwaltung, Admin-Rechte, Bankdaten (IBAN, Kontoinhaber, Export für die Kasse) und Datensicherung – dafür gibt es die Rollen Admin, Kasse und Web-Admin. Alle Personen mit Zusatzrechten auf einen Blick: Mitglieder → „Rollen & Rechte“ → Kachel „Personen mit Zusatzrechten“ anklicken (oder unter „Nach Person“ den Punkt „Mit Zusatzrechten“ wählen). Die Rechte stehen dort als orange „+ …“ unter den Rollen.',
    bereich: 'users',
  },
  {
    frage: 'Warum sieht jemand einen Bereich (nicht)?',
    antwort: 'Benutzer öffnen. Ganz oben steht „🔎 Was darf diese Person?“ – darf bearbeiten, darf nur ansehen, kein Zugriff, und für welche eigenen Teams. Die Liste rechnet mit Rollen und Zusatzrechten zusammen und ändert sich sofort, wenn du Rollen anklickst (auch vor dem Speichern).',
    bereich: 'users',
  },
  {
    frage: 'Welche Vorlagen gibt es?',
    antwort: 'Oben in der Liste unter „Mit einer Vorlage starten“ – ein Klick, danach alles anpassen. Seiten (als Entwurf): Infoseite, Veranstaltung, Abteilung vorstellen, Häufige Fragen, Ansprechpersonen, Vereinsgeschichte, Unterstützen & Spenden, Seite mit News-Liste, Leere Seite. News (als Entwurf): Spielbericht, Ankündigung, Rückblick mit Fotos, Neues Angebot, Glückwunsch & Ehrung, Wichtiger Hinweis, Helfer gesucht. Termine: Vereinsfest, Versammlung, Turnier, Arbeitseinsatz, Weihnachtsfeier, Kinderfest, Schnupperkurs. Ehrenamt & Mitmachen: Trainer/in, Helfer fürs Fest, Schiedsrichter/in, Kassenprüfer/in, Fotograf/in. Formulare: eigene Vorlagen im Bereich Formulare. Texte in eckigen Klammern [ … ] ersetzt du durch deine eigenen.',
    bereich: 'pages',
  },
  {
    frage: 'Wo ändere ich die Überschrift der News-Seite („Newsroom“), von Termine oder Kontakt?',
    antwort:
      'Website-Aufbau → „Texte & Bilder“ → Reiter „Weitere Seiten“. Dort gibt es je einen Abschnitt für News, Termine, Kontakt, Mitgliedsantrag, Probetraining und die Fußzeile – jeweils mit „Überschrift“ und „Text“ darunter. Ändern, oben rechts „Speichern“, fertig: Die Website zeigt es sofort.\n\nDie Überschriften von Startseite, Fußball, Breitensport und Verein stehen in den gleichnamigen Reitern davor. Die Einträge im Menü oben (z. B. „News“) sind etwas anderes – die änderst du unter Menü & Fußzeile.',
    bereich: 'texte',
  },
  {
    frage: 'Wo ändere ich die Mitgliedsbeiträge?',
    antwort: 'Einstellungen → Vereinsdaten → „Mitgliedsbeiträge“: je Mitgliedsart den Betrag „€ pro Quartal“ eintragen und speichern. Alles andere rechnet sich automatisch: die Beitrags-Kacheln auf der Vereinsseite (inkl. „entspricht … € im Monat“), die Überschrift „Ab … € im Monat“ (günstigster Beitrag für aktive Mitglieder, passiv zählt nicht), der Online-Antrag und der Platzhalter {abMonat} in „Texte & Bilder“. Bei jedem neuen Antrag wird der Betrag, der beim Absenden galt, unter „Beitrag laut Antrag“ festgehalten. Eine Aufnahmegebühr gibt es auf der Website nicht.',
    bereich: 'verein',
  },
  {
    frage: 'Was bedeutet das Feld „Reihenfolge“ (z. B. Wert 100)?',
    antwort:
      'Die Zahl bestimmt, an welcher Stelle ein Eintrag erscheint: kleinere Zahl = weiter vorne bzw. weiter oben. Es zählt nur der Vergleich mit den anderen Einträgen – 10, 20, 30 wirkt genauso wie 1, 2, 3. Neue Einträge bekommen automatisch 100 und landen damit hinten. Bei gleicher Zahl wird alphabetisch sortiert. Das Feld gibt es bei Teams & Kurse (Aufklappmenü Fußball/Breitensport, Übersichtsseiten, Mitgliedsantrag), Sponsoren (innerhalb derselben Art auf der Sponsorenseite und im Laufband) und Gesuchen (Seite „Mitmachen“).\n\n'
      + 'Beispiel 1 – Wenn die F1-Jugend 20 hat, die F2-Jugend 30 und eine neue F3-Jugend 100 – dann steht im Menü F1, F2, F3. Soll die F3 zwischen die beiden, gib ihr 25.\n\n'
      + 'Beispiel 2 – Wenn zwei Partner-Sponsoren beide 100 haben – dann stehen sie alphabetisch. Soll „Bäckerei Schmitz“ vor „Autohaus Müller“, gib der Bäckerei 50.\n\n'
      + 'Tipp: Für Teams geht es ohne Zahlen bequemer – Menü & Fußzeile → Reiter „Aufklappmenü Fußball“ bzw. „Breitensport“ → Einträge ziehen; die Zahlen werden dann automatisch gesetzt.',
    bereich: 'angebote',
  },
  {
    frage: 'Wie ändere ich die Reihenfolge im Menü und in den Aufklappmenüs Fußball und Breitensport?',
    antwort: 'Reihenfolge in der Menüleiste (Fußball, Breitensport, Verein, News …): Menü & Fußzeile → Reiter „Hauptmenü oben“ → Einträge am Griff links ziehen → Speichern. Inhalt der Aufklappmenüs: Reiter „Aufklappmenü Fußball“ bzw. „Aufklappmenü Breitensport“. Die Teams und Kurse kommen automatisch aus „Teams & Kurse“; am Griff ⠿ ziehen (am Handy: Pfeile ▲▼) sortiert sie innerhalb einer Spalte – gilt sofort, ohne Speichern. Die Spalte bestimmt beim Angebot der „Bereich“ und bei Fußball die „Gruppe (Fußball)“. Darunter änderst du den Text links im Aufklappmenü.',
    bereich: 'menue',
  },
  {
    frage: 'Warum wurde ich automatisch abgemeldet?',
    antwort: 'Zur Sicherheit meldet die Verwaltung dich nach 30 Minuten ohne Klick, Taste oder Scrollen ab – wichtig an gemeinsam genutzten Computern. 5 Minuten vorher erscheint „Bist du noch da?“ mit dem Knopf „Angemeldet bleiben“. Ungespeicherte Änderungen gehen beim Abmelden verloren, also zwischendurch speichern. Die Zeiten stellt der Web-Admin unter Technik → „Sicherheit“ → Reiter „Einstellungen“ ein. Arbeitest du in mehreren Tabs, zählt die Aktivität in allen zusammen.',
    bereich: 'dashboard',
  },
  {
    frage: 'Warum hat meine Seite die Adresse „…-2“ bekommen?',
    antwort: 'Jede Adresse gibt es nur einmal. Heißt eine neue Seite, News oder ein Team wie ein vorhandener Eintrag (z. B. „Kunstrasen“ → /kunstrasen), bekommt der neue automatisch /kunstrasen-2 – die Hinweise rechts zeigen die Adresse. Auch Einträge im Papierkorb zählen mit. Wunsch-Adresse? Den alten Eintrag umbenennen oder endgültig löschen und danach rechts bei „Slug“ die Adresse ändern.',
    bereich: 'pages',
  },
  {
    frage: 'Wo sehe ich, wie viele Menschen die Website besuchen?',
    antwort: 'Technik → „Besucherstatistik“ (nur Web-Admins). Dort: Besuche und Seitenaufrufe mit Vergleich zum Zeitraum davor, Verlauf pro Tag/Woche/Monat, beliebteste Seiten, Herkunft (Google, Instagram, direkt …), Handy oder Computer, meistgesehene Teams & Kurse, wie weit Interessierte im Mitgliedsantrag kommen und was gesucht wurde – auch ohne Treffer. Gezählt wird ohne Cookies und ohne Google; angemeldete Mitarbeitende zählen nicht mit.',
    bereich: 'dashboard',
  },
  {
    frage: 'Was muss wegen der Besucherstatistik in die Datenschutzerklärung?',
    antwort: 'Ein kurzer Absatz, z. B.: „Reichweitenmessung: Wir zählen Seitenaufrufe auf unserem eigenen Server, um die Website zu verbessern (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO). Dabei werden keine Cookies gesetzt und keine IP-Adressen gespeichert. Aus IP-Adresse und Browserkennung wird ein täglich wechselndes, nicht rückverfolgbares Kürzel gebildet, damit wir Besuche eines Tages zählen können. Gespeichert werden aufgerufene Seite, Herkunftsseite (nur der Name, z. B. „Google“), Gerätetyp und Suchbegriffe der Website-Suche. Die Daten werden nicht weitergegeben und nach 14 Monaten automatisch gelöscht. Browser mit aktivierter „Do Not Track“- bzw. „Global Privacy Control“-Einstellung werden nicht erfasst.“ Die Datenschutzerklärung bearbeitest du unter Website-Aufbau → Seiten → „Datenschutz“. Im Zweifel bitte rechtlich prüfen lassen.',
    bereich: 'dashboard',
  },
  {
    frage: 'Wie bekommt meine Team-News einen Platz auf der Startseite?',
    antwort: 'Beim Schreiben rechts „Für die Startseite vorschlagen“ anhaken und veröffentlichen. Die Redaktion sieht den Vorschlag oben auf ihrer Übersicht und holt die News mit einem Klick auf die Startseite. Bis dahin erscheint sie auf der Seite deines Teams.',
    bereich: 'dashboard',
  },
  {
    frage: 'Was bedeutet „Wer kümmert sich?“ und wer sieht die Notizen?',
    antwort: 'Bei Mitgliedsanträgen, Kontakt- und Probetraining-Anfragen trägst du dich oben mit „🙋 Ich kümmere mich“ ein – in der Liste steht dann dein Name in der Spalte „Zuständig“. Notizen sind nur in der Verwaltung sichtbar, für alle, die diesen Eintrag öffnen dürfen. Sie werden mit Name und Uhrzeit gespeichert und lassen sich nicht ändern oder löschen – so bleibt nachvollziehbar, wer was gemacht hat. Wird der Eintrag gelöscht, verschwinden auch die Notizen. Wichtig: Fragt eine Person nach ihren Daten (DSGVO-Auskunft), sind die Notizen dabei – also sachlich schreiben.',
    bereich: 'dashboard',
  },
  {
    frage: 'Wie exportiere ich Mitgliedsanträge für das DFBnet?',
    antwort: 'Posteingang → Mitgliedsanträge → oben „📥 … neue exportieren“. Du bekommst eine Excel-Datei (CSV) mit allen aufgenommenen Anträgen, die noch nicht exportiert wurden – eine Zeile pro Person, Familienmitglieder einzeln, ohne Bankdaten. Danach sind sie als „exportiert“ markiert. Brauchst du alle noch einmal: „alle aufgenommenen“. Die Datei nach dem Übertragen löschen. Exportieren dürfen Kasse und Admins.',
    bereich: 'dashboard',
  },
  {
    frage: 'Warum gibt es bei Auswahlfeldern kein „+“ und manchmal kein „Duplizieren“?',
    antwort: 'In Auswahlfeldern (z. B. Teams, Verantwortliche, Benutzerkonto) wählst du nur Vorhandenes aus. Früher legte das „+“ daneben unbemerkt einen NEUEN Eintrag an – etwa ein neues Team oder Konto. Neues legst du deshalb im jeweiligen Bereich links an und wählst es danach aus. Bilder kannst du weiterhin direkt im Feld hochladen. „Duplizieren“ fehlt bei Einträgen mit persönlichen Daten (Benutzer, Anträge, Mitgliedschaften, Anfragen, Passanträge, Pass-Unterlagen, Profilfotos, Formular-Eingänge, Hilfe-Rückmeldungen, Besucherstatistik), damit z. B. keine IBAN doppelt gespeichert wird.',
    bereich: 'dashboard',
  },
  {
    frage: 'Wo sehe ich, wer welche Rolle und welches Team hat?',
    antwort: 'Unter Mitglieder → „Rollen & Rechte“ (Admins und Web-Admins): Reiter „Nach Person“ und „Nach Team“. Web-Admins sehen zusätzlich „Nach Rolle“, „Rechte je Rolle“ und „Testkonten“.',
    bereich: 'users',
  },
  {
    frage: 'Warum sehe ich meine News nicht auf der Startseite?',
    antwort:
      'Team-News erscheinen zuerst nur auf der Seite des Teams. Hak beim Schreiben rechts „Für die Startseite vorschlagen“ an – die Redaktion holt sie dann mit einem Klick auf die Startseite. Prüf außerdem, ob die News veröffentlicht ist und nicht nur als Entwurf gespeichert.',
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
    frage: 'Beim Einrichten der Zwei-Faktor-App steht „Die Einrichtung wurde gerade schon gestartet“.',
    antwort:
      'In einem anderen Fenster oder Tab läuft die Einrichtung schon – dort mit dem Code aus der App abschließen. Oder 15 Minuten warten und neu beginnen. Der Schutz verhindert, dass jemand mit deinem Passwort deine Einrichtung überschreibt. Nach dem Einrichten bekommst du zur Sicherheit eine E-Mail.',
    bereich: 'users',
  },
  {
    frage: 'Ich habe mein Passwort vergessen.',
    antwort: 'Auf der Anmeldeseite auf „Passwort vergessen?“ klicken. Kommt keine E-Mail an, hilft ein Admin weiter.',
  },
  {
    frage: 'Wie ändere ich mein Passwort?',
    antwort:
      'Oben rechts auf dein Symbol → „Mein Konto“ → „Passwort ändern“. Neues Passwort zweimal eingeben (mindestens 10 Zeichen mit Groß- und Kleinbuchstaben, Zahl und Sonderzeichen; keine Allerweltswörter wie „Sommer2026!“, keine Reihen wie „12345“, nicht der eigene Name) und darunter zur Bestätigung dein aktuelles Passwort. Dann „Speichern“. Das aktuelle Passwort schützt dein Konto, falls jemand an deinem offenen Rechner sitzt.',
    bereich: 'users',
  },
  {
    frage: 'Beim Anmelden steht „Zu viele Anfragen“.',
    antwort:
      'Von deinem Anschluss kamen in kurzer Zeit sehr viele Anmeldeversuche (Schutz gegen Passwort-Raten). 10 Minuten warten, dann geht es wieder.',
  },
  {
    frage: 'Beim Anmelden steht „E-Mail oder Passwort stimmen nicht“, obwohl das Passwort richtig ist.',
    antwort:
      'Nach 5 falschen Passwörtern ist die Anmeldung für dieses Konto 10 Minuten gesperrt – aber nur von dem Internetanschluss aus, von dem falsch eingegeben wurde. Von einem anderen Anschluss (z. B. Handy im Mobilfunk statt WLAN) geht es sofort. So kann niemand Fremdes dich mit ein paar falschen Passwörtern aussperren. Erst nach 100 Fehlversuchen von überall ist das ganze Konto 10 Minuten gesperrt. Die Meldung ist absichtlich dieselbe wie bei einem falschen Passwort – sonst könnte jemand ausprobieren, welche E-Mail-Adressen ein Konto haben. Lösung: 10 Minuten warten, anderen Anschluss nehmen oder „Passwort vergessen?“ nutzen. Ein Admin kann ein ganz gesperrtes Konto vorher entsperren: Benutzer → Person öffnen → „Entsperren“.',
    bereich: 'users',
  },
  {
    frage: 'Warum fragt die Seite „E-Mail bestätigen“ nach einem Passwort?',
    antwort:
      'Schutz vor vorab angelegten Konten: Sonst könnte sich jemand mit der E-Mail-Adresse einer anderen Person und einem eigenen Passwort registrieren – klickt die echte Person dann den Link, hätte der Fremde Zugang. Deshalb gibt man beim Bestätigen das Passwort von der Registrierung ein. Wer es nicht mehr weiß, gibt einfach ein neues ein – dann gilt das neue. So kennt am Ende nur, wer das Postfach hat, das Passwort.',
    bereich: 'users',
  },
  {
    frage: 'Ich kann bei einem anderen Admin E-Mail oder Passwort nicht ändern.',
    antwort:
      'Absichtlich: Zugangsdaten anderer Admins (E-Mail, Passwort, Zwei-Faktor zurücksetzen, Löschen) ändert nur ein Web-Admin. So kann niemand das Konto eines anderen Admins übernehmen. Name, Teams und alles andere geht weiterhin.',
    bereich: 'users',
  },
  {
    frage: 'Jemand will wissen, welche Daten wir über ihn gespeichert haben.',
    antwort:
      'Einstellungen → Datenschutz-Fristen → „Auskunft für eine Person“: E-Mail-Adresse eingeben, Datei herunterladen und der Person geben (nicht per unverschlüsselter Mail an Dritte). Enthalten ist alles von der Website – auch aus dem Papierkorb. Will die Person, dass alles gelöscht wird: die gefundenen Einträge löschen und im Web-Admin-Papierkorb endgültig entfernen lassen.',
  },
  {
    frage: 'Wie lange bleiben Anträge und Anfragen gespeichert?',
    antwort:
      'Das stellst du unter Einstellungen → Datenschutz-Fristen ein. Mit „Automatisch aufräumen“ (Standard) wandern fällige Einträge täglich in den Papierkorb, nach 30 Tagen in den Web-Admin-Papierkorb und werden dort nach der Frist für persönliche Daten (Standard 30 Tage) endgültig gelöscht. Die IBAN eines Mitgliedsantrags wird schon beim Wechsel in den Web-Admin-Papierkorb entfernt.',
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
    antwort: 'Du kannst nur Teams bearbeiten, bei denen du unter „Verantwortliche“ eingetragen bist. Ein Admin trägt dich beim Benutzer unter „Team-Berechtigungen“ ein, oder die Redaktion beim Team unter „Verantwortliche“.',
    bereich: 'angebote',
  },
  {
    frage: 'Was ist der Unterschied zwischen „Entwurf speichern“ und „Veröffentlichen“?',
    antwort: 'Ein Entwurf ist nur in der Verwaltung sichtbar – zum Vorbereiten. „Veröffentlichen“ stellt den Inhalt auf die Website.',
  },
  {
    frage: 'Wie bekomme ich eine neue Seite ins Menü?',
    antwort: 'Seite veröffentlichen, dann unter „Menü & Fußzeile“ einen Eintrag hinzufügen und die Seite auswählen.',
    bereich: 'menue',
  },
  {
    frage: 'Wie ändere ich die Reihenfolge im Menü oder entferne einen Eintrag?',
    antwort: 'Unter „Menü & Fußzeile“: Eintrag am Griff links verschieben (oben = links auf der Website) oder über die drei Punkte rechts entfernen. Danach speichern.',
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
    antwort: 'Ja. Die Seitenleiste öffnest du über das Menü-Symbol oben links. Für längere Texte ist ein Computer angenehmer. Tipp: Die Verwaltung lässt sich als eigenes Symbol „BSV Verwaltung“ auf den Startbildschirm legen – genauso wie die Website-App (siehe „Gibt es die Website als App?“), nur während du in der Verwaltung bist.',
  },
  {
    frage: 'Was ist „Für Fortgeschrittene: Google-Vorschau und passende News“ bei einer News?',
    antwort:
      'Ein eingeklappter Bereich ganz unten beim Schreiben einer News. Nur Redaktion und Admins sehen ihn. Alles darin ist freiwillig – wer nichts einträgt, bekommt sinnvolle Werte automatisch.\n\n'
      + '• Passende News: bis zu 3 andere News, die unter dem Artikel als „Passend dazu“ erscheinen. Leer = unter dem Artikel stehen die 3 neuesten News („Weitere News“). Zur Auswahl stehen nur veröffentlichte News.\n'
      + '• Google-Vorschau: Titel, Beschreibung und Bild, die Google in den Suchergebnissen und WhatsApp, Facebook & Co. beim Teilen eines Links zeigen. Die Vorschau im Bereich zeigt, wie das aussieht. Leer = Titel und Titelbild der News, die Beschreibung entsteht beim Speichern aus dem Anfang des Textes. Die Beschreibung steht außerdem groß als Einleitung unter der Überschrift des Artikels.\n\n'
      + 'Beispiel 1 – Wenn du über das Pokalspiel und am nächsten Tag über die Feier danach schreibst – dann wähle bei der Feier unter „Passende News“ das Pokalspiel aus. Leser finden so den Spielbericht direkt darunter.\n\n'
      + 'Beispiel 2 – Wenn beim Teilen in WhatsApp nur ein abgeschnittener Satz wie „Am Samstag trafen sich …“ erscheint – dann schreib unter Google-Vorschau eine eigene Beschreibung, z. B. „F1-Jugend gewinnt das Hallenturnier in Xanten“. Die erscheint dann auch als Einleitung im Artikel.',
    bereich: 'posts',
  },
  {
    frage: 'Was löst eine Push-Nachricht auf dem Handy aus?',
    antwort:
      'Stand jetzt: noch nichts. Push-Nachrichten kommen mit dem nächsten Ausbau der Web-App nach der Generalprobe, weil sie eine sichere Verbindung (https) brauchen. Bis dahin wird nichts verschickt – auch nicht, wenn bei einem Trainingsausfall „Teilnehmende per E-Mail/Push benachrichtigen“ angehakt ist.\n\n'
      + 'Geplant ist eine Push-Nachricht bei:\n'
      + '• Trainingsausfall – wenn du unter „Trainingsausfälle“ einen Ausfall speicherst und „Teilnehmende per E-Mail/Push benachrichtigen“ angehakt ist (Standard). Inhalt: Team, Datum, Grund und dein Hinweis, z. B. „F1-Jugend: Training fällt heute aus (Halle belegt)“.\n'
      + '• Team-News – wenn eine News mit einem Team veröffentlicht wird. Inhalt: Titel der News; Antippen öffnet den Artikel.\n'
      + '• Eigene Nachricht – Admin und Redaktion schreiben unter „Push-Nachricht senden“ selbst Titel, kurzen Text und optional einen Link, z. B. „Sommerfest heute wegen Gewitter abgesagt“. Empfänger: alle oder nur bestimmte Teams/Bereiche. Vor dem Senden gibt es eine Vorschau wie auf dem Handy und die Rückfrage „An … Geräte senden?“; alle gesendeten Nachrichten stehen im Verlauf (wer, wann, an wen). Pro Tag sind nur wenige eigene Nachrichten an alle möglich (Standard 3), damit niemand die Benachrichtigungen genervt abschaltet. Die Zahl stellen Web-Admins direkt bei „Push-Nachricht senden“ im Reiter „Einstellungen“ ein.\n\n'
      + 'Eine Nachricht bekommt nur, wer die App installiert, Benachrichtigungen erlaubt und genau dieses Team ausgewählt hat. Alle anderen merken nichts davon.\n\n'
      + 'Keine Push-Nachricht gibt es bei: Änderungen an Terminen, Trainingszeiten oder Seiten, Entwürfen, gespeicherten Änderungen an einer schon veröffentlichten News, Mitgliedsanträgen, Kontaktanfragen und allem in der Verwaltung. Für die Verwaltung bleibt es bei E-Mails und dem Posteingang.\n\n'
      + 'Außerdem geplant:\n'
      + '• Ohne Konto und ohne Namen: Gespeichert werden nur die technische Push-Adresse des Handys und die gewählten Teams.\n'
      + '• Abbestellen geht jederzeit – in der App oder in den Handy-Einstellungen.\n'
      + '• iPhone: erst ab iOS 16.4 und nur, wenn die Web-App auf dem Home-Bildschirm installiert ist (Vorgabe von Apple). Android: auch im Browser möglich.\n'
      + '• Ein Ausfall, der nachträglich gelöscht wird, holt die schon verschickte Nachricht nicht zurück. Bei einem Fehler deshalb einen korrigierten Ausfall speichern und den Hinweis entsprechend formulieren.\n\n'
      + 'Beispiel 1 – Wenn die Halle am Dienstag belegt ist und du den Ausfall für die F1-Jugend mit Haken speicherst – dann bekommen alle, die in der App „F1-Jugend“ gewählt haben, sofort eine Nachricht. Der Hinweis steht außerdem wie bisher auf der Teamseite.\n\n'
      + 'Beispiel 2 – Wenn kurzfristig der Platz gesperrt ist, aber kein einzelnes Training betroffen ist – dann unter „Push-Nachricht senden“ eine eigene Nachricht an „Fußball“ schreiben, statt für jedes Team einen Ausfall einzutragen.\n\n'
      + 'Beispiel 3 – Wenn du einen Ausfall nur zur Übersicht einträgst (z. B. Ferien, alle wissen Bescheid) – dann nimm den Haken „benachrichtigen“ raus. Der Ausfall steht auf der Website, aber niemand bekommt eine Nachricht.',
    bereich: 'ausfaelle',
  },
  {
    frage: 'Wie zeige ich einen Countdown für eine Veranstaltung auf der Startseite?',
    antwort:
      'Direkt im Termin: Inhalte → Termine → Termin öffnen (oder neu anlegen) → rechts den Haken „Countdown auf der Startseite“ setzen → Speichern. Auf der Startseite erscheint direkt unter dem Kopfbereich die Kachel „Noch 12 Tage · 3 Stunden · 59 Minuten“ mit Name, Datum und einem Button.\n\n'
      + 'Nach dem Haken erscheinen zwei weitere Felder:\n'
      + '• „Countdown-Button führt zu“: eine eigene, veröffentlichte Seite (z. B. „Sommerfest“ mit Programm und Anmeldung). Leer = der Button führt zum Termin im Kalender.\n'
      + '• „Countdown-Text“: ein kurzer Satz unter dem Datum, z. B. „Essen und Getränke inklusive“. Leer = Ort des Termins.\n\n'
      + '• Auf der Seite „Termine“ hat jede Termin-Karte ohnehin einen kleinen Countdown („⏳ Noch 47 Tage · 5 Std. · 12 Min.“) – dafür ist kein Haken nötig. Der Haken bringt die große Kachel auf die Startseite.\n'
      + '• Name, Datum und Uhrzeit kommen aus dem Termin – ändert sich der Termin, ändert sich der Countdown mit.\n'
      + '• Haben mehrere Termine den Haken, zeigt die Startseite den nächsten. Ist er vorbei, kommt automatisch der übernächste dran. Bei wiederkehrenden Terminen zählt immer der nächste.\n'
      + '• Am Tag selbst steht „Heute ist es so weit!“, danach verschwindet die Kachel von selbst.\n'
      + '• Nur bei öffentlichen Terminen: zusammen mit „Nur für Mitglieder sichtbar“ lässt sich der Haken nicht speichern.\n'
      + '• Den Haken setzen dürfen Admin, Redaktion und wer das Recht für „Seiten“ hat – wie früher unter „Texte & Bilder“.\n'
      + '• Die Überzeile („Bald im BSV“) und den Button-Text für alle Countdowns änderst du unter Website-Aufbau → Texte & Bilder → Startseite → „Veranstaltungs-Countdown“.\n\n'
      + 'Beispiel 1 – Wenn du eine Seite „Sommerfest“ mit Programm und Anmeldung gebaut hast – dann lege unter Termine den Termin „Sommerfest“ am 4. Juli an, setze rechts den Haken „Countdown auf der Startseite“ und wähle bei „Countdown-Button führt zu“ die Seite „Sommerfest“. Die Startseite zählt herunter, der Button öffnet deine Seite.\n\n'
      + 'Beispiel 2 – Wenn im Dezember schon die Weihnachtsfeier und im Januar der Neujahrsempfang den Haken haben – dann zählt die Startseite erst bis zur Weihnachtsfeier und ab dem Folgetag bis zum Neujahrsempfang. Umstellen musst du nichts.',
    bereich: 'termine',
  },
  {
    frage: 'Wie sagen Mitglieder zu einem Termin zu oder ab – und wo sehe ich die Liste?',
    antwort:
      'Im Termin den Haken „Zu-/Absage im Mitgliederbereich“ setzen, optional Anmeldeschluss und „Begleitperson erlaubt“. Mitglieder sehen den Termin nach dem Login unter „Mein BSV“ ganz oben, wählen „Ich komme“ oder „Ich komme nicht“, bei erlaubter Begleitung 1 oder 2 Personen, und können eine Bemerkung schreiben. Bis zum Anmeldeschluss lässt sich die Antwort ändern.\n\n'
      + 'Die Liste steht unten im Termin: oben die Summe („✓ 14 Zusagen · 23 Personen · ✗ 3 Absagen“), darunter alle Antworten. „Drucken“ öffnet eine Druckansicht, „Als Tabelle herunterladen“ eine Datei für Excel.\n\n'
      + '• Antworten können nur angemeldete, freigeschaltete Mitglieder – jede Person einmal pro Termin. Wer nicht Mitglied ist, kommt gar nicht erst dorthin.\n'
      + '• Die Liste sehen Admin, Redaktion und wer das Zusatzrecht „Termine“ hat. Mitglieder sehen nur ihre eigene Antwort.\n'
      + '• Nur bei Terminen, die sich nicht wiederholen.\n'
      + '• Datenschutz: Die Antworten werden nach dem Termin automatisch gelöscht (Standard 30 Tage, Einstellungen → Datenschutz-Fristen).\n'
      + '• E-Mails an die Organisatoren gibt es nicht – die aktuelle Liste steht immer im Termin.\n\n'
      + 'Beispiel – Wenn die Weihnachtsfeier nur für Mitglieder ist und Partner mitkommen dürfen – dann Haken „Zu-/Absage im Mitgliederbereich“, Anmeldeschluss 01.12. und „Begleitperson erlaubt“ setzen. Rocco bekommt ein Konto mit Zusatzrecht „Termine“ und sieht die Liste, oder du druckst sie am 02.12. aus.',
    bereich: 'termine',
  },
  {
    frage: 'Ich habe eine Seite veröffentlicht – wo sehe ich sie?',
    antwort:
      'Unter ihrer eigenen Adresse: Website-Adresse + „/“ + Adresse der Seite, z. B. /sommerfest. In der Seite steht rechts der Link „/sommerfest ↗“ – ein Klick öffnet sie in einem neuen Tab. Die Adresse entsteht beim ersten Speichern aus dem Titel (Feld „Slug“) und ändert sich danach nicht mehr von selbst, auch wenn du den Titel änderst.\n\n'
      + '• Ins Menü kommt eine neue Seite nicht von selbst. Dafür: „Menü & Fußzeile“ → Eintrag hinzufügen → Seite wählen → Speichern.\n'
      + '• Ohne Menüeintrag findet man die Seite über einen Link: im Countdown eines Termins („Countdown-Button führt zu“), in einer News, auf einem Button einer anderen Seite oder als Link in WhatsApp.\n'
      + '• Steht rechts nur „Adresse nach dem Veröffentlichen: …“, ist die Seite noch ein Entwurf – oben rechts „Veröffentlichen“ klicken.\n\n'
      + 'Beispiel – Wenn du die Seite „Sommerfest“ veröffentlicht hast, sie aber nirgends siehst – dann klick rechts auf „/sommerfest ↗“. Soll jeder sie finden, trag sie ins Menü ein oder verlinke sie beim Countdown auf der Startseite.',
    bereich: 'pages',
  },
  {
    frage: 'Schließt ein Anmeldeformular automatisch zum Anmeldeschluss?',
    antwort:
      'Nein. Ein Formular nimmt Antworten an, solange es auf einer veröffentlichten Seite steht. Den Anmeldeschluss schreibst du deshalb gut sichtbar in den Text über dem Formular und nimmst das Formular am Stichtag selbst von der Seite.\n\n'
      + 'So geht es am Stichtag: Seite öffnen → Reiter „Inhalt (Bausteine)“ → beim Baustein „Formular“ über die drei Punkte „Entfernen“ → einen Satz wie „Die Anmeldung ist geschlossen.“ ergänzen → „Veröffentlichen“. Das Formular selbst und alle Eingänge bleiben erhalten.\n\n'
      + '• Ein Formular auf einer öffentlichen Seite kann jeder ausfüllen, auch Nicht-Mitglieder. Ist eine Feier nur für Mitglieder, besser im Termin den Haken „Zu-/Absage im Mitgliederbereich“ nutzen – dort gibt es einen echten Anmeldeschluss.\n'
      + '• Die Antworten stehen unter Posteingang → Formular-Eingänge. E-Mail-Benachrichtigungen an die Organisatoren kommen erst mit dem E-Mail-Versand.\n\n'
      + 'Beispiel – Wenn die Zu- und Absagen bis 01.12. eingehen sollen – dann schreib „Verbindliche Zu- oder Absage bis spätestens 01.12.“ über das Formular und entferne am 02.12. den Baustein „Formular“.',
    bereich: 'forms',
  },
  {
    frage: 'Was ist die Spielecke – und was wird dabei gespeichert?',
    antwort:
      'Unter /spielecke gibt es vier kleine Spiele für die BSV Kids – oben wählt man per Kachel, darunter läuft nur das gewählte Spiel: „Elfmeterschießen“ (5 Schüsse gegen einen Torwart, Ecke antippen oder Pfeiltasten), „Ball hochhalten“ (den herunterfallenden Ball antippen, mit jedem Kontakt wird es schneller – schnelles Dauerklicken zählt nicht) und „Memory“ (6 × 6 Karten, 18 Paare mit BSV-Wappen und Sport-Motiven – ganz ohne Zeitdruck, auch mit der Tastatur) und „Hütchenspiel“ für die Kleinen (der Ball liegt unter einem von drei Hütchen, die Hütchen werden gemischt, dann wird geraten – jede richtige Runde mischt länger und schneller, der Ball startet dabei immer dort, wo man ihn zuletzt gesehen hat; in die Rangliste kommt die Zahl „richtig in Folge“). Ein Spiel lässt sich direkt verlinken, z. B. /spielecke#huetchen (auch #elfmeter, #hochhalten, #memory). Ein Hinweis mit Link steht auf der Breitensport-Seite.\n\n'
      + '• Tagesrekord ohne Namen: Oben steht „Heute in der Spielecke: ⚽ 214 Elfmeter · 152 Tore · 🤹 Tagesrekord: 27× hochgehalten · 🧠 Memory in 24 Zügen“. Gespeichert werden dafür nur diese Tageszahlen – keine Namen, keine IP-Adressen, keine Kennungen. Wer den Rekord bricht, sieht „🎉 Neuer Tagesrekord!“. Die Zahlen von mehr als 30 Tagen werden automatisch gelöscht.\n'
      + '• Der „Bester Wert“ im Spiel gilt nur, solange die Seite offen ist. Unrealistische Werte (mehr als 250× hochgehalten, Memory in weniger als 18 Zügen) nimmt die Website nicht an.\n'
      + '• Elfmeterschießen hat zwei Spielarten: „5 Schüsse“ und „Bis zum Fehlschuss“ – bei Letzterem zählt die Torserie für die Rangliste.\n'
      + '• Rangliste (7, 14, 30 Tage und Allzeit, je Top 10; Reiter Ball hochhalten, Memory, Elfmeter-Serie und Hütchenspiel): Nach einer Runde können sich Kinder mit einem selbst ausgedachten Spitznamen eintragen. Gespeichert werden nur Spitzname, Spiel, Ergebnis und Zeitpunkt. Siehe „Wie prüfe und lösche ich Einträge in der Spielecke-Rangliste?“.\n'
      + '• Ein- und ausschalten: Website-Aufbau → Animationen → Spielecke.\n'
      + '• In die Fußzeile kommt die Seite über „Menü & Fußzeile“ → Spalte „Entdecken“ → Eintrag hinzufügen → Adresse /spielecke.\n\n'
      + 'Beispiel – Wenn ihr die Spielecke beim Sommerfest auf einem Tablet zeigen wollt – dann /spielecke öffnen; die Kinder spielen reihum mit „Nochmal“.',
    bereich: 'animationen',
  },
  {
    frage: 'Auf meinem Handy erscheint die Website dunkel – ist das ein Fehler?',
    antwort:
      'Die Website ist bewusst hell und sagt das jedem Browser. Manche Browser oder Erweiterungen färben Seiten trotzdem dunkel, z. B. Edge mit „Dunkler Modus für Websites“ oder die Erweiterung „Dark Reader“. Für Dark Reader und Browser mit derselben Technik ist die Website gesperrt; andere Umfärbungen kann eine Website nicht verhindern.\n\n'
      + '• Bleibt sie dunkel: in den Einstellungen des Browsers die Umfärbung für Websites ausschalten oder für diese Seite eine Ausnahme setzen.\n'
      + '• Ein roter Kasten „1 Issue“ unten links erscheint nur, wenn die Website auf deinem PC im Entwicklungsmodus läuft (BSV-Website-Update.bat). Besucher der echten Website sehen ihn nie.\n\n'
      + 'Beispiel – Wenn ein Mitglied meldet, dass die Seite „schwarz“ aussieht – dann fragen, welcher Browser es ist, und die Einstellung „Websites dunkel darstellen“ ausschalten lassen.',
    bereich: 'dashboard',
  },
  {
    frage: 'Ich habe Text eingefügt – warum sind die Überschriften nicht fett?',
    antwort:
      'Text aus dem Editor (Notepad), einer .txt-Datei oder einem Chat bringt keine Formatierung mit – alles wird normaler Text.\n\n'
      + '• Einzeln nachformatieren: in die Zeile klicken → oben in der Leiste „Normaler Text“ aufklappen → „Überschrift 2“ wählen.\n'
      + '• Schneller bei langen Texten: aus einer formatierten Quelle kopieren (Word, eine Webseite) – Überschriften, Fett und Listen bleiben dann erhalten.\n'
      + '• Ganz ersetzen: im Baustein in den Text klicken, Strg+A (alles markieren), dann Strg+V.\n\n'
      + 'Beispiel – Wenn du eine neue Datenschutzerklärung einfügen willst – dann die Fassung als Webseite öffnen, „Text kopieren“ klicken, im Baustein Strg+A und Strg+V, anschließend „Veröffentlichen“.',
    bereich: 'pages',
  },
  {
    frage: 'Wie prüfe und lösche ich Einträge in der Spielecke-Rangliste?',
    antwort:
      'Links unter Website-Aufbau → „Spielecke-Rangliste“. Dort stehen alle Einträge mit Spitzname, Spiel, Ergebnis und Datum – die neuesten oben.\n\n'
      + '• Löschen: Haken vor den Eintrag setzen → oben „Löschen“. Der Eintrag ist sofort aus der Rangliste verschwunden (kein Papierkorb).\n'
      + '• Spitzname, Spiel und Ergebnis lassen sich nicht ändern – nur löschen. So kann niemand Ergebnisse „schönen“.\n'
      + '• Erst prüfen, dann zeigen: unter Website-Aufbau → Animationen den Haken „Spitznamen erst nach Freigabe zeigen“ setzen. Neue Einträge erscheinen dann erst, wenn du sie öffnest und „In der Rangliste sichtbar“ anhakst. Die Kinder sehen nach dem Eintragen „Dein Eintrag erscheint, sobald ihn jemand vom Verein freigegeben hat“.\n'
      + '• Automatischer Schutz: Schimpfwörter (auch in Schreibweisen wie „4rsch“), Internetadressen, lange Zahlen (Geburtsjahr, Telefonnummer) und unrealistische Ergebnisse lehnt die Website gleich ab. Ein Filter fängt aber nie alles – ab und zu reinschauen lohnt sich.\n'
      + '• Aufräumen: Einträge älter als 30 Tage löscht die Website jede Nacht, außer den 10 besten aller Zeiten je Spiel.\n'
      + '• Ganz ohne Rangliste: unter Animationen „Rangliste mit Spitznamen“ ausschalten.\n'
      + '• Sehen und löschen dürfen Admin, Redaktion und wer das Recht „Seiten“ hat; „Nur ansehen“ sieht die Liste nur mit Haken „Benutzerkonten“.\n\n'
      + 'Beispiel – Wenn ein Kind seinen echten Namen eingetragen hat oder Eltern um Löschung bitten – dann den Eintrag unter „Spielecke-Rangliste“ suchen (Spitzname und Datum), Haken setzen und „Löschen“.',
    bereich: 'spielergebnisse',
  },
  {
    frage: 'Welche Animationen gibt es auf der Website – und wie schalte ich sie ab?',
    antwort:
      'Links unter Website-Aufbau → „Animationen“. Dort lässt sich jeder Effekt einzeln abschalten – oder mit „Animationen auf der Website“ alle auf einmal (dann bewegt sich nichts mehr, auch kein Einblenden, Laufband oder Spielfeld; die Inhalte bleiben gleich). Speichern, fertig.\n\n'
      + 'Die Effekte im Einzelnen:\n'
      + '• Altersregler: Ein kleiner Strich-Fußball rollt beim Schieben mit, die Zahl hüpft kurz.\n'
      + '• Countdown: Die Ziffern klappen beim Minutenwechsel um wie eine Anzeigetafel; am Tag selbst fällt kurz Konfetti in Vereinsfarben.\n'
      + '• Kachel „Fitness“ auf der Startseite: Eine Pulslinie zeichnet sich, dann läuft ab und zu ein Lichtpunkt darüber.\n'
      + '• Große Überschriften: Ein grüner Kreidestrich zieht sich darunter, wenn man hinscrollt.\n'
      + '• „Seite nicht gefunden“: Ein Ball fliegt über das Tor – „Daneben!“.\n'
      + '• Spielecke (/spielecke): „Elfmeterschießen“, „Ball hochhalten“, „Memory“ und „Hütchenspiel“ – jedes Spiel mit eigenem Haken. Ist nur ein Spiel an, entfallen die Auswahl-Kacheln. Sind alle aus, steht dort „Die Spielecke macht gerade Pause“ und der Hinweis auf der Breitensport-Seite verschwindet.\n\n'
      + 'Wer im Handy oder am PC „Bewegung reduzieren“ eingestellt hat, sieht die Effekte nie. Sie kommen ohne zusätzliche Programme aus und bremsen die Seite nicht. Ändern dürfen das alle, die auch „Texte & Bilder“ ändern dürfen.\n\n'
      + 'Beispiel – Wenn euch der Kreidestrich unter den Überschriften zu verspielt ist – dann nur den Haken „Große Überschriften: Kreidestrich“ rausnehmen und speichern. Alles andere bleibt.',
    bereich: 'animationen',
  },
  {
    frage: 'Muss die Web-App aktualisiert werden?',
    antwort:
      'Nein. Die Web-App zeigt immer die aktuelle Website – jede Änderung (News, Termine, Texte) und jedes Update der Website ist beim nächsten Öffnen sofort da. Es gibt keinen App-Store und nichts zu installieren. Auf dem Gerät liegt nur die Hinweisseite für „keine Verbindung“; alles andere kommt immer frisch vom Server.\n\n'
      + 'Nur Name und Symbol der App übernimmt der Browser verzögert:\n'
      + '• Android/PC (Chrome, Edge): prüft beim Öffnen der App etwa einmal am Tag, ob sich Name oder Symbol geändert haben, und fragt bei einer Änderung manchmal kurz nach.\n'
      + '• iPhone: übernimmt ein neues Symbol erst, wenn man die App vom Home-Bildschirm löscht und neu hinzufügt.\n'
      + '• Windows: zeigt auf dem Desktop manchmal noch das alte Symbol aus seinem Zwischenspeicher – nach einem Neustart des Rechners ist es weg.\n\n'
      + 'Beispiel 1 – Wenn du eine News veröffentlichst – dann sehen sie alle mit der App beim nächsten Öffnen sofort, ohne dass jemand etwas tun muss.\n\n'
      + 'Beispiel 2 – Wenn das App-Symbol geändert wurde und auf einem Gerät noch das alte erscheint – dann die App einmal öffnen und einen Tag warten, oder sie entfernen und neu installieren (iPhone: vom Home-Bildschirm löschen und neu hinzufügen).',
  },
  {
    frage: 'Gibt es die Website als App?',
    antwort:
      'Ja, als sogenannte Web-App: kostenlos, ohne App-Store und ohne Anmeldung. Wer sie installiert, hat das Vereinswappen auf dem Startbildschirm und die Website öffnet sich in einem eigenen Fenster ohne Browser-Leiste. Inhalte sind immer dieselben wie auf der Website – es gibt nichts extra zu pflegen.\n\n'
      + 'So geht’s: auf der Startseite in der Kachel „Mitgliederbereich“ auf „App installieren ›“ oder ganz unten auf der Website auf „Als App installieren“ tippen. Chrome, Edge und Android öffnen dann direkt den Installieren-Dialog; auf dem iPhone erscheint eine kurze Anleitung (Teilen → „Zum Home-Bildschirm“). In der installierten App sind beide Hinweise ausgeblendet. Die Texte änderst du unter Website-Aufbau → Texte & Bilder: Reiter „Startseite“ → Kachel Mitgliederbereich (Hinweis und Link-Text) und Reiter „Weitere Seiten“ → Fußzeile. Sobald es Benachrichtigungen gibt, passt du dort den Satz „… folgen in Kürze“ an.\n\n'
      + 'Ohne Internet zeigt die App eine freundliche Seite „Gerade keine Verbindung“ statt einer Fehlermeldung. Dabei werden keine Seiten oder Daten auf dem Gerät gespeichert – nur diese eine Hinweisseite. Mitgliederbereich und Ausweis brauchen also immer eine Verbindung. Benachrichtigungen aufs Handy (z. B. bei Trainingsausfall) gibt es noch nicht; sie sind für später geplant – was sie auslösen wird, steht unter „Was löst eine Push-Nachricht auf dem Handy aus?“.\n\n'
      + 'Beispiel 1 – Wenn ein Elternteil fragt, wie es schnell an die Trainingszeiten kommt – dann: Website am Handy öffnen, unten „Als App installieren“. Ein langes Drücken auf das Symbol zeigt Abkürzungen zu Trainingszeiten, Terminen, News und Mitgliederbereich (Android).\n\n'
      + 'Beispiel 2 – Wenn beim Tippen auf „Als App installieren“ nur die Anleitung erscheint statt des Dialogs – dann unterstützt der Browser das direkte Installieren nicht (z. B. Safari oder Firefox) oder die App ist schon installiert. Einfach der Anleitung folgen.',
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
  /** Häufige Fragen (Fragetext aus FAQ), die in der Kurzanleitung stehen */
  faq?: string[]
}

export const ROLLEN_PROFIL: Record<RolleKey, RollenProfil> = {
  webadmin: {
    label: 'Web-Admin',
    kurz: 'Du bist für die Technik verantwortlich und hast die obersten Rechte.',
    darf: [
      'Alles, was ein Admin darf',
      'Admin- und Web-Admin-Rechte vergeben und entziehen',
      'Konten anderer Admins und Web-Admins ändern',
      'Technik-Bereiche: Weiterleitungen und Suchindex',
      'Datensicherung, Papierkorb aller Bereiche, Besucherstatistik und Sicherheit',
      'Zusatzrechte für Rollen und einzelne Personen',
    ],
    darfNicht: [],
    anleitungen: [
      ['sicherung', 'sicherung-erstellen'],
      ['sicherung', 'wiederherstellung-testen'],
      ['users', 'admin-rechte'],
      ['users', 'zusatzrechte'],
      ['papierkorb', 'zurueckholen'],
      ['rollen', 'testkonten'],
      ['users', 'handy-verloren'],
    ],
    faq: [
      'Wie sichere ich alle Daten?',
      'Kann ich einer Person ein einzelnes Recht geben, ohne ihr eine ganze Rolle zu geben?',
      'Ich habe aus Versehen etwas gelöscht. Ist es weg?',
      'Ich habe mein Handy verloren / eine neue Handy-Nummer.',
      'Wo sehe ich, wie viele Menschen die Website besuchen?',
      'Der ENCRYPTION_KEY ist vielleicht bekannt geworden (z. B. Laptop gestohlen). Was tun?',
      'Was passiert, wenn der Web-Admin ausfällt? Wer kann übernehmen?',
    ],
  },
  admin: {
    label: 'Admin',
    kurz: 'Du darfst fast alles – inklusive Benutzer und Rollen.',
    darf: ['Alle Inhalte bearbeiten', 'Benutzer anlegen und Rollen vergeben (außer Admin/Web-Admin)', 'Zwei-Faktor zurücksetzen', 'Mitgliedsanträge und Vereinsdaten'],
    darfNicht: ['Admin- oder Web-Admin-Rechte vergeben (macht der Web-Admin)', 'Konten von Web-Admins ändern', 'Technik-Bereiche (Weiterleitungen, Suchindex)', 'Datensicherung, Web-Admin-Papierkorb, Besucherstatistik, Zusatzrechte vergeben'],
    anleitungen: [
      ['users', 'konto-anlegen'],
      ['angebote', 'team-verantwortliche'],
      ['saisonwechsel', 'saisonwechsel'],
      ['saisonwechsel', 'trainer-hoert-auf'],
      ['registrierungen', 'registrierung-freigeben'],
      ['rollen', 'rollen-pruefen'],
      ['rollen', 'rollen-aufraeumen'],
      ['mitgliedsantraege', 'antrag-bearbeiten'],
      ['users', 'handy-verloren'],
      ['datenschutz', 'auskunft'],
    ],
    faq: [
      'Jemand hat sich auf der Website registriert – was muss ich tun?',
      'Wo sehe ich, wer welche Rolle und welches Team hat?',
      'Warum sieht jemand einen Bereich (nicht)?',
      'Ich habe mein Handy verloren / eine neue Handy-Nummer.',
      'Ich habe aus Versehen etwas gelöscht. Ist es weg?',
      'Ein Trainer hört auf – was muss ich tun?',
      'Was ist der Monatsbericht?',
    ],
  },
  redaktion: {
    label: 'Redaktion',
    kurz: 'Du kümmerst dich um News, Termine, Seiten und Texte der Website.',
    darf: [
      'Alle News schreiben und auf die Startseite holen',
      'Vorschläge der Trainer für die Startseite annehmen oder ablehnen',
      'Termine, Seiten, Menü und Texte & Bilder pflegen',
      'Bilder verwalten',
      'Kontakt- und Probetraining-Anfragen bearbeiten',
      'Sponsoren, Fotoalben, Ehrenamt & Mitmachen, Vorstand und Downloads in den Vereinsdaten, Mitglieder-Dokumente',
    ],
    darfNicht: ['Mitgliedsanträge mit Bankdaten sehen', 'Benutzer und Rollen verwalten'],
    anleitungen: [
      ['posts', 'news-schreiben'],
      ['posts', 'vorschlag-annehmen'],
      ['termine', 'termin-anlegen'],
      ['kontaktanfragen', 'kontakt-beantworten'],
      ['posts', 'news-planen'],
      ['media', 'auto-zuordnen'],
      ['pages', 'seite-erstellen'],
      ['pages', 'seite-ins-menue'],
      ['forms', 'formular-bauen'],
      ['texte', 'text-aendern'],
      ['saisonwechsel', 'saisonwechsel'],
    ],
    faq: [
      'Was ist der Unterschied zwischen „Entwurf speichern“ und „Veröffentlichen“?',
      'Wie bekomme ich eine neue Seite ins Menü?',
      'Darf ich Fotos von Kindern hochladen?',
      'Was bedeutet „Wer kümmert sich?“ und wer sieht die Notizen?',
      'Ich habe etwas geändert, aber die Website zeigt noch das Alte.',
      'Was ist der Saisonwechsel und wann mache ich ihn?',
    ],
  },
  kasse: {
    label: 'Kasse',
    kurz: 'Du bearbeitest die Mitgliedsanträge und pflegst die Beiträge.',
    darf: ['Mitgliedsanträge (inkl. Bankdaten) bearbeiten', 'Anträge mit einem Klick aufnehmen, nachfragen oder ablehnen – mit fertiger E-Mail', 'Aufgenommene Anträge als Datei für das DFBnet exportieren (ohne Bankdaten)', 'Mitgliedschaften für den digitalen Ausweis pflegen', 'Beiträge und SEPA-Gläubiger-ID in den Vereinsdaten pflegen', 'Registrierungen freigeben', 'E-Mail-Vorlagen für Mitgliedsanträge'],
    darfNicht: ['News und Seiten veröffentlichen', 'Benutzer verwalten'],
    anleitungen: [
      ['mitgliedsantraege', 'antrag-bearbeiten'],
      ['mitgliedsantraege', 'antraege-exportieren'],
      ['mitgliedsantraege', 'antrag-vorlagen'],
      ['mitgliedschaften', 'ausweis-pflegen'],
      ['registrierungen', 'registrierung-freigeben'],
      ['verein', 'beitraege'],
    ],
    faq: [
      'Wie exportiere ich Mitgliedsanträge für das DFBnet?',
      'Wer sieht die Mitgliedsanträge und Bankdaten?',
      'Warum sieht ein Mitglied keinen Ausweis?',
      'Jemand hat sich auf der Website registriert – was muss ich tun?',
      'Wie lange bleiben Anträge und Anfragen gespeichert?',
    ],
  },
  passwesen: {
    label: 'Passwesen',
    kurz: 'Du bearbeitest die Fußball-Passanträge aller Teams und gibst sie an den Verband weiter.',
    darf: ['Passanträge aller Fußball-Teams sehen und bearbeiten', 'Unterlagen prüfen und fehlende nachfordern', 'Status setzen (z. B. „beim Verband“, „Spielerlaubnis erteilt“)'],
    darfNicht: ['News und Seiten veröffentlichen', 'Mitgliedsanträge oder Bankdaten sehen', 'Benutzer verwalten'],
    anleitungen: [['passantraege', 'passantrag-bearbeiten'], ['account', 'zwei-faktor-einrichten']],
    faq: [
      'Wer sieht die Passanträge und Ausweiskopien?',
      'Bekomme ich eine E-Mail bei neuen Probetraining-Anfragen oder Passanträgen?',
      'Wie melde ich mich ab oder wechsle in den Mitgliederbereich?',
      'Ich habe mein Passwort vergessen.',
      'Ich habe mein Handy verloren / eine neue Handy-Nummer.',
    ],
  },
  uebungsleitung: {
    label: 'Trainer',
    kurz: 'Du pflegst deine eigenen Teams oder Kurse.',
    darf: [
      'News für deine Teams schreiben und für die Startseite vorschlagen',
      'Fotos hochladen und deinen Teams zuordnen',
      'Fotoalben deiner Teams',
      'Trainingsausfälle melden und Hinweis-Banner auf der Teamseite setzen',
      'Trainingszeiten und Beschreibung deiner Teams ändern',
      'Probetraining-Anfragen und Passanträge für deine Teams bearbeiten',
    ],
    darfNicht: ['News auf die Startseite holen (macht die Redaktion)', 'Andere Teams bearbeiten', 'Mitgliedsanträge sehen'],
    anleitungen: [
      ['ausfaelle', 'ausfall-melden'],
      ['ausfaelle', 'ausfall-handy'],
      ['posts', 'news-schreiben'],
      ['posts', 'startseite-vorschlagen'],
      ['probetraining', 'probe-bearbeiten'],
      ['passantraege', 'passantrag-bearbeiten'],
      ['media', 'bild-hochladen'],
      ['angebote', 'team-zeiten'],
      ['angebote', 'angaben-bestaetigen'],
    ],
    faq: [
      'Wie melde ich als Trainer schnell einen Ausfall – auch vom Handy?',
      'Wie bekommt meine Team-News einen Platz auf der Startseite?',
      'Darf ich Fotos von Kindern hochladen?',
      'Warum kann ich ein Team nicht bearbeiten?',
      'Bekomme ich eine E-Mail bei neuen Probetraining-Anfragen oder Passanträgen?',
      'Was ist die „Passt noch?“-Mail?',
    ],
  },
  teamredaktion: {
    label: 'Team-Redaktion',
    kurz: 'Du schreibst News und lädst Fotos für deine Teams hoch.',
    darf: ['News für deine Teams schreiben und für die Startseite vorschlagen', 'Fotos hochladen und deinen Teams zuordnen', 'Fotoalben deiner Teams', 'Trainingsausfälle melden', 'Trainingszeiten und Beschreibung deiner Teams ändern'],
    darfNicht: ['News auf die Startseite holen (macht die Redaktion)', 'Andere Teams bearbeiten', 'Mitgliedsanträge sehen', 'Probetraining-Anfragen und Passanträge sehen'],
    anleitungen: [
      ['posts', 'news-schreiben'],
      ['posts', 'startseite-vorschlagen'],
      ['media', 'bild-hochladen'],
      ['alben', 'album-anlegen'],
      ['ausfaelle', 'ausfall-melden'],
      ['angebote', 'team-zeiten'],
      ['angebote', 'angaben-bestaetigen'],
    ],
    faq: [
      'Wie bekommt meine Team-News einen Platz auf der Startseite?',
      'Darf ich Fotos von Kindern hochladen?',
      'Wie setze ich einen kurzen Hinweis auf die Teamseite (z. B. „Heute in Halle 2“)?',
      'Was ist der Unterschied zwischen „Entwurf speichern“ und „Veröffentlichen“?',
      'Warum kann ich ein Team nicht bearbeiten?',
      'Was ist die „Passt noch?“-Mail?',
    ],
  },
  lesen: {
    label: 'Nur ansehen',
    kurz: 'Du kannst dir in der Verwaltung alles ansehen, aber nichts ändern.',
    darf: [
      'News, Termine, Seiten, Teams, Bilder und Einstellungen ansehen – auch Entwürfe und frühere Versionen',
      'Posteingang, Mitgliedsanträge, Mitgliedschaften und Benutzerkonten ansehen (sofern der Web-Admin das unter „Rollen-Rechte → Nur ansehen“ nicht abgeschaltet hat)',
      'Dein eigenes Passwort und deine Zwei-Faktor-Anmeldung ändern',
    ],
    darfNicht: [
      'Etwas anlegen, ändern, veröffentlichen oder löschen',
      'Pass-Unterlagen (Ausweise, Fotos) und den Papierkorb sehen',
      'Datensicherungen erstellen oder herunterladen, Daten exportieren',
    ],
    anleitungen: [['account', 'zwei-faktor-einrichten']],
    faq: ['Wie melde ich mich ab oder wechsle in den Mitgliederbereich?', 'Ich habe mein Passwort vergessen.', 'Ich habe mein Handy verloren / eine neue Handy-Nummer.'],
  },
  mitglied: {
    label: 'Mitglied',
    kurz: 'Du nutzt den Mitgliederbereich der Website.',
    darf: ['Mitgliederbereich nutzen', 'Zu Terminen zu- oder absagen (unter „Mein BSV“)'],
    darfNicht: ['Die Verwaltung bearbeiten'],
    anleitungen: [],
  },
}

export const ROLLEN_REIHENFOLGE: RolleKey[] = ['webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'lesen']

/** Wichtigste Rolle eines Kontos (für Begrüßung und Hinweise) */
export function hauptRolle(rollen: string[] | undefined | null): RolleKey {
  return (ROLLEN_REIHENFOLGE.find((r) => rollen?.includes(r)) ?? 'mitglied') as RolleKey
}

export function anleitungFinden(bereich: string, id: string): Anleitung | undefined {
  return ANLEITUNGEN[bereich]?.find((a) => a.id === id)
}

/* ------------------------------------------------------------------ */
/* Begriffe einfach erklärt                                            */
/* ------------------------------------------------------------------ */
export const GLOSSAR: Feld[] = [
  { name: 'Entwurf', text: 'Gespeichert, aber noch nicht auf der Website. Nur in der Verwaltung sichtbar.' },
  { name: 'Veröffentlichen', text: 'Stellt einen Inhalt auf die Website bzw. übernimmt Änderungen dorthin.' },
  { name: 'Veröffentlichung aufheben', text: 'Nimmt einen Inhalt von der Website, ohne ihn zu löschen. Er wird wieder zum Entwurf.' },
  { name: 'Versionen', text: 'Frühere Fassungen eines Eintrags. Man kann jede davon wiederherstellen.' },
  { name: 'Vorschau / Live-Vorschau', text: 'Zeigt, wie ein Entwurf auf der Website aussehen wird – bevor er veröffentlicht ist.' },
  { name: 'Slug', text: 'Der lesbare Teil der Adresse, z. B. „sommerfest“ in /sommerfest. Entsteht automatisch aus dem Titel.' },
  { name: 'SEO / Google-Vorschau', text: 'Titel, Beschreibung und Bild, die Google und Messenger beim Teilen zeigen. Wird automatisch erzeugt.' },
  { name: 'Mediathek', text: 'Der Ort für alle Bilder und Dateien. Was dort liegt, kann überall ausgewählt werden.' },
  { name: 'Baustein', text: 'Ein Teil einer Seite, z. B. ein Textabschnitt, ein Bild oder ein Button. Seiten bestehen aus Bausteinen untereinander.' },
  { name: 'Kategorie', text: 'Ein Schlagwort für News, nach dem Besucher filtern können.' },
  { name: 'Rolle', text: 'Bestimmt, was jemand in der Verwaltung darf – z. B. Redaktion, Kasse oder Trainer.' },
  { name: 'Verantwortliche', text: 'Die Benutzerkonten, die ein bestimmtes Team pflegen dürfen.' },
  { name: 'Zwei-Faktor-Anmeldung', text: 'Zusätzlich zum Passwort ein 6-stelliger Code aus einer Handy-App. Schützt die Daten des Vereins.' },
  { name: 'Wiederherstellungscodes', text: 'Zehn Einmal-Codes für den Notfall, falls das Handy fehlt. Gut aufbewahren!' },
  { name: 'Drei Punkte (⋮)', text: 'Das Menü mit weiteren Aktionen: kopieren, löschen, Veröffentlichung aufheben.' },
  { name: 'Griff (sechs Punkte)', text: 'Daran zieht man Einträge in Listen nach oben oder unten.' },
]
