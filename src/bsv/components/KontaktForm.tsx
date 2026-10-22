'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { sendeFormular } from './sendeFormular'

/** Passt ein Link-Thema (z. B. ?thema=Sponsoring) zu einem Anliegen? Dann ist es vorausgewählt. */
const passend = (anliegen: string[], wunsch: string) => {
  const w = wunsch.toLowerCase()
  if (!w) return undefined
  return anliegen.find((a) => a.toLowerCase() === w) ?? anliegen.find((a) => w.includes(a.toLowerCase()) || a.toLowerCase().includes(w))
}

export function KontaktForm({ anliegen, direkt = [] }: { anliegen: string[]; direkt?: { wert: string; label: string }[] }) {
  const sp = useSearchParams()
  const thema = sp.get('thema') ?? ''
  // „Nachricht senden“ bei einem Vorstandsmitglied: diese Person steht oben und ist ausgewählt
  const person = direkt.find((d) => d.wert === sp.get('an'))
  const vorwahl = person?.wert ?? passend(anliegen, sp.get('an') ?? '') ?? passend(anliegen, thema) ?? anliegen[0]
  const [status, setStatus] = useState<'offen' | 'sendet' | 'fertig'>('offen')
  const [fehler, setFehler] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    setStatus('sendet')
    const f = new FormData(e.currentTarget)
    const res = await sendeFormular('/api/kontaktanfragen', {
      an: f.get('an'),
      name: f.get('name'),
      email: f.get('email'),
      betreff: f.get('betreff'),
      nachricht: f.get('nachricht'),
      datenschutz: f.get('datenschutz') === 'on',
      website: f.get('website'),
    })
    if (res.ok) setStatus('fertig')
    else {
      setFehler(res.fehler)
      setStatus('offen')
    }
  }

  if (status === 'fertig') {
    return (
      <div className="success" role="status">
        <div className="success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44">
            <path d="M5 12.5l4.5 4.5L19 7.5" style={{ fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
          </svg>
        </div>
        <h2 className="t-2">Danke für deine Nachricht.</h2>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 440 }}>
          Wir melden uns so schnell wie möglich per E-Mail bei dir.
        </p>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="hp" aria-hidden="true">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="field field-full">
        Worum geht es?
        <select name="an" defaultValue={vorwahl}>
          {person && <option value={person.wert}>{person.label}</option>}
          {anliegen.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Name
        <input name="name" type="text" required maxLength={120} autoComplete="name" />
      </label>
      <label className="field">
        E-Mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field field-full">
        Betreff
        <input name="betreff" type="text" required maxLength={200} defaultValue={thema} />
      </label>
      <label className="field field-full">
        Nachricht
        <textarea name="nachricht" required maxLength={5000} />
      </label>
      <label className="check field-full">
        <input type="checkbox" name="datenschutz" required />
        <span>
          Ich habe die <Link href="/datenschutz" target="_blank" rel="noopener noreferrer">
            Datenschutzhinweise
          </Link> gelesen.
        </span>
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary field-full" disabled={status === 'sendet'} style={{ minHeight: 52 }}>
        {status === 'sendet' ? 'Wird gesendet …' : 'Nachricht senden'}
      </button>
    </form>
  )
}
