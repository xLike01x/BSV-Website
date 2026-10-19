/**
 * Ergänzende Hilfe: Schritt-für-Schritt-Anleitungen, Feld-Erklärungen,
 * Hinweise je Rolle, häufige Fragen und Rollenprofile (für Begrüßung und Kurzanleitung).
 * Alles bewusst in Alltagssprache.
 */

export type Anleitung = { id: string; titel: string; schritte: string[]; video?: string }
export type Feld = { name: string; text: string }
export type Faq = { frage: string; antwort: string; bereich?: string }

/** Rollen-Schlüssel wie in den Benutzerkonten */
export type RolleKey = 'webadmin' | 'admin' | 'redaktion' | 'kasse' | 'passwesen' | 'uebungsleitung' | 'teamredaktion' | 'mitglied'

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
        'Oben rechts „Entwurf speichern“ – dann ist nichts verloren.',
        'Wenn alles passt: „Veröffentlichen“. Fertig!',
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
        'Optional: Team wählen und „In Galerie zeigen“ anhaken.',
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
        'Unter „Links in der Menüleiste“ auf „Eintrag hinzufügen“ klicken.',
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
        'Zuerst muss die Person ein Benutzerkonto mit der Rolle „Trainer“ oder „Team-Redaktion“ haben (Bereich „Benutzer“).',
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
  sicherung: [
    {
      id: 'sicherung-erstellen',
      titel: 'Eine Sicherung erstellen und aufbewahren',
      schritte: [
        'Links unter „Einstellungen“ auf „Datensicherung“ klicken.',
        '„Sicherung jetzt erstellen“ – etwa eine Minute warten.',
        'Bei der neuen Sicherung „Herunterladen“ klicken.',
        'Die Datei zusätzlich auf einen USB-Stick oder in eine Cloud kopieren.',
      ],
    },
    {
      id: 'sicherung-einspielen',
      titel: 'Eine Sicherung zurückholen (Notfall)',
      schritte: [
        'Die Sicherungsdatei in den Ordner „backups“ im Projektordner legen.',
        'Das Server-Fenster schließen.',
        'Im Projektordner PowerShell öffnen: pnpm sicherung:einspielen DATEINAME (ohne Namen wird die neueste genommen).',
        '„JA“ eintippen und warten, bis „Fertig“ erscheint. Der vorherige Stand wird vorher automatisch gesichert.',
        'Die Website wie gewohnt mit BSV-Website-Update.bat starten.',
      ],
    },
  ],
  rollen: [
    {
      id: 'testkonten',
      titel: 'Rechte mit Testkonten ausprobieren (nur lokal)',
      schritte: [
        '„Rollen & Rechte“ öffnen → Reiter „Testkonten“ → „Testkonten anlegen“.',
        'Es entsteht je ein Konto pro Rolle (Admin, Redaktion, Kasse, Mitglied), pro Abteilung (Abteilungsleitung, Pressewart) und pro Team (Trainer). Alle mit demselben Passwort, das dort angezeigt wird.',
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
        'Links unter „Einstellungen“ auf „Rollen & Rechte“ klicken.',
        'Reiter „Nach Team“ wählen oder den Teamnamen oben ins Suchfeld tippen.',
        'Neben dem Team stehen die Verantwortlichen mit ihren Rollen.',
        'Niemand eingetragen? Auf „Zuordnen“ klicken und die Person unter „Verantwortliche“ auswählen. Speichern.',
      ],
    },
    {
      id: 'rollen-aufraeumen',
      titel: 'Rechte aufräumen, wenn jemand aufhört',
      schritte: [
        'In der „Rollen & Rechte“ die Person suchen.',
        'Auf „Bearbeiten“ klicken.',
        'Bei „Rollen“ alles außer „Mitglied“ entfernen (oder das Konto löschen) und speichern.',
        'Beim Team unter „Verantwortliche“ die Person entfernen.',
      ],
    },
  ],
  users: [
    {
      id: 'konto-anlegen',
      titel: 'Ein Konto für einen neuen Trainer anlegen',
      video: '/hilfe/konto-anlegen.mp4',
      schritte: [
        '„Neu erstellen“ klicken.',
        'Name und E-Mail eintragen, ein vorläufiges Passwort vergeben.',
        'Bei „Rollen“ „Trainer“ (oder „Team-Redaktion“) wählen und speichern.',
        'Unter „Teams & Kurse“ die Person beim Team als „Verantwortliche“ eintragen.',
        'Der Person E-Mail und Passwort persönlich mitteilen. Beim ersten Anmelden richtet sie die Zwei-Faktor-App ein.',
      ],
    },
    {
      id: 'admin-rechte',
      titel: 'Jemanden zum Admin oder Web-Admin machen (nur Web-Admin)',
      schritte: [
        'Unter „Benutzer“ das Konto öffnen.',
        'Bei „Rollen“ „Admin“ oder „Web-Admin (Technik, oberste Rechte)“ hinzufügen.',
        'Speichern. Web-Admins bekommen „Admin“ automatisch mit dazu.',
        'Tipp: Es sollte immer mindestens zwei Web-Admins geben, damit niemand ausgesperrt wird. Den letzten Web-Admin kann man nicht entfernen.',
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
        'Hat die Person ein Konto auf der Website (selbst registriert und freigegeben)? Dann bei „Benutzerkonto“ auswählen: „Nachricht senden“ geht per E-Mail direkt an sie, und der Name bleibt automatisch aktuell (Feld „Name“ darf dann leer bleiben). Ihr Profilfoto erscheint nur mit Haken „Profilfoto aus dem Konto zeigen“ – und nur mit ihrem Einverständnis.',
        'Mit dem Griff links die Reihenfolge ändern, über die drei Punkte rechts jemanden entfernen.',
        'Oben rechts „Speichern“.',
      ],
    },
    {
      id: 'startseite-bilder',
      titel: 'Die Bilder der Startseite austauschen',
      video: '/hilfe/startseite-bilder.mp4',
      schritte: [
        'Nach unten zu „Startseite“ scrollen.',
        'Bei „Bilder oben“ ein Bild über das × entfernen und mit „Aus vorhandenen auswählen“ ein neues wählen.',
        'Die Kachel-Bilder darunter genauso austauschen.',
        'Oben rechts „Speichern“ – nach etwa einer Minute ist die Startseite aktualisiert.',
      ],
    },
    {
      id: 'aktion',
      titel: 'Die grüne Aktions-Box auf der Startseite ändern',
      schritte: [
        'Zu „Aktion auf der Startseite (grüne Box)“ scrollen.',
        'Überzeile, Titel, Text, Button-Text und Button-Link anpassen, optional ein Bild wählen.',
        'Zum Ausblenden den Haken bei „Anzeigen“ entfernen.',
        'Speichern.',
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
        'Bei „Bestätigungsnachricht“ eintragen, was nach dem Absenden erscheint.',
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
    { name: 'Für Fortgeschrittene (nur Redaktion)', text: 'Eingeklappt unten: „Passende News“ (Empfehlungen unter dem Artikel) und die Google-Vorschau. Beides musst du nicht ausfüllen.' },
    { name: 'Google-Vorschau (SEO)', text: 'Titel, Beschreibung und Bild, die Google und WhatsApp & Co. beim Teilen anzeigen. Wird automatisch aus Titel, Text und Titelbild erzeugt. Nur ändern, wenn du einen anderen Text möchtest.' },
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
    { name: 'Trainer- und Betreuerteam', text: 'Nur zur Anzeige auf der Teamseite (Name, Rolle, optional Foto). Wer bearbeiten darf, steht bei „Verantwortliche“.' },
    { name: 'Kursplätze', text: 'Eingeklappt: Wenn ein Kurs nur begrenzt Plätze hat, hier die Höchstzahl eintragen.' },
    { name: 'Fußball-Widgets', text: 'Nur bei Fußball: Spielklasse, FuPa-Widget und FUSSBALL.DE-Nummer (Spielplan/Tabelle). FuPa: im Widget-Builder auf fupa.net das Widget zusammenstellen (Kader, Tabelle, Spielplan), als „URL der Webseite“ die echte Vereinsadresse eintragen, „Speichern“ und den kompletten Code einfügen – die ID wird automatisch herausgelesen. Auf dem eigenen PC (localhost) zeigt FuPa das Widget eventuell nicht an, auf der Live-Website schon. Besucher sehen die Widgets erst nach einem Klick (Datenschutz): „Einmal laden“ oder „Immer laden“ – Letzteres merkt sich ihr Browser, dann erscheinen die Widgets künftig sofort.' },
    { name: 'Reihenfolge', text: 'Kleinere Zahl = weiter vorne in Listen und Menüs.' },
    { name: 'Aktiv', text: 'Nur aktive Angebote sind auf der Website sichtbar.' },
  ],
  media: [
    { name: 'Bildbeschreibung', text: 'Beschreibt, was zu sehen ist. Wichtig für Menschen, die sich Seiten vorlesen lassen.' },
    { name: 'Sind Personen zu erkennen?', text: 'Pflicht beim Hochladen. „Ja“ nur, wenn die Einwilligung vorliegt – bei Kindern von den Eltern. In der Mediathek zeigt der Ordner „Angabe zu Personen fehlt“ alte Bilder ohne Angabe.' },
    { name: 'Ordner (Team / Kurs)', text: 'Der Ordner des Bildes. Nur Verantwortliche dieses Teams (und die Redaktion) sehen und benutzen es.' },
    { name: 'Verein allgemein', text: 'Für Bilder ohne Team, z. B. Logo oder Sportplatz. Alle Trainer dürfen sie benutzen, aber nicht ändern. Setzen kann das nur die Redaktion.' },
    { name: 'Noch nicht zugeordnet', text: 'Bilder ohne Team und ohne „Verein allgemein“. Nur die Redaktion sieht sie – Trainer können sie nicht benutzen.' },
    { name: 'In Galerie zeigen', text: 'Das Bild erscheint in der Fotogalerie auf der Seite des Teams.' },
    { name: 'Bildunterschrift (optional)', text: 'Text, der unter dem Bild erscheinen kann, z. B. Fotograf oder Anlass.' },
    { name: 'Bild bearbeiten', text: 'Nach dem Hochladen: zuschneiden und den „wichtigsten Bildbereich“ setzen – dann bleibt z. B. ein Gesicht auch in kleinen Vorschaubildern sichtbar.' },
    { name: 'Bildgrößen', text: 'Die Website erzeugt automatisch kleinere Versionen für schnelle Ladezeiten. Darum musst du dich nicht kümmern.' },
    { name: 'Ordner', text: 'Oben links „Kein Ordner“: Bilder lassen sich in Ordner sortieren, z. B. „Sommerfest 2026“. Optional – nur für die Übersicht in der Verwaltung.' },
  ],
  pages: [
    { name: 'Titel', text: 'Name der Seite, steht auch im Browser-Tab. Daraus entsteht die Adresse.' },
    { name: 'Reiter „Kopfbereich“', text: 'Der große Bereich ganz oben. Art wählen: groß mit Bild (bildschirmfüllend), mittel mit Bild, schlicht nur Text – oder kein Kopfbereich. Dazu Überschrift, Einleitung und bis zu zwei Buttons.' },
    { name: 'Reiter „Inhalt (Bausteine)“', text: 'Die Seite besteht aus Bausteinen untereinander. „Baustein hinzufügen“ → Art wählen. Mit dem Griff links verschieben, über die drei Punkte kopieren oder löschen.' },
    { name: 'Baustein „Text (in Spalten)“', text: 'Normaler Text – auch nebeneinander in Spalten (volle, halbe, Drittel-Breite). Pro Spalte optional ein Link.' },
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
    { name: 'Beginn / Ende', text: 'Datum und Uhrzeit. Ende ist optional.' },
    { name: 'Ort', text: 'Wo der Termin stattfindet.' },
    { name: 'Bereich', text: 'Bestimmt Farbe und Zuordnung im Kalender.' },
    { name: 'Nur für Mitglieder', text: 'Nur nach dem Login sichtbar.' },
    { name: 'Anmeldung im Mitgliederbereich', text: 'Mitglieder können sich nach dem Login für den Termin anmelden.' },
    { name: 'Beschreibung', text: 'Weitere Infos zum Termin. Zeilenumbrüche werden übernommen.' },
  ],
  ausfaelle: [
    { name: 'Angebot', text: 'Welches Team oder welcher Kurs ausfällt.' },
    { name: 'Datum', text: 'An welchem Tag. Danach verschwindet der Hinweis automatisch.' },
    { name: 'Grund', text: 'Zur Auswahl: Krankheit, Halle belegt, Ferien, Wetter, Sonstiges.' },
    { name: 'Hinweis', text: 'Optionaler Zusatz, z. B. ein Nachholtermin.' },
  ],
  rollen: [
    { name: 'Verantwortlich für', text: 'Teams, die die Person pflegen darf. Eingetragen wird das beim Team unter „Verantwortliche“.' },
    { name: 'Zwei-Faktor', text: 'Ob die Handy-App für die Anmeldung eingerichtet ist. Pflicht für alle außer „Mitglied“.' },
    { name: '⚠️', text: 'Hier fehlt etwas: z. B. ein Trainer ohne Team oder ein Team ohne Verantwortliche.' },
  ],
  users: [
    { name: 'Name', text: 'Erscheint in der Verwaltung und als Autor:in von News.' },
    { name: 'E-Mail', text: 'Damit meldet sich die Person an.' },
    { name: 'Rollen', text: 'Was die Person darf. Mehrere Rollen sind möglich.' },
    { name: 'Zwei-Faktor-Anmeldung eingerichtet', text: 'Haken entfernen setzt die Handy-App zurück (z. B. bei verlorenem Handy).' },
    { name: 'Teams & Kurse', text: 'In welchen Angeboten die Person selbst mitmacht (als Mitglied). Gibt keine Bearbeitungsrechte.' },
    { name: 'Verantwortlich für', text: 'Zeigt, welche Teams die Person pflegen darf. Ändern kannst du das beim jeweiligen Team unter „Verantwortliche“.' },
  ],
  menue: [
    { name: 'Text im Menü', text: 'So heißt der Eintrag auf der Website.' },
    { name: 'Was soll der Eintrag tun?', text: '„Seite öffnen“ (eine eurer Seiten), „Adresse öffnen“ (z. B. /news oder eine fremde Website) oder „Aufklappmenü zeigen“ (Fußball, Breitensport oder Verein).' },
    { name: 'Adresse', text: 'Intern mit „/“: /news, /termine, /kontakt, /verein, /fussball, /breitensport, /mitglied-werden. Extern mit „https://“.' },
    { name: 'In neuem Tab öffnen', text: 'Sinnvoll für fremde Websites wie den Fan-Shop.' },
    { name: 'Kontakt-Spalte', text: 'Die Spalte ganz rechts in der Fußzeile. Haken „anzeigen“ entfernen blendet sie aus. Die Adresse kommt aus den Vereinsdaten.' },
    { name: 'Links unter der Adresse', text: 'Für Social Media und andere fremde Seiten: „Adresse öffnen“ wählen, komplette Adresse mit https:// einfügen, „In neuem Tab öffnen“ anhaken.' },
    { name: 'Griff (sechs Punkte)', text: 'Daran ziehst du einen Eintrag nach oben oder unten.' },
  ],
  verein: [
    { name: 'Mitgliederzahl', text: 'Erscheint auf der Startseite und in Texten mit {mitglieder}.' },
    { name: 'Mitgliedsbeiträge', text: 'Beträge pro Quartal – gelten für den Online-Antrag.' },
    { name: 'SEPA-Gläubiger-ID', text: 'Steht im Lastschriftmandat des Antrags.' },
    { name: 'Vorstand', text: 'Name, Funktion, optional Foto. Erscheint auf der Vereinsseite.' },
    { name: 'Satzung & Downloads', text: 'Dateien zum Herunterladen auf der Vereinsseite.' },
    { name: 'Startseite: Bilder oben', text: 'Bis zu 4 Fotos im großen Bereich ganz oben. Dazu zwei kleine Schilder mit kurzem Text.' },
    { name: 'Texte der Startseite', text: 'Alle Überschriften und Texte der Startseite – auch die Zahlen-Leiste und die drei Schritte – stehen unter „Website-Texte“.' },
    { name: 'Startseite: Kacheln', text: 'Die Bilder für die Kacheln Fußball, BSV Kids und Fitness – und die Titelbilder der Bereichs- und Vereinsseite.' },
    { name: 'Aktion (grüne Box)', text: 'Ein großer Hinweis auf der Startseite, z. B. für ein Projekt oder Fest. Mit „Anzeigen“ ein- oder ausblenden.' },
    { name: 'Social Media', text: 'Links zu Instagram und Facebook – erscheinen unten auf der Website.' },
  ],
  forms: [
    { name: 'Name des Formulars', text: 'Nur intern, damit ihr es wiederfindet.' },
    { name: 'Felder', text: '„Feld hinzufügen“ → Art wählen: Text, E-Mail, Zahl, Auswahlliste, Ankreuzfeld, mehrzeiliger Text … Pro Feld: Bezeichnung und ob es Pflicht ist.' },
    { name: 'Text auf dem Absende-Button', text: 'z. B. „Anmelden“.' },
    { name: 'Nach dem Absenden …', text: 'Eine Danke-Nachricht zeigen oder auf eine Seite weiterleiten.' },
    { name: 'E-Mail-Benachrichtigungen', text: 'Kommt mit dem E-Mail-Versand – bis dahin stehen die Eingänge unter „Formular-Eingänge“.' },
  ],
  texte: [
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
    uebungsleitung: 'Du kannst News für deine eigenen Teams schreiben. Ob sie auch auf die Startseite kommen, entscheidet die Redaktion.',
    teamredaktion: 'Du kannst News für deine eigenen Teams schreiben. Ob sie auch auf die Startseite kommen, entscheidet die Redaktion.',
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
    antwort: 'Ja, als Trainer für deine Teams (Passanträge zusätzlich an die Rolle „Passwesen“) – sobald der E-Mail-Versand eingerichtet ist. Abbestellen: oben rechts auf dein Symbol → „Mein Konto“ → Haken „E-Mail-Benachrichtigungen zu meinen Teams“ entfernen und speichern.',
  },
  {
    frage: 'Wie melde ich mich ab oder wechsle in den Mitgliederbereich?',
    antwort: 'Oben rechts auf dein Symbol (Foto oder Anfangsbuchstaben) klicken. Im Menü: „Mein Konto“ (Name, Passwort, Foto), „Zum Mitgliederbereich“ (Ausfälle, Ausweis, Downloads – so, wie Mitglieder die Website sehen), „Website ansehen“, „Hilfe-Center“ und „Abmelden“.',
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
    antwort: 'Nötig für Registrierung, „Passwort vergessen“ und Benachrichtigungen. In die .env eintragen (Daten vom E-Mail-Anbieter, z. B. SiteGround → Site Tools → E-Mail → Konten → „Mail-Konfiguration“): SMTP_HOST=… (Postausgangsserver), SMTP_PORT=465, SMTP_USER=website@eure-domain.de, SMTP_PASS=… (Passwort des Postfachs), SMTP_FROM=website@eure-domain.de. Danach die Website neu starten (BSV-Website-Update.bat). Ohne diese Einträge stehen die Mails beim Ausprobieren auf dem eigenen PC nur im schwarzen Server-Fenster (mit Link zum Anklicken); auf der Live-Website ist die Registrierung dann gesperrt.',
    bereich: 'users',
  },

  {
    frage: 'Wer sieht die Profilfotos der Mitglieder?',
    antwort: 'Nur das Mitglied selbst, Admin und Kasse sowie die Trainer der Kurse, in denen das Mitglied eingetragen ist (im Team unter „Mitglieder in diesem Team / Kurs“). Nie öffentlich. Das Mitglied kann sein Foto jederzeit selbst entfernen.',
    bereich: 'users',
  },
  {
    frage: 'Wie stelle ich ein, dass die News auf der Startseite von selbst weiterlaufen?',
    antwort: 'Unter „Website-Texte“ → Startseite den Haken „News-Leiste läuft von selbst weiter“ setzen oder entfernen. Mit Haken wechselt die Leiste alle 6 Sekunden und pausiert, sobald jemand mit der Maus darauf zeigt. Welche News dort erscheinen, bestimmt bei jeder News der Haken „Auf Startseite“.',
    bereich: 'texte',
  },
  {
    frage: 'Wie kommen die neuen Seiten (Trainingszeiten, Galerie, Sponsoren, Mitmachen) ins Menü?',
    antwort: 'Unter „Menü & Fußzeile“ zeigt der Kasten oben, welche Seiten noch nirgends verlinkt sind – ein Klick auf „In die Fußzeile“ oder „Ins Menü Verein“ trägt sie ein.',
    bereich: 'menue',
  },
  {
    frage: 'Wo sehe ich genau, was eine Rolle darf?',
    antwort: 'Für eine bestimmte Person: Benutzer öffnen – oben steht „Was darf diese Person?“. Für eine ganze Rolle (Web-Admin): „Rollen & Rechte“ → Reiter „Rechte je Rolle“: Rolle anklicken, dann siehst du für jeden Bereich Sehen, Anlegen, Bearbeiten und Löschen. Die Tabelle wird aus den echten Regeln berechnet und stimmt deshalb immer.',
    bereich: 'users',
  },
  {
    frage: 'Ich habe aus Versehen etwas gelöscht. Ist es weg?',
    antwort: 'Nein – fast alles landet zuerst im Papierkorb: in der jeweiligen Liste oben auf „Papierkorb“ klicken, den Eintrag öffnen und „Wiederherstellen“ wählen. Nach 30 Tagen wird der Papierkorb automatisch geleert. Benutzerkonten werden sofort gelöscht.',
  },
  {
    frage: 'Kann ich die Verwaltung auf dem Handy nutzen?',
    antwort: 'Ja. Am besten als App-Symbol: Verwaltung im Handy-Browser öffnen und „Zum Startbildschirm hinzufügen“ wählen (iPhone: Teilen-Symbol → „Zum Home-Bildschirm“; Android: Menü ⋮ → „Zum Startbildschirm hinzufügen“). Ein Ausfall ist dann in drei Klicks gemeldet.',
  },
  {
    frage: 'Wie sichere ich alle Daten?',
    antwort: 'Links unter „Einstellungen“ auf „Datensicherung“ (nur Web-Admins) → „Sicherung jetzt erstellen“ → „Herunterladen“ und zusätzlich auf einem USB-Stick oder in einer Cloud speichern. Am besten einmal pro Woche – das Dashboard erinnert nach 7 Tagen.',
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
    antwort: 'Posteingang: alles, was Leute über die Website schicken – Mitgliedsanträge, Kontaktanfragen, Probetraining, Passanträge, Formular-Eingänge und Registrierungen. Inhalte: was Besucher lesen und sehen – News, Termine, Fotoalben, Mediathek, Sponsoren, Ehrenamt. Website-Aufbau: Seiten, Menü & Fußzeile, Website-Texte, Formulare. Sport: Teams & Kurse, Trainingsausfälle, Pass-Unterlagen. Mitglieder: Benutzer, Mitgliedschaften, Profilfotos, Dokumente. Einstellungen: Vereinsdaten, Rollen & Rechte, Datenschutz, Datensicherung, Hilfe-Texte. Jede Rolle sieht nur die Bereiche, die sie braucht.',
    bereich: 'dashboard',
  },
  {
    frage: 'Was bedeutet die orange Zahl in der Seitenleiste?',
    antwort: 'So viele neue Einträge warten im Posteingang, z. B. 2 neue Kontaktanfragen. Die Zahl steht am Bereich und an der Überschrift „Posteingang“ (auch wenn die Gruppe zugeklappt ist). Sie verschwindet, sobald du den Status änderst, z. B. auf „In Bearbeitung“ oder „Erledigt“. Du siehst nur Zahlen für Einträge, die du auch öffnen darfst – Trainer z. B. nur für ihre Teams.',
    bereich: 'dashboard',
  },
  {
    frage: 'Kann ich einer Person ein einzelnes Recht geben, ohne ihr eine ganze Rolle zu geben?',
    antwort: 'Ja. Benutzer öffnen → unten „Zusatzrechte nur für diese Person“ → Häkchen setzen → Speichern. Zur Wahl stehen: Kontaktanfragen, Probetraining-Anfragen aller Teams, Passanträge aller Teams, Registrierungen freigeben, Formular-Eingänge, Termine, Ehrenamt & Mitmachen, Trainingsausfälle für alle Teams und Mitgliedschaften (nur lesen). Wer ein Zusatzrecht hat, kommt in die Verwaltung, sieht dort nur die passenden Bereiche und braucht die Zwei-Faktor-Anmeldung. Vergeben kann das nur ein Web-Admin, Admins sehen die Häkchen nur. Benutzer, Admin-Rechte und Bankdaten lassen sich bewusst nicht einzeln vergeben. Alle Personen mit Zusatzrechten auf einen Blick: Einstellungen → „Rollen & Rechte“ → Kachel „Personen mit Zusatzrechten“ anklicken (oder unter „Nach Person“ den Punkt „Mit Zusatzrechten“ wählen). Die Rechte stehen dort als orange „+ …“ unter den Rollen.',
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
    frage: 'Wo ändere ich die Mitgliedsbeiträge?',
    antwort: 'Einstellungen → Vereinsdaten → „Mitgliedsbeiträge“: je Mitgliedsart den Betrag „€ pro Quartal“ eintragen und speichern. Alles andere rechnet sich automatisch: die Beitrags-Kacheln auf der Vereinsseite (inkl. „entspricht … € im Monat“), die Überschrift „Ab … € im Monat“ (günstigster Beitrag für aktive Mitglieder, passiv zählt nicht), der Online-Antrag und der Platzhalter {abMonat} in den Website-Texten. Bei jedem neuen Antrag wird der Betrag, der beim Absenden galt, unter „Beitrag laut Antrag“ festgehalten. Eine Aufnahmegebühr gibt es auf der Website nicht.',
    bereich: 'verein',
  },
  {
    frage: 'Wie ändere ich die Reihenfolge im Menü und in den Aufklappmenüs Fußball und Breitensport?',
    antwort: 'Reihenfolge in der Menüleiste (Fußball, Breitensport, Verein, News …): Menü & Fußzeile → Reiter „Hauptmenü oben“ → Einträge am Griff links ziehen → Speichern. Inhalt der Aufklappmenüs Fußball und Breitensport: Reiter „Aufklappmenüs Fußball & Breitensport“. Die Teams und Kurse kommen automatisch aus „Teams & Kurse“; mit den Pfeilen ▲▼ sortierst du sie innerhalb einer Spalte (gilt sofort). Die Spalte bestimmt beim Angebot der „Bereich“ und bei Fußball die „Gruppe (Fußball)“. Darunter änderst du den Text links im Aufklappmenü.',
    bereich: 'menue',
  },
  {
    frage: 'Wo sehe ich, wer welche Rolle und welches Team hat?',
    antwort: 'Unter Einstellungen → „Rollen & Rechte“ (nur für Admins). Dort gibt es Reiter nach Person, nach Team, nach Rolle und „Rechte je Rolle“.',
    bereich: 'users',
  },
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
  webadmin: {
    label: 'Web-Admin',
    kurz: 'Du bist für die Technik verantwortlich und hast die obersten Rechte.',
    darf: [
      'Alles, was ein Admin darf',
      'Admin- und Web-Admin-Rechte vergeben und entziehen',
      'Konten anderer Admins und Web-Admins ändern',
      'Technik-Bereiche: Weiterleitungen und Suchindex',
    ],
    darfNicht: [],
    anleitungen: [
      ['users', 'konto-anlegen'],
      ['users', 'admin-rechte'],
      ['users', 'handy-verloren'],
      ['menue', 'menue-link'],
    ],
  },
  admin: {
    label: 'Admin',
    kurz: 'Du darfst fast alles – inklusive Benutzer und Rollen.',
    darf: ['Alle Inhalte bearbeiten', 'Benutzer anlegen und Rollen vergeben (außer Admin/Web-Admin)', 'Zwei-Faktor zurücksetzen', 'Mitgliedsanträge und Vereinsdaten'],
    darfNicht: ['Admin- oder Web-Admin-Rechte vergeben (macht der Web-Admin)', 'Konten von Web-Admins ändern', 'Technik-Bereiche (Weiterleitungen, Suchindex)'],
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
    darf: ['Mitgliedsanträge (inkl. Bankdaten) bearbeiten', 'Mitgliedschaften für den digitalen Ausweis pflegen', 'Beiträge und SEPA-Gläubiger-ID in den Vereinsdaten pflegen'],
    darfNicht: ['News und Seiten veröffentlichen', 'Benutzer verwalten'],
    anleitungen: [
      ['mitgliedsantraege', 'antrag-bearbeiten'],
      ['verein', 'vorstand'],
    ],
  },
  passwesen: {
    label: 'Passwesen',
    kurz: 'Du bearbeitest die Fußball-Passanträge aller Teams und gibst sie an den Verband weiter.',
    darf: ['Passanträge aller Fußball-Teams sehen und bearbeiten', 'Unterlagen prüfen und fehlende nachfordern', 'Status setzen (z. B. „beim Verband“, „Spielerlaubnis erteilt“)'],
    darfNicht: ['News und Seiten veröffentlichen', 'Mitgliedsanträge oder Bankdaten sehen', 'Benutzer verwalten'],
    anleitungen: [['passantraege', 'passantrag-bearbeiten']],
  },
  uebungsleitung: {
    label: 'Trainer',
    kurz: 'Du pflegst deine eigenen Teams oder Kurse.',
    darf: ['News für deine Teams schreiben', 'Fotos hochladen und deinen Teams zuordnen', 'Trainingsausfälle melden', 'Trainingszeiten und Beschreibung deiner Teams ändern', 'Probetraining-Anfragen für deine Teams beantworten'],
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

export const ROLLEN_REIHENFOLGE: RolleKey[] = ['webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion']

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
