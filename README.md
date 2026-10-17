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

**Beenden:** `Strg + C`, danach `docker compose down`.

## Rollen

| Rolle | Darf |
|---|---|
| Admin | alles, Rollen vergeben |
| Redaktion | News, Termine, Seiten, Teams & Kurse |
| Kasse | Mitgliedsanträge inkl. Bankdaten |
| Übungsleitung | eigene Angebote pflegen, Ausfälle melden, eigene Probetraining-Anfragen |
| Mitglied | nur Mitgliederbereich auf der Website |

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
