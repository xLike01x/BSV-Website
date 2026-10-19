import type { Endpoint, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * Ordnet Bilder ohne Ordner automatisch zu – erst als Vorschau, mit `?ausfuehren=1` wirklich.
 * Reihenfolge der Hinweise: Titelbild/Foto eines Teams → Team-News → Vereinsdaten/Seiten/Vereins-News → Dateiname.
 * Bereits zugeordnete Bilder bleiben unverändert.
 */

type Id = number
type Vorschlag = { id: Id; datei: string; art: 'team' | 'allgemein'; teamId?: Id; team?: string; grund: string }

const idVon = (v: unknown): Id | null => {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v)
  if (typeof v === 'object' && 'id' in (v as object)) return idVon((v as { id: unknown }).id)
  return null
}

/** Alle Medien-IDs in einem Lexical-Inhalt (Bild-Bausteine und Uploads) */
export const medienImText = (knoten: unknown, raus: Set<Id> = new Set()): Set<Id> => {
  if (!knoten || typeof knoten !== 'object') return raus
  const k = knoten as Record<string, unknown>
  if (k.type === 'upload' && k.relationTo === 'media') {
    const i = idVon(k.value)
    if (i) raus.add(i)
  }
  if (k.type === 'block' && k.fields && typeof k.fields === 'object') {
    const i = idVon((k.fields as Record<string, unknown>).media)
    if (i) raus.add(i)
  }
  for (const w of Object.values(k)) if (w && typeof w === 'object') medienImText(w, raus)
  return raus
}

