#!/usr/bin/env bash
# =====================================================================================================
#  BSV-Website – Einrichtung eines neuen Servers mit EINEM Befehl
#
#  Für: frischer Server mit Ubuntu 24.04 LTS (netcup, Hetzner …), als root angemeldet.
#  Aufruf:   bash einrichten.sh             (Datei vorher auf den Server kopieren, siehe deploy/README.md)
#  Probelauf: BSV_PROBE=1 bash einrichten.sh  (stellt nur die Fragen und zeigt, was passieren würde)
#
#  Das Skript stellt am Anfang ein paar Fragen und erledigt dann alles allein (ca. 15–25 Minuten):
#  Sicherheits-Updates, Firewall, Datenbank, Website, HTTPS. Es setzt die Schritte 1, 2 und optional 3
#  aus deploy/README.md um. Mehrfaches Starten ist unschädlich – Erledigtes wird übersprungen,
#  eine vorhandene .env wird nie überschrieben.
# =====================================================================================================
# shellcheck disable=SC1111,SC2024  # deutsche Anführungszeichen in Texten sind gewollt; Umleitungen schreibt root ins eigene Protokoll
set -euo pipefail

REPO="git@github.com:xLike01x/BSV-Website.git"
ZIEL="/srv/bsv"
NODE_MAJOR="${NODE_MAJOR:-22}"
# Öffentlicher Fingerabdruck von github.com (https://docs.github.com/de/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)
GITHUB_FP="SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU"
PROBE="${BSV_PROBE:-}"
PROTOKOLL="/root/bsv-einrichtung.log"

fett() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
hinweis() { printf '  \033[33m!\033[0m %s\n' "$*"; }
fehler() { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; }
SCHRITT="Start"
trap 'fehler "Abgebrochen bei: $SCHRITT. Details stehen in $PROTOKOLL. Das Skript kann einfach erneut gestartet werden."' ERR
schritt() { SCHRITT="$1"; fett "▶ $1"; }
leise() { "$@" >>"$PROTOKOLL" 2>&1; }
als_bsv() { sudo -u bsv -H env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NEXT_TELEMETRY_DISABLED=1 TZ=Europe/Berlin bash -c "cd $ZIEL && $1"; }

# ---------------------------------------------------------------- Voraussetzungen
if [ -z "$PROBE" ] && [ "$(id -u)" -ne 0 ]; then fehler "Bitte als root starten (z. B. „sudo bash einrichten.sh“)."; exit 1; fi
if [ -r /etc/os-release ]; then . /etc/os-release; else ID=unbekannt; VERSION_ID=; fi
if [ "${ID:-}" != "ubuntu" ] || [ "${VERSION_ID:-}" != "24.04" ]; then
  hinweis "Gedacht für Ubuntu 24.04 – gefunden: ${PRETTY_NAME:-unbekannt}."
  [ -z "$PROBE" ] && { read -rp "  Trotzdem fortfahren? (j/N) " a; [[ "$a" =~ ^[jJ] ]] || exit 1; }
fi
: >"$PROTOKOLL" 2>/dev/null || PROTOKOLL=/dev/null
chmod 600 "$PROTOKOLL" 2>/dev/null || true

fett "BSV-Website – Server einrichten"
echo "  Erst ein paar Fragen, danach läuft alles von allein. Abbrechen jederzeit mit Strg+C."

# ---------------------------------------------------------------- Fragen
fett "1. Adresse der Website"
echo "  Für die Generalprobe z. B. test.buedericher-spielverein.de, für den echten Betrieb www.buedericher-spielverein.de"
while true; do
  read -rp "  Adresse [www.buedericher-spielverein.de]: " DOMAIN
  DOMAIN="${DOMAIN:-www.buedericher-spielverein.de}"
  DOMAIN="${DOMAIN,,}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%/}"
  [[ "$DOMAIN" =~ ^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$ ]] && break
  hinweis "Das sieht nicht nach einer Adresse aus (nur Kleinbuchstaben, z. B. www.beispiel.de)."
done

