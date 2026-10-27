'use client'
import React, { useEffect, useRef, useState } from 'react'

import { Ball } from './Ball'
import { RanglisteEintragen } from './RanglisteEintragen'

const PLAETZE = ['links', 'mitte', 'rechts'] as const
/** Mitte der drei Plätze in Prozent der Feldbreite */
const X = [20, 50, 80]
/** Pro Runde: mehr Tauschzüge und schneller (Millisekunden pro Tausch) */
export const runde = (n: number) => ({ tausche: Math.min(3 + n, 14), dauer: Math.max(260, 650 - n * 45) })

type Phase = 'start' | 'zeigen' | 'zudecken' | 'mischen' | 'raten' | 'aufgedeckt'

const urteil = (n: number) => (n >= 8 ? 'Adleraugen! 🦅' : n >= 5 ? 'Super aufgepasst! ⭐' : n >= 2 ? 'Gut gemacht!' : 'Nochmal?')

/** Ein Hütchen mit Augen – rein dekorativ */
function HuetchenBild() {
  return (
    <svg viewBox="0 0 100 110" aria-hidden="true" focusable="false">
      <path className="huetchen-koerper" d="M40 8h20l26 88H14z" />
      <path className="huetchen-streifen" d="M30 54h40l5 16H25z" />
      <rect className="huetchen-fuss" x="4" y="94" width="92" height="12" rx="4" />
      <g className="huetchen-augen">
        <circle cx="42" cy="36" r="7" fill="#fff" />
        <circle cx="58" cy="36" r="7" fill="#fff" />
        <circle cx="43" cy="37" r="3.4" />
        <circle cx="59" cy="37" r="3.4" />
      </g>
    </svg>
  )
}

/**
 * Hütchenspiel für die Kleinen: Der Ball verschwindet unter einem von drei Hütchen, die Hütchen werden gemischt,
 * dann wird geraten. Jede richtige Runde mischt länger und schneller. Es wird nichts gespeichert.
 * Die Bewegung läuft über die Web Animations API – sie funktioniert damit auch, wenn CSS-Übergänge abgeschaltet sind
 * (sonst wäre das Spiel bei „Bewegung reduzieren“ nicht spielbar).
 */
