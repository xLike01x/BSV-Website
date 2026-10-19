import type { Field, FieldHook, PayloadRequest } from 'payload'
import { slugify } from 'payload/shared'

/**
 * Adresse (Slug) immer eindeutig halten – auch bei Entwürfen und beim Verschieben in den Papierkorb.
 *
 * Hintergrund: Entwürfe werden ohne Eindeutigkeits-Prüfung gespeichert. Hieß ein Entwurf z. B. „Kunstrasen“
 * (→ /kunstrasen) und gab es die Adresse schon, scheiterte später jedes Speichern, Veröffentlichen und sogar
 * das Löschen mit „Das folgende Feld ist nicht korrekt: slug“. Jetzt bekommt die neuere Seite automatisch
 * /kunstrasen-2 (die Hinweise rechts zeigen die Adresse). Einträge im Papierkorb zählen mit.
 *
 * Läuft als Feld-Hook direkt am Slug – also NACH dem automatischen Erzeugen aus dem Titel und VOR dem Speichern.
 */
const eindeutig =
  (collection: string, ausFeld: string): FieldHook =>
  async ({ value, originalDoc, req, operation, data }) => {
    // Beim Anlegen erzeugt Payload den Slug parallel aus dem Titel – dieselbe Rechnung hier, damit unser Ergebnis gilt
    const roh = typeof value === 'string' && value.trim() ? value : operation === 'create' && typeof data?.[ausFeld] === 'string' ? slugify(data[ausFeld] as string) : ''
    const basis = (roh ?? '').trim()
    if (!basis) return value
    const id = (originalDoc as { id?: number | string } | undefined)?.id
    const vergeben = (slug: string) => belegt(req, collection, slug, id)
    if (!(await vergeben(basis))) return basis === value ? value : basis
    // Endung „-2“, „-3“ … anhängen (eine vorhandene Zahl am Ende nicht doppeln)
    const stamm = basis.replace(/-\d+$/, '')
    for (let n = 2; n < 100; n++) {
      const neu = `${stamm}-${n}`
      if (!(await vergeben(neu))) return neu
    }
    return value
  }

const belegt = async (req: PayloadRequest, collection: string, slug: string, id?: number | string) =>
  (
    await req.payload.find({
      collection: collection as never,
      where: { and: [{ slug: { equals: slug } }, ...(id ? [{ id: { not_equals: id } }] : [])] },
      trash: true,
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req,
    })
  ).docs.length > 0

/** Hängt den Eindeutig-Hook an das Feld „slug“ (auch innerhalb der Zeile von slugField()) */
export function mitEindeutigemSlug(feld: Field, collection: string, ausFeld = 'title'): Field {
  const f = feld as Field & { name?: string; fields?: Field[]; hooks?: { beforeChange?: FieldHook[] } }
  if (f.name === 'slug') return { ...f, hooks: { ...f.hooks, beforeChange: [...(f.hooks?.beforeChange ?? []), eindeutig(collection, ausFeld)] } } as Field
  if (Array.isArray(f.fields)) return { ...f, fields: f.fields.map((x) => mitEindeutigemSlug(x, collection, ausFeld)) } as Field
  return feld
}
