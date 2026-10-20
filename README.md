# BSV-Website – Büdericher Spielverein 1919 e.V.

Next.js + Payload CMS + PostgreSQL. Ein Login für alle, die Rolle bestimmt die Rechte.

## Lokal starten (Windows)

**Einmalig installieren**
1. Node.js LTS von https://nodejs.org
2. Docker Desktop von https://www.docker.com/products/docker-desktop/ (mit WSL2)
3. In PowerShell: `npm install -g pnpm`

**Starten** (PowerShell im Ordner `app`)
```powershell
docker compose up -d      # Datenbank starten
pnpm install              # nur beim ersten Mal / nach Updates
pnpm dev                  # Website starten
```
- Website: http://localhost:3000
- Verwaltung: http://localhost:3000/admin – beim ersten Aufruf legst du dein Admin-Konto an.

**Startinhalte einspielen** (einmalig, Datenbank muss laufen)
```powershell
pnpm seed:bsv
```
Lädt Teams & Kurse, News, Vorstand, Bilder und die Seiten Kunstrasen, Impressum und Datenschutz aus der bisherigen WordPress-Seite. Mehrfaches Ausführen ist unschädlich – Vorhandenes wird aktualisiert, nicht doppelt angelegt. Achtung: Änderungen, die du in der Verwaltung an diesen Startinhalten gemacht hast, werden dabei überschrieben.

**Beispiel-News** für alle Teams und Kurse (zum Ausprobieren):
```powershell
pnpm seed:beispiele              # anlegen
pnpm seed:beispiele --loeschen   # wieder entfernen
```

**Beenden:** `Strg + C`, danach `docker compose down`.

## Rollen

| Rolle | Darf |
|---|---|
| Web-Admin | alles, inkl. Technik (Weiterleitungen, Suche) und Admin-/Web-Admin-Rechte vergeben; der letzte Web-Admin ist geschützt |
| Admin | alles außer Admin-Rechte vergeben und Technik |
| Redaktion | News, Termine, Seiten, Teams & Kurse |
| Kasse | Mitgliedsanträge inkl. Bankdaten |
| Trainer (`uebungsleitung`) | eigene Teams/Kurse pflegen, Ausfälle, Team-News und -Bilder, eigene Probetraining-Anfragen |
| Team-Redaktion | eigene Teams/Kurse: Team-News, Bilder, Zeiten, Ausfälle (z. B. Pressewart einer Mannschaft) |
| Mitglied | nur Mitgliederbereich auf der Website |

**Rollen-Übersicht** (`/admin/rollen`, nur Admins): wer welche Rolle hat und für welche Teams – mit Reitern nach Person, Team und Rolle.

**Testkonten** (Rollen-Übersicht → Reiter „Testkonten“): je Rolle, Abteilung und Team ein Konto `…@bsv.test` mit Passwort `BSV-Test-2026!`, ohne Zwei-Faktor. Funktionieren nur mit `pnpm dev` (nur über localhost erreichbar; `pnpm dev:netzwerk` für Zugriff aus dem WLAN – dann ohne Testkonten) (in Produktion gesperrt, außer `BSV_TESTKONTEN=an`). Mit „Alle Testkonten löschen“ wieder entfernen.

„Eigene“ Teams: im jeweiligen Team/Kurs unter **Verantwortliche** eintragen. Team-News erscheinen auf der Teamseite; auf Startseite und im Newsroom erst, wenn die Redaktion den Haken „Auch auf Startseite“ setzt.

## Zwei-Faktor-Anmeldung

Alle Rollen außer „Mitglied“ brauchen für die Verwaltung zusätzlich einen Code aus einer Authenticator-App (Google/Microsoft Authenticator, iPhone-Passwörter …). Beim ersten Login wird die App per QR-Code verbunden; dabei gibt es 10 Wiederherstellungscodes für den Notfall. Handy verloren? Ein Admin entfernt im Benutzer den Haken „Zwei-Faktor-Anmeldung eingerichtet“ – beim nächsten Login wird neu eingerichtet. Lokal zum Entwickeln abschaltbar mit `ZWEI_FAKTOR=aus` in der `.env`.

## Texte ändern

Alle Überschriften und festen Texte der Website stehen in der Verwaltung unter **Inhalte → Website-Texte**. Platzhalter wie `{teams}` oder `{mitglieder}` werden automatisch durch aktuelle Zahlen ersetzt.

## Menü

Alle Einträge im Hauptmenü (inkl. Reihenfolge), das Aufklappmenü „Verein“ und die Fußzeile (inkl. Kontakt-Spalte mit beliebigen Social-Media-Links) pflegt die Redaktion unter **Inhalte → Menü & Fußzeile**. Leere Liste = Standardmenü.

