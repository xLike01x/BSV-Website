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
| Übungsleitung | eigene Teams/Kurse pflegen, Ausfälle, Team-News und -Bilder, eigene Probetraining-Anfragen |
| Team-Redaktion | eigene Teams/Kurse: Team-News, Bilder, Zeiten, Ausfälle (z. B. Pressewart einer Mannschaft) |
| Mitglied | nur Mitgliederbereich auf der Website |

**Rollen-Übersicht** (`/admin/rollen`, nur Admins): wer welche Rolle hat und für welche Teams – mit Reitern nach Person, Team und Rolle.

„Eigene“ Teams: im jeweiligen Team/Kurs unter **Verantwortliche** eintragen. Team-News erscheinen auf der Teamseite; auf Startseite und im Newsroom erst, wenn die Redaktion den Haken „Auch auf Startseite“ setzt.

## Zwei-Faktor-Anmeldung

Alle Rollen außer „Mitglied“ brauchen für die Verwaltung zusätzlich einen Code aus einer Authenticator-App (Google/Microsoft Authenticator, iPhone-Passwörter …). Beim ersten Login wird die App per QR-Code verbunden; dabei gibt es 10 Wiederherstellungscodes für den Notfall. Handy verloren? Ein Admin entfernt im Benutzer den Haken „Zwei-Faktor-Anmeldung eingerichtet“ – beim nächsten Login wird neu eingerichtet. Lokal zum Entwickeln abschaltbar mit `ZWEI_FAKTOR=aus` in der `.env`.

## Texte ändern

Alle Überschriften und festen Texte der Website stehen in der Verwaltung unter **Inhalte → Website-Texte**. Platzhalter wie `{teams}` oder `{mitglieder}` werden automatisch durch aktuelle Zahlen ersetzt.

## Menü

Alle Einträge im Hauptmenü (inkl. Reihenfolge), das Aufklappmenü „Verein“ und die Fußzeile (inkl. Kontakt-Spalte mit beliebigen Social-Media-Links) pflegt die Redaktion unter **Inhalte → Menü & Fußzeile**. Leere Liste = Standardmenü.

## Hilfe in der Verwaltung

- **„? Hilfe“** oben rechts auf jeder Seite: Erklärung des Bereichs, Schritt-für-Schritt-Anleitungen, Feld-Erklärungen, Hinweise je Rolle, FAQ, Rückmeldung 👍/👎, „Frage an den Admin“ (landet bei den Kontaktanfragen).
- **Hilfe-Center** (`/admin/hilfe`): Suche, Videos, alle Anleitungen und Fragen. **Kurzanleitung je Rolle** zum Drucken: `/admin/hilfe/kurzanleitung`.
- **Live-Hinweise** beim Bearbeiten (News, Teams, Termine, Ausfälle, Seiten, Bilder): warnen z. B. vor fehlendem Titelbild und zeigen, wo ein Eintrag erscheint.
- **Tour** und **Erste Schritte** auf dem Dashboard für neue Nutzer.
- Eingebaute Texte: `src/components/Admin/Hilfe/texte.ts` und `extras.ts`. Eigene Ergänzungen ohne Code unter **Einstellungen → Hilfe-Texte**; Rückmeldungen unter **Einstellungen → Hilfe-Rückmeldungen** (nur Admins).
- **14 Hilfe-Videos** mit Untertiteln liegen in `public/hilfe/`. Neu aufnehmen (nach Design-Änderungen, nur lokal mit Testkonten – alles Angelegte wird danach wieder entfernt):
  ```
  BSV_URL=http://localhost:3000 BSV_ADMIN_EMAIL=… BSV_ADMIN_PASSWORT=… BSV_ADMIN_TOTP=… \
  BSV_TEAM_EMAIL=… BSV_TEAM_PASSWORT=… BSV_TEAM_TOTP=… node scripts/hilfe-videos.mjs [name …]
  ```
  Danach je Video: `ffmpeg -ss 0.8 -i hilfe-videos-roh/<name>.webm -vf scale=1152:-2 -c:v libx264 -crf 28 -pix_fmt yuv420p -movflags +faststart -an public/hilfe/<name>.mp4` (Vorschaubild `<name>.jpg` daneben).

## Sicherheit

- `.env` enthält Geheimnisse und wird **nie** eingecheckt (siehe `.env.example`).
- IBANs werden mit AES-256-GCM verschlüsselt gespeichert. `ENCRYPTION_KEY` **nie ändern**, sonst sind gespeicherte IBANs nicht mehr lesbar – sicher aufbewahren (z. B. Passwortmanager des Vorstands).
- Login-Sperre nach 5 Fehlversuchen für 10 Minuten.

## Aufbau

- `src/collections` – Datenmodell (Angebote, Termine, Ausfälle, Probetraining, Mitgliedsanträge, News, Seiten, Medien, Benutzer)
- `src/access/roles.ts` – alle Zugriffsregeln an einer Stelle
- `src/Verein/config.ts` – Vereinsdaten (Adressen, Beiträge, Sponsor)
- `src/app/(frontend)` – die öffentliche Website (Seiten)
- `src/bsv` – BSV-Design: Bausteine (`components`), Datenabfragen (`data.ts`), Hilfsfunktionen (`lib.ts`), Startinhalte (`seed`)
- `src/app/(frontend)/bsv.css` – Farben, Schriften, Abstände und Animationen an einer Stelle
- `seed/` – Bilder und Texte der alten Website für die Startinhalte

## Öffentliche Formulare

Mitgliedsantrag, Probetraining und Kontakt sind gegen Spam geschützt (unsichtbares Honeypot-Feld und höchstens 8 Anfragen pro 10 Minuten und IP-Adresse). Externe Inhalte (FuPa, FUSSBALL.DE) laden erst nach Klick.
