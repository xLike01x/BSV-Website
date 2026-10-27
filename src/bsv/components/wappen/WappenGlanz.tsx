'use client'
import React, { useRef } from 'react'

/**
 * Vereinsseite: großes Wappen mit Prägung und Lichtreflex. Mit der Maus (oder dem Stift) kippt es leicht in 3D und ein
 * Lichtschimmer folgt dem Zeiger; ohne Maus (Handy) zieht der Schimmer per CSS ab und zu von selbst darüber.
 * Mit `bewegt={false}` (Animationen aus) steht es still. Bei „Bewegung reduzieren“ greift dasselbe per CSS.
 */
export function WappenGlanz({ bewegt = true, className = '' }: { bewegt?: boolean; className?: string }) {
  const karte = useRef<HTMLDivElement>(null)
  const rahmen = useRef<number>(0)

  const setzen = (x: number, y: number, aktiv: boolean) => {
    const el = karte.current
    if (!el) return
    cancelAnimationFrame(rahmen.current)
    rahmen.current = requestAnimationFrame(() => {
      // x, y: 0–1 innerhalb des Wappens; höchstens 9° Neigung
      el.style.setProperty('--kipp-x', `${((0.5 - y) * 18).toFixed(2)}deg`)
      el.style.setProperty('--kipp-y', `${((x - 0.5) * 18).toFixed(2)}deg`)
      el.style.setProperty('--licht-x', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--licht-y', `${(y * 100).toFixed(1)}%`)
      el.classList.toggle('ist-aktiv', aktiv)
    })
  }

  const bewegen = (e: React.PointerEvent) => {
    if (!bewegt || e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    setzen((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, true)
  }

  return (
    <div className={`wappen-glanz${bewegt ? '' : ' ist-still'} ${className}`} onPointerMove={bewegen} onPointerLeave={() => setzen(0.5, 0.5, false)}>
      <div ref={karte} className="wappen-glanz-karte">
        <img src="/wappen.svg" alt="Wappen des Büdericher Spielvereins 1919 e.V." width={690} height={743} />
        <span className="wappen-glanz-licht" aria-hidden="true" />
        <span className="wappen-glanz-schimmer" aria-hidden="true" />
      </div>
    </div>
  )
}
