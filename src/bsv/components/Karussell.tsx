'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Waagerechte Leiste mit Punkten und Pfeilen (wie bei Apple):
 * - Wischen/Scrollen bleibt möglich, die Karten rasten sauber ein
 * - Punkte zeigen, wo man ist – der aktive wird zur Pille; Klick springt hin
 * - Pfeile links/rechts (am Handy ausgeblendet, dort wischt man)
 * - Bei „weniger Bewegung“ im System ohne Animation
 */
export function Karussell({ children, label = 'Beiträge' }: { children: React.ReactNode; label?: string }) {
  const leiste = useRef<HTMLDivElement>(null)
  const [stellen, setStellen] = useState<number[]>([0])
  const [aktiv, setAktiv] = useState(0)

  // Mögliche Einrast-Stellen berechnen (am Ende passen mehrere Karten auf einmal → weniger Punkte als Karten)
  const messen = useCallback(() => {
    const el = leiste.current
    if (!el) return
    const karten = Array.from(el.querySelectorAll<HTMLElement>('[data-karte]'))
    const start = karten[0]?.offsetLeft ?? 0
    const max = el.scrollWidth - el.clientWidth
    const liste: number[] = []
    for (const k of karten) {
      const x = Math.min(k.offsetLeft - start, max)
      if (!liste.length || x - liste[liste.length - 1]! > 8) liste.push(x)
    }
    setStellen(liste.length ? liste : [0])
  }, [])

  const aktualisieren = useCallback(() => {
    const el = leiste.current
    if (!el) return
    const x = el.scrollLeft
    let best = 0
    stellen.forEach((s, i) => {
      if (Math.abs(s - x) < Math.abs(stellen[best]! - x)) best = i
    })
    setAktiv(best)
  }, [stellen])

  useEffect(() => {
    messen()
    const el = leiste.current
    if (!el) return
    const ro = new ResizeObserver(messen)
    ro.observe(el)
    return () => ro.disconnect()
  }, [messen])

  useEffect(() => {
    const el = leiste.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(aktualisieren)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    aktualisieren()
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [aktualisieren])

  const gehe = (i: number) => {
    const el = leiste.current
    if (!el) return
    const ziel = Math.max(0, Math.min(i, stellen.length - 1))
    const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: stellen[ziel], behavior: ruhig ? 'auto' : 'smooth' })
    setAktiv(ziel)
  }

  const mehrere = stellen.length > 1

  return (
    <div className="karussell" role="region" aria-roledescription="Karussell" aria-label={label}>
      <div
        className="news-rail karussell-leiste"
        ref={leiste}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') (e.preventDefault(), gehe(aktiv + 1))
          if (e.key === 'ArrowLeft') (e.preventDefault(), gehe(aktiv - 1))
        }}
      >
        <div className="news-rail-track">
          {React.Children.map(children, (kind, i) => (
            <div data-karte className="karussell-karte" key={i}>
              {kind}
            </div>
          ))}
        </div>
      </div>
      {mehrere && (
        <div className="karussell-steuerung">
          <div className="karussell-punkte">
            {stellen.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === aktiv ? 'ist-aktiv' : undefined}
                aria-label={`Zu Position ${i + 1} von ${stellen.length}`}
                aria-current={i === aktiv ? 'true' : undefined}
                onClick={() => gehe(i)}
              />
            ))}
          </div>
          <div className="karussell-pfeile">
            <button type="button" aria-label="Zurück" disabled={aktiv === 0} onClick={() => gehe(aktiv - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" aria-label="Weiter" disabled={aktiv === stellen.length - 1} onClick={() => gehe(aktiv + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
