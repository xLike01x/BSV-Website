/**
 * Verkleinerte Fassungen älterer Bilder neu erzeugen (als WebP, ca. 30–60 % kleiner).
 *
 * Seit Oktober 2026 erzeugt die Mediathek beim Hochladen WebP-Fassungen. Bilder von vorher haben noch JPG/PNG-Fassungen.
 * Dieses Skript lädt jedes betroffene Bild noch einmal „neu hoch“ – aus der eigenen Originaldatei auf dem Server.
 * Titel, Alt-Text, Fokuspunkt, Team, Einwilligung usw. bleiben erhalten; nur die Dateien werden neu geschrieben.
 *
 *   pnpm medien:webp            → zeigt nur, welche Bilder betroffen wären (ändert nichts)
 *   pnpm medien:webp ausfuehren → erzeugt die Fassungen neu
 *
 * Vorher eine Datensicherung erstellen (Technik → Datensicherung). Bilder im Papierkorb werden übersprungen.
 */
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import config from '@payload-config'

const ausfuehren = process.argv.slice(2).some((a) => a === 'ausfuehren' || a === 'ausführen')
const payload = await getPayload({ config })
const ordner = path.resolve(process.cwd(), 'medien')

type Groesse = { filename?: string | null; mimeType?: string | null }
type Bild = { id: number; filename?: string | null; mimeType?: string | null; sizes?: Record<string, Groesse | undefined> | null }

const BILDTYPEN = new Set(['image/jpeg', 'image/png', 'image/webp'])
const alteFassung = (b: Bild) => Object.entries(b.sizes ?? {}).some(([name, s]) => name !== 'og' && name !== 'logo' && s?.filename && s.mimeType !== 'image/webp')

const alle = (await payload.find({ collection: 'media', limit: 0, pagination: false, depth: 0, overrideAccess: true })).docs as unknown as Bild[]
const betroffen = alle.filter((b) => b.filename && b.mimeType && BILDTYPEN.has(b.mimeType) && alteFassung(b))
console.log(`${alle.length} Bilder in der Mediathek, ${betroffen.length} mit alten JPG/PNG-Fassungen.`)

let ok = 0
let fehler = 0
for (const b of betroffen) {
  const datei = path.join(ordner, path.basename(String(b.filename)))
  const daten = await fs.readFile(datei).catch(() => null)
  if (!daten) {
    fehler++
    console.log(`✗ ${b.filename}: Originaldatei fehlt – übersprungen`)
    continue
  }
  if (!ausfuehren) {
    console.log(`· ${b.filename}`)
    continue
  }
  try {
    await payload.update({
      collection: 'media',
      id: b.id,
      data: {},
      file: { data: daten, mimetype: String(b.mimeType), name: path.basename(String(b.filename)), size: daten.length },
      overrideAccess: true,
      // Kein Neuaufbau der ganzen Website pro Bild
      context: { ohneRevalidierung: true, disableRevalidate: true },
    })
    ok++
    console.log(`✓ ${b.filename}`)
  } catch (e) {
    fehler++
    console.log(`✗ ${b.filename}: ${(e as Error).message}`)
  }
}

console.log(ausfuehren ? `Fertig: ${ok} neu erzeugt, ${fehler} Fehler.` : 'Nur angezeigt. Zum Ausführen: pnpm medien:webp ausfuehren')
process.exit(fehler ? 1 : 0)
