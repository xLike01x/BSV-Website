/**
 * pnpm sicherung:einspielen <datei>   (mit „ja“ am Ende ohne Rückfrage)
 * Ersetzt ALLE Inhalte der Datenbank durch die Sicherung und legt Bilder/Dateien zurück.
 * Vorher wird automatisch eine Sicherung des jetzigen Stands erstellt.
 */
import fs from 'fs'
import path from 'path'
import readline from 'readline/promises'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SICHERUNGS_ORDNER, sicherungEinspielen, sicherungErstellen, sicherungenAuflisten, type Pool } from './kern'

// „payload run“ reicht nur Wörter ohne „--“ durch: pnpm sicherung:einspielen <datei> [ja]
const argumente = process.argv.slice(2)
const ja = argumente.some((x) => x.toLowerCase() === 'ja')
const arg = argumente.find((x) => x.toLowerCase() !== 'ja')
let datei = arg ? (fs.existsSync(arg) ? arg : path.join(SICHERUNGS_ORDNER, arg)) : null
if (!datei) {
  const neueste = sicherungenAuflisten()[0]
  if (!neueste) {
    console.log('Keine Sicherung gefunden. Aufruf: pnpm sicherung:einspielen <datei>')
    process.exit(1)
  }
  datei = path.join(SICHERUNGS_ORDNER, neueste.datei)
}
if (!fs.existsSync(datei)) {
  console.log(`Datei nicht gefunden: ${datei}`)
  process.exit(1)
}

console.log(`\nSicherung einspielen: ${path.basename(datei)}`)
console.log('ACHTUNG: Alle aktuellen Inhalte (News, Teams, Konten, Anträge …) werden durch den Stand der Sicherung ersetzt.')
if (!ja) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const antwort = await rl.question('Zum Fortfahren „JA“ eintippen: ')
  rl.close()
  if (antwort.trim() !== 'JA') {
    console.log('Abgebrochen – nichts geändert.')
    process.exit(0)
  }
}

const payload = await getPayload({ config })
const pool = (payload.db as unknown as { pool: Pool }).pool
const vorher = await sicherungErstellen(pool, 'automatisch vor dem Einspielen')
console.log(`Zur Sicherheit wurde der jetzige Stand gesichert: backups/${vorher.datei}`)
await sicherungEinspielen(pool, datei, console.log)
console.log('\n✅ Fertig. Bitte die Website neu starten (Server-Fenster schließen und BSV-Website-Update.bat erneut starten).')
process.exit(0)
