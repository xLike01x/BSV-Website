import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, Field, FieldHook, PayloadRequest } from 'payload'

import { hasRole, isAdminField } from '@/access/roles'

/**
 * „Team-Berechtigungen“: Teams direkt beim Benutzer zuordnen.
 * Gespeichert wird weiterhin beim Team im Feld „Verantwortliche“ (leitung) – dieses Feld ist nur eine
 * zweite, bequemere Tür dazu. So bleibt es egal, ob man die Zuordnung beim Benutzer oder beim Team macht.
 */
const TEAM_ROLLEN = ['uebungsleitung', 'teamredaktion']
type Ctx = { bsvTeamsNeu?: number[]; bsvLeitungKarte?: Map<number, number[]> }

const idVon = (x: unknown) => Number(typeof x === 'object' && x ? (x as { id: unknown }).id : x)

/** Einmal pro Anfrage: welcher Benutzer ist bei welchen Teams verantwortlich (für Listen mit vielen Benutzern) */
async function karte(req: PayloadRequest): Promise<Map<number, number[]>> {
  const ctx = req.context as Ctx
  if (ctx.bsvLeitungKarte) return ctx.bsvLeitungKarte
  const r = await req.payload.find({ collection: 'angebote', where: { leitung: { exists: true } }, select: { leitung: true } as never, depth: 0, limit: 0, pagination: false, overrideAccess: true, req })
  const m = new Map<number, number[]>()
  for (const a of r.docs as { id: number; leitung?: unknown[] }[]) for (const u of a.leitung ?? []) m.set(idVon(u), [...(m.get(idVon(u)) ?? []), a.id])
  ctx.bsvLeitungKarte = m
  return m
}

const lesen: FieldHook = async ({ data, req }) => {
  const id = Number((data as { id?: unknown } | undefined)?.id)
  if (!id) return []
  // Direkt nach dem Speichern (Antwort an die Verwaltung): schon die neue Auswahl zeigen –
  // die Teams werden erst danach (afterChange) aktualisiert
  const neu = (req.context as Ctx).bsvTeamsNeu
  if (neu) return neu
  return (await karte(req)).get(id) ?? []
}

export const teamsVerantwortlichFeld: Field = {
  name: 'teamsVerantwortlich',
  label: 'Team-Berechtigungen',
  type: 'relationship',
  relationTo: 'angebote',
  hasMany: true,
  virtual: true,
  maxDepth: 0,
  access: { read: ({ req }) => Boolean(req.user) && !(req.user as { _zweiFaktorOffen?: boolean })._zweiFaktorOffen, create: isAdminField, update: isAdminField },
  hooks: { afterRead: [lesen] },
  admin: {
    // Virtuelle Felder sind sonst schreibgeschützt – dieses Feld ist bewusst bearbeitbar (Speichern: Hooks unten)
    readOnly: false,
    // Kein „+“: hier werden vorhandene Teams zugeordnet, keine neuen angelegt
    allowCreate: false,
    description:
      'Diese Teams darf die Person verwalten – als Trainer (Zeiten, Ausfälle, News, Bilder, Probetraining, Passanträge) oder als Team-Redaktion (News, Bilder, Zeiten, Ausfälle), je nach Rolle oben. Ohne eine dieser Rollen wird beim Speichern „Trainer“ gesetzt. Kasse, Passwesen und Redaktion brauchen hier nichts – sie gelten für alle Teams.',
  },
}

/** Vor dem Speichern: gewünschte Teams merken und ggf. die Rolle „Trainer“ ergänzen */
export const teamsVorher: CollectionBeforeChangeHook = ({ data, req }) => {
  const wert = (data as { teamsVerantwortlich?: unknown }).teamsVerantwortlich
  if (!Array.isArray(wert) || !hasRole(req.user as never, 'admin')) return data
  const teams = [...new Set(wert.map(idVon).filter((n) => Number.isInteger(n) && n > 0))]
  ;(req.context as Ctx).bsvTeamsNeu = teams
  const rollen = Array.isArray(data.roles) ? (data.roles as string[]) : undefined
  if (teams.length && rollen && !rollen.some((r) => TEAM_ROLLEN.includes(r))) data.roles = [...rollen, 'uebungsleitung']
  delete (data as { teamsVerantwortlich?: unknown }).teamsVerantwortlich
  return data
}

/** Nach dem Speichern: bei den Teams als „Verantwortliche“ eintragen bzw. austragen (in derselben Transaktion) */
export const teamsNachher: CollectionAfterChangeHook = async ({ doc, req }) => {
  const ctx = req.context as Ctx
  const neu = ctx.bsvTeamsNeu
  if (!neu) return doc
  delete ctx.bsvTeamsNeu
  const uid = Number(doc.id)
  const betroffen = await req.payload.find({ collection: 'angebote', where: { or: [{ leitung: { contains: uid } }, { id: { in: neu.length ? neu : [0] } }] }, select: { leitung: true } as never, depth: 0, limit: 0, pagination: false, overrideAccess: true, req })
  for (const a of betroffen.docs as { id: number; leitung?: unknown[] }[]) {
    const jetzt = (a.leitung ?? []).map(idVon)
    const soll = neu.includes(a.id) ? [...new Set([...jetzt, uid])] : jetzt.filter((x) => x !== uid)
    if (soll.length === jetzt.length && soll.every((x) => jetzt.includes(x))) continue
    await req.payload.update({ collection: 'angebote', id: a.id, data: { leitung: soll } as never, overrideAccess: true, req })
  }
  delete ctx.bsvLeitungKarte
  return doc
}
