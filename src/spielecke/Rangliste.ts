import type { CollectionConfig, Endpoint, Payload, Where } from 'payload'

import { bereichZugriff, ausblendenAusserBereich } from '@/access/roles'
import { ratenGrenze } from '@/hooks/spamSchutz'

import { HOCHHALTEN_MAX, MEMORY_MAX, MEMORY_MIN, SERIE_MAX } from './Spielstatistik'
import { spitznamePruefen } from './spitzname'

/**
 * Rangliste der Spielecke: Spitzname (selbst eingetippt, streng geprüft), Wert und Zeitpunkt – sonst nichts
 * (keine IP-Adresse, kein Konto, keine Kennung).
 *
 * - Eintragen nur über POST /api/spielergebnisse/eintragen (Ratenbegrenzung, Wertebereiche, Spiel und Rangliste eingeschaltet).
 * - Anzeigen über GET /api/spielergebnisse/rangliste?spiel=…&zeitraum=7|14|30|immer – höchstens 10 Einträge, nur freigegebene.
 * - Verwaltung (Website-Aufbau → „Spielecke-Rangliste“, Bereich Seiten): ansehen, freigeben, löschen. Anlegen nur über den Endpunkt.
 * - Datensparsamkeit: Einträge älter als 30 Tage werden täglich gelöscht – außer den 10 besten aller Zeiten je Spiel (ranglisteAufraeumen).
 */
export type Spiel = 'hochhalten' | 'memory' | 'elfmeterSerie' | 'huetchen'
export const SPIELE: Spiel[] = ['hochhalten', 'memory', 'elfmeterSerie', 'huetchen']
/** Hütchenspiel: richtig geratene Runden in Folge */
export const HUETCHEN_MAX = 100
const GRENZEN: Record<Spiel, [number, number]> = { hochhalten: [1, HOCHHALTEN_MAX], memory: [MEMORY_MIN, MEMORY_MAX], elfmeterSerie: [1, SERIE_MAX], huetchen: [1, HUETCHEN_MAX] }
/** Memory: weniger Züge = besser */
const AUFSTEIGEND: Record<Spiel, boolean> = { hochhalten: false, memory: true, elfmeterSerie: false, huetchen: false }
const ZEITRAEUME: Record<string, number | null> = { '7': 7, '14': 14, '30': 30, immer: null }
const PLAETZE = 10

type Schalter = { rangliste?: boolean | null; ranglisteFreigabe?: boolean | null; hochhalten?: boolean | null; memory?: boolean | null; elfmeter?: boolean | null; huetchen?: boolean | null }
const schalter = async (payload: Payload) => ((await payload.findGlobal({ slug: 'animationen', depth: 0 }).catch(() => ({}))) ?? {}) as Schalter
const spielAn = (s: Schalter, spiel: Spiel) => s.rangliste !== false && (spiel === 'elfmeterSerie' ? s.elfmeter !== false : s[spiel] !== false)

const json = (daten: unknown, status = 200) => Response.json(daten, { status, headers: { 'Cache-Control': 'no-store' } })

const ab = (tage: number | null): Where[] => (tage ? [{ createdAt: { greater_than: new Date(Date.now() - tage * 86400000).toISOString() } }] : [])

async function liste(payload: Payload, spiel: Spiel, tage: number | null) {
  const r = await payload.find({
    collection: 'spielergebnisse',
    where: { and: [{ spiel: { equals: spiel } }, { freigegeben: { equals: true } }, ...ab(tage)] },
    // Gleichstand: wer zuerst da war, steht vorn
    sort: [AUFSTEIGEND[spiel] ? 'wert' : '-wert', 'createdAt'],
    limit: PLAETZE,
    depth: 0,
    overrideAccess: true,
    select: { spitzname: true, wert: true, createdAt: true },
  })
  return r.docs.map((d, i) => ({ platz: i + 1, id: d.id, spitzname: d.spitzname, wert: d.wert, datum: String(d.createdAt).slice(0, 10) }))
}

/** Auf welchem Platz steht dieser Eintrag (1 = bester)? Zählt bessere – und bei Gleichstand frühere – freigegebene Einträge im Zeitraum. */
async function platz(payload: Payload, spiel: Spiel, wert: number, id: number, seit: string, tage: number | null) {
  const besser = await payload.count({
    collection: 'spielergebnisse',
    where: {
      and: [
        { spiel: { equals: spiel } },
        { freigegeben: { equals: true } },
        { id: { not_equals: id } },
        { or: [{ wert: AUFSTEIGEND[spiel] ? { less_than: wert } : { greater_than: wert } }, { and: [{ wert: { equals: wert } }, { createdAt: { less_than: seit } }] }] },
        ...ab(tage),
      ],
    },
    overrideAccess: true,
  })
  return besser.totalDocs + 1
}

const ranglisteEndpunkt: Endpoint = {
  path: '/rangliste',
  method: 'get',
  handler: async (req) => {
    const spiel = String(req.searchParams.get('spiel') ?? '') as Spiel
    const zeitraum = String(req.searchParams.get('zeitraum') ?? '7')
    if (!SPIELE.includes(spiel) || !(zeitraum in ZEITRAEUME)) return json({ fehler: 'Ungültig.' }, 400)
    const s = await schalter(req.payload)
    if (!spielAn(s, spiel)) return json({ eintraege: [], aus: true })
    return json({ eintraege: (await liste(req.payload, spiel, ZEITRAEUME[zeitraum]!)).map(({ id: _id, ...e }) => e) })
  },
}

