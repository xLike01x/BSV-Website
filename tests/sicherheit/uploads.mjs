import sharp from 'sharp'

import { B, login, pruefe } from './lib.mjs'

/** F-11: Standort- und Kameradaten werden beim Hochladen entfernt */
export default async function uploads(d) {
  const red = await login('redaktion@bsv.test')
  const bild = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#1b7a43' } })
    .jpeg()
    .withExif({ IFD0: { Make: 'SICHERHEITSTEST', Model: 'Kamera' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 15/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '6/1 40/1 0/1' } })
    .toBuffer()
  const vorher = await sharp(bild).metadata()
  pruefe('Testbild enthält EXIF', Boolean(vorher.exif))
  const fd = new FormData()
  fd.append('file', new Blob([bild], { type: 'image/jpeg' }), 'sicherheitstest-gps.jpg')
  fd.append('_payload', JSON.stringify({ alt: 'Sicherheitstest', personen: 'keine' }))
  const r = await fetch(B + '/api/media', { method: 'POST', headers: { Cookie: red }, body: fd })
  const j = await r.json().catch(() => null)
  try {
    pruefe('Upload als Redaktion', r.status === 201, j)
    if (r.status !== 201) return
    const datei = await fetch(B + j.doc.url)
    const nachher = await sharp(Buffer.from(await datei.arrayBuffer())).metadata()
    pruefe('Ausgeliefertes Original ohne EXIF/GPS', !nachher.exif && !nachher.xmp, { exif: Boolean(nachher.exif) })
  } finally {
    const reste = await d.q(`delete from media where filename like 'sicherheitstest-gps%' returning *`).catch(() => [])
    const fs = await import('fs/promises')
    for (const row of reste) for (const [k, f] of Object.entries(row)) if (k.endsWith('filename') && f) await fs.rm(new URL(`../../medien/${f}`, import.meta.url), { force: true })
  }
}
