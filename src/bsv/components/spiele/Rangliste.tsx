'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { RanglistenSpiel } from './RanglisteEintragen'

type Eintrag = { platz: number; spitzname: string; wert: number; datum: string }
const ZEITRAEUME: [string, string][] = [
  ['7', '7 Tage'],
  ['14', '14 Tage'],
  ['30', '30 Tage'],
  ['immer', 'Allzeit'],
]
const NAMEN: Record<RanglistenSpiel, string> = { hochhalten: 'Ball hochhalten', memory: 'Memory', elfmeterSerie: 'Elfmeter-Serie', huetchen: 'Hütchenspiel' }
const EINHEIT: Record<RanglistenSpiel, (n: number) => string> = {
  hochhalten: (n) => `${n}×`,
  memory: (n) => `${n} Züge`,
  elfmeterSerie: (n) => `${n} ${n === 1 ? 'Tor' : 'Tore'}`,
  huetchen: (n) => `${n}× richtig`,
}
const datum = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`

/** Rangliste der Spielecke: Top 10 je Spiel für 7, 14, 30 Tage oder alle Zeiten */
export function Rangliste({ spiele }: { spiele: RanglistenSpiel[] }) {
  const [spiel, setSpiel] = useState<RanglistenSpiel>(spiele[0]!)
  const [zeitraum, setZeitraum] = useState('7')
  const [liste, setListe] = useState<Eintrag[] | null>(null)

  const laden = useCallback(() => {
    fetch(`/api/spielergebnisse/rangliste?spiel=${spiel}&zeitraum=${zeitraum}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { eintraege: [] }))
      .then((d: { eintraege: Eintrag[] }) => setListe(d.eintraege))
      .catch(() => setListe([]))
  }, [spiel, zeitraum])

  useEffect(() => {
    laden()
    const neu = (e: Event) => {
      const s = (e as CustomEvent<{ spiel: RanglistenSpiel }>).detail?.spiel
      // Nur Spiele, die hier auch einen Reiter haben (abgeschaltete Spiele fehlen)
      if (s && spiele.includes(s)) setSpiel(s)
      laden()
    }
    window.addEventListener('bsv-rangliste', neu)
    return () => window.removeEventListener('bsv-rangliste', neu)
  }, [laden, spiele])

  return (
    <section className="spiel rangliste" aria-labelledby="rangliste-titel">
      <div className="spiel-kopf">
        <h2 className="spiel-titel" id="rangliste-titel">
          🏆 Rangliste
        </h2>
      </div>
      <div className="rangliste-filter">
        <div className="rangliste-tabs" role="tablist" aria-label="Spiel">
          {spiele.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={s === spiel} onClick={() => setSpiel(s)}>
              {NAMEN[s]}
            </button>
          ))}
        </div>
        <div className="rangliste-zeit" role="radiogroup" aria-label="Zeitraum">
          {ZEITRAEUME.map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={k === zeitraum} onClick={() => setZeitraum(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {liste === null ? (
        <p className="muted">Wird geladen …</p>
      ) : liste.length === 0 ? (
        <p className="muted rangliste-leer">Noch keine Einträge – sei die oder der Erste! 🚀</p>
      ) : (
        <ol className="rangliste-liste">
          {liste.map((e) => (
            <li key={e.platz} className={e.platz <= 3 ? `ist-platz-${e.platz}` : undefined}>
              <span className="rangliste-platz">{e.platz <= 3 ? ['🥇', '🥈', '🥉'][e.platz - 1] : `${e.platz}.`}</span>
              <span className="rangliste-name">{e.spitzname}</span>
              <span className="rangliste-wert">{EINHEIT[spiel](e.wert)}</span>
              <span className="rangliste-datum">{datum(e.datum)}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="spiel-hilfe">{spiel === 'memory' ? 'Beim Memory gewinnt, wer die wenigsten Züge braucht.' : spiel === 'elfmeterSerie' ? 'Gezählt werden Tore in Folge im Modus „Bis zum Fehlschuss“.' : 'Gezählt wird, wie oft der Ball am längsten hochgehalten wurde.'} Unpassende Namen löscht der Verein.</p>
    </section>
  )
}
