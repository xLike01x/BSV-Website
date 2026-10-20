'use client'
import React, { useState } from 'react'

import type { Balken } from './daten'

/** Säulendiagramm „Besuche pro Tag/Woche/Monat“ mit Hover-Hinweis und Tabelle für Screenreader */
export function Verlauf({ daten }: { daten: Balken[] }) {
  const [aktiv, setAktiv] = useState<number | null>(null)
  const max = Math.max(1, ...daten.map((d) => d.besuche))
  // Schöne Obergrenze für die Achse (1, 2, 5, 10 …)
  const stufe = 10 ** Math.floor(Math.log10(max))
  const oben = [1, 2, 5, 10].map((f) => f * stufe).find((v) => v >= max) ?? max
  const H = 180
  const breite = 100 / Math.max(1, daten.length)
  const beschriften = daten.length <= 8 ? 1 : Math.ceil(daten.length / 6)
  const a = aktiv !== null ? daten[aktiv] : null

  return (
    <div className="bsv-verlauf">
      <div className="bsv-verlauf__flaeche" onMouseLeave={() => setAktiv(null)}>
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="bsv-verlauf__linie" style={{ bottom: `${f * 100}%` }}>
            <span>{Math.round(oben * f).toLocaleString('de-DE')}</span>
          </div>
        ))}
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-label="Besuche im Zeitverlauf">
          {daten.map((d, i) => {
            const h = (d.besuche / oben) * H
            return (
              <g key={i} onMouseEnter={() => setAktiv(i)} onClick={() => setAktiv(i)}>
                {/* große, unsichtbare Trefferfläche */}
                <rect x={i * breite} y={0} width={breite} height={H} fill="transparent" />
                <rect x={i * breite + breite * 0.18} y={H - h} width={breite * 0.64} height={Math.max(h, d.besuche ? 1 : 0)} rx={0.6} className={aktiv === i ? 'is-aktiv' : ''} />
              </g>
            )
          })}
        </svg>
        {a && aktiv !== null && (
          <div className="bsv-verlauf__tipp" style={{ left: `${Math.min(88, Math.max(12, (aktiv + 0.5) * breite))}%` }}>
            <strong>{a.lang}</strong>
            <span>
              {a.besuche.toLocaleString('de-DE')} Besuche · {a.aufrufe.toLocaleString('de-DE')} Aufrufe
            </span>
          </div>
        )}
      </div>
      <div className="bsv-verlauf__achse" aria-hidden="true">
        {daten.map((d, i) => (
          <span key={i} style={{ width: `${breite}%` }}>
            {i % beschriften === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      <details className="bsv-verlauf__tabelle">
        <summary>Als Tabelle anzeigen</summary>
        <table>
          <thead>
            <tr>
              <th>Zeitraum</th>
              <th>Besuche</th>
              <th>Seitenaufrufe</th>
            </tr>
          </thead>
          <tbody>
            {daten.map((d, i) => (
              <tr key={i}>
                <td>{d.lang}</td>
                <td>{d.besuche.toLocaleString('de-DE')}</td>
                <td>{d.aufrufe.toLocaleString('de-DE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