fett "2. Der geheime Schlüssel (ENCRYPTION_KEY)"
echo "  Genau derselbe wie in der .env auf deinem PC (steht im Passwortmanager). Die Eingabe bleibt unsichtbar."
while true; do
  read -rsp "  ENCRYPTION_KEY: " SCHLUESSEL; echo
  if [ ${#SCHLUESSEL} -lt 32 ]; then hinweis "Zu kurz (mindestens 32 Zeichen). Bitte aus dem Passwortmanager kopieren."; continue; fi
  if [[ "$SCHLUESSEL" =~ bitte|ersetzen|beispiel ]]; then hinweis "Das ist noch der Platzhalter aus .env.example."; continue; fi
  read -rsp "  Zur Kontrolle noch einmal: " SCHLUESSEL2; echo
  [ "$SCHLUESSEL" = "$SCHLUESSEL2" ] && break
  hinweis "Die beiden Eingaben sind verschieden – bitte noch einmal."
done
unset SCHLUESSEL2

fett "3. E-Mail-Versand (geht auch später, siehe deploy/README.md Abschnitt 4)"
read -rp "  Jetzt einrichten? (j/N) " a
SMTP_HOST=""; SMTP_PORT="465"; SMTP_USER=""; SMTP_PASS=""; SMTP_FROM=""
if [[ "$a" =~ ^[jJ] ]]; then
  read -rp "  Postausgangsserver (z. B. mail.beispiel.de): " SMTP_HOST
  read -rp "  Port [465]: " p; SMTP_PORT="${p:-465}"
  read -rp "  Benutzer/E-Mail (z. B. website@buedericher-spielverein.de): " SMTP_USER
  read -rsp "  Passwort des Postfachs (unsichtbar): " SMTP_PASS; echo
  read -rp "  Absender [$SMTP_USER]: " p; SMTP_FROM="${p:-$SMTP_USER}"
fi

fett "4. Inhalte vom PC übernehmen (geht auch später)"
echo "  Liegt eine Sicherungsdatei (bsv-sicherung_….tar.gz.enc) schon auf dem Server? Dann den Pfad angeben, z. B. /root/bsv-sicherung_2026-10-21_09-00.tar.gz.enc"
SICHERUNG=""
while true; do
  read -rp "  Pfad (leer = später): " SICHERUNG
  [ -z "$SICHERUNG" ] && break
  [ -f "$SICHERUNG" ] && [[ "$SICHERUNG" =~ \.tar\.gz(\.enc)?$ ]] && break
  hinweis "Datei nicht gefunden oder keine Sicherung (.tar.gz.enc)."
done

ROOT_DOMAIN=""
[[ "$DOMAIN" == www.* ]] && ROOT_DOMAIN="${DOMAIN#www.}"

fett "Zusammenfassung"
echo "  Adresse:          https://$DOMAIN${ROOT_DOMAIN:+   (und $ROOT_DOMAIN → Weiterleitung)}"
echo "  ENCRYPTION_KEY:   ${#SCHLUESSEL} Zeichen"
echo "  E-Mail-Versand:   ${SMTP_HOST:-später}"
echo "  Sicherung:        ${SICHERUNG:-später}"
echo "  Node.js:          $NODE_MAJOR"
if [ -n "$PROBE" ]; then
  fett "Probelauf – es wurde nichts verändert."
  echo "  Ablauf wäre: Updates → Firewall/fail2ban → SSH absichern → Node.js/pnpm → Nutzer „bsv“ → Datenbank → Zugang zu GitHub"
  echo "  → Website holen → .env → Pakete → Prüfung → Datenbank-Tabellen → ${SICHERUNG:+Sicherung einspielen → }Bauen → Dienst → HTTPS (Caddy)"
  exit 0
fi
read -rp "  Los geht's? (J/n) " a
[[ "$a" =~ ^[nN] ]] && exit 0

# ---------------------------------------------------------------- System
schritt "System aktualisieren (dauert ein paar Minuten)"
export DEBIAN_FRONTEND=noninteractive
leise apt-get update
leise apt-get -y -o Dpkg::Options::=--force-confold upgrade
leise apt-get -y install unattended-upgrades fail2ban ufw git curl ca-certificates gnupg postgresql rclone openssl sudo
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now fail2ban >>"$PROTOKOLL" 2>&1 || true
ok "Updates installiert, automatische Sicherheits-Updates an, fail2ban läuft"

schritt "Firewall (nur SSH, HTTP, HTTPS)"
leise ufw allow OpenSSH
leise ufw allow 80/tcp
leise ufw allow 443/tcp
leise ufw --force enable
ok "Firewall an"

schritt "SSH absichern"
# Nur abschalten, was sicher ist: Passwort-Anmeldung erst, wenn ein SSH-Schlüssel hinterlegt ist – sonst sperrt man sich aus.
SCHLUESSEL_DA=""
for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do [ -s "$f" ] && SCHLUESSEL_DA=1; done
if [ -n "$SCHLUESSEL_DA" ]; then
  cat >/etc/ssh/sshd_config.d/00-bsv.conf <<'EOF'
# BSV: nur Anmeldung mit SSH-Schlüssel, root nur mit Schlüssel
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
  if sshd -t >>"$PROTOKOLL" 2>&1; then
    systemctl restart ssh >>"$PROTOKOLL" 2>&1 || systemctl restart sshd >>"$PROTOKOLL" 2>&1 || true
    ok "Anmeldung nur noch mit SSH-Schlüssel"
  else
    rm -f /etc/ssh/sshd_config.d/00-bsv.conf
    hinweis "SSH-Einstellung fehlerhaft – unverändert gelassen."
  fi
else
  hinweis "Kein SSH-Schlüssel hinterlegt – Passwort-Anmeldung bleibt vorerst an. Später nachholen (deploy/README.md, Abschnitt 1)."
fi

schritt "Node.js $NODE_MAJOR und pnpm"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" != "$NODE_MAJOR" ]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource.sh
  leise bash /tmp/nodesource.sh
  rm -f /tmp/nodesource.sh
  leise apt-get -y install nodejs
fi
leise corepack enable
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 leise corepack prepare pnpm@10 --activate
ok "Node.js $(node -v)"

schritt "Eigener Nutzer „bsv“ für die Website"
if ! id bsv >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$ZIEL" --shell /bin/bash bsv
fi
echo 'bsv ALL=(root) NOPASSWD: /usr/bin/systemctl restart bsv' >/etc/sudoers.d/bsv
chmod 440 /etc/sudoers.d/bsv
visudo -cf /etc/sudoers.d/bsv >>"$PROTOKOLL" 2>&1
ok "Nutzer bsv ($ZIEL)"

schritt "Datenbank"
DB_PW=""
if [ -f "$ZIEL/.env" ]; then
  ok "Vorhandene .env gefunden – Datenbank-Zugang bleibt, wie er ist"
else
  DB_PW="$(openssl rand -hex 24)"
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='bsv'" | grep -q 1; then
    sudo -u postgres psql -q -c "ALTER USER bsv WITH PASSWORD '$DB_PW';" >>"$PROTOKOLL" 2>&1
  else
    sudo -u postgres psql -q -c "CREATE USER bsv WITH PASSWORD '$DB_PW';" >>"$PROTOKOLL" 2>&1
  fi
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='bsv'" | grep -q 1 || sudo -u postgres psql -q -c "CREATE DATABASE bsv OWNER bsv;" >>"$PROTOKOLL" 2>&1
  ok "Datenbank „bsv“ mit eigenem, zufälligem Passwort (nur lokal erreichbar)"
fi

schritt "Zugang zu GitHub (nur lesen)"
sudo -u bsv mkdir -p "$ZIEL/.ssh"
chmod 700 "$ZIEL/.ssh"
if [ ! -f "$ZIEL/.ssh/github" ]; then
  sudo -u bsv ssh-keygen -q -t ed25519 -f "$ZIEL/.ssh/github" -N "" -C "bsv-server-$(hostname)"
fi
grep -q 'IdentityFile ~/.ssh/github' "$ZIEL/.ssh/config" 2>/dev/null || printf 'Host github.com\n  IdentityFile ~/.ssh/github\n  IdentitiesOnly yes\n' | sudo -u bsv tee -a "$ZIEL/.ssh/config" >/dev/null
# Echtheit von github.com prüfen, bevor wir dem Server vertrauen
GH_KEY="$(ssh-keyscan -t ed25519 github.com 2>/dev/null)"
if [ "$(echo "$GH_KEY" | ssh-keygen -lf - 2>/dev/null | awk '{print $2}')" != "$GITHUB_FP" ]; then
  fehler "Der Schlüssel von github.com passt nicht zum veröffentlichten Fingerabdruck – abgebrochen (Netzwerk prüfen)."
  exit 1
fi
grep -qF "$GH_KEY" "$ZIEL/.ssh/known_hosts" 2>/dev/null || echo "$GH_KEY" | sudo -u bsv tee -a "$ZIEL/.ssh/known_hosts" >/dev/null
chown -R bsv:bsv "$ZIEL/.ssh"
until sudo -u bsv -H git ls-remote "$REPO" HEAD >>"$PROTOKOLL" 2>&1; do
  echo
  echo "  Bitte diesen Schlüssel bei GitHub eintragen:"
  echo "  GitHub → Repository BSV-Website → Settings → Deploy keys → „Add deploy key“"
  echo "  Titel: BSV-Server · Haken „Allow write access“ NICHT setzen · Schlüssel einfügen:"
  echo
  echo "    $(cat "$ZIEL/.ssh/github.pub")"
  echo
  read -rp "  Eingetragen? Dann Enter drücken … " _
done
ok "GitHub erreichbar"

schritt "Website holen"
if [ ! -d "$ZIEL/.git" ]; then
  TMP="$(sudo -u bsv mktemp -d)"
  sudo -u bsv -H git clone -q "$REPO" "$TMP/bsv" >>"$PROTOKOLL" 2>&1
  sudo -u bsv mv "$TMP/bsv/.git" "$ZIEL/.git"
  rm -rf "$TMP"
  als_bsv "git reset -q --hard"
  ok "Website-Dateien geholt"
else
  als_bsv "git pull -q --ff-only" >>"$PROTOKOLL" 2>&1 || hinweis "Konnte nicht aktualisieren (lokale Änderungen?) – nutze den vorhandenen Stand."
  ok "Website-Dateien vorhanden"
fi

schritt "Einstellungen (.env)"
if [ -f "$ZIEL/.env" ]; then
  ok "Vorhandene .env bleibt unverändert"
else
  ENV_TMP="$(mktemp)"
  chmod 600 "$ENV_TMP"
  {
    echo "# Angelegt von deploy/einrichten.sh am $(date '+%d.%m.%Y %H:%M') – Werte nie in den Chat oder per E-Mail"
    echo "DATABASE_URL=postgresql://bsv:${DB_PW}@127.0.0.1:5432/bsv"
    echo "PAYLOAD_SECRET=$(openssl rand -hex 32)"
    echo "ENCRYPTION_KEY=${SCHLUESSEL}"
    echo "PREVIEW_SECRET=$(openssl rand -hex 32)"
    echo "NEXT_PUBLIC_SERVER_URL=https://${DOMAIN}"
    echo "NEXT_TELEMETRY_DISABLED=1"
    if [ -n "$SMTP_HOST" ]; then
      echo "SMTP_HOST=${SMTP_HOST}"
      echo "SMTP_PORT=${SMTP_PORT}"
      echo "SMTP_USER=${SMTP_USER}"
      echo "SMTP_PASS=${SMTP_PASS}"
      echo "SMTP_FROM=${SMTP_FROM}"
      echo "SMTP_FROM_NAME=BSV 1919"
    fi
  } >"$ENV_TMP"
  install -o bsv -g bsv -m 600 "$ENV_TMP" "$ZIEL/.env"
  rm -f "$ENV_TMP"
  ok ".env angelegt (nur für den Nutzer bsv lesbar)"
fi
unset SCHLUESSEL SMTP_PASS

schritt "Pakete installieren (dauert ein paar Minuten)"
als_bsv "pnpm install --frozen-lockfile --prod=false" >>"$PROTOKOLL" 2>&1
ok "Pakete installiert"

schritt "Einstellungen prüfen"
als_bsv "pnpm -s live:pruefen" | tee -a "$PROTOKOLL"

schritt "Datenbank-Tabellen anlegen"
als_bsv "NODE_ENV=production pnpm payload migrate" >>"$PROTOKOLL" 2>&1
ok "Datenbank auf dem neuesten Stand"

if [ -n "$SICHERUNG" ]; then
  schritt "Inhalte vom PC einspielen"
  systemctl stop bsv >>"$PROTOKOLL" 2>&1 || true
  sudo -u bsv mkdir -p "$ZIEL/backups"
  chmod 700 "$ZIEL/backups"
  NAME="$(basename "$SICHERUNG")"
  [[ "$NAME" =~ ^[A-Za-z0-9._-]+$ ]] || { fehler "Dateiname enthält ungewöhnliche Zeichen – bitte umbenennen (z. B. bsv-sicherung.tar.gz.enc)."; exit 1; }
  install -o bsv -g bsv -m 600 "$SICHERUNG" "$ZIEL/backups/$NAME"
  als_bsv "NODE_ENV=production pnpm -s sicherung:einspielen '$NAME' ja" | tee -a "$PROTOKOLL"
  ok "Inhalte übernommen"
fi

schritt "Website bauen (dauert ein paar Minuten)"
AKTIV=".next-a"
[ -f "$ZIEL/.build-env" ] && AKTIV="$(sed -n 's/^BSV_DIST_DIR=//p' "$ZIEL/.build-env")"
als_bsv "NODE_ENV=production BSV_DIST_DIR=${AKTIV:-.next-a} pnpm build" >>"$PROTOKOLL" 2>&1
echo "BSV_DIST_DIR=${AKTIV:-.next-a}" | sudo -u bsv tee "$ZIEL/.build-env" >/dev/null
ok "Gebaut"

schritt "Dienst einrichten und starten"
install -m 644 "$ZIEL/deploy/bsv.service" /etc/systemd/system/bsv.service
systemctl daemon-reload
systemctl enable bsv >>"$PROTOKOLL" 2>&1
systemctl restart bsv
for _ in $(seq 1 60); do
  curl -fsS --max-time 3 http://127.0.0.1:3000/api/gesund >/dev/null 2>&1 && break
  sleep 2
done
if curl -fsS --max-time 3 http://127.0.0.1:3000/api/gesund >/dev/null 2>&1; then ok "Website läuft (nur intern auf Port 3000)"; else
  fehler "Die Website antwortet nicht. Protokoll: journalctl -u bsv -n 100"
  exit 1
fi

schritt "HTTPS mit Caddy"
if ! command -v caddy >/dev/null; then
  if ! leise apt-get -y install caddy; then
    # Offizielle Paketquelle von Caddy, falls Ubuntu das Paket nicht hat
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' -o /etc/apt/sources.list.d/caddy-stable.list
    leise apt-get update
    leise apt-get -y install caddy
  fi
fi
CADDY_TMP="$(mktemp)"
if [ -n "$ROOT_DOMAIN" ]; then
  sed -e "s/www\.buedericher-spielverein\.de/${DOMAIN}/g" -e "s/^buedericher-spielverein\.de {/${ROOT_DOMAIN} {/" "$ZIEL/deploy/Caddyfile" >"$CADDY_TMP"
else
  # Nur eine Adresse (z. B. Generalprobe test.…): ohne Weiterleitungs-Block
  sed -e "s/www\.buedericher-spielverein\.de/${DOMAIN}/g" "$ZIEL/deploy/Caddyfile" | awk '/^# Ohne „www“/{exit} {print}' >"$CADDY_TMP"
fi
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy 2>/dev/null || true
if caddy validate --config "$CADDY_TMP" --adapter caddyfile >>"$PROTOKOLL" 2>&1; then
  install -m 644 "$CADDY_TMP" /etc/caddy/Caddyfile
  systemctl enable caddy >>"$PROTOKOLL" 2>&1 || true
  systemctl reload caddy >>"$PROTOKOLL" 2>&1 || systemctl restart caddy >>"$PROTOKOLL" 2>&1
  ok "Caddy eingerichtet für $DOMAIN"
else
  hinweis "Caddyfile ungültig – unverändert gelassen (Details im Protokoll)."
fi
rm -f "$CADDY_TMP"

schritt "Protokolle auf 14 Tage begrenzen"
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nMaxRetentionSec=14day\n' >/etc/systemd/journald.conf.d/bsv.conf
systemctl restart systemd-journald >>"$PROTOKOLL" 2>&1 || true
ok "Systemprotokoll wird nach 14 Tagen gelöscht"

# ---------------------------------------------------------------- Fertig
IP4="$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.' | grep -vE '^(10|127|172\.(1[6-9]|2[0-9]|3[01])|192\.168)\.' | head -1)"
trap - ERR
fett "✅ Fertig!"
if [ -n "$DB_PW" ]; then
  echo
  echo "  Datenbank-Passwort (JETZT in den Passwortmanager, wird nicht noch einmal angezeigt):"
  echo "    $DB_PW"
fi
cat <<EOF

  Nächste Schritte:
  1. Bei SiteGround (DNS der Domain) einen A-Eintrag setzen:
       ${DOMAIN}  →  ${IP4:-<IP-Adresse dieses Servers>}${ROOT_DOMAIN:+
       ${ROOT_DOMAIN}  →  ${IP4:-<IP-Adresse dieses Servers>}}
     Die MX-Einträge (E-Mail) NICHT ändern. Nach einigen Minuten holt Caddy das Zertifikat selbst.
  2. Prüfen: https://${DOMAIN}/api/gesund  →  {"ok":true}
  3. In der Verwaltung: eigenes Konto anmelden, Zwei-Faktor einrichten,
     Rollen & Rechte → Testkonten → „Alle Testkonten löschen“.
  4. Weiter mit der Go-Live-Checkliste (externe Sicherung, Überwachung, E-Mail-Test).

  Updates später:  sudo -u bsv -H bash -c 'cd /srv/bsv && ./deploy/update.sh'
  Protokoll:       journalctl -u bsv -f      ·   Einrichtungs-Protokoll: $PROTOKOLL
EOF
