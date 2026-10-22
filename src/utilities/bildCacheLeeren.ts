import fs from 'fs'
import path from 'path'

/**
 * Zwischenspeicher des Bild-Optimierers (/_next/image) leeren – nach dem Löschen oder Verschieben eines Bildes in den
 * Papierkorb (z. B. Widerruf einer Foto-Einwilligung). Sonst wäre die verkleinerte Fassung noch bis zu 10 Minuten
 * abrufbar. Der Speicher baut sich beim nächsten Aufruf von selbst neu auf.
 */
export async function bildCacheLeeren(): Promise<void> {
  const dist = process.env.BSV_DIST_DIR || '.next'
  // Asynchron (blockiert den Server nicht), aber abgewartet – sonst käme die nächste Anfrage noch an den alten Speicher
  await Promise.all(
    [path.join(dist, 'cache', 'images'), path.join(dist, 'dev', 'cache', 'images')].map((ordner) =>
      fs.promises.rm(path.resolve(process.cwd(), ordner), { recursive: true, force: true }).catch(() => {
        // gerade in Benutzung – beim nächsten Mal
      }),
    ),
  )
}
