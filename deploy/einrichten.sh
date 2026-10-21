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
# Node.js 24 LTS (Sicherheits-Updates bis 04.2028); GitHub testet jeden Stand damit (Workflow „Node.js 24“)
NODE_MAJOR="${NODE_MAJOR:-24}"
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
{ echo; echo "===== Lauf vom $(date '+%d.%m.%Y %H:%M:%S') ====="; } >>"$PROTOKOLL" 2>/dev/null || PROTOKOLL=/dev/null
chmod 600 "$PROTOKOLL" 2>/dev/null || true
# Schon eingerichtet? Dann bleiben .env und Datenbank-Zugang, und das Bauen übernimmt deploy/update.sh
# (Sicherung vorher, Bauen neben der laufenden Website, Zurückschalten bei Fehlern).
BESTEHEND=""
[ -f "$ZIEL/.env" ] && BESTEHEND=1
GEBAUT=""
[ -f "$ZIEL/.build-env" ] && GEBAUT=1
# Zeichen, die die .env-Leser (Next.js, Node --env-file) unterschiedlich deuten, sind verboten:
# $ (Variable), # (Kommentar), Anführungszeichen, Backtick, Backslash, Leerzeichen
SICHER_MUSTER='^[]A-Za-z0-9._+/=@:,!%^*()?~;&|<>[{}-]+$'
sicherer_wert() { [[ "$1" =~ $SICHER_MUSTER ]]; }
# Eingabe lesen; ohne Tastatur (Ende der Eingabe) abbrechen statt endlos zu fragen
frage() { read -rp "$1" "$2" || { echo; fehler "Keine Eingabe mehr – abgebrochen."; exit 1; }; }
env_wert() { sed -n "s/^$1=//p" "$ZIEL/.env" | tail -n1; }

fett "BSV-Website – Server einrichten"
echo "  Erst ein paar Fragen, danach läuft alles von allein. Abbrechen jederzeit mit Strg+C."

# ---------------------------------------------------------------- Fragen
fett "1. Adresse der Website"
echo "  Für die Generalprobe z. B. test.buedericher-spielverein.de, für den echten Betrieb www.buedericher-spielverein.de"
while true; do
  frage "  Adresse [www.buedericher-spielverein.de]: " DOMAIN
  DOMAIN="${DOMAIN:-www.buedericher-spielverein.de}"
  DOMAIN="${DOMAIN,,}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%/}"
  [[ "$DOMAIN" =~ ^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$ ]] && break
  hinweis "Das sieht nicht nach einer Adresse aus (nur Kleinbuchstaben, z. B. www.beispiel.de)."
done

p=""; a=""; SCHLUESSEL=""; SMTP_HOST=""; SMTP_PORT="465"; SMTP_USER=""; SMTP_PASS=""; SMTP_FROM=""
if [ -n "$BESTEHEND" ]; then
  fett "2./3. Schlüssel und E-Mail-Versand"
  ok "Schon eingerichtet ($ZIEL/.env) – keine Eingabe nötig"