export function Huetchen({ rangliste = false }: { rangliste?: boolean }) {
  const feld = useRef<HTMLDivElement>(null)
  const huetchen = useRef<(HTMLSpanElement | null)[]>([])
  // platz[h] = auf welchem Platz (0–2) Hütchen h gerade steht; der Ball liegt immer unter Hütchen „ball“
  const platz = useRef([0, 1, 2])
  const ball = useRef(1)
  const abbruch = useRef(false)
  const [phase, setPhase] = useState<Phase>('start')
  const [nr, setNr] = useState(0)
  const [serie, setSerie] = useState(0)
  const [bester, setBester] = useState(0)
  // Zählt Spiele mit – jedes Spiel bekommt ein frisches Eintragen-Feld
  const [spielNr, setSpielNr] = useState(0)
  const [gewaehlt, setGewaehlt] = useState<number | null>(null)
  const [meldung, setMeldung] = useState('')
  // Nach einem Fehlversuch wird kurz danach auch das richtige Hütchen gehoben
  const [zeigeRichtig, setZeigeRichtig] = useState(false)
  const [ruhigGewuenscht, setRuhigGewuenscht] = useState(false)
  // Für die Anzeige: Stand der Plätze und des Balls (während des Mischens bewegt sich das DOM direkt, danach wird hier abgeglichen)
  const [plaetze, setPlaetze] = useState([0, 1, 2])
  const [ballH, setBallH] = useState(1)

  useEffect(() => {
    // In der Entwicklung bindet React Effekte zweimal ein – daher hier zurücksetzen, nicht nur beim Abbauen setzen
    abbruch.current = false
    setRuhigGewuenscht(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return () => {
      abbruch.current = true
    }
  }, [])

  const warten = (ms: number) => new Promise((r) => setTimeout(r, ms))

  /** Zwei Plätze tauschen: beide Hütchen fliegen im Bogen – eines oben, eines unten herum */
  const tauschen = async (a: number, b: number, dauer: number) => {
    const breite = feld.current?.clientWidth ?? 0
    const ha = platz.current.indexOf(a)
    const hb = platz.current.indexOf(b)
    platz.current[ha] = b
    platz.current[hb] = a
    const schritt = ((b - a) * breite * 30) / 100
    const ea = huetchen.current[ha]
    const eb = huetchen.current[hb]
    if (!ea || !eb) return
    ea.style.left = `${X[b]}%`
    eb.style.left = `${X[a]}%`
    const bogen = Math.min(46, breite * 0.08)
    const opt: KeyframeAnimationOptions = { duration: dauer, easing: 'cubic-bezier(0.45, 0, 0.35, 1)' }
    await Promise.all([
      ea.animate([{ transform: `translateX(${-schritt}px)` }, { transform: `translateX(${-schritt / 2}px) translateY(${-bogen}px) scale(0.92)` }, { transform: 'none' }], opt).finished,
      eb.animate([{ transform: `translateX(${schritt}px)` }, { transform: `translateX(${schritt / 2}px) translateY(${bogen * 0.5}px) scale(1.06)` }, { transform: 'none' }], opt).finished,
    ]).catch(() => {})
  }

  const spielen = async (rundeNr: number) => {
    // Der Start-/Weiter-Knopf verschwindet gleich – Fokus aufs Spielfeld, damit die Pfeiltasten weiter funktionieren
    feld.current?.focus({ preventScroll: true })
    setGewaehlt(null)
    setZeigeRichtig(false)
    setMeldung('')
    setNr(rundeNr)
    // Der Ball bleibt, wo man ihn zuletzt gesehen hat (am Anfang in der Mitte) – kurz zeigen, dann geht es von dort weiter
    setBallH(ball.current)
    setPlaetze([...platz.current])
    setPhase('zeigen')
    await warten(700)
    if (abbruch.current) return
    setPhase('zudecken')
    await warten(650)
    if (abbruch.current) return
    setPhase('mischen')
    const { tausche, dauer } = runde(rundeNr)
    let letztes = -1
    for (let i = 0; i < tausche; i++) {
      // Nie zweimal hintereinander dasselbe Paar – sonst sieht es aus, als würde nichts passieren
      let paar: number
      do paar = Math.floor(Math.random() * 3)
      while (paar === letztes)
      letztes = paar
      const [a, b] = ([[0, 1], [1, 2], [0, 2]] as const)[paar]!
      await tauschen(a, b, dauer)
      if (abbruch.current) return
    }
    setPlaetze([...platz.current])
    setPhase('raten')
    setMeldung('Wo ist der Ball?')
  }

  const raten = async (p: number) => {
    if (phase !== 'raten') return
    const h = platz.current.indexOf(p)
    setGewaehlt(h)
    setPhase('aufgedeckt')
    const richtig = h === ball.current
    if (richtig) {
      const neu = serie + 1
      setSerie(neu)
      setBester((b) => Math.max(b, neu))
      setMeldung('Gefunden! 🎉')
    } else {
      setMeldung('Leer! 🙈')
      await warten(700)
      if (abbruch.current) return
      setMeldung('Hier war er!')
      setZeigeRichtig(true)
      setBester((b) => Math.max(b, serie))
    }
  }

  const weiter = () => void spielen(nr + 1)
  const neuStarten = () => {
    setSerie(0)
    setSpielNr((n) => n + 1)
    void spielen(0)
  }

  const taste = (e: React.KeyboardEvent) => {
    const p = ({ ArrowLeft: 0, ArrowUp: 1, ArrowDown: 1, ArrowRight: 2, '1': 0, '2': 1, '3': 2 } as Record<string, number>)[e.key]
    if (p !== undefined && phase === 'raten') {
      e.preventDefault()
      void raten(p)
    }
  }

  const aufgedeckt = phase === 'aufgedeckt'
  const richtig = aufgedeckt && gewaehlt === ballH
  const imSpiel = phase === 'zudecken' || phase === 'mischen' || phase === 'raten'
  // Oben stehen: am Anfang und beim Zeigen alle, beim Aufdecken das gewählte und nach einem Fehlversuch das richtige
  const hoch = (h: number) => phase === 'start' || phase === 'zeigen' || (aufgedeckt && (h === gewaehlt || (zeigeRichtig && h === ballH)))
  const ballSichtbar = phase === 'start' || phase === 'zeigen' || phase === 'zudecken' || (aufgedeckt && (richtig || zeigeRichtig))
  const anfang = phase === 'start'

  return (
    <div className="spiel huetchen" onKeyDown={taste}>
      <div className="spiel-kopf">
        <h2 className="spiel-titel">Hütchenspiel</h2>
        <p className="hochhalten-zahl" aria-live="off">
          <strong>{serie}</strong> <span>richtig in Folge</span>
        </p>
      </div>
      <div
        ref={feld}
        className={`huetchen-feld${imSpiel ? ' ist-im-spiel' : ''}`}
        role="application"
        aria-label="Spielfeld: Pfeiltaste links, oben oder rechts wählt ein Hütchen"
        tabIndex={0}
      >
        <span className={`huetchen-ball${ballSichtbar ? '' : ' ist-weg'}`} style={{ left: `${X[plaetze[ballH]!]}%` }} aria-hidden="true">
          <Ball />
        </span>
        {[0, 1, 2].map((h) => (
          <span
            key={h}
            ref={(el) => {
              huetchen.current[h] = el
            }}
            className={`huetchen-stueck${hoch(h) ? ' ist-hoch' : ''}${aufgedeckt && h === gewaehlt ? (richtig ? ' ist-richtig' : ' ist-falsch') : ''}`}
            style={{ left: `${X[plaetze[h]!]}%` }}
            aria-hidden="true"
          >
            <span className="huetchen-heben">
              <HuetchenBild />
            </span>
          </span>
        ))}
        {/* Unsichtbare Flächen über den drei Plätzen: Tippen = raten */}
        <div className="huetchen-ziele">
          {PLAETZE.map((p, i) => (
            <button key={p} type="button" tabIndex={-1} aria-hidden="true" onClick={() => void raten(i)} disabled={phase !== 'raten'} />
          ))}
        </div>
        <p className="spiel-meldung huetchen-meldung" role="status" aria-live="polite">
          {meldung}
        </p>
      </div>
      {/* Eigene keys: sonst verwendet React den Knopf der Leiste darunter weiter, und autoFocus greift nicht */}
      {aufgedeckt ? (
        <div className="spiel-ende" key="ende">
          <p>
            {richtig ? (
              <>
                <strong>Richtig!</strong> Nächste Runde wird schneller.
              </>
            ) : (
              <>
                <strong>{serie}× richtig in Folge.</strong> {urteil(serie)}
                {bester > 0 && <span className="muted"> Bester Wert: {bester}</span>}
              </>
            )}
          </p>
          {richtig ? (
            <button type="button" className="btn btn-primary" onClick={weiter} autoFocus>
              Weiter
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={neuStarten} autoFocus>
              Nochmal
            </button>
          )}
          {/* Rangliste: erst eintragen, wenn das Spiel vorbei ist (beim ersten Fehlversuch) */}
          {!richtig && rangliste && zeigeRichtig && serie >= 1 && <RanglisteEintragen key={`hu-${spielNr}`} spiel="huetchen" wert={Math.min(serie, 100)} />}
        </div>
      ) : anfang ? (
        <div className="spiel-ende" key="anfang">
          <p>Merk dir, unter welchem Hütchen der Ball liegt!</p>
          <button type="button" className="btn btn-primary" onClick={neuStarten}>
            Los geht’s
          </button>
        </div>
      ) : (
        <div className="spiel-knoepfe" role="group" aria-label="Unter welchem Hütchen ist der Ball?" key="knoepfe">
          <button type="button" className="btn btn-ghost" onClick={() => void raten(0)} disabled={phase !== 'raten'}>
            ← Links
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void raten(1)} disabled={phase !== 'raten'}>
            ↑ Mitte
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void raten(2)} disabled={phase !== 'raten'}>
            Rechts →
          </button>
        </div>
      )}
      <p className="spiel-hilfe">
        {ruhigGewuenscht && 'Hinweis: In diesem Spiel bewegen sich die Hütchen – auf deinem Gerät ist „Bewegung reduzieren“ eingeschaltet. '}
        Pass gut auf, wohin die Hütchen wandern – dann aufs richtige tippen oder die Pfeiltasten nutzen.
      </p>
    </div>
  )
}
