# Live-Betrieb der BSV-Website

Diese Anleitung bringt die Website auf einen eigenen Server (VPS, z. B. netcup oder Hetzner) und hält sie dort aktuell.
Alle Befehle stehen zum Kopieren da. Wo `www.buedericher-spielverein.de` steht, die echte Adresse einsetzen.

**Überblick**

```
Besucher ──HTTPS──▶ Caddy (Port 443, Zertifikat automatisch) ──▶ Website (nur 127.0.0.1:3000) ──▶ PostgreSQL (nur lokal)
                                                                   └─ Ordner medien/, profilbilder/, passantraege/, kuendigungen/, dokumente/, backups/
```

- Genau **eine** Website-Instanz (Ratenbegrenzung und tägliche Aufgaben laufen im Arbeitsspeicher).
- Die Website selbst ist von außen nicht erreichbar – nur über Caddy. Caddy setzt die echte Besucher-Adresse (`X-Real-IP`).
- Datenbank-Aufbau ausschließlich über **Migrationen** (`src/migrations`). Sie laufen beim Start automatisch.
- Täglich eine verschlüsselte Sicherung in `backups/`, gespiegelt auf einen externen Speicher.

---

## 0. Schnellweg: alles mit einem Befehl (empfohlen)

`deploy/einrichten.sh` erledigt die Abschnitte 1, 2 und (optional) 3 automatisch. Es stellt am Anfang ein paar Fragen
(Adresse, `ENCRYPTION_KEY`, optional E-Mail-Versand und Sicherungsdatei) und richtet dann alles ein. Mehrfaches Starten
schadet nicht, eine vorhandene `.env` wird nie überschrieben.

1. **Server bestellen:** Ubuntu 24.04 LTS. Bei der Bestellung, wenn möglich, gleich einen **SSH-Schlüssel** hinterlegen
   (am PC in PowerShell: `ssh-keygen -t ed25519`, dann den Inhalt von `C:\Users\<du>\.ssh\id_ed25519.pub` einfügen).
   Danach steht die **IP-Adresse** des Servers in der Bestellbestätigung bzw. im Kundenbereich.
2. **Skript (und optional die Sicherung) auf den Server kopieren**, am PC in PowerShell:
   ```powershell
   scp F:\BSV-Website\app\deploy\einrichten.sh root@<IP-Adresse>:/root/
   scp F:\BSV-Website\app\backups\bsv-sicherung_<datum>.tar.gz.enc root@<IP-Adresse>:/root/    # optional
   ```
3. **Anmelden und starten:**
   ```powershell
   ssh root@<IP-Adresse>
   bash einrichten.sh          # erst nur ausprobieren: BSV_PROBE=1 bash einrichten.sh
   ```
   Unterwegs zeigt das Skript einen Schlüssel an, der einmal bei GitHub eingetragen wird
   (Repository → Settings → Deploy keys → „Add deploy key“, **ohne** Schreibrecht). Dann Enter drücken.
4. **Am Ende** zeigt es das Datenbank-Passwort (in den Passwortmanager) und die nächsten Schritte: A-Eintrag bei
   SiteGround setzen (MX bleibt!), dann `https://<Adresse>/api/gesund` prüfen.

**Generalprobe:** Beim ersten Mal als Adresse z. B. `test.buedericher-spielverein.de` angeben und bei SiteGround nur für
`test` einen A-Eintrag auf den Server setzen. Die alte Website bleibt dabei völlig unberührt. Bei einer Adresse ohne
`www` schreibt das Skript `BSV_ERINNERUNGEN=aus` in die `.env`: Die Generalprobe verschickt dann keine automatischen
Mails (Erinnerungen, Monatsbericht) an echte Personen.

Passt alles, für den echten Betrieb das Skript noch einmal starten und als Adresse `www.buedericher-spielverein.de`
angeben. Beim zweiten Lauf fragt es nicht mehr nach Schlüssel und E-Mail. Es bietet an, in `/srv/bsv/.env` die Adresse
umzustellen und `BSV_ERINNERUNGEN=aus` zu löschen (beides mit „J“ bestätigen; der vorherige Stand bleibt als
`/srv/bsv/.env.vorher`). Dann baut es über `deploy/update.sh` neu: Sicherung vorher, bei Fehlern läuft die bisherige
Version weiter. Eine Sicherungsdatei vom PC spielt es erst **nach** dem Update ein, damit neue Tabellen mit übernommen
werden. Zum Schluss den A-Eintrag für `www` und die Domain ohne `www` umstellen.

