'use client'
import { ruhig } from '@/bsv/bewegung'

import React, { useEffect, useRef, useState } from 'react'

/** Zählt beim ersten Sichtbarwerden von `von` auf `bis` hoch. */
export function CountUp({ bis, von = 0, tausender = true }: { bis: number; von?: number; tausender?: boolean }) {
  const [wert, setWert] = useState(bis)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (ruhig()) return
    setWert(von)
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const step = (t: number) => {
          const p = Math.min(1, (t - start) / 1600)
          setWert(Math.round(von + (bis - von) * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [bis, von])

  return <span ref={ref}>{tausender ? wert.toLocaleString('de-DE') : wert}</span>
}
