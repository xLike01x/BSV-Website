'use client'
import React, { useState } from 'react'

export type Vorschlag = { id: number; titel: string; team: string | null; entwurf: boolean; von: string | null }

/** Redaktion: News, die Trainer für die Startseite vorgeschlagen haben – mit einem Klick annehmen oder ablehnen */
export default function Vorschlaege({ liste }: { liste: Vorschlag[] }) {
  const [offen, setOffen] = useState(liste)
  const [laeuft, setLaeuft] = useState<number | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  if (!offen.length) return null

  const entscheiden = async (id: number, annehmen: boolean) => {
    setLaeuft(id)
    setFehler(null)
    try {
      const r = await fetch(`/api/posts/${id}/startseite`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ annehmen }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setFehler(d.fehler ?? 'Das hat nicht geklappt.')
      setOffen((l) => l.filter((v) => v.id !== id))
    } catch {
      setFehler('Keine Verbindung. Bitte noch einmal versuchen.')
    } finally {
      setLaeuft(null)
    }
  }

  return (
    <section className="bsv-dash__box bsv-dash__vorschlaege" aria-label="Vorschläge für die Startseite">
      <h2>⭐ Für die Startseite vorgeschlagen</h2>
      <ul className="bsv-dash__vorschlag-liste">
        {offen.map((v) => (
          <li key={v.id}>
            <div>
              <a href={`/admin/collections/posts/${v.id}`}>
                <strong>{v.titel || 'Ohne Titel'}</strong>
              </a>
              <span>
                {[v.team, v.von && `von ${v.von}`, v.entwurf && 'noch Entwurf – erscheint nach dem Veröffentlichen'].filter(Boolean).join(' · ')}
              </span>
            </div>
            <span className="bsv-dash__vorschlag-knoepfe">
              <button type="button" className="bsv-dash__btn bsv-dash__btn--primaer" disabled={laeuft === v.id} onClick={() => entscheiden(v.id, true)}>
                Auf die Startseite
              </button>
              <button type="button" className="bsv-dash__btn" disabled={laeuft === v.id} onClick={() => entscheiden(v.id, false)}>
                Nein, danke
              </button>
            </span>
          </li>
        ))}
      </ul>
      {fehler && <p role="alert" className="bsv-dash__fehler">{fehler}</p>}
    </section>
  )
}
