'use client'

import React, { useCallback, useEffect, useState } from 'react'

export type GalerieBild = { id: number; klein: string; gross: string; alt: string; breite?: number; hoehe?: number }

/** Bildergalerie mit Vollbildansicht (Pfeiltasten, Wischen, Escape) */
export function Galerie({ bilder }: { bilder: GalerieBild[] }) {
  const [offen, setOffen] = useState<number | null>(null)
  const [startX, setStartX] = useState<number | null>(null)

  const weiter = useCallback((d: number) => setOffen((i) => (i === null ? i : (i + d + bilder.length) % bilder.length)), [bilder.length])

  useEffect(() => {
    if (offen === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOffen(null)
      if (e.key === 'ArrowRight') weiter(1)
      if (e.key === 'ArrowLeft') weiter(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [offen, weiter])

  const aktuell = offen !== null ? bilder[offen] : null

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
        {bilder.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setOffen(i)}
            className="tile"
            aria-label={`Bild vergrößern${b.alt ? `: ${b.alt}` : ''}`}
            style={{ border: 0, padding: 0, cursor: 'zoom-in', aspectRatio: '1', borderRadius: 18, background: 'var(--bsv-soft)' }}
          >
            <img src={b.klein} alt={b.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>

      {aktuell && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bildansicht"
          onClick={() => setOffen(null)}
          onTouchStart={(e) => setStartX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const x = e.changedTouches[0]?.clientX
            if (startX !== null && x !== undefined && Math.abs(x - startX) > 50) weiter(x < startX ? 1 : -1)
            setStartX(null)
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,10,12,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 4vw, 48px)', animation: 'panel .25s ease both' }}
        >
          <img src={aktuell.gross} alt={aktuell.alt} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} />
          {[
            { label: 'Vorheriges Bild', d: -1, pos: { left: 12 }, txt: '‹' },
            { label: 'Nächstes Bild', d: 1, pos: { right: 12 }, txt: '›' },
          ].map((k) => (
            <button
              key={k.label}
              type="button"
              aria-label={k.label}
              onClick={(e) => (e.stopPropagation(), weiter(k.d))}
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 30, cursor: 'pointer', ...k.pos }}
            >
              {k.txt}
            </button>
          ))}
          <button type="button" aria-label="Schließen" onClick={() => setOffen(null)} style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
            ✕
          </button>
          <span style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {(offen ?? 0) + 1} / {bilder.length}
          </span>
        </div>
      )}
    </>
  )
}
