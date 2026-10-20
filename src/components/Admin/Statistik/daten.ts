import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

type Zeile = Record<string, unknown>
type Db = { drizzle: { execute: (q: unknown) => Promise<{ rows: Zeile[] }> } }

export const ZEITRAEUME = [
  { key: '7', titel: '7 Tage', tage: 7 },
  { key: '30', titel: '30 Tage', tage: 30 },
  { key: '90', titel: '3 Monate', tage: 90 },
  { key: '365', titel: '12 Monate', tage: 365 },
] as const

const tagText = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
const minus = (d: Date, tage: number) => new Date(d.getTime() - tage * 86400000)
const zahl = (v: unknown) => Number(v) || 0

export type Balken = { label: string; lang: string; besuche: number; aufrufe: number }
export type Liste = { name: string; href?: string; wert: number; zusatz?: string }
export type StatistikDaten = {
  von: string
  bis: string
  kpi: { besuche: number; aufrufe: number; handy: number; vorherBesuche: number; vorherAufrufe: number }
  verlauf: Balken[]
  einheit: 'Tag' | 'Woche' | 'Monat'
  seiten: Liste[]
  herkunft: Liste[]
  geraete: Liste[]
  teams: Liste[]
  antrag: { geoeffnet: number; schritt2: number; schritt3: number; gesendet: number }
  suche: Liste[]
  ohneTreffer: Liste[]
  ersterTag: string | null
}

