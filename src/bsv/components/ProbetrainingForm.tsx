'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { sendeFormular } from './sendeFormular'

type Props = {
  angebotId: number
  angebotName: string
  ansprechperson?: string
  istKinderangebot: boolean
  terminVorschlaege: string[]
}

export function ProbetrainingForm({ angebotId, angebotName, ansprechperson, istKinderangebot, terminVorschlaege }: Props) {
  const [status, setStatus] = useState<'offen' | 'sendet' | 'fertig'>('offen')
  const [fehler, setFehler] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    setStatus('sendet')
    const f = new FormData(e.currentTarget)
    const alter = Number(f.get('alter'))
    const res = await sendeFormular('/api/probetraining', {
      angebot: angebotId,
      name: f.get('name'),
      email: f.get('email'),
      teilnehmer: f.get('teilnehmer') || undefined,
      alter: Number.isFinite(alter) && alter > 0 ? alter : undefined,
      wunschtermin: f.get('wunschtermin') || undefined,
      nachricht: f.get('nachricht') || undefined,
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
        <h2 className="t-2">Anfrage ist raus.</h2>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 440 }}>
          {ansprechperson ? `${ansprechperson} meldet sich bei dir.` : 'Die Übungsleitung meldet sich bei dir.'} Bring bequeme Kleidung und eine Trinkflasche mit.
        </p>
        <button type="button" onClick={() => setStatus('offen')} className="btn" style={{ marginTop: 16, color: 'var(--bsv-green)', background: 'transparent' }}>
          Noch eine Anfrage
        </button>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      <input type="hidden" name="angebot" value={angebotName} />
      <div className="hp" aria-hidden="true">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {istKinderangebot && (
        <label className="field">
          Vorname des Kindes
          <input name="teilnehmer" type="text" required maxLength={80} autoComplete="off" />
        </label>
      )}
      <label className="field">
        Alter{istKinderangebot ? ' des Kindes' : ''}
        <input name="alter" type="number" min={1} max={99} inputMode="numeric" />
      </label>
      <label className="field">
        {istKinderangebot ? 'Name Elternteil' : 'Dein Name'}
        <input name="name" type="text" required maxLength={120} autoComplete="name" />
      </label>
      <label className="field">
        E-Mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field field-full">
        Wunschtermin
        {terminVorschlaege.length > 0 ? (
          <select name="wunschtermin" defaultValue={terminVorschlaege[0]}>
            {terminVorschlaege.map((t) => (
              <option key={t}>{t}</option>
            ))}
            <option>Anderer Termin – bitte melden</option>
          </select>
        ) : (
          <input name="wunschtermin" type="text" placeholder="z. B. nächste Woche" maxLength={120} />
        )}
      </label>
      <label className="field field-full">
        Nachricht (optional)
        <textarea name="nachricht" maxLength={2000} style={{ minHeight: 100 }} />
      </label>
      <label className="check field-full">
        <input type="checkbox" name="datenschutz" required />
        <span>
          Ich habe die <Link href="/datenschutz">Datenschutzhinweise</Link> gelesen. Meine Angaben werden nur zur Bearbeitung dieser Anfrage genutzt.
        </span>
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary field-full" disabled={status === 'sendet'} style={{ fontSize: 17, minHeight: 52 }}>
        {status === 'sendet' ? 'Wird gesendet …' : 'Anfrage senden'}
      </button>
    </form>
  )
}
