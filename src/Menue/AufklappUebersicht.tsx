'use client'
import React, { useCallback, useEffect, useState } from 'react'

import './aufklapp.scss'

type Menue = 'Fußball' | 'Breitensport'
type Angebot = { id: number; title: string; bereich?: string | null; untergruppe?: string | null; reihenfolge?: number | null }
type Spalte = { titel: string; items: Angebot[]; hinweis?: string; warn?: boolean }

const GRUPPEN: [string, string][] = [
  ['junioren', 'Junioren'],
  ['juniorinnen', 'Juniorinnen'],
  ['senioren', 'Senioren'],
  ['seniorinnen', 'Seniorinnen'],
]

/** Spalten genau wie im Menü auf der Website (siehe src/bsv/components/Nav.tsx) */
function spalten(alle: Angebot[], menue: Menue): Spalte[] {
  if (menue === 'Fußball') {
    const fussball = alle.filter((a) => a.bereich === 'fussball')
    const ohneGruppe = fussball.filter((a) => !GRUPPEN.some(([g]) => g === a.untergruppe))
    return [
      ...GRUPPEN.map(([g, t]) => ({ titel: t, items: fussball.filter((a) => a.untergruppe === g) })),
      ...(ohneGruppe.length ? [{ titel: 'Ohne Gruppe – erscheint nicht im Menü', items: ohneGruppe, hinweis: 'Beim Team „Gruppe (Fußball)“ wählen.', warn: true }] : []),
    ].filter((s) => s.items.length > 0)
  }
  return [
    { titel: 'BSV Kids', items: alle.filter((a) => a.bereich === 'kids') },
    { titel: 'Erwachsene & Senioren', items: alle.filter((a) => a.bereich === 'erwachsene'), hinweis: 'Wird auf der Website automatisch auf zwei Spalten verteilt.' },
  ].filter((s) => s.items.length > 0)
}

/**
 * Inhalt eines Aufklappmenüs (Fußball oder Breitensport): Teams und Kurse je Spalte, wie auf der Website.
 * Reihenfolge per Ziehen am Griff (wie bei den anderen Listen) – am Handy über die Pfeile.
 * Gespeichert wird sofort in der „Reihenfolge“ der Teams & Kurse, denn die Einträge SIND die Teams & Kurse.
 */
