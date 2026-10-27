/**
 * Einmalig: Satzung, Ordnungen und Konzepte (PDFs aus src/bsv/seed/vereinsdokumente/) in die Mediathek-Ordner
 * „Vereinsdokumente“ legen und unter Einstellungen → Vereinsdaten → „Satzung & Downloads“ öffentlich eintragen.
 *
 * Mehrfach ausführbar: Vorhandene Dateien (gleicher Dateiname) und Download-Einträge (gleicher Titel) werden nicht
 * doppelt angelegt, bestehende Einträge bleiben unverändert.
 *
 * Start: pnpm vereinsdokumente:einspielen – auf der Live-Website nur mit --auch-live.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '@payload-config'

/** Reihenfolge = Reihenfolge auf der Website */
export const VEREINSDOKUMENTE = [
  { datei: 'Satzung-September-2020.pdf', titel: 'Satzung', hinweis: 'PDF · Stand September 2020' },
  { datei: 'Kinder-und-Jugendschutzkonzept-2026.pdf', titel: 'Kinder- und Jugendschutzkonzept', hinweis: 'PDF · 2026' },
  { datei: 'Verhaltenskodex-Trainerinnen-und-Trainer.pdf', titel: 'Verhaltenskodex für Trainerinnen und Trainer', hinweis: 'PDF · 2026' },
  { datei: 'Abteilungsordnung-Fussball-Junioren.pdf', titel: 'Abteilungsordnung Fußball-Jugend', hinweis: 'PDF' },
  { datei: 'Abteilungsordnung-Fussball-Senioren-Entwurf-2015.pdf', titel: 'Abteilungsordnung Fußball-Senioren', hinweis: 'PDF · Entwurf vom 10.04.2015' },
] as const

type Download = { id?: string; titel?: string | null; hinweis?: string | null; nurMitglieder?: boolean | null; datei?: unknown; dokument?: unknown }

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--auch-live')) {
    console.log('Live-Website: nichts geändert. Nur mit --auch-live einspielen.')
    process.exit(0)
  }
  const ordner = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vereinsdokumente')
  const payload = await getPayload({ config })

  const verein = (await payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true })) as { downloads?: Download[] | null }
  const vorhanden = verein.downloads ?? []
  const titelDa = new Set(vorhanden.map((d) => (d.titel ?? '').trim().toLowerCase()))

  const neu: Download[] = []
  let dateienNeu = 0
  for (const d of VEREINSDOKUMENTE) {
    if (titelDa.has(d.titel.toLowerCase())) {
      console.log(`– „${d.titel}“ steht schon in „Satzung & Downloads“ – übersprungen.`)
      continue
    }
    const pfad = path.join(ordner, d.datei)
    if (!fs.existsSync(pfad)) throw new Error(`Datei fehlt: ${d.datei}`)
    // Gleiche Datei schon in der Mediathek (auch im Papierkorb nicht doppelt anlegen)? Dann diese benutzen.
    const da = (await payload.find({ collection: 'media', where: { filename: { equals: d.datei } }, limit: 1, depth: 0, overrideAccess: true, trash: true })).docs[0] as
      | { id: number; deletedAt?: string | null }
      | undefined
    let id: number
    if (da && !da.deletedAt) {
      id = da.id
      await payload.update({ collection: 'media', id, data: { team: null, vereinsdokument: true } as never, overrideAccess: true, context: { disableRevalidate: true } })
    } else {
      const m = await payload.create({
        collection: 'media',
        data: { alt: d.titel, personen: 'keine', vereinsdokument: true, allgemein: true } as never,
        filePath: pfad,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      id = m.id as number
      dateienNeu++
    }
    neu.push({ titel: d.titel, hinweis: d.hinweis, nurMitglieder: false, datei: id })
  }

  if (neu.length) {
    await payload.updateGlobal({
      slug: 'verein',
      data: { downloads: [...vorhanden, ...neu] } as never,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
  console.log(
    neu.length
      ? `${neu.length} Dokumente unter Vereinsdaten → „Satzung & Downloads“ eingetragen (${dateienNeu} neu in der Mediathek, Ordner „Vereinsdokumente“).`
      : 'Nichts zu tun – alle Dokumente sind schon eingetragen.',
  )
  process.exit(0)
}

try {
  await main()
} catch (e) {
  // Nur die erste Zeile – keine langen Datenbank-Abfragen im Fenster
  console.error('Vereinsdokumente einspielen hat nicht geklappt:', (e instanceof Error ? e.message : String(e)).split('\n')[0]!.slice(0, 200))
  process.exit(1)
}
