'use client'

import Link from 'next/link'
import React, { useState } from 'react'

export type NewsKarte = { id: number; href: string; titel: string; datum: string; kategorie: string; img?: string; pos?: string }

const FARBE: Record<string, [string, string]> = {
  Verein: ['#1D4ED8', '#EEF4FF'],
  Fußball: ['#157A43', '#E8F6EE'],
  Kids: ['#C2410C', '#FFEDE7'],
}

export function NewsListe({ items, kategorien }: { items: NewsKarte[]; kategorien: string[] }) {
  const [f, setF] = useState('Alle')
  const liste = items.filter((n) => f === 'Alle' || n.kategorie === f)

  return (
    <>
      {kategorien.length > 1 && (
        <div role="group" aria-label="News filtern" className="chips" style={{ marginBottom: 32 }}>
          {['Alle', ...kategorien].map((k) => (
            <button key={k} type="button" className="chip chip-dark" aria-pressed={k === f} onClick={() => setF(k)}>
              {k}
            </button>
          ))}
        </div>
      )}
      {liste.length === 0 && <p className="muted">In dieser Kategorie gibt es noch keine News.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '28px 20px' }}>
        {liste.map((n) => {
          const [tint, bg] = FARBE[n.kategorie] ?? FARBE.Verein!
          return (
            <Link key={n.id} href={n.href} className="card card-anim" style={{ background: 'transparent', gap: 12, borderRadius: 24 }}>
              <span style={{ aspectRatio: '16 / 10', background: bg, borderRadius: 24, overflow: 'hidden', display: 'block' }}>
                {n.img ? (
                  <img src={n.img} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: n.pos, display: 'block' }} />
                ) : (
                  <img src="/bsv-logo.png" alt="" style={{ width: '22%', height: 'auto', margin: '0 auto', display: 'block', position: 'relative', top: '50%', transform: 'translateY(-50%)', opacity: 0.85 }} />
                )}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: tint, padding: '0 4px' }}>
                {n.kategorie} · {n.datum}
              </span>
              <strong style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.02em', padding: '0 4px 8px' }}>{n.titel}</strong>
            </Link>
          )
        })}
      </div>
    </>
  )
}