Wer lieber von Hand ändert: in `/srv/bsv/.env` `NEXT_PUBLIC_SERVER_URL` anpassen, die Zeile `BSV_ERINNERUNGEN=aus` löschen,
dann `./deploy/update.sh --neu-bauen` als Nutzer `bsv`.

Zurück zur alten Website: den A-Eintrag bei SiteGround einfach wieder auf die alte Adresse stellen.

Die folgenden Abschnitte beschreiben dieselben Schritte von Hand – zum Nachlesen oder falls etwas schiefgeht.

## 1. Server vorbereiten (einmalig, ca. 30 Minuten)

Empfehlung: Ubuntu 24.04 LTS, 2 CPU, 4 GB RAM, 40 GB SSD.

```bash
# als root bzw. mit sudo
apt update && apt -y upgrade
apt -y install unattended-upgrades fail2ban ufw git curl postgresql caddy rclone
dpkg-reconfigure -plow unattended-upgrades          # automatische Sicherheitsupdates: „Ja“

# Firewall: nur SSH, HTTP, HTTPS
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

# SSH nur mit Schlüssel; root nur mit Schlüssel (vorher eigenen Schlüssel hinterlegen und die Anmeldung testen!)
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/00-bsv.conf
sshd -t && systemctl restart ssh

# Node.js 24 LTS + pnpm (Sicherheits-Updates bis 30.04.2028; Node.js 22 nur bis 30.04.2027).
# GitHub prüft bei jedem Push mit Node.js 24: frische Datenbank, Migrationen, Build, Start (Workflow „Node.js 24“).
# Die Verwaltung (Datensicherung → „Wartung“) zeigt, bis wann die installierte Version Updates bekommt.
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
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
NODE_ENV=production pnpm payload migrate     # legt alle Tabellen an („Migrated: …“)
echo "BSV_DIST_DIR=.next-a" > .build-env
NODE_ENV=production BSV_DIST_DIR=.next-a pnpm build
exit                              # zurück zu root
```

### Dienst und HTTPS

```bash
cp /srv/bsv/deploy/bsv.service /etc/systemd/system/bsv.service
systemctl daemon-reload && systemctl enable --now bsv
journalctl -u bsv -f              # Protokoll ansehen (Strg+C beendet nur die Anzeige)

cp /srv/bsv/deploy/Caddyfile /etc/caddy/Caddyfile && nano /etc/caddy/Caddyfile   # Domain prüfen
systemctl reload caddy
```

DNS: A- (und ggf. AAAA-) Eintrag der Domain auf die Server-IP. Sobald der zeigt, holt Caddy das Zertifikat selbst.

**Prüfen:**
- `curl -s https://www.buedericher-spielverein.de/api/gesund` → `{"ok":true}`
- Von außen `http://<Server-IP>:3000` → **keine** Verbindung (gut so)
- `https://www.buedericher-spielverein.de/admin/create-first-user` → **403** (gesperrt, siehe unten)

### Erstes Konto (nur ohne Sicherung)

„Erstes Konto anlegen“ im Browser ist live gesperrt (in der Website und zusätzlich in Caddy/nginx) – sonst könnte sich
jemand, der die neue Adresse vor dir findet, selbst zum Web-Admin machen. Wer **keine** Sicherung einspielt, legt das
erste Konto auf dem Server an (`einrichten.sh` fragt das automatisch ab):

```bash
sudo -u bsv -H bash -c 'cd /srv/bsv && NODE_ENV=production pnpm konto:erstes'
```

Fragt Name, E-Mail und Passwort (unsichtbar) ab, legt einen Web-Admin an und tut nichts, wenn es schon Konten gibt.
Danach im Browser anmelden und die Zwei-Faktor-Anmeldung einrichten.

### Geschütztes Konto aufheben (Notfall)

Ein Web-Admin kann sein eigenes Konto schützen (Haken „Mein Konto schützen“ – nur für ihn selbst sichtbar). Dann kann
niemand sonst dieses Konto ändern, herabstufen oder löschen, auch kein anderer Web-Admin. Fällt die Person aus oder
muss ihr Zugang entzogen werden, geht das nur mit Server-Zugang:

```bash
sudo -u postgres psql bsv -c "UPDATE users SET konto_geschuetzt = false WHERE konto_geschuetzt = true;"
```

Danach kann ein anderer Web-Admin das Konto wie jedes andere bearbeiten.

## 3. Inhalte vom PC übernehmen

