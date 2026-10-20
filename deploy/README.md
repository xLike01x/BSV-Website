# Live-Betrieb der BSV-Website

Diese Anleitung bringt die Website auf einen eigenen Server (VPS, z. B. netcup oder Hetzner) und hält sie dort aktuell.
Alle Befehle stehen zum Kopieren da. Wo `www.buedericher-spielverein.de` steht, die echte Adresse einsetzen.

**Überblick**

```
Besucher ──HTTPS──▶ Caddy (Port 443, Zertifikat automatisch) ──▶ Website (nur 127.0.0.1:3000) ──▶ PostgreSQL (nur lokal)
                                                                   └─ Ordner medien/, profilbilder/, passantraege/, dokumente/, backups/
```

- Genau **eine** Website-Instanz (Ratenbegrenzung und tägliche Aufgaben laufen im Arbeitsspeicher).
- Die Website selbst ist von außen nicht erreichbar – nur über Caddy. Caddy setzt die echte Besucher-Adresse (`X-Real-IP`).
- Datenbank-Aufbau ausschließlich über **Migrationen** (`src/migrations`). Sie laufen beim Start automatisch.
- Täglich eine verschlüsselte Sicherung in `backups/`, gespiegelt auf einen externen Speicher.

---

## 1. Server vorbereiten (einmalig, ca. 30 Minuten)

Empfehlung: Ubuntu 24.04 LTS, 2 CPU, 4 GB RAM, 40 GB SSD.

```bash
# als root bzw. mit sudo
apt update && apt -y upgrade
apt -y install unattended-upgrades fail2ban ufw git curl postgresql caddy rclone
dpkg-reconfigure -plow unattended-upgrades          # automatische Sicherheitsupdates: „Ja“

# Firewall: nur SSH, HTTP, HTTPS
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

# SSH nur mit Schlüssel, kein Root-Login (vorher eigenen Schlüssel hinterlegen und testen!)
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/; s/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# Node.js 22 LTS + pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt -y install nodejs
corepack enable && corepack prepare pnpm@10 --activate

# Eigener Nutzer für die Website
useradd --system --create-home --home-dir /srv/bsv --shell /bin/bash bsv
# „bsv“ darf (nur) die Website neu starten – für deploy/update.sh
echo 'bsv ALL=(root) NOPASSWD: /usr/bin/systemctl restart bsv' > /etc/sudoers.d/bsv && chmod 440 /etc/sudoers.d/bsv
```

### Datenbank

```bash
PW=$(openssl rand -hex 24); echo "Datenbank-Passwort: $PW   ← in den Passwortmanager"
sudo -u postgres psql -c "CREATE USER bsv WITH PASSWORD '$PW';"
sudo -u postgres psql -c "CREATE DATABASE bsv OWNER bsv;"
```

PostgreSQL lauscht unter Ubuntu standardmäßig nur lokal – so lassen.

## 2. Website installieren

```bash
sudo -u bsv -H bash
cd /srv/bsv
# Privates Repository: Zugriff per „Deploy key“ (GitHub → Repository → Settings → Deploy keys, nur Lesen)
ssh-keygen -t ed25519 -f ~/.ssh/github -N "" && cat ~/.ssh/github.pub     # diesen Schlüssel bei GitHub eintragen
printf 'Host github.com\n  IdentityFile ~/.ssh/github\n' >> ~/.ssh/config
git clone git@github.com:xLike01x/BSV-Website.git /tmp/bsv && mv /tmp/bsv/.git . && git reset --hard && rm -rf /tmp/bsv
umask 077
cp .env.example .env && nano .env
```

**.env ausfüllen** (Werte mit `openssl rand -hex 32` erzeugen):

| Eintrag | Wert |
|---|---|
| `DATABASE_URL` | `postgresql://bsv:<Datenbank-Passwort>@127.0.0.1:5432/bsv` |
| `PAYLOAD_SECRET` | neuer Zufallswert |
| `ENCRYPTION_KEY` | **derselbe** wie auf dem PC, auf dem die Daten entstanden sind (sonst sind IBANs, 2FA und Sicherungen unlesbar) |
| `PREVIEW_SECRET` | neuer Zufallswert |
| `NEXT_PUBLIC_SERVER_URL` | `https://www.buedericher-spielverein.de` (ohne `/` am Ende) |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `SMTP_…` | siehe Abschnitt „E-Mail-Versand“ |

`ZWEI_FAKTOR` und `BSV_TESTKONTEN` **nicht** eintragen – die Website startet damit live gar nicht.

```bash
chmod 600 .env
pnpm install --frozen-lockfile --prod=false
pnpm live:pruefen                 # muss „✓ Keine Fehler“ melden
echo "BSV_DIST_DIR=.next-a" > .build-env
NODE_ENV=production BSV_DIST_DIR=.next-a pnpm build
exit                              # zurück zu root
```

### Dienst und HTTPS

```bash
cp /srv/bsv/deploy/bsv.service /etc/systemd/system/bsv.service
systemctl daemon-reload && systemctl enable --now bsv
journalctl -u bsv -f              # beim ersten Start legt die Migration alle Tabellen an („Migrated: …“)

cp /srv/bsv/deploy/Caddyfile /etc/caddy/Caddyfile && nano /etc/caddy/Caddyfile   # Domain prüfen
systemctl reload caddy
```

DNS: A- (und ggf. AAAA-) Eintrag der Domain auf die Server-IP. Sobald der zeigt, holt Caddy das Zertifikat selbst.

