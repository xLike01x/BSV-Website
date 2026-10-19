'use client'
import React, { useCallback, useEffect, useState } from 'react'

import './aufklapp.scss'

type Angebot = { id: number; title: string; bereich?: string | null; untergruppe?: string | null; reihenfolge?: number | null; aktiv?: boolean | null }
type Spalte = { menue: 'Fußball' | 'Breitensport'; titel: string; items: Angebot[]; hinweis?: string }

const GRUPPEN: [string, string][] = [
  ['junioren', 'Junioren'],
  ['juniorinnen', 'Juniorinnen'],
  ['senioren', 'Senioren'],
  ['seniorinnen', 'Seniorinnen'],
]

/** Spalten genau wie im Menü auf der Website (siehe src/bsv/components/Nav.tsx) */
function spalten(alle: Angebot[]): Spalte[] {
  const fussball = alle.filter((a) => a.bereich === 'fussball')
  const ohneGruppe = fussball.filter((a) => !GRUPPEN.some(([g]) => g === a.untergruppe))
  return [
    ...GRUPPEN.map(([g, t]) => ({ menue: 'Fußball' as const, titel: t, items: fussball.filter((a) => a.untergruppe === g) })),
    ...(ohneGruppe.length ? [{ menue: 'Fußball' as const, titel: '⚠️ Ohne Gruppe – erscheint nicht im Menü', items: ohneGruppe, hinweis: 'Beim Team „Gruppe (Fußball)“ wählen.' }] : []),
    { menue: 'Breitensport' as const, titel: 'BSV Kids', items: alle.filter((a) => a.bereich === 'kids') },
    { menue: 'Breitensport' as const, titel: 'Erwachsene & Senioren', items: alle.filter((a) => a.bereich === 'erwachsene'), hinweis: 'Wird auf der Website automatisch auf zwei Spalten verteilt.' },
  ].filter((s) => s.items.length > 0)
}

/**
 * Übersicht der Aufklappmenüs „Fußball“ und „Breitensport“: Welche Teams und Kurse in welcher Spalte stehen –
 * mit Pfeilen zum Umsortieren (ändert die „Reihenfolge“ der Teams & Kurse direkt).
 */
export default function AufklappUebersicht() {
  const [alle, setAlle] = useState<Angebot[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  const laden = useCallback(async () => {
    const r = await fetch('/api/angebote?depth=0&limit=300&sort=reihenfolge,title&where[aktiv][not_equals]=false&select[title]=true&select[bereich]=true&select[untergruppe]=true&select[reihenfolge]=true', { credentials: 'include' }).catch(() => null)
    if (r?.ok) setAlle(((await r.json()).docs ?? []) as Angebot[])
    else setFehler('Teams & Kurse konnten nicht geladen werden.')
  }, [])
  useEffect(() => void laden(), [laden])

  // Spalte neu durchnummerieren (10, 20, 30 …), damit die Reihenfolge eindeutig ist
  const verschieben = async (spalte: Spalte, index: number, richtung: -1 | 1) => {
    const ziel = index + richtung
    if (ziel < 0 || ziel >= spalte.items.length) return
    const neu = [...spalte.items]
    ;[neu[index], neu[ziel]] = [neu[ziel]!, neu[index]!]
    setLaeuft(true)
    setFehler(null)
    try {
      for (const [i, a] of neu.entries()) {
        const wert = (i + 1) * 10
        if (a.reihenfolge === wert) continue
        const r = await fetch(`/api/angebote/${a.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reihenfolge: wert }) })
        if (!r.ok) throw new Error()
      }
      await laden()
    } catch {
      setFehler('Das Umsortieren hat nicht geklappt. Bitte noch einmal versuchen.')
    }
    setLaeuft(false)
  }

  if (!alle) return <p className="bsv-aufklapp__leer">{fehler ?? 'Lädt …'}</p>

  const liste = spalten(alle)
  return (
    <div className={`bsv-aufklapp${laeuft ? ' is-laeuft' : ''}`}>
      <p className="bsv-aufklapp__info">
        Die Teams und Kurse in diesen Menüs kommen <strong>automatisch aus „Teams & Kurse“</strong> – ein neues Angebot erscheint von selbst. Mit den Pfeilen änderst du die Reihenfolge innerhalb einer Spalte (gilt sofort, ohne Speichern).
        In welcher Spalte ein Angebot steht, legst du beim Angebot fest: „Bereich“ und bei Fußball „Gruppe (Fußball)“. Ausgeblendet wird es mit dem Haken „Aktiv“.
      </p>
      {fehler && <p className="bsv-aufklapp__fehler">{fehler}</p>}
      {(['Fußball', 'Breitensport'] as const).map((m) => (
        <section key={m}>
          <h4>Aufklappmenü „{m}“</h4>
          <div className="bsv-aufklapp__spalten">
            {liste
              .filter((s) => s.menue === m)
              .map((s) => (
                <div key={s.titel} className="bsv-aufklapp__spalte">
                  <strong>{s.titel}</strong>
                  {s.hinweis && <small>{s.hinweis}</small>}
                  <ol>
                    {s.items.map((a, i) => (
                      <li key={a.id}>
                        <a href={`/admin/collections/angebote/${a.id}`}>{a.title}</a>
                        <span className="bsv-aufklapp__pfeile">
                          <button type="button" aria-label={`${a.title} nach oben`} disabled={laeuft || i === 0} onClick={() => verschieben(s, i, -1)}>
                            ▲
                          </button>
                          <button type="button" aria-label={`${a.title} nach unten`} disabled={laeuft || i === s.items.length - 1} onClick={() => verschieben(s, i, 1)}>
                            ▼
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
          </div>
        </section>
      ))}
      <a className="bsv-aufklapp__neu" href="/admin/collections/angebote/create">
        + Neues Team oder neuen Kurs anlegen
      </a>
    </div>
  )
}