Auf dem PC in der Verwaltung: **Einstellungen → Datensicherung → „Jetzt sichern“**, Datei herunterladen
(`bsv-sicherung_….tar.gz.enc`). Dann auf den Server kopieren und einspielen:

```bash
scp bsv-sicherung_*.tar.gz.enc <dein-nutzer>@<server>:/tmp/
sudo mv /tmp/bsv-sicherung_*.tar.gz.enc /srv/bsv/backups/ && sudo chown bsv:bsv /srv/bsv/backups/*
sudo systemctl stop bsv
sudo -u bsv -H bash -c 'cd /srv/bsv && NODE_ENV=production pnpm sicherung:einspielen bsv-sicherung_<datum>.tar.gz.enc'
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
und kurz durchklicken. Dafür muss in der `.env` am PC derselbe `ENCRYPTION_KEY` stehen wie auf dem Server. Danach am PC die
automatisch angelegte Sicherung vom Stand davor wieder einspielen, damit keine echten Mitgliederdaten auf dem PC bleiben.
In der Verwaltung der Live-Website unter Datensicherung → Wartung „✓ Heute erfolgreich getestet“ klicken.

**Notfall auf dem Server einspielen** (z. B. nach versehentlichem Löschen): die Befehle stehen auch in der Verwaltung unter
Datensicherung → „Sicherung wieder einspielen“:

```bash
sudo systemctl stop bsv
sudo -u bsv -H bash -c 'cd /srv/bsv && NODE_ENV=production pnpm sicherung:einspielen bsv-sicherung_<datum>.tar.gz.enc'
sudo systemctl start bsv
```

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

Das Skript sichert, holt den neuen Stand, migriert die Datenbank, baut **neben** der laufenden Website, schaltet um und prüft
`/api/gesund`. Antwortet die Website nicht, schaltet es automatisch auf den alten Stand zurück. Ausfallzeit: wenige Sekunden.

Vorher immer `pnpm audit --prod` im Blick haben (Sicherheitsmeldungen zu Paketen).

### Sicherheitsmeldungen zu Paketen

- Die Website selbst prüft täglich Node.js, PostgreSQL, die direkt genutzten Pakete und (live) die Server-Updates. Ergebnis:
  Verwaltung → Einstellungen → **„Sicherheit“**, Reiter „Updates“ (nur Web-Admin), Hinweise im Dashboard und im Monatsbericht.
  Abschalten mit `BSV_PAKETPRUEFUNG=aus`.
- GitHub prüft **jeden Morgen** automatisch (`.github/workflows/sicherheit-woechentlich.yml`) und bei jedem Push. Bei einer hohen oder
  kritischen Lücke in einem Live-Paket schlägt die Prüfung fehl und GitHub schickt eine E-Mail. Dann: Update einspielen
  (`pnpm update <paket>` bzw. Payload/Next-Update), testen, `./deploy/update.sh`.
- Zusätzlich empfohlen: im Repository unter *Settings → Code security* „Dependabot alerts“ einschalten.
- **Bewusst geprüfte Ausnahmen** (`package.json` → `pnpm.auditConfig.ignoreGhsas`). Jede Ausnahme braucht eine Begründung und ein
  Datum zum erneuten Prüfen:

| Meldung | Paket | Warum unkritisch | Erneut prüfen |
|---|---|---|---|
| GHSA-vfj7-8cjw-p6xm | `braces` 3.0.3 (über `sass` → `chokidar`) | Nur beim Übersetzen der Stylesheets (Build/Dateiüberwachung) im Einsatz; Besucher können keine Muster an `braces` übergeben. Es gibt noch keine reparierte Version. | 01.2027 bzw. sobald `sass`/Next eine neue Version liefert |

### Zurück auf eine Sicherung

```bash
sudo systemctl stop bsv
sudo -u bsv -H bash -c 'cd /srv/bsv && git checkout <alter-commit> && pnpm install --frozen-lockfile --prod=false && NODE_ENV=production pnpm sicherung:einspielen <datei>'
sudo -u bsv -H bash -c 'cd /srv/bsv && NODE_ENV=production BSV_DIST_DIR=$(sed -n "s/^BSV_DIST_DIR=//p" .build-env) pnpm build'
sudo systemctl start bsv
```

### Schlüssel wechseln (`ENCRYPTION_KEY`)

Nur nötig, wenn der Schlüssel bekannt geworden sein könnte (z. B. Laptop mit der `.env` gestohlen, `.env` versehentlich
verschickt) – oder vorsorglich, wenn jemand mit Server-Zugang ausscheidet. **Nie den Schlüssel einfach austauschen**: Dann sind
IBANs, Zwei-Faktor und alle Sicherungen unlesbar.

1. **Sicherung erstellen** (Verwaltung → Datensicherung → „Jetzt sichern“) – noch mit dem alten Schlüssel.
2. **Website anhalten:** `sudo systemctl stop bsv` (am PC: Server-Fenster schließen).
3. **Neuen Schlüssel erzeugen:** `openssl rand -hex 32`. In der `.env`:
   ```
   ENCRYPTION_KEY_ALT=<bisheriger Wert von ENCRYPTION_KEY>
   ENCRYPTION_KEY=<neuer Schlüssel>
   ```
   Den neuen Schlüssel sofort im Passwortmanager des Vorstands speichern.
4. **Probelauf:** `sudo -u bsv -H bash -c 'cd /srv/bsv && pnpm schluessel:wechseln'` – zeigt, wie viele Werte und Sicherungen
   umgestellt werden. Ändert nichts.
5. **Ausführen:** `… pnpm schluessel:wechseln ausfuehren`
   - War auch die **Datenbank** betroffen (z. B. Server-Einbruch, Sicherung abhandengekommen)? Dann
     `… pnpm schluessel:wechseln ausfuehren zwei-faktor-neu` – setzt die Zwei-Faktor-Anmeldung aller Konten zurück; jede Person
     richtet sie beim nächsten Anmelden neu ein. (Ein neuer Schlüssel allein schützt nicht, wenn die Zwei-Faktor-Geheimnisse
     schon mit dem alten Schlüssel ausgelesen wurden.)
   - Die Datenbank wird in einem Schritt umgestellt und vorher geprüft – bei einem Fehler bleibt alles, wie es war.
     Mehrfaches Ausführen schadet nicht.
   - Jede Sicherung im Ordner `backups` wird umgeschlüsselt – außen und innen (IBANs darin), damit sie auch ohne den alten
     Schlüssel vollständig eingespielt werden kann.
6. **Website starten:** `sudo systemctl start bsv`. Im Protokoll steht die Warnung „Schlüsselwechsel nicht abgeschlossen“, im
   Dashboard ein Hinweis für Web-Admins – solange `ENCRYPTION_KEY_ALT` gesetzt ist.
7. **Aufräumen:**
   - Externe Kopien (Storage Box) sind noch mit dem alten Schlüssel verschlüsselt → dort löschen, neue Sicherung hochladen.
   - Gedruckte Mitgliedsausweise (QR-Code) und Wiederherstellungscodes gelten nur, solange `ENCRYPTION_KEY_ALT` gesetzt ist →
     Ausweise neu drucken; wer Wiederherstellungscodes braucht, lässt die Zwei-Faktor-Anmeldung zurücksetzen und richtet sie neu ein.
   - **Danach `ENCRYPTION_KEY_ALT` aus der `.env` löschen** und neu starten. Bei einem echten Leck: sofort, ohne auf Ausweise zu warten.
8. War die **ganze `.env`** betroffen? Dann auch `PAYLOAD_SECRET` (meldet alle ab), `PREVIEW_SECRET` und das SMTP-Passwort wechseln.

Eine **alte Sicherung** (z. B. von der Storage Box) einspielen, die noch mit dem alten Schlüssel gemacht wurde: `ENCRYPTION_KEY_ALT`
vorübergehend wieder eintragen, einspielen, danach `pnpm schluessel:wechseln ausfuehren` und `ENCRYPTION_KEY_ALT` wieder löschen.

Geprüft wird das Ganze mit `pnpm test:schluessel` (eigene Test-Datenbank, fasst nichts Echtes an).

## 8. Für Entwicklung: Feld-Änderungen und Migrationen

Beim Entwickeln (`pnpm dev`) passt Payload die lokale Datenbank automatisch an. Live passiert das **nie** automatisch.
Deshalb nach jeder Änderung an Feldern, Sammlungen oder Globals:

```powershell
pnpm payload migrate:create kurze-beschreibung
```

Die neue Datei in `src/migrations/` mit committen. Prüfen lässt sich das mit einer leeren Test-Datenbank:
`DATABASE_URL=…/bsv_test pnpm payload migrate` – danach muss der Produktions-Build darauf starten.

Sicherheits-Regressionstests (lokal, Entwicklungsserver muss laufen): `pnpm test:sicherheit`.
