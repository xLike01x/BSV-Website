'use client'
import React, { useEffect, useRef, useState } from 'react'

import { Ball } from './Ball'
import { melden } from './melden'
import { RanglisteEintragen } from './RanglisteEintragen'

type Ecke = 'links' | 'mitte' | 'rechts'
const ECKEN: Ecke[] = ['links', 'mitte', 'rechts']
const SCHUESSE = 5
/** Zielpunkte im Tor (Koordinaten der Grafik 360 × 240) */
const ZIEL: Record<Ecke, [number, number]> = { links: [96, 62], mitte: [180, 92], rechts: [264, 62] }
const PUNKT: [number, number] = [180, 204]

/**
 * Sprung des Torwarts: [x, y, Drehung]. Gedreht wird um die Füße (180|148), danach verschoben.
 * „Halten“: so berechnet, dass der obere Handschuh genau auf dem Ziel landet – der Ball bleibt sichtbar in der Hand.
 * „Daneben“: der Torwart springt in die falsche Ecke, der Ball fliegt an ihm vorbei ins Netz.
 */
const SPRUNG: Record<Ecke, [number, number, number]> = { links: [-78, 0, -35], mitte: [0, -10, 0], rechts: [78, 0, 35] }
const HALTEN: Record<Ecke, [number, number, number]> = { links: [-68, -24, -35], mitte: [0, -6, 0], rechts: [68, -24, 35] }
/** Wo der Ball nach dem Schuss liegt: im Handschuh bzw. hinten im Netz */
const IN_DER_HAND: Record<Ecke, [number, number]> = { links: [96, 62], mitte: [180, 112], rechts: [264, 62] }
/** Nach dem Halten: Ball prallt seitlich ab (Mitte: Torwart fängt ihn) */
const ABPRALL: Record<Ecke, [number, number]> = { links: [26, 196], mitte: [180, 112], rechts: [334, 196] }
/** Nach dem Tor: Ball fällt im Netz etwas nach unten */
const IM_NETZ: Record<Ecke, [number, number]> = { links: [92, 128], mitte: [180, 134], rechts: [268, 128] }

const urteil = (tore: number) =>
  tore === 5 ? 'Alle fünf drin – Weltklasse! 🏆' : tore >= 4 ? 'Stark geschossen! ⭐' : tore >= 2 ? 'Gut gemacht – nochmal?' : 'Der Torwart war heute richtig gut. Nochmal?'

/**
 * Elfmeterschießen: 5 Schüsse gegen einen Strich-Torwart. Bedienung per Tippen auf eine Ecke, Knopf oder Pfeiltasten.
 * Es wird nichts gespeichert; der Torwart wählt seine Ecke zufällig.
 */
