#!/usr/bin/env bash
# Sicherungen zusätzlich AUSSERHALB des Servers ablegen (Pflicht: fällt der Server aus, sind sonst auch die Sicherungen weg).
# Die Dateien sind bereits verschlüsselt (.tar.gz.enc) – der Speicher-Anbieter kann sie nicht lesen.
#
# Einrichten (einmalig, als Nutzer „bsv“):
#   1. Speicher buchen, z. B. Hetzner Storage Box oder netcup Storage (SFTP/WebDAV)
#   2. sudo apt install rclone   und   rclone config   → Ziel namens „extern“ anlegen (Typ sftp oder webdav)
#   3. Testlauf:  ./deploy/sicherung-extern.sh
#   4. Täglich automatisch (04:30 Uhr):  crontab -e  →  30 4 * * * /srv/bsv/deploy/sicherung-extern.sh >> /srv/bsv/backups/extern.log 2>&1
#
# Gespiegelt wird der Ordner backups/ – was dort durch die Aufbewahrungsregel wegfällt, wird auch extern gelöscht.
set -euo pipefail
cd "$(dirname "$0")/.."
ZIEL="${BSV_EXTERN_ZIEL:-extern:bsv-sicherungen}"
rclone sync backups/ "$ZIEL" --include "bsv-sicherung_*.tar.gz.enc" --transfers 2 --checksum
echo "$(date '+%F %T') Sicherungen nach $ZIEL gespiegelt: $(ls backups/bsv-sicherung_*.tar.gz.enc 2>/dev/null | wc -l) Dateien"
