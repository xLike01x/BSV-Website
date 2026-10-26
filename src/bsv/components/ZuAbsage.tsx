'use client'
import React, { useState } from 'react'

export type ZuAbsageTermin = {
  id: number
  title: string
  /** Datum und Uhrzeit, auf dem Server formatiert */
  wann: string
  ort: string | null
  /** z. B. „Dienstag, 1. Dezember“ – oder null (bis zum Beginn) */
  schluss: string | null
  offen: boolean
  begleitung: boolean
}
export type ZuAbsageAntwort = { teilnahme: 'ja' | 'nein'; personen: number; bemerkung: string } | null

const MAX = 300

/** Zu- oder Absage eines Mitglieds zu einem Termin (Mein BSV). Gespeichert wird über /api/termin-rueckmeldungen/antworten. */
export function ZuAbsage({ termin, antwort: start }: { termin: ZuAbsageTermin; antwort: ZuAbsageAntwort }) {
  const [antwort, setAntwort] = useState(start)
  const [teilnahme, setTeilnahme] = useState<'ja' | 'nein' | ''>(start?.teilnahme ?? '')
  const [personen, setPersonen] = useState(start?.personen && start.personen > 1 ? 2 : 1)
  const [bemerkung, setBemerkung] = useState(start?.bemerkung ?? '')
  const [status, setStatus] = useState<'' | 'sendet' | 'ok' | string>('')

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teilnahme) return setStatus('Bitte „Ich komme“ oder „Ich komme nicht“ wählen.')
    setStatus('sendet')
    try {
      const r = await fetch('/api/termin-rueckmeldungen/antworten', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termin: termin.id, teilnahme, personen, bemerkung }),
      })
      const d = (await r.json().catch(() => ({}))) as { fehler?: string; teilnahme?: 'ja' | 'nein'; personen?: number; bemerkung?: string }
      if (!r.ok || !d.teilnahme) return setStatus(d.fehler ?? 'Das hat nicht geklappt – bitte noch einmal versuchen.')
      setAntwort({ teilnahme: d.teilnahme, personen: d.personen ?? 0, bemerkung: d.bemerkung ?? '' })
      setStatus('ok')
    } catch {
      setStatus('Keine Verbindung – bitte noch einmal versuchen.')
    }
  }

  const stand = antwort ? (antwort.teilnahme === 'ja' ? `✓ Du hast zugesagt${antwort.personen > 1 ? ` (${antwort.personen} Personen)` : ''}` : '✗ Du hast abgesagt') : 'Noch nicht beantwortet'
  const kennung = `zusage-${termin.id}`

  return (
    <div className="zusage">
      <div className="zusage-kopf">
        <strong className="zusage-titel">{termin.title}</strong>
        <span className={`zusage-stand${antwort ? (antwort.teilnahme === 'ja' ? ' ist-ja' : ' ist-nein') : ''}`}>{stand}</span>
      </div>
      <p className="zusage-wann">
        {termin.wann}
        {termin.ort ? ` · ${termin.ort}` : ''}
      </p>
      {termin.offen ? (
        <form method="post" onSubmit={speichern} className="zusage-form">
          <fieldset className="zusage-wahl">
            <legend className="sr-only">Deine Antwort zu {termin.title}</legend>
            <label className={teilnahme === 'ja' ? 'ist-gewaehlt' : undefined}>
              <input type="radio" name={`${kennung}-teilnahme`} value="ja" checked={teilnahme === 'ja'} onChange={() => setTeilnahme('ja')} />
              ✓ Ich komme
            </label>
            <label className={teilnahme === 'nein' ? 'ist-gewaehlt' : undefined}>
              <input type="radio" name={`${kennung}-teilnahme`} value="nein" checked={teilnahme === 'nein'} onChange={() => setTeilnahme('nein')} />
              ✗ Ich komme nicht
            </label>
          </fieldset>
          {teilnahme === 'ja' && termin.begleitung && (
            <label className="field">
              Wie viele Personen?
              <select value={personen} onChange={(e) => setPersonen(Number(e.target.value))}>
                <option value={1}>1 Person (nur ich)</option>
                <option value={2}>2 Personen (mit Begleitung)</option>
              </select>
            </label>
          )}
          <label className="field">
            Bemerkung (optional)
            <input type="text" value={bemerkung} maxLength={MAX} onChange={(e) => setBemerkung(e.target.value)} placeholder="z. B. vegetarisch oder „komme später“" />
          </label>
          {status && status !== 'sendet' && status !== 'ok' && (
            <p className="form-error" role="alert">
              {status}
            </p>
          )}
          {status === 'ok' && (
            <p className="zusage-ok" role="status">
              ✓ Gespeichert.{termin.schluss ? ` Du kannst deine Antwort bis ${termin.schluss} ändern.` : ' Du kannst deine Antwort bis zum Termin ändern.'}
            </p>
          )}
          <div className="zusage-fuss">
            <button type="submit" className="btn btn-primary" disabled={status === 'sendet'}>
              {status === 'sendet' ? 'Wird gespeichert …' : antwort ? 'Antwort ändern' : 'Antwort speichern'}
            </button>
            <span className="muted">{termin.schluss ? `Zu- oder Absage bis ${termin.schluss}` : 'Zu- oder Absage bis zum Termin'}</span>
          </div>
        </form>
      ) : (
        <p className="muted zusage-zu">
          Anmeldeschluss vorbei.{antwort?.bemerkung ? ` Deine Bemerkung: „${antwort.bemerkung}“` : ''}
        </p>
      )}
    </div>
  )
}