else
fett "2. Der geheime Schlüssel (ENCRYPTION_KEY)"
echo "  Genau derselbe wie in der .env auf deinem PC (steht im Passwortmanager). Die Eingabe bleibt unsichtbar."
while true; do
  read -rsp "  ENCRYPTION_KEY: " SCHLUESSEL || { echo; fehler "Keine Eingabe mehr – abgebrochen."; exit 1; }; echo
  if [ ${#SCHLUESSEL} -lt 32 ]; then hinweis "Zu kurz (mindestens 32 Zeichen). Bitte aus dem Passwortmanager kopieren."; continue; fi
  if [[ "$SCHLUESSEL" =~ bitte|ersetzen|beispiel ]]; then hinweis "Das ist noch der Platzhalter aus .env.example."; continue; fi
  if ! sicherer_wert "$SCHLUESSEL"; then
    hinweis "Der Schlüssel enthält Leer- oder Sonderzeichen wie \$ # \" ' \\ – die liest die .env nicht überall gleich."
    echo "    Ist das wirklich genau der Wert aus der .env vom PC (der Schlüssel darf nie geändert werden)?"
    echo "    Dann abbrechen und die .env von Hand anlegen: deploy/README.md, Abschnitt 2."
    read -rp "  Noch einmal eingeben? (J/n) " b || exit 1
    [[ "$b" =~ ^[nN] ]] && exit 1
    continue
  fi
  read -rsp "  Zur Kontrolle noch einmal: " SCHLUESSEL2 || exit 1; echo
  [ "$SCHLUESSEL" = "$SCHLUESSEL2" ] && break
  hinweis "Die beiden Eingaben sind verschieden – bitte noch einmal."
done
unset SCHLUESSEL2

fett "3. E-Mail-Versand (geht auch später, siehe deploy/README.md Abschnitt 4)"
read -rp "  Jetzt einrichten? (j/N) " a
if [[ "$a" =~ ^[jJ] ]]; then
  while true; do
    frage "  Postausgangsserver (z. B. mail.beispiel.de): " SMTP_HOST
    SMTP_HOST="${SMTP_HOST,,}"; SMTP_HOST="${SMTP_HOST//[[:space:]]/}"
    [[ "$SMTP_HOST" =~ ^[a-z0-9.-]+\.[a-z0-9-]{2,}$ ]] && break
    hinweis "Bitte nur die Adresse, z. B. mail.beispiel.de"
  done
  while true; do
    frage "  Port [465]: " p; SMTP_PORT="${p//[[:space:]]/}"; SMTP_PORT="${SMTP_PORT:-465}"
    [[ "$SMTP_PORT" =~ ^[0-9]{2,5}$ ]] && break
    hinweis "Bitte eine Zahl, meist 465 oder 587"
  done
  while true; do
    frage "  Benutzer/E-Mail (z. B. website@buedericher-spielverein.de): " SMTP_USER
    SMTP_USER="${SMTP_USER//[[:space:]]/}"
    [ -n "$SMTP_USER" ] && sicherer_wert "$SMTP_USER" && break
    hinweis "Ohne Leer- und Sonderzeichen wie \$ # Anführungszeichen"
  done
  while true; do
    read -rsp "  Passwort des Postfachs (unsichtbar): " SMTP_PASS || exit 1; echo
    sicherer_wert "$SMTP_PASS" && break
    hinweis "Das Passwort enthält Leer- oder Sonderzeichen wie \$ # \" ' \\ – die liest die .env nicht sicher. Am besten beim Anbieter ein Passwort ohne diese Zeichen setzen, oder den E-Mail-Versand später von Hand eintragen."
    read -rp "  Später eintragen? (J/n) " b || exit 1; [[ "$b" =~ ^[nN] ]] || { SMTP_HOST=""; SMTP_PASS=""; break; }
  done
  if [ -n "$SMTP_HOST" ]; then
    while true; do
      frage "  Absender [$SMTP_USER]: " p; SMTP_FROM="${p//[[:space:]]/}"; SMTP_FROM="${SMTP_FROM:-$SMTP_USER}"
      [[ "$SMTP_FROM" == *@* ]] && sicherer_wert "$SMTP_FROM" && break
      hinweis "Bitte eine E-Mail-Adresse"
    done
  fi
fi
fi

fett "4. Inhalte vom PC übernehmen (geht auch später)"
echo "  Liegt eine Sicherungsdatei (bsv-sicherung_….tar.gz.enc) schon auf dem Server? Dann den Pfad angeben, z. B. /root/bsv-sicherung_2026-10-21_09-00.tar.gz.enc"
SICHERUNG=""
while true; do
  frage "  Pfad (leer = später): " SICHERUNG
  [ -z "$SICHERUNG" ] && break
  if [ -f "$SICHERUNG" ] && [[ "$SICHERUNG" =~ \.tar\.gz(\.enc)?$ ]]; then
    [[ "$(basename "$SICHERUNG")" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] && break
    hinweis "Der Dateiname enthält ungewöhnliche Zeichen – bitte umbenennen (z. B. bsv-sicherung.tar.gz.enc)."
    continue
  fi
  hinweis "Datei nicht gefunden oder keine Sicherung (.tar.gz.enc)."
done

# SSH: Passwort-Anmeldung nur abschalten, wenn bestätigt ist, dass die Anmeldung mit Schlüssel klappt
SSH_HAERTEN=""
SSH_SCHON=""
[ -f /etc/ssh/sshd_config.d/00-bsv.conf ] && SSH_SCHON=1
SCHLUESSEL_DA=""
for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do [ -s "$f" ] && SCHLUESSEL_DA=1; done
if [ -n "$SCHLUESSEL_DA" ] && [ -z "$SSH_SCHON" ]; then
  fett "5. SSH-Anmeldung absichern"
  echo "  Danach geht die Anmeldung am Server NUR noch mit SSH-Schlüssel, nicht mehr mit Passwort."
  echo "  Nur mit „j“ antworten, wenn du dich gerade mit deinem Schlüssel angemeldet hast (ohne Passwort-Eingabe)."
  frage "  Passwort-Anmeldung abschalten? (j/N) " a
  [[ "$a" =~ ^[jJ] ]] && SSH_HAERTEN=1
fi

ROOT_DOMAIN=""
[[ "$DOMAIN" == www.* ]] && ROOT_DOMAIN="${DOMAIN#www.}"

# Erneuter Lauf (z. B. von der Generalprobe auf www): passt die vorhandene .env zur Adresse?
URL_ANPASSEN=""; ERINNERUNGEN_AN=""
if [ -n "$BESTEHEND" ]; then
  ALT_URL="$(env_wert NEXT_PUBLIC_SERVER_URL)"
  if [ "$ALT_URL" != "https://$DOMAIN" ]; then
    hinweis "In der .env steht als Adresse noch „${ALT_URL:-nichts}“, gewählt ist https://$DOMAIN."
    frage "  In der .env auf https://$DOMAIN ändern? (J/n) " a
    [[ "$a" =~ ^[nN] ]] || URL_ANPASSEN=1
  fi
  if [ -n "$ROOT_DOMAIN" ] && [ "$(env_wert BSV_ERINNERUNGEN)" = "aus" ]; then
    hinweis "In der .env steht noch BSV_ERINNERUNGEN=aus (Generalprobe): keine „Passt noch?“-Mails, kein Monatsbericht."
    frage "  Für den echten Betrieb einschalten (Zeile löschen)? (J/n) " a
    [[ "$a" =~ ^[nN] ]] || ERINNERUNGEN_AN=1
  fi
fi

fett "Zusammenfassung"
echo "  Adresse:          https://$DOMAIN${ROOT_DOMAIN:+   (und $ROOT_DOMAIN → Weiterleitung)}"
if [ -n "$BESTEHEND" ]; then
  echo "  Einstellungen:    vorhandene .env${URL_ANPASSEN:+ (Adresse wird angepasst)}${ERINNERUNGEN_AN:+ (automatische Mails werden eingeschaltet)}"
  [ -n "$GEBAUT" ] && echo "  Bauen:            über deploy/update.sh (Sicherung vorher, bei Fehlern zurück)"
else
  echo "  ENCRYPTION_KEY:   ${#SCHLUESSEL} Zeichen"
  echo "  E-Mail-Versand:   ${SMTP_HOST:-später}"
fi
if [ -n "$SSH_SCHON" ]; then echo "  SSH:              schon abgesichert (nur mit Schlüssel)"
else echo "  SSH:              $([ -n "$SSH_HAERTEN" ] && echo 'nur noch mit Schlüssel' || echo 'unverändert')"; fi
echo "  Sicherung:        ${SICHERUNG:-später}"
echo "  Node.js:          $NODE_MAJOR"
if [ -n "$PROBE" ]; then
  fett "Probelauf – es wurde nichts verändert."
  echo "  Ablauf wäre: Updates → Firewall/fail2ban → SSH absichern → Node.js/pnpm → Nutzer „bsv“ → Datenbank → Zugang zu GitHub"
  if [ -n "$GEBAUT" ]; then echo "  → .env prüfen → Dienst → deploy/update.sh (Sicherung, Update, Migrationen, Bauen) → ${SICHERUNG:+Sicherung einspielen → }Start → HTTPS (Caddy)"
  else echo "  → Website holen → .env → Dienst → Pakete → Prüfung → Datenbank-Tabellen → ${SICHERUNG:+Sicherung einspielen → }Bauen → Start → HTTPS (Caddy)"; fi
  exit 0
fi
frage "  Los geht's? (J/n) " a
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
# Nur nach ausdrücklicher Bestätigung (Frage 5) – sonst sperrt man sich womöglich aus.
if [ -n "$SSH_HAERTEN" ]; then
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
elif [ -n "$SSH_SCHON" ]; then
  ok "Schon abgesichert (nur Anmeldung mit SSH-Schlüssel)"
else
  hinweis "Passwort-Anmeldung bleibt vorerst an. Später nachholen, wenn die Anmeldung mit Schlüssel klappt: Skript erneut starten (deploy/README.md, Abschnitt 1)."
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
  # Passwort über die Standardeingabe – so taucht es nicht in der Prozessliste auf
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='bsv'" | grep -q 1; then
    printf "ALTER USER bsv WITH PASSWORD '%s';\n" "$DB_PW" | sudo -u postgres psql -q -v ON_ERROR_STOP=1 >>"$PROTOKOLL" 2>&1
  else
    printf "CREATE USER bsv WITH PASSWORD '%s';\n" "$DB_PW" | sudo -u postgres psql -q -v ON_ERROR_STOP=1 >>"$PROTOKOLL" 2>&1
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
  ok "Website-Dateien vorhanden (aktualisiert wird gleich über deploy/update.sh)"
fi

schritt "Einstellungen (.env)"
if [ -f "$ZIEL/.env" ]; then
  if [ -n "$URL_ANPASSEN" ] || [ -n "$ERINNERUNGEN_AN" ]; then
    cp -p "$ZIEL/.env" "$ZIEL/.env.vorher"
    [ -n "$URL_ANPASSEN" ] && sed -i "s|^NEXT_PUBLIC_SERVER_URL=.*|NEXT_PUBLIC_SERVER_URL=https://${DOMAIN}|" "$ZIEL/.env"
    [ -n "$ERINNERUNGEN_AN" ] && sed -i -e '/^# Generalprobe: keine automatischen Mails/d' -e '/^BSV_ERINNERUNGEN=aus$/d' "$ZIEL/.env"
    chown bsv:bsv "$ZIEL/.env" "$ZIEL/.env.vorher"; chmod 600 "$ZIEL/.env" "$ZIEL/.env.vorher"
    ok ".env angepasst (vorheriger Stand: $ZIEL/.env.vorher)"
  else
    ok "Vorhandene .env bleibt unverändert"
  fi
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
    if [ -z "$ROOT_DOMAIN" ]; then
      echo "# Generalprobe: keine automatischen Mails (Erinnerungen, Monatsbericht) an echte Personen. Für den echten Betrieb löschen."
      echo "BSV_ERINNERUNGEN=aus"
    fi
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

# Dienst-Datei vor dem Bauen einrichten: deploy/update.sh startet die Website über systemctl neu
schritt "Dienst einrichten"
UNIT_NEU=""
cmp -s "$ZIEL/deploy/bsv.service" /etc/systemd/system/bsv.service || UNIT_NEU=1
install -m 644 "$ZIEL/deploy/bsv.service" /etc/systemd/system/bsv.service
systemctl daemon-reload
systemctl enable bsv >>"$PROTOKOLL" 2>&1
ok "Dienst „bsv“ eingerichtet"

# Sicherung einspielen – immer erst NACH den Migrationen, damit neue Tabellen und Spalten mit übernommen werden
einspielen() {
  schritt "Inhalte vom PC einspielen"
  NAME="$(basename "$SICHERUNG")"
  sudo -u bsv mkdir -p "$ZIEL/backups"
  chmod 700 "$ZIEL/backups"
  install -o bsv -g bsv -m 600 "$SICHERUNG" "$ZIEL/backups/$NAME"
  systemctl stop bsv >>"$PROTOKOLL" 2>&1 || true
  if ! als_bsv "NODE_ENV=production pnpm -s sicherung:einspielen '$NAME' ja" | tee -a "$PROTOKOLL"; then
    [ -n "$GEBAUT" ] && systemctl start bsv >>"$PROTOKOLL" 2>&1
    fehler "Einspielen fehlgeschlagen – Protokoll: $PROTOKOLL"
    exit 1
  fi
  ok "Inhalte übernommen${GEBAUT:+ (der vorherige Stand wurde vorher automatisch gesichert)}"
}

if [ -n "$GEBAUT" ]; then
  # Schon einmal gebaut: wie jedes Update – Sicherung, neuer Stand, Prüfung, Migrationen, Bauen neben der
  # laufenden Website, Umschalten, bei Fehlern automatisch zurück
  schritt "Aktualisieren und neu bauen (über deploy/update.sh)"
  systemctl is-active --quiet bsv || systemctl start bsv >>"$PROTOKOLL" 2>&1 || true
  if ! sudo -u bsv -H env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 bash -c "cd $ZIEL && ./deploy/update.sh --neu-bauen" | tee -a "$PROTOKOLL"; then
    systemctl is-active --quiet bsv || systemctl start bsv >>"$PROTOKOLL" 2>&1 || true
    fehler "Aktualisieren fehlgeschlagen – die bisherige Version läuft weiter. Protokoll: $PROTOKOLL"
    exit 1
  fi
  ok "Aktualisiert"
  [ -n "$SICHERUNG" ] && einspielen
else
  schritt "Pakete installieren (dauert ein paar Minuten)"
  als_bsv "pnpm install --frozen-lockfile --prod=false" >>"$PROTOKOLL" 2>&1
  ok "Pakete installiert"

  schritt "Einstellungen prüfen"
  als_bsv "pnpm -s live:pruefen" | tee -a "$PROTOKOLL"

  schritt "Datenbank-Tabellen anlegen"
  als_bsv "NODE_ENV=production pnpm payload migrate" >>"$PROTOKOLL" 2>&1
  ok "Datenbank auf dem neuesten Stand"

  [ -n "$SICHERUNG" ] && einspielen

  schritt "Website bauen (dauert ein paar Minuten)"
  als_bsv "NODE_ENV=production BSV_DIST_DIR=.next-a pnpm build" >>"$PROTOKOLL" 2>&1
  echo "BSV_DIST_DIR=.next-a" | sudo -u bsv tee "$ZIEL/.build-env" >/dev/null
  ok "Gebaut"
fi

schritt "Website starten"
if [ -n "$UNIT_NEU" ] || [ -n "$URL_ANPASSEN$ERINNERUNGEN_AN" ]; then systemctl restart bsv
else systemctl is-active --quiet bsv || systemctl start bsv; fi
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