**Prüfen:**
- `curl -s https://www.buedericher-spielverein.de/api/gesund` → `{"ok":true}`
- Von außen `http://<Server-IP>:3000` → **keine** Verbindung (gut so)

## 3. Inhalte vom PC übernehmen

Auf dem PC in der Verwaltung: **Einstellungen → Datensicherung → „Jetzt sichern“**, Datei herunterladen
(`bsv-sicherung_….tar.gz.enc`). Dann auf den Server kopieren und einspielen:

```bash
scp bsv-sicherung_*.tar.gz.enc <dein-nutzer>@<server>:/tmp/
sudo mv /tmp/bsv-sicherung_*.tar.gz.enc /srv/bsv/backups/ && sudo chown bsv:bsv /srv/bsv/backups/*
sudo systemctl stop bsv
sudo -u bsv -H bash -c 'cd /srv/bsv && pnpm sicherung:einspielen bsv-sicherung_<datum>.tar.gz.enc'
sudo systemctl start bsv
```

Danach in der Verwaltung:
1. **Rollen & Rechte → Testkonten → „Alle Testkonten löschen“** (die Testkonten können sich live ohnehin nicht anmelden).
2. Eigenes Admin-Konto anmelden, Zwei-Faktor einrichten, Wiederherstellungscodes sicher ablegen.
3. Eine Testanfrage über das Kontaktformular schicken und wieder löschen.

## 4. E-Mail-Versand

Nötig für Registrierung, „Passwort vergessen“ und Benachrichtigungen. Ein Postfach beim Mail-Anbieter der Domain anlegen
(z. B. `website@buedericher-spielverein.de`) und in die `.env` eintragen:

```
SMTP_HOST=<Postausgangsserver des Anbieters>
SMTP_PORT=465
SMTP_USER=website@buedericher-spielverein.de
SMTP_PASS=<Passwort des Postfachs>
SMTP_FROM=website@buedericher-spielverein.de
SMTP_FROM_NAME=BSV 1919
```

Beim Anbieter der Domain **SPF, DKIM und DMARC** einrichten (sonst landen Mails im Spam). Danach `sudo systemctl restart bsv`,
dann „Passwort vergessen“ mit dem eigenen Konto testen.

## 5. Sicherungen außerhalb des Servers

Die Website sichert täglich selbst (verschlüsselt, `backups/`, behält 14 Stück + je eine pro Woche/Monat).
Damit ein Serverausfall nicht auch die Sicherungen mitnimmt, zusätzlich extern spiegeln – Anleitung in
`deploy/sicherung-extern.sh` (Hetzner Storage Box / netcup Storage, `rclone`).

**Einmal im Quartal Wiederherstellung testen:** neueste Sicherung auf dem PC einspielen (`pnpm sicherung:einspielen <datei>`)
und kurz durchklicken. Datum in der Go-Live-Checkliste notieren.

`ENCRYPTION_KEY` zusätzlich im Passwortmanager des Vorstands ablegen – ohne ihn ist jede Sicherung wertlos.

## 6. Überwachung

- Uptime-Dienst (z. B. UptimeRobot, Better Stack, healthchecks.io) auf `https://www.buedericher-spielverein.de/api/gesund`, Alarm per E-Mail.
- Protokoll: `journalctl -u bsv -f` · Caddy: `/var/log/caddy/bsv.log` (14 Tage, siehe Caddyfile)
- Systemprotokoll auf 14 Tage begrenzen (enthält IP-Adressen): in `/etc/systemd/journald.conf` `MaxRetentionSec=14day` setzen, dann `sudo systemctl restart systemd-journald`.
- Platz: `df -h /srv` – Warnung ab 80 % (Medien und Sicherungen wachsen).
- Meldungen „CSP blockiert …“ im Protokoll: ein Widget (FuPa/FUSSBALL.DE) braucht eine weitere Adresse → in `next.config.ts` ergänzen.

## 7. Updates einspielen

```bash
sudo -u bsv -H bash -c 'cd /srv/bsv && ./deploy/update.sh'
```

Das Skript sichert, holt den neuen Stand, baut ihn **neben** der laufenden Website, migriert die Datenbank, schaltet um und prüft
`/api/gesund`. Antwortet die Website nicht, schaltet es automatisch auf den alten Stand zurück. Ausfallzeit: wenige Sekunden.

Vorher immer `pnpm audit --prod` im Blick haben (Sicherheitsmeldungen zu Paketen).

### Zurück auf eine Sicherung

```bash
sudo systemctl stop bsv
sudo -u bsv -H bash -c 'cd /srv/bsv && git checkout <alter-commit> && pnpm install --frozen-lockfile --prod=false && pnpm sicherung:einspielen <datei>'
sudo -u bsv -H bash -c 'cd /srv/bsv && NODE_ENV=production BSV_DIST_DIR=$(sed -n "s/^BSV_DIST_DIR=//p" .build-env) pnpm build'
sudo systemctl start bsv
```

## 8. Für Entwicklung: Feld-Änderungen und Migrationen

Beim Entwickeln (`pnpm dev`) passt Payload die lokale Datenbank automatisch an. Live passiert das **nie** automatisch.
Deshalb nach jeder Änderung an Feldern, Sammlungen oder Globals:

```powershell
pnpm payload migrate:create kurze-beschreibung
```

Die neue Datei in `src/migrations/` mit committen. Prüfen lässt sich das mit einer leeren Test-Datenbank:
`DATABASE_URL=…/bsv_test pnpm payload migrate` – danach muss der Produktions-Build darauf starten.

Sicherheits-Regressionstests (lokal, Entwicklungsserver muss laufen): `pnpm test:sicherheit`.
