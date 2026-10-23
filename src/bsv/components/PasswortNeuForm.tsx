'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { passwortFehler } from '@/auth/passwortRegeln'

import { PasswortHinweis } from './PasswortHinweis'

/** Neues Passwort festlegen (Link aus der „Passwort vergessen“-E-Mail) – danach angemeldet */
export function PasswortNeuForm() {
  const router = useRouter()
  const t = useSearchParams().get('t') ?? ''
  const [fehler, setFehler] = useState<string | null>(t ? null : 'Der Link ist unvollständig. Bitte den Knopf in der E-Mail benutzen.')
  const [laedt, setLaedt] = useState(false)
  const [eingabe, setEingabe] = useState('')

  async function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    const f = new FormData(e.currentTarget)
    const passwort = String(f.get('passwort') ?? '')
    // Name/E-Mail prüft der Server zusätzlich (hier unbekannt)
    const pwFehler = passwortFehler(passwort)
    if (pwFehler) return setFehler(pwFehler)
    if (passwort !== f.get('passwort2')) return setFehler('Die beiden Passwörter sind nicht gleich.')
    setLaedt(true)
    try {
      const res = await fetch('/api/users/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ token: t, password: passwort }) })
      if (res.ok) {
        const st = await fetch('/api/users/zwei-faktor/status', { credentials: 'same-origin' }).then((r) => r.json()).catch(() => null)
        router.push(st?.offen ? '/login/zwei-faktor?weiter=/mitglieder' : '/mitglieder')
        router.refresh()
        return
      }
      // Regelverstoß (z. B. Name im Passwort) verständlich anzeigen – sonst ist der Link das Problem
      const d = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      const meldung = d?.errors?.[0]?.message ?? ''
      setFehler(res.status === 400 && /^(Das Passwort|Dieses Passwort|Bitte keine Reihen)/.test(meldung) ? meldung : 'Der Link ist abgelaufen oder wurde schon benutzt. Bitte auf der Anmeldeseite noch einmal „Passwort vergessen?“ wählen.')
    } catch {
      setFehler('Keine Verbindung. Bitte versuche es erneut.')
    }
    setLaedt(false)
  }

  return (
    <form method="post" className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={absenden}>
      <label className="field">
        Neues Passwort
        <input name="passwort" type="password" required minLength={10} maxLength={200} autoComplete="new-password" autoFocus aria-describedby="passwort-hinweis" onChange={(e) => setEingabe(e.target.value)} />
      </label>
      <PasswortHinweis id="passwort-hinweis" passwort={eingabe} />
      <label className="field">
        Neues Passwort wiederholen
        <input name="passwort2" type="password" required minLength={10} maxLength={200} autoComplete="new-password" />
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={laedt || !t} style={{ minHeight: 52 }}>
        {laedt ? 'Bitte warten …' : 'Passwort speichern und anmelden'}
      </button>
      <div style={{ fontSize: 15 }}>
        <Link href="/login">Zurück zur Anmeldung</Link>
      </div>
    </form>
  )
}
