'use client'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { ALTERSGRUPPEN } from '@/bsv/lib'

type Basis = { team: string; href: string; bereich: string; farbe: [string, string]; kategorie: string; alter: string; alterVon: number; alterBis: number }
export type PlanEintrag = Basis & { tag: string; von: string; bis: string; ort: string; hinweis: string }
export type OhneZeit = Basis

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const BEREICHE = [
  { id: 'alle', label: 'Alle' },
  { id: 'fussball', label: 'Fußball' },
  { id: 'kids', label: 'BSV Kids' },
  { id: 'erwachsene', label: 'Erwachsene' },
]

/** Wochenplan mit Filtern nach Bereich und Alter; der heutige Tag ist hervorgehoben */
export function Wochenplan({ eintraege, ohneZeit }: { eintraege: PlanEintrag[]; ohneZeit: OhneZeit[] }) {
  const [bereich, setBereich] = useState('alle')
  const [alter, setAlter] = useState('alle')
  const [heute, setHeute] = useState<string | null>(null)
  useEffect(() => setHeute(TAGE[(new Date().getDay() + 6) % 7]!), [])

  const passt = (e: Basis) => {
    const g = ALTERSGRUPPEN.find((x) => x.id === alter)!
    return (bereich === 'alle' || e.bereich === bereich) && e.alterVon <= g.bis && e.alterBis >= g.von
  }
  const liste = useMemo(() => eintraege.filter(passt), [eintraege, bereich, alter]) // eslint-disable-line react-hooks/exhaustive-deps
  const ohne = useMemo(() => ohneZeit.filter(passt), [ohneZeit, bereich, alter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="plan-filter">
        <div role="group" aria-label="Bereich" className="plan-chips">
          {BEREICHE.map((b) => (
            <button key={b.id} type="button" aria-pressed={bereich === b.id} onClick={() => setBereich(b.id)}>
              {b.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Alter" className="plan-chips">
          {ALTERSGRUPPEN.map((g) => (
            <button key={g.id} type="button" aria-pressed={alter === g.id} onClick={() => setAlter(g.id)}>
              {g.id === 'alle' ? 'Jedes Alter' : g.label}
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 && <p className="muted">Für diese Auswahl sind noch keine festen Zeiten eingetragen.</p>}

      {TAGE.map((tag) => {
        const amTag = liste.filter((e) => e.tag === tag)
        if (!amTag.length) return null
        return (
          <div key={tag} className={`plan-tag${heute === tag ? ' is-heute' : ''}`} id={tag.toLowerCase()}>
            <h2 className="t-3">
              {tag} {heute === tag && <span className="plan-heute">heute</span>}
            </h2>
            <ul className="plan-liste">
              {amTag.map((e, i) => (
                <li key={`${e.href}-${i}`}>
                  <Link href={e.href} className="plan-karte">
                    <span className="plan-zeit">
                      {e.von || '–'}
                      {e.bis && <small>bis {e.bis}</small>}
                    </span>
                    <span className="plan-info">
                      <span className="plan-kat" style={{ color: e.farbe[0] }}>
                        {e.kategorie || 'Training'}
                        {e.alter && <span className="muted"> · {e.alter}</span>}
                      </span>
                      <strong>{e.team}</strong>
                      {(e.ort || e.hinweis) && (
                        <span className="muted plan-ort">
                          {e.ort}
                          {e.ort && e.hinweis ? ' · ' : ''}
                          {e.hinweis}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {ohne.length > 0 && (
        <div className="plan-tag">
          <h2 className="t-3">Zeiten auf Anfrage</h2>
          <p className="muted" style={{ margin: '4px 0 14px' }}>
            Für diese Teams und Kurse steht noch keine feste Zeit im Plan – frag einfach über die Teamseite nach.
          </p>
          <div className="plan-ohne">
            {ohne.map((e) => (
              <Link key={e.href} href={e.href}>
                {e.team}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
