import type { Payload, TypedUser } from 'payload'
import React from 'react'

import { alleBilder, imBereich, nurLeser } from '@/access/roles'

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
  // Alle Ordner sehen: Redaktion und Zusatzrechte mit Bildern; Bilder verschieben/zuordnen: nur Redaktion bzw. Zusatzrecht „medien“
  const alle = alleBilder(user) || nurLeser(user)
  const redaktion = imBereich(user, 'medien')

  const [medien, angebote] = await Promise.all([
    payload.find({ collection: 'media', limit: 10000, depth: 0, pagination: false, select: { team: true, allgemein: true, sponsoren: true, personen: true }, overrideAccess: true }),
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
  let offen = 0
  let ohneEinwilligung = 0
  for (const m of medien.docs as unknown as { team?: unknown; allgemein?: boolean | null; sponsoren?: boolean | null; personen?: string | null }[]) {
    if (!m.personen) ohneEinwilligung++
    const t = idVon(m.team)
    if (t) proTeam.set(t, (proTeam.get(t) ?? 0) + 1)
    else if (m.sponsoren) sponsoren++
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
    { key: 'alle', titel: alle ? 'Alle Bilder' : 'Alle meine Bilder', anzahl: alle ? medien.docs.length : eigeneSumme + allgemein + sponsoren, query: '', symbol: '🗂️' },
    { key: 'allgemein', titel: 'Verein allgemein', anzahl: allgemein, query: 'where[and][0][allgemein][equals]=true&where[and][1][sponsoren][not_equals]=true&where[and][2][team][exists]=false', symbol: '🏟️', ziel: redaktion ? { art: 'allgemein' } : undefined },
    { key: 'sponsoren', titel: 'Sponsoren', anzahl: sponsoren, query: 'where[and][0][sponsoren][equals]=true&where[and][1][team][exists]=false', symbol: '🤝', ziel: redaktion ? { art: 'sponsoren' } : undefined },
    ...(redaktion
      ? [
          {
            key: 'offen',
            titel: 'Noch nicht zugeordnet',
            anzahl: offen,
            query: 'where[and][0][team][exists]=false&where[and][1][or][0][allgemein][equals]=false&where[and][1][or][1][allgemein][exists]=false&where[and][2][sponsoren][not_equals]=true',
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