export function Elfmeter({ rangliste = false }: { rangliste?: boolean }) {
  // „runde“ = 5 Schüsse, „serie“ = so lange, bis der Torwart einen hält (Torserie kommt in die Rangliste)
  const [modus, setModus] = useState<'runde' | 'serie'>('runde')
  const [ergebnisse, setErgebnisse] = useState<boolean[]>([])
  const [schuss, setSchuss] = useState<{ ziel: Ecke; torwart: Ecke; tor: boolean; danach: boolean } | null>(null)
  const [meldung, setMeldung] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>[]>([])
  const stand = useRef<boolean[]>([])
  useEffect(() => () => timer.current.forEach(clearTimeout), [])

  const vorbei = (e: boolean[]) => (modus === 'runde' ? e.length >= SCHUESSE : e.length > 0 && !e[e.length - 1])
  const fertig = vorbei(ergebnisse) && !schuss
  const tore = ergebnisse.filter(Boolean).length

  const schiessen = (ziel: Ecke) => {
    if (schuss || vorbei(ergebnisse)) return
    const torwart = ECKEN[Math.floor(Math.random() * 3)]!
    const tor = torwart !== ziel
    setSchuss({ ziel, torwart, tor, danach: false })
    setMeldung('')
    timer.current.push(
      // Zweite Phase (nach kurzer Pause, damit man den Ball im Handschuh bzw. im Netz sieht):
      // gehaltener Ball prallt ab, Tor-Ball fällt ins Netz
      setTimeout(() => setSchuss((x) => (x ? { ...x, danach: true } : x)), 780),
      setTimeout(() => setMeldung(tor ? 'Tor! ⚽' : 'Gehalten! 🧤'), 520),
      setTimeout(() => {
        // Nicht im setState-Updater melden: React ruft Updater in der Entwicklung doppelt auf
        const neu = [...stand.current, tor]
        stand.current = neu
        setErgebnisse(neu)
        setSchuss(null)
        // Runde vorbei: Ergebnis (nur die Zahl der Tore) zum Tagesrekord melden
        if (modus === 'runde' && neu.length === SCHUESSE) void melden('elfmeter', neu.filter(Boolean).length)
        if (modus === 'serie' && !tor) void melden('elfmeterSerie', neu.length - 1)
      }, 2000),
    )
  }
  const nochmal = () => {
    stand.current = []
    setErgebnisse([])
    setMeldung('')
  }
  const modusWechseln = (m: 'runde' | 'serie') => {
    if (schuss || m === modus) return
    setModus(m)
    nochmal()
  }
  const taste = (e: React.KeyboardEvent) => {
    const ecke = ({ ArrowLeft: 'links', ArrowUp: 'mitte', ArrowRight: 'rechts' } as Record<string, Ecke>)[e.key]
    if (ecke) {
      e.preventDefault()
      schiessen(ecke)
    }
  }

  // Ball in Prozent der Grafik positionieren – passt so bei jeder Breite
  const [bx, by] = !schuss ? PUNKT : schuss.tor ? (schuss.danach ? IM_NETZ : ZIEL)[schuss.ziel] : (schuss.danach ? ABPRALL : IN_DER_HAND)[schuss.ziel]
  const drehung = !schuss ? 0 : schuss.danach ? (schuss.tor ? 620 : schuss.ziel === 'mitte' ? 540 : 900) : 540
  const ballStil = {
    left: `${(bx / 360) * 100}%`,
    top: `${(by / 240) * 100}%`,
    transform: `translate(-50%, -50%) scale(${schuss ? (schuss.tor && schuss.danach ? 0.56 : 0.62) : 1}) rotate(${drehung}deg)`,
  }
  const [tx, ty, dr] = schuss ? (schuss.tor ? SPRUNG : HALTEN)[schuss.torwart] : [0, 0, 0]
  const torwartStil = schuss ? { transform: `translate(${tx}px, ${ty}px) rotate(${dr}deg)` } : undefined

  return (
    <div className="spiel elfmeter" onKeyDown={taste}>
      <div className="spiel-kopf">
        <h2 className="spiel-titel">Elfmeterschießen</h2>
        {modus === 'runde' ? (
          <ol className="elfmeter-punkte" aria-label={`${tore} Tore bei ${ergebnisse.length} von ${SCHUESSE} Schüssen`}>
            {Array.from({ length: SCHUESSE }, (_, i) => (
              <li key={i} className={i < ergebnisse.length ? (ergebnisse[i] ? 'ist-tor' : 'ist-gehalten') : undefined} aria-hidden="true">
                {i < ergebnisse.length ? (ergebnisse[i] ? '✓' : '✗') : ''}
              </li>
            ))}
          </ol>
        ) : (
          <p className="hochhalten-zahl elfmeter-serie" aria-live="off">
            <strong>{tore}</strong> <span>{tore === 1 ? 'Tor in Folge' : 'Tore in Folge'}</span>
          </p>
        )}
      </div>
      <div className="elfmeter-modus" role="radiogroup" aria-label="Spielart">
        <button type="button" role="radio" aria-checked={modus === 'runde'} onClick={() => modusWechseln('runde')} disabled={Boolean(schuss)}>
          5 Schüsse
        </button>
        <button type="button" role="radio" aria-checked={modus === 'serie'} onClick={() => modusWechseln('serie')} disabled={Boolean(schuss)}>
          Bis zum Fehlschuss
        </button>
      </div>
      <div className="elfmeter-feld">
        <svg className={`elfmeter-bild${schuss?.tor && schuss.danach ? ' ist-tor' : ''}`} viewBox="0 0 360 240" aria-hidden="true" focusable="false">
          <path className="elfmeter-boden" d="M10 226 H350" />
          <path className="elfmeter-netz" d="M70 40 H290 M70 40 V150 M290 40 V150 M100 40 V150 M130 40 V150 M160 40 V150 M190 40 V150 M220 40 V150 M250 40 V150 M70 70 H290 M70 100 H290 M70 130 H290" />
          <path className="elfmeter-tor" d="M60 150 V30 H300 V150" />
          <path className="elfmeter-strafraum" d="M20 226 L70 150 M340 226 L290 150 M60 150 H300" />
          <circle className="elfmeter-punkt" cx="180" cy="212" r="2.5" />
          <g className={`elfmeter-torwart${schuss ? ' ist-sprung' : ''}`} style={torwartStil}>
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
            {modus === 'runde' ? (
              <>
                <strong>
                  {tore} von {SCHUESSE} Toren.
                </strong>{' '}
                {urteil(tore)}
              </>
            ) : (
              <>
                <strong>
                  {tore} {tore === 1 ? 'Tor' : 'Tore'} in Folge!
                </strong>{' '}
                {tore >= 8 ? 'Unglaublich! 🏆' : tore >= 4 ? 'Starke Serie! ⭐' : tore >= 1 ? 'Schaffst du mehr?' : 'Gleich beim ersten gehalten – nochmal!'}
              </>
            )}
          </p>
          <button type="button" className="btn btn-primary" onClick={nochmal}>
            Nochmal schießen
          </button>
          {rangliste && modus === 'serie' && tore >= 1 && <RanglisteEintragen key={`serie-${ergebnisse.length}`} spiel="elfmeterSerie" wert={tore} />}
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
      <p className="spiel-hilfe">
        Tippe auf eine Ecke im Tor – oder nutze die Pfeiltasten.{' '}
        {modus === 'runde' ? `Schuss ${Math.min(ergebnisse.length + (schuss ? 1 : 0), SCHUESSE) || 1} von ${SCHUESSE}.` : 'Schieß so lange, bis der Torwart einen hält.'}
      </p>
    </div>
  )
}
