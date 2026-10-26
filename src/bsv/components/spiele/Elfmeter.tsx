'use client'
import React, { useEffect, useRef, useState } from 'react'

import { Ball } from './Ball'
import { melden } from './melden'

type Ecke = 'links' | 'mitte' | 'rechts'
const ECKEN: Ecke[] = ['links', 'mitte', 'rechts']
const SCHUESSE = 5
/** Zielpunkte im Tor (Koordinaten der Grafik 360 × 240) */
const ZIEL: Record<Ecke, [number, number]> = { links: [96, 62], mitte: [180, 92], rechts: [264, 62] }
const TORWART: Record<Ecke, number> = { links: -78, mitte: 0, rechts: 78 }
const PUNKT: [number, number] = [180, 204]

const urteil = (tore: number) =>
  tore === 5 ? 'Alle fünf drin – Weltklasse! 🏆' : tore >= 4 ? 'Stark geschossen! ⭐' : tore >= 2 ? 'Gut gemacht – nochmal?' : 'Der Torwart war heute richtig gut. Nochmal?'

/**
 * Elfmeterschießen: 5 Schüsse gegen einen Strich-Torwart. Bedienung per Tippen auf eine Ecke, Knopf oder Pfeiltasten.
 * Es wird nichts gespeichert; der Torwart wählt seine Ecke zufällig.
 */
export function Elfmeter() {
  const [ergebnisse, setErgebnisse] = useState<boolean[]>([])
  const [schuss, setSchuss] = useState<{ ziel: Ecke; torwart: Ecke; tor: boolean } | null>(null)
  const [meldung, setMeldung] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>[]>([])
  const stand = useRef<boolean[]>([])
  useEffect(() => () => timer.current.forEach(clearTimeout), [])

  const fertig = ergebnisse.length >= SCHUESSE && !schuss
  const tore = ergebnisse.filter(Boolean).length

  const schiessen = (ziel: Ecke) => {
    if (schuss || ergebnisse.length >= SCHUESSE) return
    const torwart = ECKEN[Math.floor(Math.random() * 3)]!
    const tor = torwart !== ziel
    setSchuss({ ziel, torwart, tor })
    setMeldung('')
    timer.current.push(
      setTimeout(() => setMeldung(tor ? 'Tor! ⚽' : 'Gehalten! 🧤'), 650),
      setTimeout(() => {
        // Nicht im setState-Updater melden: React ruft Updater in der Entwicklung doppelt auf
        const neu = [...stand.current, tor]
        stand.current = neu
        setErgebnisse(neu)
        setSchuss(null)
        // Runde vorbei: Ergebnis (nur die Zahl der Tore) zum Tagesrekord melden
        if (neu.length === SCHUESSE) void melden('elfmeter', neu.filter(Boolean).length)
      }, 1700),
    )
  }
  const nochmal = () => {
    stand.current = []
    setErgebnisse([])
    setMeldung('')
  }
  const taste = (e: React.KeyboardEvent) => {
    const ecke = ({ ArrowLeft: 'links', ArrowUp: 'mitte', ArrowRight: 'rechts' } as Record<string, Ecke>)[e.key]
    if (ecke) {
      e.preventDefault()
      schiessen(ecke)
    }
  }

  // Ball in Prozent der Grafik positionieren – passt so bei jeder Breite
  const [bx, by] = schuss ? ZIEL[schuss.ziel] : PUNKT
  const ballStil = { left: `${(bx / 360) * 100}%`, top: `${(by / 240) * 100}%`, transform: `translate(-50%, -50%) scale(${schuss ? 0.62 : 1}) rotate(${schuss ? 540 : 0}deg)` }

  return (
    <div className="spiel elfmeter" onKeyDown={taste}>
      <div className="spiel-kopf">
        <h2 className="spiel-titel">Elfmeterschießen</h2>
        <ol className="elfmeter-punkte" aria-label={`${tore} Tore bei ${ergebnisse.length} von ${SCHUESSE} Schüssen`}>
          {Array.from({ length: SCHUESSE }, (_, i) => (
            <li key={i} className={i < ergebnisse.length ? (ergebnisse[i] ? 'ist-tor' : 'ist-gehalten') : undefined} aria-hidden="true">
              {i < ergebnisse.length ? (ergebnisse[i] ? '✓' : '✗') : ''}
            </li>
          ))}
        </ol>
      </div>
      <div className="elfmeter-feld">
        <svg className="elfmeter-bild" viewBox="0 0 360 240" aria-hidden="true" focusable="false">
          <path className="elfmeter-boden" d="M10 226 H350" />
          <path className="elfmeter-netz" d="M70 40 H290 M70 40 V150 M290 40 V150 M100 40 V150 M130 40 V150 M160 40 V150 M190 40 V150 M220 40 V150 M250 40 V150 M70 70 H290 M70 100 H290 M70 130 H290" />
          <path className="elfmeter-tor" d="M60 150 V30 H300 V150" />
          <path className="elfmeter-strafraum" d="M20 226 L70 150 M340 226 L290 150 M60 150 H300" />
          <circle className="elfmeter-punkt" cx="180" cy="212" r="2.5" />
          <g className={`elfmeter-torwart${schuss ? ' ist-sprung' : ''}`} style={schuss ? { transform: `translateX(${TORWART[schuss.torwart]}px) rotate(${schuss.torwart === 'links' ? -35 : schuss.torwart === 'rechts' ? 35 : 0}deg)` } : undefined}>
            <circle cx="180" cy="86" r="9" />
            <path d="M180 95 V126 M180 126 L168 148 M180 126 L192 148 M180 104 L158 88 M180 104 L202 88" />
            <circle className="elfmeter-handschuh" cx="158" cy="88" r="4" />
            <circle className="elfmeter-handschuh" cx="202" cy="88" r="4" />
          </g>
        </svg>
        <span className={`elfmeter-ball${schuss ? ' ist-flug' : ''}`} style={ballStil}>
          <Ball />
        </span>
        {/* Unsichtbare Ziel-Flächen über dem Tor: Tippen = schießen */}
        <div className="elfmeter-ziele">
          {ECKEN.map((e) => (
            <button key={e} type="button" tabIndex={-1} aria-hidden="true" onClick={() => schiessen(e)} disabled={Boolean(schuss) || fertig} />
          ))}
        </div>
        <p className="spiel-meldung" role="status" aria-live="polite">
          {meldung}
        </p>
      </div>
      {fertig ? (
        <div className="spiel-ende">
          <p>
            <strong>
              {tore} von {SCHUESSE} Toren.
            </strong>{' '}
            {urteil(tore)}
          </p>
          <button type="button" className="btn btn-primary" onClick={nochmal}>
            Nochmal schießen
          </button>
        </div>
      ) : (
        <div className="spiel-knoepfe" role="group" aria-label="Wohin schießt du?">
          <button type="button" className="btn btn-ghost" onClick={() => schiessen('links')} disabled={Boolean(schuss)}>
            ← Links
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => schiessen('mitte')} disabled={Boolean(schuss)}>
            ↑ Mitte
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => schiessen('rechts')} disabled={Boolean(schuss)}>
            Rechts →
          </button>
        </div>
      )}
      <p className="spiel-hilfe">Tippe auf eine Ecke im Tor – oder nutze die Pfeiltasten. Schuss {Math.min(ergebnisse.length + (schuss ? 1 : 0), SCHUESSE) || 1} von {SCHUESSE}.</p>
    </div>
  )
}
