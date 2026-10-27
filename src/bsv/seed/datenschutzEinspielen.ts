/**
 * Einmalig: Datenschutzerklärung aus src/bsv/seed/datenschutzerklaerung.txt als Seite „Datenschutz“ einspielen
 * (Überschriften „1. …“ als Überschrift 2, Absätze, Zeilenumbrüche). Der bisherige Inhalt bleibt unter „Versionen“
 * der Seite erhalten und lässt sich dort wiederherstellen.
 *
 * Start: pnpm datenschutz:einspielen – auf der Live-Website nur mit --auch-live (überschreibt sonst nichts).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '@payload-config'

type Node = Record<string, unknown>
const text = (t: string): Node => ({ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
const absatz = (zeilen: string[]): Node => ({
  type: 'paragraph',
  children: zeilen.flatMap((z, i) => (i ? [{ type: 'linebreak', version: 1 }, text(z)] : [text(z)])),
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})
const ueberschrift = (t: string): Node => ({ type: 'heading', tag: 'h2', children: [text(t)], direction: 'ltr', format: '', indent: 0, version: 1 })

/** Text → Lexical: „1. Titel“ wird Überschrift, Leerzeilen trennen Absätze; Zeilen von Nr. 11 (Anbieter) einzeln */
function alsLexical(roh: string) {
  const zeilen = roh.replace(/\r\n/g, '\n').trim().split('\n')
  if (zeilen[0]?.trim() === 'Datenschutz') zeilen.shift()
  const bloecke: string[][] = []
  let akt: string[] = []
  for (const z of [...zeilen, '']) {
    if (z.trim()) akt.push(z.trim())
    else if (akt.length) {
      bloecke.push(akt)
      akt = []
    }
  }
  const kinder: Node[] = []
  for (const b of bloecke) {
    let rest = b
    if (/^\d+\.\s/.test(b[0]!)) {
      kinder.push(ueberschrift(b[0]!))
      rest = b.slice(1)
    }
    if (!rest.length) continue
    if (rest.some((z) => /^(OpenStreetMap|Links zu|Rechtsgrundlage: deine Einwilligung)/.test(z))) rest.forEach((z) => kinder.push(absatz([z])))
    else kinder.push(absatz(rest))
  }
  return { root: { type: 'root', children: kinder, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--auch-live')) {
    console.log('Live-Website: nichts geändert. Nur mit --auch-live einspielen.')
    process.exit(0)
  }
  const datei = path.join(path.dirname(fileURLToPath(import.meta.url)), 'datenschutzerklaerung.txt')
  const inhalt = alsLexical(fs.readFileSync(datei, 'utf8'))
  const payload = await getPayload({ config })
  const vorhanden = (await payload.find({ collection: 'pages', where: { slug: { equals: 'datenschutz' } }, limit: 1, depth: 0, overrideAccess: true, draft: true })).docs[0] as { id: number } | undefined
  const daten = { layout: [{ blockType: 'content', columns: [{ size: 'full', richText: inhalt }] }], _status: 'published' }
  if (vorhanden) await payload.update({ collection: 'pages', id: vorhanden.id, data: daten as never, overrideAccess: true, context: { disableRevalidate: true } })
  else await payload.create({ collection: 'pages', data: { title: 'Datenschutz', slug: 'datenschutz', hero: { type: 'none' }, meta: { title: 'Datenschutz' }, ...daten } as never, overrideAccess: true, context: { disableRevalidate: true } })
  // (ohne Neu-Erzeugen des Seiten-Zwischenspeichers – das geht nur im laufenden Server; die Seite aktualisiert sich spätestens nach einer Minute)
  console.log(`Datenschutzerklärung eingespielt (${inhalt.root.children.length} Abschnitte/Absätze). Der vorherige Stand liegt unter Seiten → Datenschutz → „Versionen“.`)
  process.exit(0)
}

try {
  await main()
} catch (e) {
  console.error('Einspielen fehlgeschlagen:', e instanceof Error ? e.message : e)
  process.exit(1)
}
