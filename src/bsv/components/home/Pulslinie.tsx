'use client'
import React, { useEffect, useRef, useState } from 'react'

const LINIE = 'M2 34 H96 L106 34 L114 14 L124 54 L134 6 L144 44 L152 34 H298'

/**
 * Herzschlag-Linie in der Kachel „Fitness“: zeichnet sich wie das Spielfeld selbst, sobald die Kachel sichtbar wird,
 * danach läuft ab und zu ein Lichtpunkt darüber. Rein dekorativ; ausschaltbar unter Website-Aufbau → Animationen.
 */
export function Pulslinie() {
  const ref = useRef<SVGSVGElement>(null)
  const [sichtbar, setSichtbar] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return setSichtbar(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSichtbar(true)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <svg ref={ref} className={sichtbar ? 'pulslinie ist-sichtbar' : 'pulslinie'} viewBox="0 0 300 60" aria-hidden="true" focusable="false">
      <path className="pulslinie-strich" pathLength={1} d={LINIE} />
      <path className="pulslinie-funke" pathLength={1} d={LINIE} />
    </svg>
  )
}
