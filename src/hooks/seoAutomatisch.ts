import type { CollectionBeforeChangeHook } from 'payload'

/** Lexical-Inhalt → reiner Text */
export const klartext = (knoten: unknown): string => {
  if (!knoten || typeof knoten !== 'object') return ''
  const k = knoten as { text?: string; children?: unknown[]; root?: unknown }
  if (k.root) return klartext(k.root)
  if (typeof k.text === 'string') return k.text
  return (k.children ?? []).map(klartext).join(' ')
}

const idVon = (v: unknown) => (v && typeof v === 'object' ? (v as { id?: number }).id : v)

/**
 * Google-Vorschau (meta) automatisch füllen, solange niemand selbst etwas eingetragen hat.
 * `text` und `bild` liefern die Quellen je Sammlung.
 */
export const seoAutomatisch =
  (quellen: { text: (data: Record<string, any>) => unknown; bild: (data: Record<string, any>) => unknown }): CollectionBeforeChangeHook =>
  ({ data }) => {
    const meta = { ...(data.meta ?? {}) }
    if (!meta.title && data.title) meta.title = `${data.title} | Büdericher SV 1919`
    if (!meta.description) {
      const text = klartext(quellen.text(data)).replace(/\s+/g, ' ').trim()
      if (text) meta.description = text.length > 155 ? text.slice(0, 152).replace(/\s\S*$/, '') + ' …' : text
    }
    if (!meta.image) {
      const bild = idVon(quellen.bild(data))
      if (bild) meta.image = bild
    }
    data.meta = meta
    return data
  }
