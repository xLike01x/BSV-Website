import fs from 'fs/promises'
import path from 'path'
import type { Endpoint } from 'payload'

type Zeile = { id?: string | null; konto?: number | { id: number } | null; fotoAusKonto?: boolean | null; foto?: unknown }

/**
 * Profilfoto eines Vorstandsmitglieds für die Vereinsseite – nur wenn beim Vorstand
 * „Profilfoto aus dem Konto zeigen“ angehakt ist. Alle anderen Profilfotos bleiben privat.
 */
export const vorstandFotoEndpunkt: Endpoint = {
  path: '/vorstand-foto/:zeile',
  method: 'get',
  handler: async (req) => {
    const nichts = () => new Response('Nicht gefunden', { status: 404 })
    const id = String(req.routeParams?.zeile ?? '')
    const verein = (await req.payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true })) as unknown as { vorstand?: Zeile[] }
    const z = (verein.vorstand ?? []).find((x) => x.id === id)
    const konto = z?.konto && typeof z.konto === 'object' ? z.konto.id : z?.konto
    if (!z || !konto || !z.fotoAusKonto || z.foto) return nichts()
    const bild = (await req.payload.find({ collection: 'profilbilder', where: { besitzer: { equals: konto } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as
      | { filename?: string | null; sizes?: { klein?: { filename?: string | null } } }
      | undefined
    const datei = bild?.sizes?.klein?.filename ?? bild?.filename
    if (!datei) return nichts()
    const dir = req.payload.collections.profilbilder.config.upload.staticDir as string
    try {
      const daten = await fs.readFile(path.join(dir, path.basename(datei)))
      return new Response(new Uint8Array(daten), {
        headers: { 'Content-Type': datei.endsWith('.webp') ? 'image/webp' : 'image/jpeg', 'Cache-Control': 'public, max-age=600', 'X-Content-Type-Options': 'nosniff' },
      })
    } catch {
      return nichts()
    }
  },
}
