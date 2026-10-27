'use client'
import React, { useEffect, useRef, useState } from 'react'

export type SpielKachel = { key: string; titel: string; text: string; symbol: string }

/**
 * Spielecke: oben Kacheln zur Auswahl, darunter läuft nur das gewählte Spiel.
 * Die Wahl steht im Adress-Anker (z. B. /spielecke#memory), damit man ein Spiel direkt verlinken kann.
 * Bei nur einem Spiel gibt es keine Kacheln.
 */
export function SpieleAuswahl({
  spiele,
  inhalte,
  ranglisten = {},
}: {
  spiele: SpielKachel[]
  inhalte: Record<string, React.ReactNode>
  /** Welcher Ranglisten-Reiter zum Spiel gehört (z. B. elfmeter → elfmeterSerie) – die Rangliste springt mit */
  ranglisten?: Record<string, string>
}) {
  const [aktiv, setAktiv] = useState(spiele[0]?.key ?? '')
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  // Anker erst im Browser lesen – sonst unterschieden sich Server- und Browser-Fassung
  useEffect(() => {
    const vonAnker = () => {
      const k = decodeURIComponent(window.location.hash.slice(1))
      if (spiele.some((s) => s.key === k)) setAktiv(k)
    }
    vonAnker()
    window.addEventListener('hashchange', vonAnker)
    return () => window.removeEventListener('hashchange', vonAnker)
  }, [spiele])

  const waehlen = (k: string) => {
    setAktiv(k)
    if (ranglisten[k]) window.dispatchEvent(new CustomEvent('bsv-rangliste', { detail: { spiel: ranglisten[k] } }))
    try {
      window.history.replaceState(null, '', `#${k}`)
    } catch {
      /* z. B. in eingebetteten Vorschauen nicht erlaubt – Auswahl funktioniert trotzdem */
    }
  }

  const taste = (e: React.KeyboardEvent, i: number) => {
    const ziel = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: spiele.length - 1 }[e.key]
    if (ziel === undefined) return
    e.preventDefault()
    const n = (ziel + spiele.length) % spiele.length
    waehlen(spiele[n]!.key)
    tabs.current[n]?.focus()
  }

  if (spiele.length <= 1) return <>{spiele[0] ? inhalte[spiele[0].key] : null}</>

  return (
    <>
      <div className="spiele-kacheln" role="tablist" aria-label="Spiel auswählen">
        {spiele.map((s, i) => (
          <button
            key={s.key}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`spiel-tab-${s.key}`}
            aria-selected={aktiv === s.key}
            aria-controls="spiel-buehne"
            tabIndex={aktiv === s.key ? 0 : -1}
            className="spiele-kachel"
            onClick={() => waehlen(s.key)}
            onKeyDown={(e) => taste(e, i)}
          >
            <span className="spiele-kachel-symbol" aria-hidden="true">
              {s.symbol}
            </span>
            <strong>{s.titel}</strong>
            <span className="spiele-kachel-text">{s.text}</span>
          </button>
        ))}
      </div>
      {/* key: beim Wechsel startet das Spiel frisch */}
      <div id="spiel-buehne" className="spiel-buehne" role="tabpanel" aria-labelledby={`spiel-tab-${aktiv}`} key={aktiv}>
        {inhalte[aktiv]}
      </div>
    </>
  )
}
