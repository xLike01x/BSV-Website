'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Ball } from './Ball'
import { amBoden, darfKicken, RASEN } from './hochhaltenRegel'
import { melden } from './melden'
import { RanglisteEintragen } from './RanglisteEintragen'

const GROESSE = 64
const urteil = (n: number) => (n >= 30 ? 'Profi-Niveau! 🏆' : n >= 15 ? 'Richtig stark! ⭐' : n >= 5 ? 'Gut gemacht!' : 'Schaffst du mehr?')

/**
 * Ball hochhalten: den fallenden Ball antippen, bevor er den Boden berührt. Mit jedem Kontakt wird es etwas schneller.
 * Ein Kontakt zählt nur, wenn der Ball herunterfällt und im unteren Teil des Feldes ist (siehe hochhaltenRegel.ts) –
 * sonst ließe er sich durch schnelles Klicken oben festhalten.
 * Bedienung per Tippen/Klicken auf den Ball oder Leertaste. Nichts wird gespeichert („Bester Wert“ gilt nur, solange die Seite offen ist).
 */
export function Hochhalten({ rangliste = false }: { rangliste?: boolean }) {
  const feld = useRef<HTMLDivElement>(null)
  const ball = useRef<HTMLSpanElement>(null)
  const zustand = useRef({ x: 0, y: 0, vx: 0, vy: 0, dreh: 0, kontakte: 0, laeuft: false, zuletzt: 0 })
  const [kontakte, setKontakte] = useState(0)
  const [bester, setBester] = useState(0)
  const [phase, setPhase] = useState<'start' | 'spiel' | 'aus'>('start')
  const [ruhigGewuenscht, setRuhigGewuenscht] = useState(false)
  const [rekord, setRekord] = useState(false)
  // Zählt Runden mit – jede Runde bekommt ein frisches Eintragen-Feld
  const [runde, setRunde] = useState(0)

  useEffect(() => {
    setRuhigGewuenscht(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const zeichnen = useCallback(() => {
    const z = zustand.current
    if (ball.current) ball.current.style.transform = `translate(${z.x}px, ${z.y}px) rotate(${z.dreh}deg)`
  }, [])

  const hinstellen = useCallback(() => {
    const f = feld.current
    if (!f) return
    const z = zustand.current
    z.x = (f.clientWidth - GROESSE) / 2
    z.y = f.clientHeight - GROESSE - RASEN
    z.vx = 0
    z.vy = 0
    z.dreh = 0
    zeichnen()
  }, [zeichnen])

  useEffect(() => {
    hinstellen()
    const r = () => !zustand.current.laeuft && hinstellen()
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [hinstellen])

  // Spielschleife – läuft nur während eines Spiels
  useEffect(() => {
    if (phase !== 'spiel') return
    const z = zustand.current
    z.laeuft = true
    z.zuletzt = performance.now()
    let id = 0
    const schritt = (t: number) => {
      const f = feld.current
      if (!f) return
      // Zeitstempel von requestAnimationFrame kann knapp vor performance.now() liegen – nie rückwärts rechnen
      const dt = Math.max(0, Math.min(0.033, (t - z.zuletzt) / 1000))
      z.zuletzt = t
      const g = 1500 * Math.min(1.6, 1 + z.kontakte * 0.025)
      z.vy += g * dt
      z.x += z.vx * dt
      z.y += z.vy * dt
      z.dreh += z.vx * dt * 2
      const breite = f.clientWidth - GROESSE
      if (z.x < 0) {
        z.x = 0
        z.vx = Math.abs(z.vx) * 0.8
      }
      if (z.x > breite) {
        z.x = breite
        z.vx = -Math.abs(z.vx) * 0.8
      }
      if (z.y < 0) {
        z.y = 0
        z.vy = Math.abs(z.vy) * 0.3
      }
      if (amBoden({ y: z.y, vy: z.vy, groesse: GROESSE, feldHoehe: f.clientHeight })) {
        z.y = f.clientHeight - GROESSE - RASEN
        z.laeuft = false
        zeichnen()
        setPhase('aus')
        setBester((b) => Math.max(b, z.kontakte))
        // Ergebnis zum Tagesrekord melden (nur die Zahl, ohne Namen)
        void melden('hochhalten', Math.min(z.kontakte, 250)).then((d) => setRekord(Boolean(d?.neuerRekord)))
        return
      }
      zeichnen()
      id = requestAnimationFrame(schritt)
    }
    id = requestAnimationFrame(schritt)
    return () => {
      cancelAnimationFrame(id)
      z.laeuft = false
    }
  }, [phase, zeichnen])

  /** Kick: nach oben, seitlich je nachdem, wo der Ball getroffen wurde */
  const kick = (trefferX?: number) => {
    const z = zustand.current
    const mitte = z.x + GROESSE / 2
    const seitlich = trefferX === undefined ? (Math.random() - 0.5) * 240 : Math.max(-300, Math.min(300, (mitte - trefferX) * 7))
    z.vy = -760
    z.vx = seitlich + (Math.random() - 0.5) * 80
    z.kontakte += 1
    setKontakte(z.kontakte)
  }

  const starten = () => {
    setRekord(false)
    setRunde((r) => r + 1)
    zustand.current.kontakte = 0
    setKontakte(0)
    hinstellen()
    setPhase('spiel')
    kick()
  }

  const tippen = (e: React.PointerEvent) => {
    if (phase !== 'spiel') return
    const f = feld.current
    if (!f) return
    const r = f.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const z = zustand.current
    // Großzügige Trefferfläche (anderthalb Ballgrößen) – auch für kleine Finger
    const dx = px - (z.x + GROESSE / 2)
    const dy = py - (z.y + GROESSE / 2)
    if (Math.hypot(dx, dy) <= GROESSE * 1.5 && darfKicken({ y: z.y, vy: z.vy, groesse: GROESSE, feldHoehe: f.clientHeight })) kick(px)
  }
  const taste = (e: React.KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.preventDefault()
    if (phase !== 'spiel') return starten()
    const f = feld.current
    const z = zustand.current
    // Gleiche Regel wie beim Tippen: nur, wenn der Ball fällt und im unteren Teil ist
    if (f && darfKicken({ y: z.y, vy: z.vy, groesse: GROESSE, feldHoehe: f.clientHeight })) kick()
  }

  return (
    <div className="spiel hochhalten">
      <div className="spiel-kopf">
        <h2 className="spiel-titel">Ball hochhalten</h2>
        <p className="hochhalten-zahl" aria-live="off">
          <strong>{kontakte}</strong> <span>{kontakte === 1 ? 'Kontakt' : 'Kontakte'}</span>
        </p>
      </div>
      <div
        ref={feld}
        className="hochhalten-feld"
        role="application"
        aria-label="Spielfeld: Leertaste oder Enter tippt den Ball an"
        tabIndex={0}
        onPointerDown={tippen}
        onKeyDown={taste}
      >
        <span ref={ball} className="hochhalten-ball" style={{ width: GROESSE, height: GROESSE }}>
          <Ball />
        </span>
        {phase !== 'spiel' && (
          <div className="hochhalten-overlay">
            {phase === 'aus' && (
              <p className="spiel-ende-text" role="status">
                {rekord && <span className="hochhalten-rekord">🎉 Neuer Tagesrekord!</span>}
                <strong>{kontakte}× hochgehalten.</strong> {urteil(kontakte)}
                {bester > 0 && <span className="muted"> Bester Wert: {bester}</span>}
              </p>
            )}
            {phase === 'aus' && rangliste && kontakte >= 1 && <RanglisteEintragen key={`hh-${runde}`} spiel="hochhalten" wert={Math.min(kontakte, 250)} />}
            {ruhigGewuenscht && phase === 'start' && <p className="muted">Hinweis: Dieses Spiel bewegt sich – auf deinem Gerät ist „Bewegung reduzieren“ eingeschaltet.</p>}
            <button type="button" className="btn btn-primary" onClick={starten}>
              {phase === 'start' ? 'Los geht’s' : 'Nochmal'}
            </button>
          </div>
        )}
        <span className="hochhalten-rasen" aria-hidden="true" />
      </div>
      <p className="spiel-hilfe">Tippe auf den Ball, wenn er herunterkommt – bevor er den Boden berührt. Oder drück die Leertaste.</p>
    </div>
  )
}
