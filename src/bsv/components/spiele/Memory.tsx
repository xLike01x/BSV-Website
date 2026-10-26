'use client'
import React, { useEffect, useRef, useState } from 'react'

import { Ball } from './Ball'
import { melden } from './melden'
import { RanglisteEintragen } from './RanglisteEintragen'

/** 18 Motive für 36 Karten (6 × 6): das Vereinswappen und eigene Strich-Bilder aus Fußball und Breitensport */
type Motiv = { key: string; name: string; farbe: string; bild: React.ReactNode }
const S = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
)
const MOTIVE: Motiv[] = [
  { key: 'wappen', name: 'BSV-Wappen', farbe: '#157A43', bild: <img src="/bsv-logo.png" alt="" width={166} height={180} /> },
  { key: 'ball', name: 'Fußball', farbe: '#1d1d1f', bild: <Ball /> },
  { key: 'pfeife', name: 'Pfeife', farbe: '#E8590C', bild: <S><circle cx="15" cy="14" r="5" /><path d="M3 10.5h9v4H3zM15 9V5.5h3" /></S> },
  { key: 'pokal', name: 'Pokal', farbe: '#D99A06', bild: <S><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4.5a3 3 0 0 0 3 4M17 6h2.5a3 3 0 0 1-3 4M12 13v4M8 20.5h8M9 17h6" /></S> },
  { key: 'trikot', name: 'Trikot', farbe: '#157A43', bild: <S><path d="M8.5 3 3 6l2 4 2.2-1.1V21h9.6V8.9L19 10l2-4-5.5-3a3.5 3.5 0 0 1-7 0z" /></S> },
  { key: 'tor', name: 'Tor', farbe: '#157A43', bild: <S><path d="M3 19V6h18v13" /><path className="duenn" d="M3 10h18M3 14h18M7.5 6v13M12 6v13M16.5 6v13" /></S> },
  { key: 'stoppuhr', name: 'Stoppuhr', farbe: '#1D4ED8', bild: <S><circle cx="12" cy="13.5" r="7" /><path d="M12 13.5l3-3M10 3h4M12 3v3.5M17.6 7.4l1.6-1.6" /></S> },
  { key: 'huetchen', name: 'Hütchen', farbe: '#E8590C', bild: <S><path d="M8 18 11 5h2l3 13M4.5 18h15v2.5h-15zM9.3 12h5.4" /></S> },
  { key: 'eckfahne', name: 'Eckfahne', farbe: '#C2410C', bild: <S><path d="M6.5 21V3M6.5 4l11.5 4-11.5 4M3 21a6 6 0 0 1 7-3.5" /></S> },
  { key: 'medaille', name: 'Medaille', farbe: '#D99A06', bild: <S><path d="M8 3l4 7 4-7" /><circle cx="12" cy="15.5" r="5" /><path d="M12 13l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3z" /></S> },
  { key: 'hantel', name: 'Hantel', farbe: '#7C3AED', bild: <S><path d="M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11" /></S> },
  { key: 'seil', name: 'Springseil', farbe: '#7C3AED', bild: <S><path d="M3.8 3h2.4v6H3.8zM17.8 3h2.4v6h-2.4zM5 9c0 12.5 14 12.5 14 0" /></S> },
  { key: 'ringe', name: 'Turnringe', farbe: '#1D4ED8', bild: <S><path d="M8 2v8.5M16 2v8.5" /><circle cx="8" cy="15" r="4" /><circle cx="16" cy="15" r="4" /></S> },
  { key: 'note', name: 'Musiknote', farbe: '#DB2777', bild: <S><path d="M9 18V5.5l10-2.5v12.5" /><circle cx="7" cy="18" r="2.2" className="voll" /><circle cx="17" cy="15.5" r="2.2" className="voll" /></S> },
  { key: 'herz', name: 'Herzschlag', farbe: '#E11D48', bild: <S><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" /><path d="M7.5 12h2.2l1.4-2.6 1.9 5 1.4-2.4h2.1" /></S> },
  { key: 'stern', name: 'Stern', farbe: '#D99A06', bild: <S><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></S> },
  { key: 'schuh', name: 'Fußballschuh', farbe: '#1d1d1f', bild: <S><path d="M3 15.5c0-3 2-6.5 4-6.5l2 2h4l7 3c1.2.6 1.2 3 0 3.5H4c-.6 0-1-.4-1-1zM6 18v2M10 18v2M14 18v2M18 18v2M10.5 11.5l1-1M12.5 12.5l1-1" /></S> },
  { key: 'rad', name: 'Fahrrad', farbe: '#0E7490', bild: <S><circle cx="6" cy="16" r="3.6" /><circle cx="18" cy="16" r="3.6" /><path d="M6 16l4-7h5l3 7M10 9l4 7H6M13.5 6h3" /></S> },
]
const SPALTEN = 6

type Karte = { id: number; motiv: number }
const mischen = (): Karte[] => {
  const k = MOTIVE.flatMap((_, i) => [i, i]).map((motiv, id) => ({ id, motiv }))
  for (let i = k.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[k[i], k[j]] = [k[j]!, k[i]!]
  }
  return k
}
const urteil = (z: number) => (z <= 24 ? 'Was für ein Gedächtnis! 🏆' : z <= 32 ? 'Super gemacht! ⭐' : z <= 45 ? 'Gut gemacht!' : 'Geschafft – nochmal?')

/**
 * Memory 6 × 6: Karten umdrehen und Paare finden. Bedienung per Tippen/Klicken oder Tastatur (Pfeiltasten, Enter).
 * Gezählt werden nur die Züge; beim Tagesrekord nur die Zahl, ohne Namen.
 */
export function Memory({ rangliste = false }: { rangliste?: boolean }) {
  // Mischen erst im Browser – sonst unterschieden sich Server- und Browser-Fassung
  const [karten, setKarten] = useState<Karte[] | null>(null)
  const [offen, setOffen] = useState<number[]>([])
  const [gefunden, setGefunden] = useState<Set<number>>(() => new Set())
  const [zuege, setZuege] = useState(0)
  const [ansage, setAnsage] = useState('')
  const [rekord, setRekord] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const raster = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setKarten(mischen())
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const fertig = gefunden.size === MOTIVE.length

  const umdrehen = (index: number) => {
    if (!karten || offen.length >= 2 || offen.includes(index)) return
    const karte = karten[index]!
    if (gefunden.has(karte.motiv)) return
    const neu = [...offen, index]
    setOffen(neu)
    if (neu.length < 2) {
      setAnsage(MOTIVE[karte.motiv]!.name)
      return
    }
    const z = zuege + 1
    setZuege(z)
    const [a, b] = neu.map((i) => karten[i]!.motiv)
    if (a === b) {
      const g = new Set(gefunden).add(a!)
      setGefunden(g)
      setOffen([])
      setAnsage(`Paar gefunden: ${MOTIVE[a!]!.name}`)
      if (g.size === MOTIVE.length) void melden('memory', z).then((d) => setRekord(Boolean(d?.neuerRekord)))
    } else {
      setAnsage(`${MOTIVE[b!]!.name} – leider kein Paar`)
      timer.current = setTimeout(() => setOffen([]), 950)
    }
  }

  const nochmal = () => {
    if (timer.current) clearTimeout(timer.current)
    setKarten(mischen())
    setOffen([])
    setGefunden(new Set())
    setZuege(0)
    setAnsage('')
    setRekord(false)
  }

  /** Pfeiltasten bewegen den Fokus im Raster */
  const taste = (e: React.KeyboardEvent) => {
    const schritt = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -SPALTEN, ArrowDown: SPALTEN } as Record<string, number>)[e.key]
    if (!schritt) return
    const knoepfe = Array.from(raster.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    const jetzt = knoepfe.indexOf(document.activeElement as HTMLButtonElement)
    if (jetzt < 0) return
    e.preventDefault()
    knoepfe[Math.max(0, Math.min(knoepfe.length - 1, jetzt + schritt))]?.focus()
  }

  return (
    <div className="spiel memory">
      <div className="spiel-kopf">
        <h2 className="spiel-titel">Memory</h2>
        <p className="memory-stand">
          <strong>{gefunden.size}</strong> von {MOTIVE.length} Paaren · {zuege} {zuege === 1 ? 'Zug' : 'Züge'}
        </p>
      </div>
      <div ref={raster} className="memory-raster" role="grid" aria-label="Memory mit 36 Karten" onKeyDown={taste}>
        {Array.from({ length: SPALTEN * SPALTEN }, (_, i) => {
          const karte = karten?.[i]
          const motiv = karte ? MOTIVE[karte.motiv]! : null
          const aufgedeckt = Boolean(karte && (offen.includes(i) || gefunden.has(karte.motiv)))
          const paar = Boolean(karte && gefunden.has(karte.motiv))
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              className={`memory-karte${aufgedeckt ? ' ist-offen' : ''}${paar ? ' ist-paar' : ''}`}
              onClick={() => umdrehen(i)}
              disabled={!karte}
              aria-label={aufgedeckt && motiv ? `${motiv.name}${paar ? ' (gefunden)' : ''}` : `Karte ${i + 1}, verdeckt`}
            >
              <span className="memory-innen">
                <span className="memory-rueckseite" aria-hidden="true" />
                <span className="memory-vorderseite" aria-hidden="true" style={{ color: motiv?.farbe }}>
                  {aufgedeckt && motiv ? motiv.bild : null}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {ansage}
      </p>
      {fertig ? (
        <div className="spiel-ende">
          <p>
            {rekord && <span className="hochhalten-rekord">🎉 Neuer Tagesbestwert!</span>}
            <strong>Alle Paare in {zuege} Zügen!</strong> {urteil(zuege)}
          </p>
          <button type="button" className="btn btn-primary" onClick={nochmal}>
            Nochmal spielen
          </button>
          {rangliste && <RanglisteEintragen spiel="memory" wert={zuege} />}
        </div>
      ) : (
        <p className="spiel-hilfe">Dreh zwei Karten um. Passen sie zusammen, bleiben sie offen. Mit der Tastatur: Pfeiltasten und Enter.</p>
      )}
    </div>
  )
}
