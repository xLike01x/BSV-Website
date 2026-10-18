import type { Payload, TypedUser } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'

import MedienOrdnerClient, { type Ordner } from './Client'
import './ordner.scss'

const BEREICHE: [string, string][] = [
  ['fussball', 'Fußball'],
  ['kids', 'BSV Kids'],
  ['erwachsene', 'Erwachsene & Senioren'],
]

const idVon = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? ((v as { id?: number }).id ?? null) : Number(v))

/** Über der Mediathek: Ordner je Team, „Verein allgemein“ und „Noch nicht zugeordnet“ */
export default async function MedienOrdner({ payload, user }: { payload: Payload; user: TypedUser | null }) {
  if (!user) return null
  const redaktion = hasRole(user as never, 'admin', 'redaktion')

  const [medien, angebote] = await Promise.all([
    payload.find({ collection: 'media', limit: 10000, depth: 0, pagination: false, select: { team: true, allgemein: true }, overrideAccess: true }),
    payload.find({
      collection: 'angebote',
      limit: 500,
      depth: 0,
      pagination: false,
      sort: 'title',
      select: { title: true, bereich: true, aktiv: true },
      where: redaktion ? undefined : { leitung: { contains: user.id } },
      overrideAccess: true,
    }),
  ])

  const proTeam = new Map<number, number>()
  let allgemein = 0
  let offen = 0
  for (const m of medien.docs as unknown as { team?: unknown; allgemein?: boolean | null }[]) {
    const t = idVon(m.team)
    if (t) proTeam.set(t, (proTeam.get(t) ?? 0) + 1)
    else if (m.allgemein) allgemein++
    else offen++
  }

  const gruppen = BEREICHE.map(([key, label]) => ({
    label,
    ordner: (angebote.docs as unknown as { id: number; title: string; bereich?: string; aktiv?: boolean }[])
      .filter((a) => a.bereich === key)
      .map<Ordner>((a) => ({ key: `team-${a.id}`, titel: a.title, anzahl: proTeam.get(a.id) ?? 0, query: `where[team][equals]=${a.id}`, gedimmt: a.aktiv === false, ziel: { art: 'team', id: a.id } })),
  })).filter((g) => g.ordner.length)

  const eigeneSumme = gruppen.reduce((s, g) => s + g.ordner.reduce((x, o) => x + o.anzahl, 0), 0)
  const oben: Ordner[] = [
    { key: 'alle', titel: redaktion ? 'Alle Bilder' : 'Alle meine Bilder', anzahl: redaktion ? medien.docs.length : eigeneSumme + allgemein, query: '', symbol: '🗂️' },
    { key: 'allgemein', titel: 'Verein allgemein', anzahl: allgemein, query: 'where[allgemein][equals]=true', symbol: '🏟️', ziel: redaktion ? { art: 'allgemein' } : undefined },
    ...(redaktion
      ? [
          {
            key: 'offen',
            titel: 'Noch nicht zugeordnet',
            anzahl: offen,
            query: 'where[and][0][team][exists]=false&where[and][1][or][0][allgemein][equals]=false&where[and][1][or][1][allgemein][exists]=false',
            symbol: '📥',
            warn: offen > 0,
            ziel: { art: 'offen' } as const,
          },
        ]
      : []),
  ]

  return <MedienOrdnerClient oben={oben} gruppen={gruppen} redaktion={redaktion} />
}
