import { getEnabledNodes, type SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'
import { getPayload, type Field, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { EINSTIEGE } from '@/components/Admin/Einstieg/einstiege'
import { VORLAGEN as FORMULAR_VORLAGEN } from '@/components/Admin/Formulare/vorlagen'

/**
 * Passt jeder Text-Editor-Inhalt zu seinem Editor? Kennt der Editor einen Baustein nicht (z. B. Aufzählung „list“
 * in einem Editor ohne Listen), zeigt die Verwaltung „parseEditorState: type "list" not found“ statt des Textes.
 * Geprüft werden alle Vorlagen und alles, was in der Datenbank steht (Entwürfe und frühere Versionen eingeschlossen).
 */

let payload: Payload
type Problem = { wo: string; typ: string }

/** Alle Knotentypen in einem Lexical-Inhalt (Überschriften als „heading:h2“ zusätzlich) */
function typen(knoten: unknown, raus = new Set<string>()): Set<string> {
  if (!knoten || typeof knoten !== 'object') return raus
  const k = knoten as { type?: unknown; tag?: unknown; children?: unknown[] }
  if (typeof k.type === 'string') raus.add(k.type)
  if (k.type === 'heading' && typeof k.tag === 'string') raus.add(`heading:${k.tag}`)
  if (Array.isArray(k.children)) for (const c of k.children) typen(c, raus)
  return raus
}

const erlaubtCache = new WeakMap<object, Set<string>>()
function erlaubt(field: Field): Set<string> {
  const editorConfig = (field as unknown as { editor?: { editorConfig?: SanitizedServerEditorConfig } }).editor?.editorConfig
  if (!editorConfig) return new Set()
  const cached = erlaubtCache.get(editorConfig)
  if (cached) return cached
  // Lexical-Grundbausteine sind immer dabei
  const set = new Set<string>(['root', 'text', 'linebreak', 'tab', 'paragraph'])
  for (const n of getEnabledNodes({ editorConfig })) set.add((n as unknown as { getType: () => string }).getType())
  // Erlaubte Überschriften-Größen (HeadingFeature({ enabledHeadingSizes }))
  const groessen = (editorConfig.resolvedFeatureMap.get('heading') as { sanitizedServerFeatureProps?: { enabledHeadingSizes?: string[] } } | undefined)?.sanitizedServerFeatureProps?.enabledHeadingSizes
  for (const g of groessen ?? []) set.add(`heading:${g}`)
  erlaubtCache.set(editorConfig, set)
  return set
}

/** Felder durchgehen und jeden Text-Editor-Inhalt gegen seinen Editor prüfen */
function pruefeFelder(fields: Field[], daten: unknown, wo: string, probleme: Problem[]) {
  if (!daten || typeof daten !== 'object') return
  const d = daten as Record<string, unknown>
  for (const f of fields) {
    const name = 'name' in f ? (f.name as string) : undefined
    switch (f.type) {
      case 'row':
      case 'collapsible':
        pruefeFelder(f.fields, d, wo, probleme)
        break
      case 'tabs':
        for (const t of f.tabs) pruefeFelder(t.fields, 'name' in t && t.name ? d[t.name] : d, `${wo}.${'name' in t && t.name ? t.name : ''}`, probleme)
        break
      case 'group':
        pruefeFelder(f.fields, name ? d[name] : d, name ? `${wo}.${name}` : wo, probleme)
        break
      case 'array':
        if (name && Array.isArray(d[name])) (d[name] as unknown[]).forEach((zeile, i) => pruefeFelder(f.fields, zeile, `${wo}.${name}[${i}]`, probleme))
        break
      case 'blocks':
        if (name && Array.isArray(d[name]))
          (d[name] as { blockType?: string }[]).forEach((zeile, i) => {
            const block = (f.blocks ?? []).find((b) => b.slug === zeile?.blockType) ?? payload.config.blocks?.find((b) => b.slug === zeile?.blockType)
            if (block) pruefeFelder(block.fields, zeile, `${wo}.${name}[${i}:${zeile.blockType}]`, probleme)
          })
        break
      case 'richText':
        if (name && d[name] && typeof d[name] === 'object') {
          const ok = erlaubt(f)
          for (const typ of typen((d[name] as { root?: unknown }).root)) if (!ok.has(typ)) probleme.push({ wo: `${wo}.${name}`, typ })
        }
        break
    }
  }
}

const feldDerSammlung = (slug: string) => (payload.collections as unknown as Record<string, { config: { fields: Field[] } } | undefined>)[slug]?.config.fields
const feldDesGlobals = (slug: string) => payload.config.globals.find((g) => g.slug === slug)?.fields

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

describe('Text-Editor: Inhalte passen zum Editor', () => {
  it('alle Vorlagen „Mit einer Vorlage starten“', () => {
    const probleme: Problem[] = []
    let geprueft = 0
    for (const [slug, e] of Object.entries(EINSTIEGE)) {
      const fields = feldDerSammlung(slug)
      for (const v of e.vorlagen ?? []) {
        if (!fields) continue
        pruefeFelder(fields, v.daten(), `${slug}/${v.key}`, probleme)
        geprueft++
      }
    }
    for (const v of FORMULAR_VORLAGEN) {
      pruefeFelder(feldDerSammlung('forms')!, v.daten, `forms/${v.key}`, probleme)
      geprueft++
    }
    expect(geprueft).toBeGreaterThan(20)
    expect(probleme).toEqual([])
  })

  it('alles in der Datenbank (Einträge, Entwürfe, Versionen, Einstellungen)', async () => {
    const probleme: Problem[] = []
    for (const c of payload.config.collections) {
      if (!c.fields.some(function hatText(f: Field): boolean {
        if (f.type === 'richText') return true
        if ('fields' in f && Array.isArray(f.fields)) return f.fields.some(hatText)
        if (f.type === 'tabs') return f.tabs.some((t) => t.fields.some(hatText))
        if (f.type === 'blocks') return true
        return false
      }))
        continue
      for (let seite = 1; ; seite++) {
        const r = await payload.find({ collection: c.slug as never, depth: 0, limit: 200, page: seite, draft: true, overrideAccess: true, trash: true } as never)
        for (const doc of r.docs as { id: string | number }[]) pruefeFelder(c.fields, doc, `${c.slug}#${doc.id}`, probleme)
        if (!r.hasNextPage) break
      }
      if (c.versions) {
        for (let seite = 1; ; seite++) {
          const r = await payload.findVersions({ collection: c.slug as never, depth: 0, limit: 200, page: seite, overrideAccess: true, trash: true } as never)
          for (const v of r.docs as { id: string | number; version: unknown }[]) pruefeFelder(c.fields, v.version, `${c.slug}/version#${v.id}`, probleme)
          if (!r.hasNextPage) break
        }
      }
    }
    for (const g of payload.config.globals) {
      const doc = await payload.findGlobal({ slug: g.slug as never, depth: 0, draft: true, overrideAccess: true } as never).catch(() => null)
      if (doc) pruefeFelder(feldDesGlobals(g.slug)!, doc, `global:${g.slug}`, probleme)
    }
    expect(probleme).toEqual([])
  }, 120_000)
})
