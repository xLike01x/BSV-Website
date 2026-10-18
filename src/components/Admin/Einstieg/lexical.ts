/** Kleine Helfer, um Text-Editor-Inhalte (Lexical) für Vorlagen zu bauen */
type Knoten = { h?: 'h2' | 'h3'; p?: string; liste?: string[] }

const text = (t: string) => ({ type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 })
const absatz = (t: string) => ({ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: t ? [text(t)] : [] })

export function richText(knoten: Knoten[]) {
  const children = knoten.flatMap((k): unknown[] => {
    if (k.liste)
      return [
        {
          type: 'list',
          listType: 'bullet',
          tag: 'ul',
          start: 1,
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: k.liste.map((t, i) => ({ type: 'listitem', value: i + 1, format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] })),
        },
      ]
    if (k.h) return [{ type: 'heading', tag: k.h, format: '', indent: 0, version: 1, direction: 'ltr', children: [text(k.p ?? '')] }]
    return [absatz(k.p ?? '')]
  })
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
}

/** Datum in einigen Tagen, um eine bestimmte Uhrzeit (ISO) */
export const inTagen = (tage: number, stunde = 18, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + tage)
  d.setHours(stunde, minute, 0, 0)
  return d.toISOString()
}

/** Nächster Samstag (oder heute in einer Woche, wenn heute Samstag ist) */
export const naechsterSamstag = (stunde: number) => {
  const d = new Date()
  const plus = (6 - d.getDay() + 7) % 7 || 7
  return inTagen(plus, stunde)
}

export const heuteText = () => new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
