import { sql } from '@payloadcms/db-postgres'
import type { CollectionConfig, Endpoint, Payload } from 'payload'

import { berlinTag } from '@/bsv/wiederholung'
import { ratenGrenze } from '@/hooks/spamSchutz'

/**
 * Tagesrekord der Spielecke – ganz ohne Namen: pro Tag nur Summen (Elfmeter, Tore, Runden) und der höchste
 * „Ball hochhalten“-Wert. Keine IP-Adressen, keine Kennungen; die Ratenbegrenzung läuft nur im Arbeitsspeicher.
 * Einträge älter als 30 Tage löscht die tägliche Aufgabe (spielstatistikAufraeumen).
 */
export const HOCHHALTEN_MAX = 250

export type Tageswerte = { elfmeterSchuesse: number; elfmeterTore: number; hochhaltenSpiele: number; hochhaltenRekord: number }
const LEER: Tageswerte = { elfmeterSchuesse: 0, elfmeterTore: 0, hochhaltenSpiele: 0, hochhaltenRekord: 0 }

async function heute(payload: Payload): Promise<Tageswerte> {
  const r = await payload.find({ collection: 'spielstatistik', where: { datum: { equals: berlinTag(new Date()) } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as Partial<Tageswerte> | undefined
  return d ? { elfmeterSchuesse: d.elfmeterSchuesse ?? 0, elfmeterTore: d.elfmeterTore ?? 0, hochhaltenSpiele: d.hochhaltenSpiele ?? 0, hochhaltenRekord: d.hochhaltenRekord ?? 0 } : LEER
}

const antwort = (daten: unknown) => Response.json(daten, { headers: { 'Cache-Control': 'no-store' } })

const heuteEndpunkt: Endpoint = {
  path: '/heute',
  method: 'get',
  handler: async (req) => antwort(await heute(req.payload)),
}

const meldenEndpunkt: Endpoint = {
  path: '/melden',
  method: 'post',
  handler: async (req) => {
    if (Number(req.headers.get('content-length') || 0) > 200) return antwort({ fehler: 'Zu groß.' })
    const b = (await req.json?.().catch(() => null)) as { spiel?: unknown; wert?: unknown } | null
    const wert = Number(b?.wert)
    const elfmeter = b?.spiel === 'elfmeter' && Number.isInteger(wert) && wert >= 0 && wert <= 5
    const hochhalten = b?.spiel === 'hochhalten' && Number.isInteger(wert) && wert >= 0 && wert <= HOCHHALTEN_MAX
    if (!elfmeter && !hochhalten) return Response.json({ fehler: 'Ungültig.' }, { status: 400 })
    // Ausgeschaltete Spiele zählen nicht
    const a = (await req.payload.findGlobal({ slug: 'animationen', depth: 0 }).catch(() => ({}))) as { elfmeter?: boolean | null; hochhalten?: boolean | null }
    if ((elfmeter && a.elfmeter === false) || (hochhalten && a.hochhalten === false)) return Response.json({ fehler: 'Spiel ist ausgeschaltet.' }, { status: 403 })
    const vorher = await heute(req.payload)
    try {
      // Pro Anschluss höchstens 60 Runden in 10 Minuten, alle zusammen 3.000 – darüber wird still nicht gezählt
      ratenGrenze(req, 'spielecke', 60, 3000)
    } catch {
      return antwort({ ...vorher, gezaehlt: false, neuerRekord: false })
    }
    const tag = berlinTag(new Date())
    const db = (req.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle
    // In einem Schritt hochzählen bzw. Rekord übernehmen – auch bei vielen gleichzeitigen Runden richtig
    await db.execute(sql`
      INSERT INTO "spielstatistik" ("datum", "elfmeter_schuesse", "elfmeter_tore", "hochhalten_spiele", "hochhalten_rekord", "updated_at", "created_at")
      VALUES (${tag}, ${elfmeter ? 5 : 0}, ${elfmeter ? wert : 0}, ${hochhalten ? 1 : 0}, ${hochhalten ? wert : 0}, now(), now())
      ON CONFLICT ("datum") DO UPDATE SET
        "elfmeter_schuesse" = COALESCE("spielstatistik"."elfmeter_schuesse", 0) + EXCLUDED."elfmeter_schuesse",
        "elfmeter_tore" = COALESCE("spielstatistik"."elfmeter_tore", 0) + EXCLUDED."elfmeter_tore",
        "hochhalten_spiele" = COALESCE("spielstatistik"."hochhalten_spiele", 0) + EXCLUDED."hochhalten_spiele",
        "hochhalten_rekord" = GREATEST(COALESCE("spielstatistik"."hochhalten_rekord", 0), EXCLUDED."hochhalten_rekord"),
        "updated_at" = now()
    `)
    const danach = await heute(req.payload)
    return antwort({ ...danach, gezaehlt: true, neuerRekord: hochhalten && wert > 0 && wert > vorher.hochhaltenRekord })
  },
}

export const Spielstatistik: CollectionConfig = {
  slug: 'spielstatistik',
  labels: { singular: 'Spielecke-Tag', plural: 'Spielecke-Statistik' },
  // Nur über die beiden Endpunkte – kein direkter Zugriff über die Schnittstelle
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  admin: { hidden: true },
  endpoints: [heuteEndpunkt, meldenEndpunkt],
  fields: [
    { name: 'datum', type: 'text', required: true, unique: true, index: true },
    { name: 'elfmeterSchuesse', type: 'number', defaultValue: 0 },
    { name: 'elfmeterTore', type: 'number', defaultValue: 0 },
    { name: 'hochhaltenSpiele', type: 'number', defaultValue: 0 },
    { name: 'hochhaltenRekord', type: 'number', defaultValue: 0 },
  ],
}

/** Tägliche Aufgabe: Tage älter als 30 Tage löschen */
export async function spielstatistikAufraeumen(payload: Payload) {
  const grenze = berlinTag(new Date(Date.now() - 30 * 86400000))
  const r = await payload.delete({ collection: 'spielstatistik', where: { datum: { less_than: grenze } }, overrideAccess: true })
  return r.docs.length
}
