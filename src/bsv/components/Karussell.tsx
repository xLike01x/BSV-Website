'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Waagerechte Leiste mit Punkten und Pfeilen (wie bei Apple):
 * - Wischen/Scrollen bleibt möglich, die Karten rasten sauber ein
 * - Punkte zeigen, wo man ist – der aktive wird zur Pille; Klick springt hin
 * - Pfeile links/rechts (am Handy ausgeblendet, dort wischt man)
 * - Läuft von selbst weiter (optional). Pause, solange die Maus darauf zeigt, man wischt, es nicht
 *   zu sehen ist oder der Tab im Hintergrund liegt. Die aktive Pille füllt sich als Fortschritt.
 * - Bei „weniger Bewegung“ im System ohne Animation und ohne automatisches Weiterlaufen
 */
export function Karussell({ children, label = 'Beiträge', automatisch = 0 }: { children: React.ReactNode; label?: string; automatisch?: number }) {
  const leiste = useRef<HTMLDivElement>(null)
  const huelle = useRef<HTMLDivElement>(null)
  const [stellen, setStellen] = useState<number[]>([0])
  const [aktiv, setAktiv] = useState(0)
  const verstrichen = useRef(0)
  const pause = useRef({ maus: false, fokus: false, finger: false, unsichtbar: false })
  const [laeuft, setLaeuft] = useState(false)

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

  // Neuer Punkt → Fortschritt von vorn
  useEffect(() => {
    verstrichen.current = 0
    huelle.current?.style.setProperty('--fortschritt', '0')
  }, [aktiv])

  // Automatisch weiter
  useEffect(() => {
    if (!automatisch || !mehrere || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setLaeuft(true)
    const el = huelle.current
    const io = new IntersectionObserver(([e]) => (pause.current.unsichtbar = !e?.isIntersecting), { threshold: 0.4 })
    if (el) io.observe(el)
    let raf = 0
    let zuletzt = performance.now()
    const schritt = (jetzt: number) => {
      const p = pause.current
      if (!(p.maus || p.fokus || p.finger || p.unsichtbar || document.hidden)) {
        verstrichen.current += jetzt - zuletzt
        el?.style.setProperty('--fortschritt', String(Math.max(0, Math.min(1, verstrichen.current / automatisch))))
        if (verstrichen.current >= automatisch) {
          verstrichen.current = 0
          setAktiv((a) => {
            const naechster = a + 1 >= stellen.length ? 0 : a + 1
            leiste.current?.scrollTo({ left: stellen[naechster], behavior: 'smooth' })
            return naechster
          })
        }
      }
      zuletzt = jetzt
      raf = requestAnimationFrame(schritt)
    }
    raf = requestAnimationFrame(schritt)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [automatisch, mehrere, stellen])

  return (
    <div
      className={`karussell${laeuft ? ' karussell--auto' : ''}`}
      role="region"
      aria-roledescription="Karussell"
      aria-label={label}
      ref={huelle}
      onMouseEnter={() => (pause.current.maus = true)}
      onMouseLeave={() => (pause.current.maus = false)}
      onFocus={(e) => (pause.current.fokus = (e.target as HTMLElement).matches(':focus-visible'))}
      onBlur={() => (pause.current.fokus = false)}
      onTouchStart={() => (pause.current.finger = true)}
      onTouchEnd={() => setTimeout(() => (pause.current.finger = false), 4000)}
    >
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
              >
                {i === aktiv && <span className="karussell-fortschritt" />}
              </button>
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
