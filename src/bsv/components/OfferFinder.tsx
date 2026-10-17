'use client'

import Link from 'next/link'
import React, { useState } from 'react'

export type FinderItem = {
  id: number
  name: string
  href: string
  kategorie: string
  alter: string
  von: number
  bis: number
  img?: string
  tint: string
  tintBg: string
}

const GRUPPEN = [
  { id: 'alle', label: 'Alle', von: 0, bis: 99 },
  { id: 'kinder', label: 'Kinder', von: 0, bis: 11 },
  { id: 'jugend', label: 'Jugend', von: 12, bis: 17 },
  { id: 'erwachsene', label: 'Erwachsene', von: 18, bis: 59 },
  { id: 'senioren', label: '60+', von: 60, bis: 99 },
]

/** „Finde deinen Sport“ – Filter nach Altersgruppe */
export function OfferFinder({ items }: { items: FinderItem[] }) {
  const [g, setG] = useState('alle')
  const [alleZeigen, setAlleZeigen] = useState(false)
  const idx = Math.max(0, GRUPPEN.findIndex((x) => x.id === g))
  const gruppe = GRUPPEN[idx]!
  const liste = items.filter((i) => i.von <= gruppe.bis && i.bis >= gruppe.von)
  const LIMIT = 12
  const sichtbar = alleZeigen ? liste : liste.slice(0, LIMIT)

  return (
    <>
      <p className="rv lead center" style={{ margin: '14px auto 36px', maxWidth: 560 }}>
        {liste.length} Angebote passen. Probetraining mit einem Klick.
      </p>
      <div role="group" aria-label="Nach Alter filtern" className="seg seg-warm" style={{ gridTemplateColumns: `repeat(${GRUPPEN.length}, minmax(0, 1fr))`, maxWidth: 640, marginBottom: 44 }}>
        <span aria-hidden="true" className="seg-ind" style={{ width: `calc((100% - 8px) / ${GRUPPEN.length})`, transform: `translateX(${idx * 100}%)` }} />
        {GRUPPEN.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === g} onClick={() => (setG(x.id), setAlleZeigen(false))}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid-cards">
        {sichtbar.map((o) => (
          <Link key={`${g}-${o.id}`} href={o.href} className="card card-anim">
            <span className="card-img" style={{ background: o.tintBg }}>
              {o.img && <img src={o.img} alt="" loading="lazy" />}
            </span>
            <span className="card-body">
              <span className="card-cat" style={{ color: o.tint }}>
                {o.kategorie}
              </span>
              <strong className="card-title">{o.name}</strong>
              <span className="card-meta">{o.alter}</span>
              <span className="card-cta">Probetraining ›</span>
            </span>
          </Link>
        ))}
      </div>
      {liste.length > LIMIT && !alleZeigen && (
        <div className="center" style={{ marginTop: 32 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setAlleZeigen(true)}>
            Alle {liste.length} Angebote anzeigen
          </button>
        </div>
      )}
    </>
  )
}
