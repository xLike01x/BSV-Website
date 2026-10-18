'use client'

import { sicheresZiel } from '@/bsv/sicheresZiel'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const [modus, setModus] = useState<'login' | 'vergessen' | 'gesendet'>('login')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)

  // Nur interne Ziele erlauben (kein Open Redirect)
  const weiter = sicheresZiel(sp.get('weiter'), '/mitglieder')

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    setLaedt(true)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: f.get('email'), password: f.get('passwort') }),
      })
      if (res.ok) {
        // Personal (alle außer Mitglied) bestätigt die Anmeldung mit dem zweiten Faktor
        const st = await fetch('/api/users/zwei-faktor/status', { credentials: 'same-origin' }).then((r) => r.json()).catch(() => null)
        router.push(st?.offen ? `/login/zwei-faktor?weiter=${encodeURIComponent(weiter.startsWith('/mitglieder') ? '/mitglieder' : weiter)}` : weiter)
        router.refresh()
        return
      }
      const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      const msg = body?.errors?.[0]?.message ?? ''
      setFehler(/locked|gesperrt/i.test(msg) ? 'Zu viele Fehlversuche. Das Konto ist für 10 Minuten gesperrt.' : 'E-Mail oder Passwort stimmen nicht.')
    } catch {
      setFehler('Keine Verbindung. Bitte versuche es erneut.')
    }
    setLaedt(false)
  }

  async function vergessen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLaedt(true)
    const f = new FormData(e.currentTarget)
    await fetch('/api/users/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.get('email') }),
    }).catch(() => null)
    // Immer dieselbe Meldung – verrät nicht, ob es die Adresse gibt
    setLaedt(false)
    setModus('gesendet')
  }

  if (modus === 'gesendet') {
    return (
      <div className="success" style={{ padding: 40 }} role="status">
        <h2 className="t-2" style={{ fontSize: 28 }}>
          Schau in dein Postfach.
        </h2>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 380 }}>
          Wenn es ein Konto mit dieser Adresse gibt, haben wir dir einen Link zum Zurücksetzen geschickt.
        </p>
        <button type="button" className="btn" style={{ marginTop: 16, color: 'var(--bsv-green)', background: 'transparent' }} onClick={() => setModus('login')}>
          Zurück zur Anmeldung
        </button>
      </div>
    )
  }

  return (
    <form className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={modus === 'login' ? login : vergessen}>
      <label className="field">
        E-Mail
        <input name="email" type="email" required autoComplete="username" autoFocus />
      </label>
      {modus === 'login' && (
        <label className="field">
          Passwort
          <input name="passwort" type="password" required autoComplete="current-password" />
        </label>
      )}
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={laedt} style={{ minHeight: 52 }}>
        {laedt ? 'Bitte warten …' : modus === 'login' ? 'Anmelden' : 'Link zum Zurücksetzen senden'}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 15 }}>
        <button type="button" onClick={() => (setFehler(null), setModus(modus === 'login' ? 'vergessen' : 'login'))} style={{ font: 'inherit', background: 'none', border: 0, color: 'var(--bsv-green)', cursor: 'pointer', padding: 0 }}>
          {modus === 'login' ? 'Passwort vergessen?' : 'Zurück zur Anmeldung'}
        </button>
        <Link href="/mitglied-werden">Noch kein Mitglied?</Link>
      </div>
    </form>
  )
}
