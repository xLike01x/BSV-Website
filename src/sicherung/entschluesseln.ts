/**
 * pnpm sicherung:entschluesseln <datei>
 * Macht aus einer verschlüsselten Sicherung (.tar.gz.enc) eine normale .tar.gz – z. B. um sie mit 7-Zip anzusehen.
 * Braucht denselben ENCRYPTION_KEY wie beim Erstellen. Die entschlüsselte Datei enthält persönliche Daten im Klartext:
 * nach Gebrauch löschen, nie per E-Mail verschicken.
 */
import fs from 'fs'
import path from 'path'

import { entschluesseln, SICHERUNGS_ORDNER } from './kern'

const arg = process.argv.slice(2)[0]
const datei = arg ? (fs.existsSync(arg) ? arg : path.join(SICHERUNGS_ORDNER, arg)) : null
if (!datei || !fs.existsSync(datei)) {
  console.log('Aufruf: pnpm sicherung:entschluesseln bsv-sicherung_….tar.gz.enc')
  process.exit(1)
}
const ziel = datei.replace(/\.enc$/, '')
await entschluesseln(datei, ziel)
console.log(`✅ Entschlüsselt: ${ziel}\n⚠ Enthält persönliche Daten im Klartext – nach Gebrauch löschen.`)