## Mediathek-Ordner

Jedes Bild hat einen Ordner = „Team / Kurs“ oder „Verein allgemein“. Trainer sehen und benutzen nur ihre Team-Ordner und „Verein allgemein“ (nur benutzen). Die Prüfung gilt auch serverseitig für News und Teams (`src/hooks/medienPruefen.ts`). Redaktion: „Automatisch zuordnen“ in der Mediathek (`src/collections/Media/autoZuordnen.ts`) – erst Vorschau, dann übernehmen; bereits zugeordnete Bilder bleiben unverändert. Auf der Website bleiben Bilder öffentlich.

## Eigene Formulare

Unter **Eigene Formulare → Formulare** gibt es Vorlagen (Anmeldung, Helferliste, Sammelbestellung). Im Formular erstellt „Neue Seite mit diesem Formular erstellen“ direkt eine Seite mit dem Formular-Baustein. Antworten landen unter **Formular-Eingänge**. Vorlagen: `src/components/Admin/Formulare/vorlagen.ts`.

## Einstiegs-Kästen

Über den Listen (News, Termine, Ausfälle, Seiten, Formulare, Teams, Anfragen, Anträge, Benutzer) erklärt ein Kasten das Wozu, zeigt den Ablauf und bietet Vorlagen bzw. die Ausfall-Schnellmeldung. Inhalte und Vorlagen: `src/components/Admin/Einstieg/einstiege.ts`.

## Hilfe in der Verwaltung

- **„? Hilfe“** oben rechts auf jeder Seite: Erklärung des Bereichs, Schritt-für-Schritt-Anleitungen, Feld-Erklärungen, Hinweise je Rolle, FAQ, Rückmeldung 👍/👎, „Frage an den Admin“ (landet bei den Kontaktanfragen).
- **Hilfe-Center** (`/admin/hilfe`): Suche, Videos, alle Anleitungen und Fragen. **Kurzanleitung je Rolle** zum Drucken: `/admin/hilfe/kurzanleitung`.
- **Live-Hinweise** beim Bearbeiten (News, Teams, Termine, Ausfälle, Seiten, Bilder): warnen z. B. vor fehlendem Titelbild und zeigen, wo ein Eintrag erscheint.
- **Tour** und **Erste Schritte** auf dem Dashboard für neue Nutzer.
- Eingebaute Texte: `src/components/Admin/Hilfe/texte.ts` und `extras.ts`. Eigene Ergänzungen ohne Code unter **Einstellungen → Hilfe-Texte**; Rückmeldungen unter **Einstellungen → Hilfe-Rückmeldungen** (nur Admins).
- **21 Hilfe-Videos** mit Untertiteln liegen in `public/hilfe/`. Neu aufnehmen (nach Änderungen an der Verwaltung, nur lokal mit Testkonten – alles Angelegte wird danach wieder entfernt). Zwei Durchläufe empfohlen: der erste lässt den Entwicklungsserver alle Seiten übersetzen, erst der zweite ist flüssig.
  ```
  BSV_URL=http://localhost:3000 node scripts/hilfe-videos.mjs                  # alle, nur aufnehmen (hilfe-videos-roh/)
  BSV_URL=http://localhost:3000 BSV_FERTIG=1 node scripts/hilfe-videos.mjs     # aufnehmen + nach public/hilfe/*.mp4/.jpg
  BSV_URL=http://localhost:3000 node scripts/hilfe-videos.mjs news-schreiben   # nur ein Video
  ```
  Standard sind die Testkonten (admin@, redaktion@, kasse@, trainer-f1-jugend@bsv.test). Andere Konten: `BSV_<ADMIN|REDAKTION|KASSE|TEAM>_EMAIL`, `_PASSWORT`, `_TOTP` (Zwei-Faktor-Geheimnis, nur wenn 2FA aktiv).

## Digitaler Mitgliedsausweis

- Sammlung **Mitgliedschaften** (Admin/Kasse): Name, Mitgliedsnummer, Mitglied seit, Art (Einzel jugend/aktiv/passiv oder Familie), Kurse, gültig/Austritt, E-Mail des Kontos. Entsteht automatisch, wenn ein Mitgliedsantrag auf „Aufgenommen“ gesetzt wird (inkl. Familienmitglieder).
- Sichtbar im verknüpften Benutzerkonto (Feld „Benutzerkonto“; wird bei Freigabe einer Registrierung mit gleicher E-Mail bzw. bei Aufnahme eines Antrags mit bestehendem Konto gesetzt). Eltern sehen die Ausweise ihrer Kinder – live (Uhr, schimmernder Streifen) mit QR-Code. Der QR-Code führt zu `/ausweis/<signierter Code>` und zeigt live gültig/ungültig mit minimalen Daten.