/** Alle Kennzahlen für einen Zeitraum – direkt per SQL gezählt (schnell auch bei vielen Einträgen) */
export async function statistikLaden(payload: Payload, tage: number): Promise<StatistikDaten> {
  const db = payload.db as unknown as Db
  const q = async (s: unknown) => (await db.drizzle.execute(s)).rows
  const jetzt = new Date()
  const bis = tagText(jetzt)
  const von = tagText(minus(jetzt, tage - 1))
  const vorherBis = tagText(minus(jetzt, tage))
  const vorherVon = tagText(minus(jetzt, 2 * tage - 1))
  const besuch = sql`count(distinct (tag || besucher))`

  const [summe, vorher, handy, proTag, seiten, herkunft, geraete, teams, antrag, suche, ohne, erster] = await Promise.all([
    q(sql`select ${besuch} as besuche, count(*) as aufrufe from statistik where art = 'aufruf' and tag between ${von} and ${bis}`),
    q(sql`select ${besuch} as besuche, count(*) as aufrufe from statistik where art = 'aufruf' and tag between ${vorherVon} and ${vorherBis}`),
    q(sql`select ${besuch} as besuche from statistik where art = 'aufruf' and geraet = 'handy' and tag between ${von} and ${bis}`),
    q(sql`select tag, count(distinct besucher) as besuche, count(*) as aufrufe from statistik where art = 'aufruf' and tag between ${von} and ${bis} group by tag order by tag`),
    q(sql`select pfad, count(*) as aufrufe, ${besuch} as besuche from statistik where art = 'aufruf' and tag between ${von} and ${bis} group by pfad order by aufrufe desc limit 12`),
    q(sql`select quelle, ${besuch} as besuche from statistik where art = 'aufruf' and quelle is not null and quelle <> 'intern' and tag between ${von} and ${bis} group by quelle order by besuche desc limit 10`),
    q(sql`select geraet, ${besuch} as besuche from statistik where art = 'aufruf' and tag between ${von} and ${bis} group by geraet order by besuche desc`),
    q(sql`select pfad, ${besuch} as besuche, count(*) as aufrufe from statistik where art = 'aufruf' and pfad like '/angebote/%' and tag between ${von} and ${bis} group by pfad order by besuche desc limit 12`),
    q(sql`select
        count(distinct case when art = 'aufruf' and pfad = '/mitglied-werden' then tag || besucher end) as geoeffnet,
        count(distinct case when art = 'schritt' and schritt = 2 then tag || besucher end) as schritt2,
        count(distinct case when art = 'schritt' and schritt = 3 then tag || besucher end) as schritt3
      from statistik where tag between ${von} and ${bis}`),
    q(sql`select suchbegriff, count(*) as anzahl, round(avg(treffer)) as treffer from statistik where art = 'suche' and tag between ${von} and ${bis} group by suchbegriff order by anzahl desc limit 12`),
    q(sql`select suchbegriff, count(*) as anzahl from statistik where art = 'suche' and treffer = 0 and tag between ${von} and ${bis} group by suchbegriff order by anzahl desc limit 12`),
    q(sql`select min(tag) as tag from statistik`),
  ])

  // Abgeschickte Anträge zählt der Antrag selbst (zuverlässiger als ein Klick)
  const gesendet = (
    await payload.count({
      collection: 'mitgliedsantraege',
      where: { and: [{ createdAt: { greater_than_equal: new Date(`${von}T00:00:00`).toISOString() } }] },
      overrideAccess: true,
    })
  ).totalDocs

  // Titel für Teams/Kurse und News statt nackter Adressen
  const slugs = (prefix: string, rows: Zeile[]) => rows.map((r) => String(r.pfad)).filter((p) => p.startsWith(prefix)).map((p) => p.slice(prefix.length))
  const angebotSlugs = [...new Set([...slugs('/angebote/', seiten), ...slugs('/angebote/', teams)])]
  const newsSlugs = slugs('/news/', seiten)
  const [angebote, news] = await Promise.all([
    angebotSlugs.length ? payload.find({ collection: 'angebote', where: { slug: { in: angebotSlugs } }, limit: 100, depth: 0, overrideAccess: true, select: { title: true, slug: true } as never }) : null,
    newsSlugs.length ? payload.find({ collection: 'posts', where: { slug: { in: newsSlugs } }, limit: 100, depth: 0, overrideAccess: true, select: { title: true, slug: true } as never }) : null,
  ])
  const titel = new Map<string, string>()
  for (const a of (angebote?.docs ?? []) as unknown as { title: string; slug: string }[]) titel.set(`/angebote/${a.slug}`, a.title)
  for (const n of (news?.docs ?? []) as unknown as { title: string; slug: string }[]) titel.set(`/news/${n.slug}`, `News: ${n.title}`)
  const FEST: Record<string, string> = {
    '/': 'Startseite',
    '/fussball': 'Fußball',
    '/breitensport': 'Breitensport',
    '/verein': 'Verein',
    '/news': 'News (Übersicht)',
    '/termine': 'Termine',
    '/kontakt': 'Kontakt',
    '/mitglied-werden': 'Mitglied werden',
    '/sponsoren': 'Sponsoren',
    '/galerie': 'Galerie',
    '/mitmachen': 'Mitmachen',
    '/trainingszeiten': 'Trainingszeiten',
    '/mitglieder': 'Mitgliederbereich',
    '/login': 'Anmelden',
    '/suche': 'Suche',
  }
  const name = (p: string) => titel.get(p) ?? FEST[p] ?? p

  // Verlauf: bis 31 Tage pro Tag, bis 3 Monate pro Woche, sonst pro Monat
  const einheit: StatistikDaten['einheit'] = tage <= 31 ? 'Tag' : tage <= 120 ? 'Woche' : 'Monat'
  const nachTag = new Map(proTag.map((r) => [String(r.tag), { besuche: zahl(r.besuche), aufrufe: zahl(r.aufrufe) }]))
  const verlauf: Balken[] = []
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', ...o })
  for (let i = tage - 1; i >= 0; ) {
    const start = minus(jetzt, i)
    const schritt = einheit === 'Tag' ? 1 : einheit === 'Woche' ? 7 : 0
    let tageImBalken = schritt
    if (einheit === 'Monat') {
      // bis zum Monatsende bzw. heute
      const ende = new Date(start.getFullYear(), start.getMonth() + 1, 0)
      tageImBalken = Math.min(i + 1, Math.round((ende.getTime() - start.getTime()) / 86400000) + 1)
    }
    tageImBalken = Math.min(tageImBalken, i + 1)
    let besuche = 0
    let aufrufe = 0
    for (let k = 0; k < tageImBalken; k++) {
      const w = nachTag.get(tagText(minus(jetzt, i - k)))
      if (w) (besuche += w.besuche), (aufrufe += w.aufrufe)
    }
    const ende = minus(jetzt, i - tageImBalken + 1)
    verlauf.push({
      label: einheit === 'Tag' ? fmt(start, { day: 'numeric', month: 'numeric' }) : einheit === 'Woche' ? fmt(start, { day: 'numeric', month: 'numeric' }) : fmt(start, { month: 'short' }),
      lang: einheit === 'Tag' ? fmt(start, { weekday: 'long', day: 'numeric', month: 'long' }) : einheit === 'Woche' ? `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(ende, { day: 'numeric', month: 'short' })}` : fmt(start, { month: 'long', year: 'numeric' }),
      besuche,
      aufrufe,
    })
    i -= tageImBalken
  }

  const GERAET: Record<string, string> = { handy: '📱 Handy', tablet: '📟 Tablet', computer: '💻 Computer' }
  return {
    von,
    bis,
    kpi: { besuche: zahl(summe[0]?.besuche), aufrufe: zahl(summe[0]?.aufrufe), handy: zahl(handy[0]?.besuche), vorherBesuche: zahl(vorher[0]?.besuche), vorherAufrufe: zahl(vorher[0]?.aufrufe) },
    verlauf,
    einheit,
    seiten: seiten.map((r) => ({ name: name(String(r.pfad)), href: String(r.pfad), wert: zahl(r.aufrufe), zusatz: `${zahl(r.besuche)} Besuche` })),
    herkunft: herkunft.map((r) => ({ name: String(r.quelle) === 'direkt' ? 'Direkt (Adresse eingetippt, Lesezeichen, App)' : String(r.quelle), wert: zahl(r.besuche) })),
    geraete: geraete.map((r) => ({ name: GERAET[String(r.geraet)] ?? String(r.geraet), wert: zahl(r.besuche) })),
    teams: teams.map((r) => ({ name: name(String(r.pfad)), href: String(r.pfad), wert: zahl(r.besuche), zusatz: `${zahl(r.aufrufe)} Aufrufe` })),
    antrag: { geoeffnet: zahl(antrag[0]?.geoeffnet), schritt2: zahl(antrag[0]?.schritt2), schritt3: zahl(antrag[0]?.schritt3), gesendet },
    suche: suche.map((r) => ({ name: String(r.suchbegriff), wert: zahl(r.anzahl), zusatz: zahl(r.treffer) ? `ø ${zahl(r.treffer)} Treffer` : 'keine Treffer' })),
    ohneTreffer: ohne.map((r) => ({ name: String(r.suchbegriff), wert: zahl(r.anzahl) })),
    ersterTag: erster[0]?.tag ? String(erster[0].tag) : null,
  }
}