/** Alle Medien-IDs irgendwo in einem Objekt mit Feldnamen, die nach Bild klingen */
const BILD_FELDER = /^(media|bild|foto|logo|datei|heroBilder|bild\w+|heroImage|image)$/
export const medienInDaten = (wert: unknown, raus: Set<Id> = new Set(), feld = ''): Set<Id> => {
  if (Array.isArray(wert)) {
    for (const w of wert) {
      if (BILD_FELDER.test(feld)) {
        const i = idVon(w)
        if (i) raus.add(i)
      }
      medienInDaten(w, raus, feld)
    }
    return raus
  }
  if (wert && typeof wert === 'object') {
    for (const [k, w] of Object.entries(wert as Record<string, unknown>)) {
      if (BILD_FELDER.test(k) && !Array.isArray(w)) {
        const i = idVon(w)
        if (i) raus.add(i)
      }
      medienInDaten(w, raus, k)
    }
  }
  return raus
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export async function vorschlaegeErmitteln(req: PayloadRequest): Promise<{ vorschlaege: Vorschlag[]; offen: { id: Id; datei: string }[] }> {
  const p = req.payload
  const alle = <T,>(collection: string) =>
    p.find({ collection: collection as never, limit: 5000, depth: 0, pagination: false, overrideAccess: true, req }).then((r) => r.docs as unknown as T[])

  const [medien, angebote, posts, pages] = await Promise.all([
    alle<{ id: Id; filename?: string; team?: unknown; allgemein?: boolean }>('media'),
    alle<{ id: Id; title: string; slug?: string; bild?: unknown; leitungAnzeige?: unknown; [k: string]: unknown }>('angebote'),
    alle<{ id: Id; team?: unknown; heroImage?: unknown; content?: unknown; meta?: { image?: unknown } }>('posts'),
    alle<Record<string, unknown>>('pages'),
  ])
  const verein = await p.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true, req }).catch(() => null)
  const texte = await p.findGlobal({ slug: 'texte', depth: 0, overrideAccess: true, req }).catch(() => null)

  // Hinweise sammeln: Medien-ID → Team-Stimmen bzw. „allgemein“
  const teamStimmen = new Map<Id, Map<Id, number>>()
  const teamGrund = new Map<Id, string>()
  const stimme = (m: Id, t: Id, grund: string, gewicht = 1) => {
    const s = teamStimmen.get(m) ?? new Map<Id, number>()
    s.set(t, (s.get(t) ?? 0) + gewicht)
    teamStimmen.set(m, s)
    if (!teamGrund.has(m) || gewicht > 1) teamGrund.set(m, grund)
  }
  const allgemein = new Map<Id, string>()

  for (const a of angebote) for (const m of medienInDaten(a)) stimme(m, a.id, `Bild auf der Teamseite „${a.title}“`, 3)
  for (const post of posts) {
    const ms = new Set<Id>([...medienInDaten({ heroImage: post.heroImage, image: post.meta?.image }), ...medienImText(post.content)])
    const t = idVon(post.team)
    for (const m of ms) {
      if (t) stimme(m, t, 'In einer News dieses Teams benutzt', 2)
      else if (!allgemein.has(m)) allgemein.set(m, 'In einer Vereins-News benutzt')
    }
  }
  for (const m of medienInDaten(verein)) allgemein.set(m, 'In den Vereinsdaten benutzt (z. B. Vorstand)')
  for (const m of medienInDaten(texte)) allgemein.set(m, 'Unter „Texte & Bilder“ benutzt')
  for (const s of pages) for (const m of [...medienInDaten(s), ...medienImText(s)]) if (!allgemein.has(m)) allgemein.set(m, 'Auf einer eigenen Seite benutzt')

  // Dateiname ↔ Team-Name (längster Treffer gewinnt, z. B. „d1-jugend“ vor „jugend“)
  const namen = angebote
    .flatMap((a) => [norm(a.slug ?? ''), norm(a.title)].filter((n) => n.length >= 3).map((n) => ({ n, a })))
    .sort((x, y) => y.n.length - x.n.length)

  const vorschlaege: Vorschlag[] = []
  const offen: { id: Id; datei: string }[] = []
  const titel = new Map(angebote.map((a) => [a.id, a.title]))

  for (const m of medien) {
    if (idVon(m.team) || m.allgemein) continue
    const datei = m.filename ?? `Bild ${m.id}`
    // Dateiname wie ein Team (ganzes Wort, z. B. „f-jugend-2026.jpg“) zählt mehr als eine einzelne News
    const dn = `-${norm(datei.replace(/\.[a-z0-9]+$/i, ''))}-`
    const treffer = namen.find(({ n }) => dn.includes(`-${n}-`))
    if (treffer) stimme(m.id, treffer.a.id, `Dateiname passt zu „${treffer.a.title}“`, 2.5)

    const st = teamStimmen.get(m.id)
    if (st && st.size) {
      const sortiert = [...st.entries()].sort((a, b) => b[1] - a[1])
      const [teamId, punkte] = sortiert[0]!
      if (sortiert.length > 1 && sortiert[1]![1] === punkte) {
        vorschlaege.push({ id: m.id, datei, art: 'allgemein', grund: `Wird von mehreren Teams benutzt (${sortiert.map(([t]) => titel.get(t)).slice(0, 3).join(', ')})` })
        continue
      }
      const grund = treffer && treffer.a.id === teamId ? `Dateiname passt zu „${treffer.a.title}“` : (teamGrund.get(m.id) ?? 'Benutzt bei diesem Team')
      vorschlaege.push({ id: m.id, datei, art: 'team', teamId, team: titel.get(teamId), grund })
      continue
    }
    if (allgemein.has(m.id)) {
      vorschlaege.push({ id: m.id, datei, art: 'allgemein', grund: allgemein.get(m.id)! })
      continue
    }
    offen.push({ id: m.id, datei })
  }
  return { vorschlaege, offen }
}

export const autoZuordnenEndpunkt: Endpoint = {
  path: '/auto-zuordnen',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'redaktion')) return Response.json({ fehler: 'Nur für Redaktion und Admins.' }, { status: 403 })
    const ausfuehren = new URL(req.url ?? 'http://x').searchParams.get('ausfuehren') === '1'
    const { vorschlaege, offen } = await vorschlaegeErmitteln(req)
    let geaendert = 0
    if (ausfuehren) {
      for (const v of vorschlaege) {
        await req.payload.update({
          collection: 'media',
          id: v.id,
          data: v.art === 'team' ? { team: v.teamId } : { allgemein: true },
          overrideAccess: true,
          req,
          context: { ohneRevalidierung: true },
        })
        geaendert++
      }
    }
    return Response.json({ vorschlaege, offen, geaendert })
  },
}