## Fußball-Passanträge

- Mitglieder stellen im Mitgliederbereich (`/mitglieder/passantrag`) einen Antrag auf Spielerlaubnis – auch für ihre Kinder – und laden die Unterlagen hoch (Passantrag, Ausweis/Geburtsurkunde, Passfoto, Einverständniserklärungen, ggf. Abmeldung und Meldebescheinigung). Pflicht-Unterlagen hängen von der Art (erster Pass, Vereinswechsel, international) und dem Alter ab.
- Verwaltung: „Sport → Passanträge“. Sichtbar für Admin, die neue Rolle **Passwesen** (alle Teams) und die **Trainer** des Teams (nicht Team-Redaktion). Status: Eingereicht → In Prüfung / Unterlagen fehlen (mit Hinweis, Person reicht nach) → Beim Verband → Erteilt/Abgelehnt.
- Dateien in `passantraege/` (nicht öffentlich). Nach Abschluss werden Ausweis, Foto & Erklärungen automatisch gelöscht (Standard 30 Tage); der unterschriebene Passantrag wird 2 Jahre aufbewahrt, danach Antrag samt Formular gelöscht; nie zugeordnete Uploads nach 7 Tagen. Formular-Link (Standard: WDFV-Spielberechtigungsantrag) bzw. eigene PDF: Vereinsdaten → „Fußball: Passantrag“.

## Registrierung, E-Mail, Profilfotos

- `/registrieren`: Mitglieder erstellen selbst ein Konto (E-Mail + Passwort) und kreuzen optional ihre Teams & Kurse an (Feld `wunschAngebote`). Danach Bestätigungs-E-Mail (`/registrieren/bestaetigen?t=…`, 48 h gültig, in der DB nur SHA-256 des Tokens). Vor der Bestätigung ist kein Login möglich (`beforeLogin`); „Passwort vergessen“ gilt ebenfalls als Bestätigung. Erst bestätigte Konten erscheinen unter **Registrierungen** (`/admin/registrierungen`); Admin/Kasse gibt frei und ordnet Teams & Kurse zu (Wünsche vorausgewählt), die Person bekommt eine E-Mail. Ablehnen löscht das Konto. Unbestätigte Registrierungen nach 7 Tagen, nicht freigegebene nach 60 Tagen automatisch gelöscht.
- Gleiche E-Mail erneut registriert: gleiche Antwort wie bei Erfolg (keine Konto-Aufzählung); bestehendes Konto bekommt einen Hinweis per Mail, eine nie bestätigte Registrierung wird ersetzt. Höchstens eine Mail pro Adresse alle 5 Minuten.
- Bot-Schutz ohne Captcha und ohne Fremddienst (`src/auth/botschutz.ts`): Proof of Work (SHA-256, HMAC-signierte Aufgabe, 30 min gültig, einmalig), Zeitfalle ≥ 3 s, Honeypot, Rate-Limit pro IP.
- E-Mail-Versand: `SMTP_*` in der `.env` (Nodemailer). Ohne SMTP beim Entwickeln werden alle Mails samt Link im Server-Log angezeigt; in Produktion ist die Registrierung ohne SMTP gesperrt. „Passwort vergessen“ verlinkt auf `/login/passwort-neu`.
- Die frühere Google-Anmeldung wurde entfernt (Felder `googleId`/„Google“ bleiben nur, damit das Datenbankschema unverändert bleibt).
- Profilfotos (`profilbilder/`, nicht öffentlich): Mitglied lädt im Mitgliederbereich hoch; sichtbar für das Mitglied, Admin/Kasse und die Trainer seiner Kurse (im Team: „Mitglieder in diesem Team / Kurs“). Wird beim Löschen des Kontos mit gelöscht und ist Teil der Datensicherung.

## Website-Seiten (neu)

