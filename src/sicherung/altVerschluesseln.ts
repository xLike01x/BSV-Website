/**
 * pnpm sicherung:alte-verschluesseln
 * Verschlüsselt ältere, unverschlüsselte Sicherungen (bsv-sicherung_….tar.gz) im Ordner backups und löscht danach das Original.
 * Einmalig nach dem Update vom Oktober 2026 ausführen – vorher lagen Sicherungen im Klartext auf der Festplatte.
 */
import fs from 'fs'
import path from 'path'

import { SICHERUNGS_ORDNER, verschluesseln } from './kern'

const alte = fs.existsSync(SICHERUNGS_ORDNER) ? fs.readdirSync(SICHERUNGS_ORDNER).filter((f) => /^bsv-sicherung_[\w-]+\.tar\.gz$/.test(f)) : []
if (!alte.length) console.log('Keine unverschlüsselten Sicherungen gefunden.')
for (const f of alte) {
  const quelle = path.join(SICHERUNGS_ORDNER, f)
  const ziel = `${quelle}.enc`
  await verschluesseln(quelle, ziel)
  const zeit = fs.statSync(quelle).mtime
  fs.utimesSync(ziel, zeit, zeit)
  fs.rmSync(quelle)
  console.log(`✓ ${f} → ${f}.enc`)
}
