'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export type GruppenKarte = {
  id: number
  name: string
  href: string
  oben: string
  untertitel: string
  zeile?: string
  img?: string
  tint?: string
  cta: string
}
export type Gruppe = { id: string; title: string; sub?: string; items: GruppenKarte[] }

/**
 * Teams/Kurse nach Gruppen mit Segment-Filter. Der Anker in der URL
 * (z. B. /fussball#senioren) wählt den Filter vor.
 */
export function GruppenFilter({ gruppen, variante }: { gruppen: Gruppe[]; variante: 'text' | 'bild' }) {
  const defs = [{ id: 'alle', label: 'Alle' }, ...gruppen.map((g) => ({ id: g.id, label: g.title.replace(' & Senioren', '') }))]
  const [f, setF] = useState('alle')

  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.slice(1))
    if (gruppen.some((g) => g.id === h)) setF(h)
  }, [gruppen])

  const idx = Math.max(0, defs.findIndex((d) => d.id === f))
  const sichtbar = gruppen.filter((g) => f === 'alle' || g.id === f)

  return (
    <>
      <div role="group" aria-label="Filtern" className="seg" style={{ gridTemplateColumns: `repeat(${defs.length}, minmax(0, 1fr))`, maxWidth: defs.length * 136 }}>
        <span aria-hidden="true" className="seg-ind" style={{ width: `calc((100% - 8px) / ${defs.length})`, transform: `translateX(${idx * 100}%)` }} />
        {defs.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={d.id === f}
            onClick={() => {
              setF(d.id)
              history.replaceState(null, '', d.id === 'alle' ? window.location.pathname : `#${d.id}`)
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
      {sichtbar.map((g) => (
        <div key={g.id} id={g.id} style={{ marginBottom: 64, scrollMarginTop: 90 }}>
          <h2 className="t-3" style={{ fontSize: 'clamp(30px, 3.4vw, 40px)', fontWeight: 800 }}>
            {g.title} <span style={{ color: 'var(--bsv-muted)', fontWeight: 500 }}>{g.items.length}</span>
          </h2>
          {g.sub && (
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 19 }}>
              {g.sub}
            </p>
          )}
          <div className="grid-cards" style={{ marginTop: 22 }}>
            {g.items.map((t) =>
              variante === 'text' ? (
                <Link key={t.id} href={t.href} className="card card-soft card-anim" style={{ padding: 24, minHeight: 180, gap: 6 }}>
                  <span className="card-cat green" style={{ fontWeight: 600 }}>
                    {t.oben}
                  </span>
                  <strong style={{ fontSize: 24, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{t.name}</strong>
                  <span className="card-meta">{t.untertitel}</span>
                  <span className="card-cta" style={{ paddingTop: 10 }}>
                    {t.cta}
                  </span>
                </Link>
              ) : (
                <Link key={t.id} href={t.href} className="card card-anim">
                  <span className="card-img">
                    {t.img && <img src={t.img} alt="" loading="lazy" />}
                  </span>
                  <span className="card-body">
                    <span className="card-cat" style={{ color: t.tint }}>
                      {t.oben}
                    </span>
                    <strong className="card-title">{t.name}</strong>
                    <span className="card-meta">{t.untertitel}</span>
                    {t.zeile && <span className="card-meta">{t.zeile}</span>}
                    <span className="card-cta">{t.cta}</span>
                  </span>
                </Link>
              ),
            )}
          </div>
        </div>
      ))}
    </>
  )
}
