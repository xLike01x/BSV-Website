import { describe, expect, it } from 'vitest'

import { alsRichtext, DATENSCHUTZ, IMPRESSUM } from '@/utilities/rechtstexte'

// Nur Knotentypen, die der Editor der Text-Spalten (src/blocks/Content/config.ts) kennt –
// sonst zeigt die Verwaltung „parseEditorState: type … not found“ (passiert mit „quote“)
const ERLAUBT = new Set(['root', 'paragraph', 'heading', 'list', 'listitem', 'text', 'linebreak'])

const typen = (knoten: unknown, gefunden = new Set<string>()): Set<string> => {
  if (Array.isArray(knoten)) knoten.forEach((k) => typen(k, gefunden))
  else if (knoten && typeof knoten === 'object') {
    const k = knoten as Record<string, unknown>
    if (typeof k.type === 'string') gefunden.add(k.type)
    Object.values(k).forEach((v) => typen(v, gefunden))
  }
  return gefunden
}

describe('Rechtstexte als Richtext', () => {
  it.each([
    ['Impressum', IMPRESSUM],
    ['Datenschutz', DATENSCHUTZ],
  ])('%s enthält nur Knoten, die der Editor kennt', (_name, md) => {
    const unbekannt = [...typen(alsRichtext(md))].filter((t) => !ERLAUBT.has(t))
    expect(unbekannt).toEqual([])
  })

  it('Prüfhinweis steht als erster (fetter) Absatz oben', () => {
    const erster = alsRichtext(IMPRESSUM).root.children[0] as { type: string; children: { text: string; format: number }[] }
    expect(erster.type).toBe('paragraph')
    expect(erster.children[0]!.text).toContain('ENTWURF zur Prüfung durch den Vorstand')
    expect(erster.children[0]!.format).toBe(1)
  })
})
