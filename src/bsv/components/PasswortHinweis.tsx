'use client'

import React from 'react'

import { type Kontext, passwortFehler, passwortRegeln, passwortStaerke } from '@/auth/passwortRegeln'

const STUFEN = [
  { text: 'erfüllt die Regeln noch nicht', farbe: 'var(--bsv-coral, #e8590c)' },
  { text: 'in Ordnung', farbe: 'var(--bsv-blue, #1d4ed8)' },
  { text: 'gut', farbe: 'var(--bsv-grass, #3dae6a)' },
  { text: 'stark', farbe: 'var(--bsv-green, #157a43)' },
]

/**
 * Live-Anzeige unter dem Passwortfeld: Checkliste der Regeln, Stärke-Balken und – sobald die Grundregeln erfüllt sind –
 * der genaue Grund, falls das Passwort trotzdem zu leicht ist. Dieselben Regeln prüft der Server verbindlich.
 */
export function PasswortHinweis({ passwort, kontext, id }: { passwort: string; kontext?: Kontext; id?: string }) {
  if (!passwort) {
    return (
      <p id={id} className="muted" style={{ margin: '-4px 0 0', fontSize: 14, lineHeight: 1.5 }}>
        Mindestens 10 Zeichen mit Groß- und Kleinbuchstaben, Zahl und Sonderzeichen. Tipp: ein kurzer Satz, z. B. „Mein Hund frisst 3 Äpfel!“
      </p>
    )
  }
  const regeln = passwortRegeln(passwort)
  const staerke = passwortStaerke(passwort, kontext)
  const grund = regeln.every((r) => r.ok) ? passwortFehler(passwort, kontext) : null
  const stufe = STUFEN[staerke]!
  return (
    <div id={id} aria-live="polite" style={{ margin: '-4px 0 0', fontSize: 14, lineHeight: 1.5 }}>
      <div style={{ display: 'flex', gap: 4, margin: '0 0 6px' }} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: staerke >= n ? stufe.farbe : staerke === 0 && n === 1 ? stufe.farbe : 'var(--bsv-line, #d2d2d7)' }} />
        ))}
      </div>
      <div style={{ fontWeight: 600, color: stufe.farbe }}>Passwort: {grund ? 'zu leicht zu erraten' : stufe.text}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'grid', gap: 2 }}>
        {regeln.map((r) => (
          <li key={r.key} style={{ color: r.ok ? 'var(--bsv-green, #157a43)' : 'inherit' }}>
            <span aria-hidden="true">{r.ok ? '✓' : '○'}</span> {r.text}
            <span className="sr-only">{r.ok ? ' – erfüllt' : ' – fehlt noch'}</span>
          </li>
        ))}
      </ul>
      {grund && <p style={{ margin: '6px 0 0', color: 'var(--bsv-coral-dark, #c2410c)' }}>{grund}</p>}
    </div>
  )
}
