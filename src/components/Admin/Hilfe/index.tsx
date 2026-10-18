'use client'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { HILFE, HILFE_BEARBEITEN, HILFE_LISTE, type HilfeText } from './texte'
import './hilfe.scss'

type Ansicht = { schluessel: string; art: 'liste' | 'bearbeiten' | 'seite' }

/** Aus der Adresse ableiten, wo man gerade ist */
function ansichtAus(pfad: string): Ansicht {
  const teile = pfad
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean)
  if (teile[0] === 'collections' && teile[1])
    return { schluessel: teile[1], art: teile[2] ? 'bearbeiten' : 'liste' }
  if (teile[0] === 'globals' && teile[1]) return { schluessel: teile[1], art: 'bearbeiten' }
  if (teile[0] === 'account') return { schluessel: 'account', art: 'bearbeiten' }
  return { schluessel: 'dashboard', art: 'seite' }
}

const Abschnitt = ({ titel, punkte }: { titel: string; punkte?: string[] }) =>
  punkte && punkte.length > 0 ? (
    <section className="bsv-hilfe__abschnitt">
      <h3>{titel}</h3>
      <ul>
        {punkte.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  ) : null

/** „Hilfe“-Knopf oben rechts: erklärt in einfachen Worten den aktuellen Bereich. */
export default function Hilfe() {
  const pfad = usePathname() ?? '/admin'
  const [offen, setOffen] = useState(false)
  const ansicht = ansichtAus(pfad)
  const text: HilfeText = HILFE[ansicht.schluessel] ?? {
    titel: 'Hilfe',
    kurz: 'Für diesen Bereich gibt es noch keinen eigenen Hilfetext.',
    tun: ['Bei Fragen wende dich an einen Admin des Vereins.'],
    wirkung: [],
  }

  // Beim Seitenwechsel schließen, Escape schließt ebenfalls
  useEffect(() => setOffen(false), [pfad])
  useEffect(() => {
    if (!offen) return
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false)
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [offen])

  return (
    <>
      <button
        type="button"
        className="bsv-hilfe__knopf"
        onClick={() => setOffen(true)}
        aria-haspopup="dialog"
        aria-expanded={offen}
      >
        <span aria-hidden="true">?</span> Hilfe
      </button>

      {offen &&
        createPortal(
          <div className="bsv-hilfe__schleier" onClick={() => setOffen(false)}>
            <aside
              className="bsv-hilfe__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bsv-hilfe-titel"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="bsv-hilfe__kopf">
                <p className="bsv-hilfe__ueber">Hilfe</p>
                <h2 id="bsv-hilfe-titel">{text.titel}</h2>
                <button
                  type="button"
                  className="bsv-hilfe__zu"
                  onClick={() => setOffen(false)}
                  aria-label="Hilfe schließen"
                >
                  ×
                </button>
              </header>
              <p className="bsv-hilfe__kurz">{text.kurz}</p>
              <Abschnitt titel="Was kann ich hier machen?" punkte={text.tun} />
              <Abschnitt titel="Was passiert dann auf der Website?" punkte={text.wirkung} />
              <Abschnitt titel="Gut zu wissen" punkte={text.tipps} />
              {ansicht.art === 'liste' && (
                <Abschnitt titel="So funktioniert die Liste" punkte={HILFE_LISTE} />
              )}
              {ansicht.art === 'bearbeiten' && (
                <Abschnitt titel="Beim Bearbeiten" punkte={HILFE_BEARBEITEN} />
              )}
              <p className="bsv-hilfe__fuss">
                Nicht weitergekommen? Frag einen Admin des Vereins – lieber einmal zu viel als
                einmal zu wenig.
              </p>
            </aside>
          </div>,
          document.body,
        )}
    </>
  )
}
