'use client'
import React, { useCallback, useEffect, useState } from 'react'

type Foto = { id: number; src: string; srcSet?: string; gross: string; alt: string; breite: number; hoehe: number }

/** Bilder-Raster mit Großansicht (Pfeiltasten, Wischen, Esc) */
export function Fotogalerie({ bilder }: { bilder: Foto[] }) {
  const [offen, setOffen] = useState<number | null>(null)
  const [startX, setStartX] = useState<number | null>(null)
  const weiter = useCallback((d: number) => setOffen((i) => (i === null ? null : (i + d + bilder.length) % bilder.length)), [bilder.length])

  useEffect(() => {
    if (offen === null) return
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOffen(null)
      if (e.key === 'ArrowRight') weiter(1)
      if (e.key === 'ArrowLeft') weiter(-1)
    }
    document.addEventListener('keydown', taste)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', taste)
      document.body.style.overflow = ''
    }
  }, [offen, weiter])

  const b = offen !== null ? bilder[offen] : null
  return (
    <>
      <div className="foto-raster">
        {bilder.map((f, i) => (
          <button key={f.id} type="button" onClick={() => setOffen(i)} aria-label={`Foto ${i + 1} groß ansehen${f.alt ? `: ${f.alt}` : ''}`}>
            <img src={f.src} srcSet={f.srcSet} sizes="(max-width: 700px) 50vw, 300px" alt={f.alt} loading="lazy" width={f.breite} height={f.hoehe} />
          </button>
        ))}
      </div>
      {b && (
        <div
          className="foto-gross"
          role="dialog"
          aria-modal="true"
          aria-label="Foto-Großansicht"
          onClick={() => setOffen(null)}
          onTouchStart={(e) => setStartX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (startX === null) return
            const dx = (e.changedTouches[0]?.clientX ?? startX) - startX
            if (Math.abs(dx) > 50) weiter(dx < 0 ? 1 : -1)
            setStartX(null)
          }}
        >
          <img src={b.gross} alt={b.alt} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="foto-zu" onClick={() => setOffen(null)} aria-label="Schließen">
            ×
          </button>
          {bilder.length > 1 && (
            <>
              <button type="button" className="foto-pfeil foto-pfeil--l" onClick={(e) => (e.stopPropagation(), weiter(-1))} aria-label="Vorheriges Foto">
                ‹
              </button>
              <button type="button" className="foto-pfeil foto-pfeil--r" onClick={(e) => (e.stopPropagation(), weiter(1))} aria-label="Nächstes Foto">
                ›
              </button>
            </>
          )}
          <p className="foto-zahl">
            {offen! + 1} / {bilder.length}
            {b.alt ? ` · ${b.alt}` : ''}
          </p>
        </div>
      )}
    </>
  )
}
