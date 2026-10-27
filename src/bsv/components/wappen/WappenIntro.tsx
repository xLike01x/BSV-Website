'use client'
import React, { useLayoutEffect, useRef } from 'react'

import { WAPPEN_UMRISS, WAPPEN_VIEWBOX } from './umriss'

/**
 * Startseite: Beim ersten Besuch zeichnet sich das Wappen auf (Kontur, dann die Fläche als diagonaler Pinselstrich,
 * darunter der Vereinsname) und blendet nach gut 2 Sekunden aus. Nur einmal pro Besuch.
 *
 * - Animation und Ausblenden sind reines CSS – auch ohne JavaScript verschwindet das Intro von selbst.
 * - Ob es schon gelaufen ist, entscheidet das kleine Skript im <head> (introSkript.ts) vor dem ersten Zeichnen.
 * - Bei Navigation innerhalb der Website (ohne Neuladen) blendet der Effekt unten es vor dem Zeichnen aus.
 * - Ein Klick überspringt es.
 */
export function WappenIntro({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const d = document.documentElement
    // Erster Aufruf: läuft bereits – erst danach als „gesehen“ markieren (React bindet Effekte in der Entwicklung zweimal ein)
    if (d.getAttribute('data-intro') === 'laeuft') {
      const t = setTimeout(() => d.setAttribute('data-intro', 'gesehen'), 3200)
      return () => clearTimeout(t)
    }
    ref.current?.classList.add('ist-aus')
  }, [])

  return (
    <div ref={ref} className="wappen-intro" aria-hidden="true" onClick={() => ref.current?.classList.add('ist-weg')}>
      <div className="wappen-intro-logo">
        <img src="/wappen.svg" alt="" width={690} height={743} className="wappen-intro-flaeche" decoding="sync" />
        <svg viewBox={WAPPEN_VIEWBOX} className="wappen-intro-strich" focusable="false">
          <path d={WAPPEN_UMRISS} pathLength={1} />
        </svg>
      </div>
      <p className="wappen-intro-name">{name}</p>
    </div>
  )
}