const eintragenEndpunkt: Endpoint = {
  path: '/eintragen',
  method: 'post',
  handler: async (req) => {
    if (Number(req.headers.get('content-length') || 0) > 300) return json({ fehler: 'Zu groß.' }, 400)
    const b = (await req.json?.().catch(() => null)) as { spiel?: unknown; wert?: unknown; spitzname?: unknown } | null
    const spiel = String(b?.spiel ?? '') as Spiel
    const wert = Number(b?.wert)
    if (!SPIELE.includes(spiel) || !Number.isInteger(wert) || wert < GRENZEN[spiel][0] || wert > GRENZEN[spiel][1]) return json({ fehler: 'Ungültiges Ergebnis.' }, 400)
    const name = spitznamePruefen(b?.spitzname)
    if (!name.ok) return json({ fehler: name.fehler }, 400)
    const s = await schalter(req.payload)
    if (!spielAn(s, spiel)) return json({ fehler: 'Die Rangliste ist gerade ausgeschaltet.' }, 403)
    try {
      // Pro Anschluss höchstens 20 Einträge in 10 Minuten, alle zusammen 600
      ratenGrenze(req, 'rangliste', 20, 600)
    } catch {
      return json({ fehler: 'Zu viele Einträge – bitte später nochmal versuchen.' }, 429)
    }
    const freigegeben = s.ranglisteFreigabe !== true
    const doc = await req.payload.create({ collection: 'spielergebnisse', data: { spiel, wert, spitzname: name.name, freigegeben }, overrideAccess: true, req })
    if (!freigegeben) return json({ ok: true, wartet: true })
    const [p7, pImmer] = await Promise.all([platz(req.payload, spiel, wert, doc.id, doc.createdAt, 7), platz(req.payload, spiel, wert, doc.id, doc.createdAt, null)])
    return json({ ok: true, platz7: p7, platzImmer: pImmer })
  },
}

export const Spielergebnisse: CollectionConfig = {
  slug: 'spielergebnisse',
  labels: { singular: 'Ranglisten-Eintrag', plural: 'Spielecke-Rangliste' },
  access: {
    read: bereichZugriff('seiten'),
    create: () => false,
    update: bereichZugriff('seiten'),
    delete: bereichZugriff('seiten'),
  },
  admin: {
    group: 'Website-Aufbau',
    hidden: ausblendenAusserBereich('seiten'),
    useAsTitle: 'spitzname',
    defaultColumns: ['spitzname', 'spiel', 'wert', 'freigegeben', 'createdAt'],
    description:
      'Einträge aus der Spielecke (/spielecke). Unpassende Spitznamen hier löschen (Haken setzen → „Löschen“). Freigabe nötig? Einstellen unter Website-Aufbau → Animationen. Einträge älter als 30 Tage werden automatisch gelöscht – außer den 10 besten aller Zeiten je Spiel.',
  },
  defaultSort: '-createdAt',
  endpoints: [ranglisteEndpunkt, eintragenEndpunkt],
  fields: [
    // Spitzname, Spiel und Ergebnis sind unveränderlich (nur löschen oder freigeben) – auch über die Schnittstelle
    { name: 'spitzname', label: 'Spitzname', type: 'text', required: true, maxLength: 16, access: { update: () => false }, admin: { readOnly: true } },
    {
      name: 'spiel',
      label: 'Spiel',
      type: 'select',
      required: true,
      index: true,
      access: { update: () => false },
      options: [
        { label: 'Ball hochhalten', value: 'hochhalten' },
        { label: 'Memory (Züge)', value: 'memory' },
        { label: 'Elfmeter-Serie', value: 'elfmeterSerie' },
        { label: 'Hütchenspiel', value: 'huetchen' },
      ],
      admin: { readOnly: true },
    },
    { name: 'wert', label: 'Ergebnis', type: 'number', required: true, index: true, access: { update: () => false }, admin: { readOnly: true, description: 'Hochhalten: Kontakte · Memory: Züge (weniger ist besser) · Elfmeter: Tore in Folge · Hütchenspiel: richtig in Folge' } },
    { name: 'freigegeben', label: 'In der Rangliste sichtbar', type: 'checkbox', defaultValue: true, index: true },
  ],
}

/** Tägliche Aufgabe: Einträge älter als 30 Tage löschen – außer den 10 besten aller Zeiten je Spiel (auch nicht freigegebene, damit nichts Gutes verloren geht) */
export async function ranglisteAufraeumen(payload: Payload) {
  const behalten: number[] = []
  for (const spiel of SPIELE) {
    const r = await payload.find({ collection: 'spielergebnisse', where: { spiel: { equals: spiel } }, sort: [AUFSTEIGEND[spiel] ? 'wert' : '-wert', 'createdAt'], limit: PLAETZE, depth: 0, overrideAccess: true, select: {} })
    behalten.push(...r.docs.map((d) => d.id))
  }
  const grenze = new Date(Date.now() - 30 * 86400000).toISOString()
  const weg = await payload.delete({
    collection: 'spielergebnisse',
    where: { and: [{ createdAt: { less_than: grenze } }, ...(behalten.length ? [{ id: { not_in: behalten } }] : [])] },
    overrideAccess: true,
  })
  return weg.docs.length
}
