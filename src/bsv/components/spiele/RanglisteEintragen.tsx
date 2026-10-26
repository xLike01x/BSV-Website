'use client'
import React, { useState } from 'react'

export type RanglistenSpiel = 'hochhalten' | 'memory' | 'elfmeterSerie'

/** Zuletzt benutzter Spitzname – nur solange die Seite offen ist (nicht gespeichert) */
let letzterName = ''

/**
 * Nach einer Runde: Spitzname eintippen und in die Rangliste eintragen.
 * Die Prüfung (Schimpfwörter, Links, lange Zahlen) macht der Server; hier nur die Länge.
 */
export function RanglisteEintragen({ spiel, wert }: { spiel: RanglistenSpiel; wert: number }) {
  const [name, setName] = useState(letzterName)
  const [status, setStatus] = useState<'' | 'sendet' | { fehler: string } | { platz7: number; platzImmer: number } | { wartet: true }>('')

  const senden = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sendet')
    try {
      const r = await fetch('/api/spielergebnisse/eintragen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spiel, wert, spitzname: name }),
      })
      const d = (await r.json().catch(() => ({}))) as { fehler?: string; platz7?: number; platzImmer?: number; wartet?: boolean }
      if (!r.ok) return setStatus({ fehler: d.fehler ?? 'Das hat nicht geklappt.' })
      letzterName = name.trim()
      setStatus(d.wartet ? { wartet: true } : { platz7: d.platz7 ?? 0, platzImmer: d.platzImmer ?? 0 })
      window.dispatchEvent(new CustomEvent('bsv-rangliste', { detail: { spiel } }))
    } catch {
      setStatus({ fehler: 'Keine Verbindung – bitte nochmal versuchen.' })
    }
  }

  if (status && typeof status === 'object' && 'platz7' in status)
    return (
      <p className="rangliste-erfolg" role="status">
        {status.platz7 <= 3 ? ['🥇', '🥈', '🥉'][status.platz7 - 1] : '🏅'} Platz {status.platz7} der letzten 7 Tage
        {status.platzImmer <= 10 ? ` · Platz ${status.platzImmer} aller Zeiten!` : ''}
      </p>
    )
  if (status && typeof status === 'object' && 'wartet' in status)
    return (
      <p className="rangliste-erfolg" role="status">
        Danke! Dein Eintrag erscheint, sobald ihn jemand vom Verein freigegeben hat.
      </p>
    )

  return (
    // Tasten nicht an das Spielfeld weitergeben (sonst startet z. B. die Leertaste beim Tippen eine neue Runde)
    <form method="post" className="rangliste-eintragen" onSubmit={senden} onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <label className="field">
        In die Rangliste eintragen
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} minLength={2} required placeholder="Dein Spitzname" autoComplete="off" spellCheck={false} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={status === 'sendet'}>
        {status === 'sendet' ? 'Wird eingetragen …' : 'Eintragen'}
      </button>
      <p className="rangliste-hinweis">Bitte nicht deinen echten Namen – denk dir einen Spitznamen aus, z. B. „Flinker Fuchs“.</p>
      {status && typeof status === 'object' && 'fehler' in status && (
        <p className="form-error" role="alert">
          {status.fehler}
        </p>
      )}
    </form>
  )
}