export default function AufklappUebersicht({ menue = 'Fußball' }: { menue?: Menue }) {
  const [alle, setAlle] = useState<Angebot[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [gespeichert, setGespeichert] = useState(false)
  const [ziehe, setZiehe] = useState<{ spalte: string; index: number } | null>(null)
  const [ueber, setUeber] = useState<{ spalte: string; index: number } | null>(null)

  const laden = useCallback(async () => {
    const r = await fetch('/api/angebote?depth=0&limit=300&sort=reihenfolge,title&where[aktiv][not_equals]=false&select[title]=true&select[bereich]=true&select[untergruppe]=true&select[reihenfolge]=true', { credentials: 'include' }).catch(() => null)
    if (r?.ok) setAlle(((await r.json()).docs ?? []) as Angebot[])
    else setFehler('Teams & Kurse konnten nicht geladen werden.')
  }, [])
  useEffect(() => void laden(), [laden])

  // Neue Reihenfolge einer Spalte speichern (10, 20, 30 …)
  const speichern = async (neu: Angebot[]) => {
    // Sofort anzeigen, dann im Hintergrund speichern
    setAlle((alt) => (alt ? alt.map((a) => ({ ...a, reihenfolge: (neu.findIndex((n) => n.id === a.id) + 1) * 10 || a.reihenfolge })).sort((x, y) => (x.reihenfolge ?? 100) - (y.reihenfolge ?? 100) || x.title.localeCompare(y.title, 'de')) : alt))
    setLaeuft(true)
    setFehler(null)
    try {
      // Alles in einem Schritt: entweder die ganze Spalte oder gar nichts
      const r = await fetch('/api/angebote/reihenfolge', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: neu.map((a) => a.id) }) })
      if (!r.ok) throw new Error()
      setGespeichert(true)
      window.setTimeout(() => setGespeichert(false), 2500)
    } catch {
      setFehler('Das Umsortieren hat nicht geklappt. Bitte noch einmal versuchen.')
    }
    await laden()
    setLaeuft(false)
  }

  const verschieben = (spalte: Spalte, von: number, nach: number) => {
    if (von === nach || nach < 0 || nach >= spalte.items.length) return
    const neu = [...spalte.items]
    const [stueck] = neu.splice(von, 1)
    neu.splice(nach, 0, stueck!)
    void speichern(neu)
  }

  if (!alle) return <p className="bsv-aufklapp__leer">{fehler ?? 'Lädt …'}</p>

  const liste = spalten(alle, menue)
  return (
    <div className={`bsv-aufklapp${laeuft ? ' is-laeuft' : ''}`}>
      <p className="bsv-aufklapp__info">
        Die Einträge in diesem Menü sind eure <strong>Teams & Kurse</strong> – ein neues Angebot erscheint von selbst. Reihenfolge ändern: <strong>am Griff ⠿ ziehen</strong> (am Handy mit den Pfeilen). Das gilt sofort, ohne Speichern.
        {menue === 'Fußball' ? ' Die Spalte legst du beim Team fest: „Gruppe (Fußball)“.' : ' Die Spalte legst du beim Kurs fest: „Bereich“ (BSV Kids oder Erwachsene & Senioren).'} Ausblenden: beim Angebot den Haken „Aktiv“ entfernen.
      </p>
      {fehler && <p className="bsv-aufklapp__fehler">{fehler}</p>}
      {gespeichert && <p className="bsv-aufklapp__ok">✓ Reihenfolge gespeichert</p>}
      <div className="bsv-aufklapp__spalten">
        {liste.map((s) => (
          <div key={s.titel} className={`bsv-aufklapp__spalte${s.warn ? ' is-warn' : ''}`}>
            <strong>
              {s.warn ? '⚠️ ' : ''}
              {s.titel}
            </strong>
            {s.hinweis && <small>{s.hinweis}</small>}
            <ol>
              {s.items.map((a, i) => (
                <li
                  key={a.id}
                  draggable={!laeuft}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    setZiehe({ spalte: s.titel, index: i })
                  }}
                  onDragOver={(e) => {
                    if (ziehe?.spalte !== s.titel) return
                    e.preventDefault()
                    if (ueber?.index !== i || ueber.spalte !== s.titel) setUeber({ spalte: s.titel, index: i })
                  }}
                  onDragEnd={() => {
                    setZiehe(null)
                    setUeber(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (ziehe && ziehe.spalte === s.titel) verschieben(s, ziehe.index, i)
                    setZiehe(null)
                    setUeber(null)
                  }}
                  className={[ziehe?.spalte === s.titel && ziehe.index === i ? 'is-zieht' : '', ueber?.spalte === s.titel && ueber.index === i && ziehe?.index !== i ? (ziehe!.index < i ? 'is-ziel-unten' : 'is-ziel-oben') : ''].join(' ')}
                >
                  <span className="bsv-aufklapp__griff" aria-hidden="true" title="Ziehen zum Verschieben">
                    ⠿
                  </span>
                  <a href={`/admin/collections/angebote/${a.id}`} draggable={false}>
                    {a.title}
                  </a>
                  <span className="bsv-aufklapp__pfeile">
                    <button type="button" aria-label={`${a.title} nach oben`} disabled={laeuft || i === 0} onClick={() => verschieben(s, i, i - 1)}>
                      ▲
                    </button>
                    <button type="button" aria-label={`${a.title} nach unten`} disabled={laeuft || i === s.items.length - 1} onClick={() => verschieben(s, i, i + 1)}>
                      ▼
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <a className="bsv-aufklapp__neu" href="/admin/collections/angebote/create">
        + {menue === 'Fußball' ? 'Neues Team anlegen' : 'Neuen Kurs anlegen'}
      </a>
    </div>
  )
}
