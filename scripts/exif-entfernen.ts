/**
 * Einmalig (und nach dem Einspielen alter Daten): Standort- und Kameradaten aus bereits hochgeladenen Fotos entfernen.
 * `pnpm medien:exif` – ändert nur Dateien, die tatsächlich Metadaten enthalten; Bildinhalt und Größe bleiben.
 * Neue Uploads werden seit Oktober 2026 automatisch bereinigt.
 */
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const ORDNER = ['medien', 'passantraege', 'kuendigungen', 'dokumente', 'profilbilder']
const BILD = /\.(jpe?g|png|webp)$/i

let geprueft = 0
let bereinigt = 0
for (const o of ORDNER) {
  const dir = path.resolve(process.cwd(), o)
  const dateien = await fs.readdir(dir).catch(() => [] as string[])
  for (const name of dateien) {
    if (!BILD.test(name)) continue
    const datei = path.join(dir, name)
    geprueft++
    const meta = await sharp(datei).metadata().catch(() => null)
    if (!meta || (!meta.exif && !meta.xmp && !meta.iptc)) continue
    const puffer = await sharp(datei).rotate().toBuffer()
    await fs.writeFile(datei, puffer)
    bereinigt++
    console.log(`bereinigt: ${o}/${name}`)
  }
}
console.log(`${geprueft} Fotos geprüft, ${bereinigt} bereinigt`)
