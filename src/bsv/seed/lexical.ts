/** Kleine Helfer, um Lexical-Richtext (Payload-Editor) aus einfachem Text zu bauen. */
type Node = Record<string, unknown>

const text = (t: string, format = 0): Node => ({ type: 'text', text: t, format, detail: 0, mode: 'normal', style: '', version: 1 })

export const p = (t: string): Node => ({
  type: 'paragraph',
  children: [text(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

export const h = (t: string, tag: 'h2' | 'h3' = 'h2'): Node => ({
  type: 'heading',
  tag,
  children: [text(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

export const quote = (t: string): Node => ({
  type: 'quote',
  children: [text(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

export const ul = (items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((it, i) => ({
    type: 'listitem',
    value: i + 1,
    children: [text(it)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  })),
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

export const doc = (children: Node[]) => ({
  root: { type: 'root', children, direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 },
})

/**
 * Wandelt WordPress-Fließtext in Absätze und Zwischenüberschriften um:
 * kurze Zeilen ohne Satzzeichen am Ende werden zu Überschriften.
 */
export const ausText = (raw: string, opts: { titel?: string; ueberschriften?: boolean } = {}) => {
  const zeilen = raw
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean)
  const nodes: Node[] = []
  zeilen.forEach((z, i) => {
    if (i === 0 && opts.titel && z.toLowerCase().replace(/\W/g, '').includes(opts.titel.toLowerCase().replace(/\W/g, '').slice(0, 20))) return
    const istUeberschrift = opts.ueberschriften !== false && z.length < 60 && !/[.!?:,;)]$/.test(z) && i < zeilen.length - 1 && !/^\d/.test(z)
    nodes.push(istUeberschrift ? h(z, 'h3') : p(z))
  })
  if (nodes.length === 0) nodes.push(p(zeilen.join(' ') || ' '))
  return doc(nodes)
}
