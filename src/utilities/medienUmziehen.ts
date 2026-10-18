import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

/** Bilder und Dateien der Mediathek – NICHT im öffentlichen Ordner, damit nur Payload sie ausliefert (Zugriffsregeln, Papierkorb) */
export const MEDIEN_ORDNER = path.join(process.cwd(), 'medien')
const ALT = path.join(process.cwd(), 'public', 'media')

/**
 * Einmalig: Früher lagen die Dateien in public/media und waren dort für jeden direkt abrufbar –
 * auch gelöschte Bilder im Papierkorb. Beim Start werden sie in den geschützten Ordner verschoben.
 */
export function medienUmziehen(payload: Payload) {
  if (!fs.existsSync(ALT)) return
  fs.mkdirSync(MEDIEN_ORDNER, { recursive: true })
  let n = 0
  for (const name of fs.readdirSync(ALT)) {
    const von = path.join(ALT, name)
    const nach = path.join(MEDIEN_ORDNER, name)
    if (!fs.statSync(von).isFile()) continue
    try {
      if (!fs.existsSync(nach)) {
        try {
          fs.renameSync(von, nach)
        } catch {
          fs.copyFileSync(von, nach)
          fs.unlinkSync(von)
        }
        n++
      } else fs.unlinkSync(von)
    } catch (e) {
      payload.logger.warn({ err: e }, `Mediendatei ${name} konnte nicht verschoben werden`)
    }
  }
  try {
    if (fs.readdirSync(ALT).length === 0) fs.rmdirSync(ALT)
  } catch {
    // leerer Ordner darf bleiben
  }
  if (n) payload.logger.info(`${n} Mediendateien in den geschützten Ordner „medien“ verschoben`)
}
