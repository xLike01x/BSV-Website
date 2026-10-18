'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { GoogleKnopf } from '@/bsv/components/GoogleKnopf'
import { sicheresZiel } from '@/bsv/sicheresZiel'

/** Konto erstellen – danach angemeldet, der Mitgliederbereich öffnet sich nach der Freigabe */
export function RegistrierenForm({ google = false }: { google?: boolean }) {
  const router = useRouter()
  const sp = useSearchParams()
  const weiter = sicheresZiel(sp.get('weiter'), '/mitglieder')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)

  async function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    const f = new FormData(e.currentTarget)
    if (f.get('passwort') !== f.get('passwort2')) return setFehler('Die beiden Passwörter sind nicht gleich.')
    setLaedt(true)
    try {
      const res = await fetch('/api/users/registrieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: f.get('name'), email: f.get('email'), passwort: f.get('passwort'), datenschutz: f.get('datenschutz') === 'on', website: f.get('website') }),
      })
      const d = (await res.json().catch(() => ({}))) as { fehler?: string }
      if (res.ok) {
        router.push(weiter)
        router.refresh()
        return
      }
      setFehler(d.fehler ?? 'Das hat nicht geklappt. Bitte versuche es erneut.')
    } catch {
      setFehler('Keine Verbindung. Bitte versuche es erneut.')
    }
    setLaedt(false)
  }

  return (
    <form className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={absenden}>
      {google && <GoogleKnopf weiter={weiter} text="Mit Google registrieren" />}
      <label className="field">
        Vor- und Nachname
        <input name="name" required autoComplete="name" maxLength={120} />
      </label>
      <label className="field">
        E-Mail
        <input name="email" type="email" required autoComplete="email" maxLength={200} />
      </label>
      <label className="field">
        Passwort (mindestens 10 Zeichen)
        <input name="passwort" type="password" required minLength={10} autoComplete="new-password" />
      </label>
      <label className="field">
        Passwort wiederholen
        <input name="passwort2" type="password" required minLength={10} autoComplete="new-password" />
      </label>
      {/* Für Bots: unsichtbares Feld */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      <label className="check">
        <input type="checkbox" name="datenschutz" required />
        <span>
          Ich habe die <Link href="/datenschutz">Datenschutzhinweise</Link> gelesen.
        </span>
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={laedt} style={{ minHeight: 52 }}>
        {laedt ? 'Bitte warten …' : 'Konto erstellen'}
      </button>
      <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
        Nach der Registrierung prüft die Verwaltung kurz, ob du Mitglied bist, und schaltet deinen Zugang frei. Noch kein Mitglied?{' '}
        <Link href="/mitglied-werden">Hier geht’s zum Antrag.</Link>
      </p>
      <div style={{ fontSize: 15 }}>
        <Link href="/login">Schon ein Konto? Anmelden</Link>
      </div>
    </form>
  )
}
