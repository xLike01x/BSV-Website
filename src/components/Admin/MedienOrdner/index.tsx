import { sql } from '@payloadcms/db-postgres'
import type { Payload, TypedUser } from 'payload'
import React from 'react'

import { alleBilder, imBereich, nurLeser } from '@/access/roles'
import { ausfuehren } from '@/papierkorb/plugin'

import MedienOrdnerClient, { type Ordner } from './Client'
import './ordner.scss'

const BEREICHE: [string, string][] = [
  ['fussball', 'Fußball'],
  ['kids', 'BSV Kids'],
  ['erwachsene', 'Erwachsene & Senioren'],
]

const idVon = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? ((v as { id?: number }).id ?? null) : Number(v))

/** Über der Mediathek: Ordner je Team, „Verein allgemein“, „Sponsoren“, „Vereinsdokumente“ und „Noch nicht zugeordnet“ */
export default async function MedienOrdner({ payload, user }: { payload: Payload; user: TypedUser | null }) {
  if (!user) return null
  // Alle Ordner sehen: Redaktion und Zusatzrechte mit Bildern; Bilder verschieben/zuordnen: nur Redaktion bzw. Zusatzrecht „medien“
  const alle = alleBilder(user) || nurLeser(user)
  const redaktion = imBereich(user, 'medien')

  // Gezählt wird in der Datenbank (GROUP BY) – vorher wurden dafür alle Bilder geladen
  const [zaehlung, angebote] = await Promise.all([
    ausfuehren(
      { payload },
      sql`select team_id, coalesce(allgemein, false) as allgemein, coalesce(sponsoren, false) as sponsoren, coalesce(vereinsdokument, false) as vereinsdokument, count(*)::int as anzahl, (count(*) filter (where personen is null))::int as ohne from media where deleted_at is null group by 1, 2, 3, 4`,
    ),
    payload.find({
      collection: 'angebote',
      limit: 500,
      depth: 0,
      pagination: false,
      sort: 'title',
      select: { title: true, bereich: true, aktiv: true },
      where: alle ? undefined : { leitung: { contains: user.id } },
      overrideAccess: true,
    }),
  ])

  const proTeam = new Map<number, number>()
  let allgemein = 0
  let sponsoren = 0
  let dokumente = 0
  let offen = 0
  let ohneEinwilligung = 0
  let gesamt = 0
  for (const z of zaehlung.rows as { team_id: number | null; allgemein: boolean; sponsoren: boolean; vereinsdokument: boolean; anzahl: number; ohne: number }[]) {
    ohneEinwilligung += Number(z.ohne)
    const n = Number(z.anzahl)
    gesamt += n
    const t = idVon(z.team_id)
    if (t) proTeam.set(t, (proTeam.get(t) ?? 0) + n)
    else if (z.vereinsdokument) dokumente += n
    else if (z.sponsoren) sponsoren += n
    else if (z.allgemein) allgemein += n
    else offen += n
  }

  const gruppen = BEREICHE.map(([key, label]) => ({
    label,
    ordner: (angebote.docs as unknown as { id: number; title: string; bereich?: string; aktiv?: boolean }[])
      .filter((a) => a.bereich === key)
      .map<Ordner>((a) => ({ key: `team-${a.id}`, titel: a.title, anzahl: proTeam.get(a.id) ?? 0, query: `where[team][equals]=${a.id}`, gedimmt: a.aktiv === false, ziel: { art: 'team', id: a.id } })),
  })).filter((g) => g.ordner.length)

  const eigeneSumme = gruppen.reduce((s, g) => s + g.ordner.reduce((x, o) => x + o.anzahl, 0), 0)
  const oben: Ordner[] = [
    { key: 'alle', titel: alle ? 'Alle Bilder' : 'Alle meine Bilder', anzahl: alle ? gesamt : eigeneSumme + allgemein + sponsoren + dokumente, query: '', symbol: '🗂️' },
    { key: 'allgemein', titel: 'Verein allgemein', anzahl: allgemein, query: 'where[and][0][allgemein][equals]=true&where[and][1][sponsoren][not_equals]=true&where[and][2][vereinsdokument][not_equals]=true&where[and][3][team][exists]=false', symbol: '🏟️', ziel: redaktion ? { art: 'allgemein' } : undefined },
    { key: 'sponsoren', titel: 'Sponsoren', anzahl: sponsoren, query: 'where[and][0][sponsoren][equals]=true&where[and][1][vereinsdokument][not_equals]=true&where[and][2][team][exists]=false', symbol: '🤝', ziel: redaktion ? { art: 'sponsoren' } : undefined },
    { key: 'dokumente', titel: 'Vereinsdokumente', anzahl: dokumente, query: 'where[and][0][vereinsdokument][equals]=true&where[and][1][team][exists]=false', symbol: '📜', ziel: redaktion ? { art: 'dokumente' } : undefined },
    ...(redaktion
      ? [
          {
            key: 'offen',
            titel: 'Noch nicht zugeordnet',
            anzahl: offen,
            query: 'where[and][0][team][exists]=false&where[and][1][or][0][allgemein][equals]=false&where[and][1][or][1][allgemein][exists]=false&where[and][2][sponsoren][not_equals]=true&where[and][3][vereinsdokument][not_equals]=true',
            symbol: '📥',
            warn: offen > 0,
            ziel: { art: 'offen' } as const,
          },
          ...(ohneEinwilligung
            ? [{ key: 'einwilligung', titel: 'Angabe zu Personen fehlt', anzahl: ohneEinwilligung, query: 'where[personen][exists]=false', symbol: '👤', warn: true }]
            : []),
        ]
      : []),
  ]

  return <MedienOrdnerClient oben={oben} gruppen={gruppen} redaktion={redaktion} />
}
