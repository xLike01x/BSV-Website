import fs from 'fs/promises'
import path from 'path'
import type { Payload } from 'payload'
import sharp from 'sharp'
import { zeileAendern } from '@/utilities/zeileAendern'

/**
 * Bildgröße „logo“: Logo ohne leeren Rand (weiß oder durchsichtig), höchstens 800 × 800.
 * Neue Uploads bekommen sie automatisch; für ältere Logos erzeugt `logoFreistellen` sie nachträglich.
 */
export const LOGO_GROESSE = {
  name: 'logo',
  width: 800,
  height: 800,
  fit: 'inside' as const,
  // false = auch kleine Logos durchlaufen das Freistellen (bei true lieferte Payload das Original ohne Zuschnitt)
  withoutEnlargement: false,
  trimOptions: { threshold: 24 },
  formatOptions: { format: 'webp' as const, options: { quality: 88 } },
}

type MediaDoc = { id: number; filename?: string | null; mimeType?: string | null; sizes?: { logo?: { filename?: string | null } | null } | null }

/** Fehlt einem Bild die Logo-Größe (älterer Upload), wird sie hier erzeugt */
export async function logoFreistellen(payload: Payload, id: number) {
  const m = (await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true }).catch(() => null)) as MediaDoc | null
  if (!m?.filename || m.sizes?.logo?.filename || !m.mimeType?.startsWith('image/')) return false
  const dir = payload.collections.media.config.upload.staticDir as string
  const quelle = path.join(dir, path.basename(m.filename))
  const ziel = `${path.parse(m.filename).name}-logo.webp`
  const { data, info } = await sharp(quelle)
    .resize({ width: LOGO_GROESSE.width, height: LOGO_GROESSE.height, fit: 'inside', withoutEnlargement: true })
    .trim(LOGO_GROESSE.trimOptions)
    .webp(LOGO_GROESSE.formatOptions.options)
    .toBuffer({ resolveWithObject: true })
  await fs.writeFile(path.join(dir, ziel), data)
  await zeileAendern(payload, 'media', id, { sizes: { logo: { filename: ziel, width: info.width, height: info.height, mimeType: 'image/webp', filesize: info.size } } })
  return true
}

