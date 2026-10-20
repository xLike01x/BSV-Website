#!/usr/bin/env bash
# Update der Live-Website – auf dem Server als Nutzer „bsv“ ausführen:
#   cd /srv/bsv && ./deploy/update.sh
#
# Ablauf (bricht bei jedem Fehler ab, die laufende Website bleibt dann unverändert):
#   1. Sicherung (Datenbank + Dateien, verschlüsselt)
#   2. Neuen Stand von GitHub holen
#   3. Pakete installieren (genau die Versionen aus pnpm-lock.yaml)
#   4. Konfiguration prüfen (pnpm live:pruefen)
#   5. Datenbank-Migrationen (nur hinzufügende Änderungen – die laufende Website kommt damit weiter klar)
#   6. Neu bauen – in den gerade NICHT aktiven Build-Ordner (.next-a / .next-b), die Website läuft weiter
#   7. Umschalten + Neustart, dann Gesundheitsprüfung. Klappt die nicht: automatisch zurück auf den alten Build.
set -euo pipefail

cd "$(dirname "$0")/.."
ORDNER="$(pwd)"
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export TZ=Europe/Berlin
export NODE_OPTIONS=--no-deprecation

if [ "$(id -un)" != "bsv" ]; then
  echo "Bitte als Nutzer „bsv“ ausführen:  sudo -u bsv -H ./deploy/update.sh"
  exit 1
fi

AKTIV=".next-a"
[ -f .build-env ] && AKTIV="$(sed -n 's/^BSV_DIST_DIR=//p' .build-env)"
[ -z "$AKTIV" ] && AKTIV=".next-a"
if [ "$AKTIV" = ".next-a" ]; then NEU=".next-b"; else NEU=".next-a"; fi
ALT_COMMIT="$(git rev-parse HEAD)"

schritt() { printf '\n\033[1m%s\033[0m\n' "$1"; }
zurueck_code() {
  echo "→ Code wird auf den vorherigen Stand ($ALT_COMMIT) zurückgesetzt, die Website läuft unverändert weiter."
  git reset --hard "$ALT_COMMIT" >/dev/null
  pnpm install --frozen-lockfile --prod=false >/dev/null
}

schritt "1/7 Sicherung"
pnpm -s sicherung:erstellen

schritt "2/7 Neuen Stand holen"
# Dateien, die der Build selbst anpasst (Next.js trägt seine Build-Ordner ein), vor dem Holen zurücksetzen
git checkout -- tsconfig.json next-env.d.ts 2>/dev/null || true
git fetch --quiet origin
if [ "$(git rev-parse HEAD)" = "$(git rev-parse '@{u}')" ] && [ "${1:-}" != "--neu-bauen" ]; then
  echo "Schon aktuell – nichts zu tun. (Trotzdem neu bauen: ./deploy/update.sh --neu-bauen)"
  exit 0
fi
git log --oneline HEAD..'@{u}' | head -20
git pull --ff-only --quiet

schritt "3/7 Pakete installieren"
pnpm install --frozen-lockfile --prod=false || { zurueck_code; exit 1; }

schritt "4/7 Konfiguration prüfen"
pnpm -s live:pruefen || { zurueck_code; exit 1; }

schritt "5/7 Datenbank-Migrationen"
pnpm -s payload migrate < /dev/null || { echo "Migration fehlgeschlagen – Website läuft mit altem Stand weiter. Sicherung siehe Schritt 1."; zurueck_code; exit 1; }

schritt "6/7 Bauen (in $NEU, die Website läuft solange weiter)"
rm -rf "$NEU"
BSV_DIST_DIR="$NEU" pnpm -s build < /dev/null || { echo "Bauen fehlgeschlagen – die Website läuft mit dem alten Stand weiter."; zurueck_code; exit 1; }

schritt "7/7 Umschalten und neu starten"
echo "BSV_DIST_DIR=$NEU" > .build-env
sudo /usr/bin/systemctl restart bsv
for i in $(seq 1 30); do
  sleep 2
  if curl -fsS -m 5 http://127.0.0.1:3000/api/gesund >/dev/null 2>&1; then
    echo "✓ Website läuft mit dem neuen Stand ($(git rev-parse --short HEAD))."
    exit 0
  fi
done

echo "✗ Die Website antwortet nicht – zurück auf den alten Build ($AKTIV)."
echo "BSV_DIST_DIR=$AKTIV" > .build-env
git reset --hard "$ALT_COMMIT" >/dev/null
pnpm install --frozen-lockfile --prod=false >/dev/null || true
sudo /usr/bin/systemctl restart bsv
echo "Fehlerdetails:  journalctl -u bsv -n 100"
echo "Falls eine Migration gelaufen ist und der alte Stand damit nicht klarkommt: neueste Sicherung aus Schritt 1 einspielen (deploy/README.md → „Zurück auf eine Sicherung“)."
exit 1
