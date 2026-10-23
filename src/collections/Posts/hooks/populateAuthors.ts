import type { CollectionAfterReadHook, PayloadRequest } from 'payload'

/**
 * Autor:innen-Namen für die Website (`populatedAuthors`) – die Benutzer selbst sind nicht öffentlich lesbar.
 *
 * Schnell auch für Listen: Payload ruft den Hook für alle News einer Liste gleichzeitig auf. Die Namen werden
 * deshalb pro Anfrage gesammelt und mit EINER Abfrage geladen (vorher eine Abfrage je Autor und News).
 */
type Sammler = { ids: Set<number>; gestartet?: boolean; namen?: Promise<Map<number, string>> }
const sammler = new WeakMap<PayloadRequest, Sammler>()

const idVon = (a: unknown) => Number(typeof a === 'object' && a ? (a as { id: unknown }).id : a)

async function namenLaden(req: PayloadRequest, s: Sammler): Promise<Map<number, string>> {
  // Einen Takt warten, damit die gleichzeitig laufenden Hooks ihre IDs eintragen können
  await new Promise((r) => setTimeout(r, 0))
  s.gestartet = true
  const ids = [...s.ids]
  const r = await req.payload.find({ collection: 'users', where: { id: { in: ids } }, select: { name: true } as never, depth: 0, limit: ids.length, pagination: false, overrideAccess: true, req })
  return new Map((r.docs as { id: number; name?: string }[]).map((u) => [u.id, u.name ?? '']))
}

export const populateAuthors: CollectionAfterReadHook = async ({ doc, req }) => {
  const ids = ((doc?.authors ?? []) as unknown[]).map(idVon).filter((n) => Number.isInteger(n) && n > 0)
  if (!ids.length) return doc
  let s = sammler.get(req)
  // Abfrage läuft schon, aber diese Autor:innen fehlen (später in derselben Anfrage) → neu sammeln
  if (s?.gestartet && ids.some((id) => !s!.ids.has(id))) s = undefined
  if (!s) {
    s = { ids: new Set() }
    sammler.set(req, s)
  }
  for (const id of ids) s.ids.add(id)
  const aktuell = s
  aktuell.namen ??= namenLaden(req, aktuell).catch(() => {
    sammler.delete(req)
    return new Map<number, string>()
  })
  try {
    const namen = await aktuell.namen
    const gefunden = ids.filter((id) => namen.has(id)).map((id) => ({ id, name: namen.get(id) ?? '' }))
    if (gefunden.length) doc.populatedAuthors = gefunden
  } catch {
    // Ohne Namen weiter – die News bleibt lesbar
  }
  return doc
}