- **/trainingszeiten** – Wochenplan aller Trainings (aus Teams & Kurse), filterbar nach Bereich und Alter
- **/termine** – mit Kalender-Abo (`/termine/kalender.ics`, webcal), Einzeltermin als .ics, Google-Kalender-Link
- **/suche** – Suche über Teams, News, Termine, Seiten (Lupe im Menü)
- **/sponsoren** – aus der Sammlung „Sponsoren“; Logo-Laufband auf der Startseite (ab 3 Logos)
- **/galerie**, **/galerie/[album]** – Fotoalben mit Großansicht; Alben eines Teams auch auf der Teamseite
- **/mitmachen** – Ehrenamts-Gesuche mit „Ich bin dabei“ → Kontaktformular
- Kontaktseite: Anfahrt-Karte (OpenStreetMap lädt erst nach Klick; Koordinaten in den Vereinsdaten)
- Teilen-Knopf (WhatsApp, Facebook, E-Mail, Link) bei News, Terminen, Teams, Alben, Gesuchen
- Google: strukturierte Daten (Verein, Termine, News, Teams, Brotkrumen); Vorschaubild beim Teilen je Seite (`public/og-bsv.jpg` als Standard)
- Neue Bild-Uploads werden in WebP-Größen umgerechnet (kleiner, schneller)

## Datensicherung

Verwaltung → **💾 Datensicherung** (nur Web-Admins): „Sicherung jetzt erstellen“ legt Datenbank (alle Tabellen als JSON) und alle Dateien (`medien`, `dokumente`) als **eine** Datei `backups/bsv-sicherung_JJJJ-MM-TT_HH-MM.tar.gz` ab – ohne pg_dump. Herunterladen und zusätzlich extern aufbewahren. Ohne Verwaltung: `pnpm sicherung:erstellen`.

**Einspielen** (ersetzt alle Inhalte; vorher wird automatisch gesichert): Server stoppen, `pnpm sicherung:einspielen <datei>` (ohne Datei: neueste; mit `ja` am Ende ohne Rückfrage). Der `ENCRYPTION_KEY` ist nicht enthalten – getrennt aufbewahren.

## Papierkorb & Datenschutz-Fristen

Gelöschtes (außer Benutzerkonten) landet 30 Tage im **Papierkorb** (Reiter „Papierkorb“ in jeder Liste) und wird danach täglich automatisch endgültig gelöscht. **Einstellungen → Datenschutz-Fristen** legt fest, wann erledigte Anfragen, bearbeitete Mitgliedsanträge und Formular-Eingänge aufgeräumt werden – per Knopf oder automatisch. Das Dashboard erinnert.

## Mitglieder-Dokumente

Dateien „Nur für Mitglieder“ liegen in `dokumente/` (nicht öffentlich) und werden nur an Angemeldete ausgeliefert (`/api/dokumente/file/…`). Einbinden über Vereinsdaten → Satzung & Downloads. Alte öffentliche Dateien zieht der Knopf „In den geschützten Bereich umziehen“ um.

## Sicherheit

- `.env` enthält Geheimnisse und wird **nie** eingecheckt (siehe `.env.example`).
- IBANs werden mit AES-256-GCM verschlüsselt gespeichert. `ENCRYPTION_KEY` **nie ändern**, sonst sind gespeicherte IBANs nicht mehr lesbar – sicher aufbewahren (z. B. Passwortmanager des Vorstands).
- Login-Sperre nach 5 Fehlversuchen für 10 Minuten.
- Fotos: Beim Hochladen ist die Angabe „Sind Personen zu erkennen?“ Pflicht (Einwilligung).
- Rollen-Übersicht zeigt die letzte Anmeldung; Zugänge mit Verwaltungsrechten, die seit 6 Monaten ungenutzt sind, werden markiert.
- Verwaltung als App: `public/verwaltung.webmanifest` (Startbildschirm-Symbol).

## Aufbau

- `src/collections` – Datenmodell (Angebote, Termine, Ausfälle, Probetraining, Mitgliedsanträge, News, Seiten, Medien, Benutzer)
- `src/access/roles.ts` – alle Zugriffsregeln an einer Stelle
- `src/Verein/config.ts` – Vereinsdaten (Adressen, Beiträge; Hauptsponsor jetzt in „Sponsoren“)
- `src/app/(frontend)` – die öffentliche Website (Seiten)
- `src/bsv` – BSV-Design: Bausteine (`components`), Datenabfragen (`data.ts`), Hilfsfunktionen (`lib.ts`), Startinhalte (`seed`)
- `src/app/(frontend)/bsv.css` – Farben, Schriften, Abstände und Animationen an einer Stelle
- `seed/` – Bilder und Texte der alten Website für die Startinhalte

## Öffentliche Formulare

Mitgliedsantrag, Probetraining und Kontakt sind gegen Spam geschützt (unsichtbares Honeypot-Feld und höchstens 8 Anfragen pro 10 Minuten und IP-Adresse). Externe Inhalte (FuPa, FUSSBALL.DE) laden erst nach Klick.
