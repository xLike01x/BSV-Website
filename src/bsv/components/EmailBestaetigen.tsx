'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { passwortFehler } from '@/auth/passwortRegeln'

import { ErneutSenden } from './ErneutSenden'
import { PasswortHinweis } from './PasswortHinweis'

type Status = 'laeuft' | 'passwort' | 'ok' | 'ungueltig' | 'abgelaufen' | 'fehler'

/**
 * Wird über den Link in der Bestätigungs-E-Mail geöffnet: prüft den Link und fragt dann nach dem Passwort.
 * (Schutz davor, dass jemand Fremdes vorab mit deiner Adresse und seinem Passwort registriert.)
 */
export function EmailBestaetigen() {
  const t = useSearchParams().get('t') ?? ''
  const [status, setStatus] = useState<Status>('laeuft')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)
  const [eingabe, setEingabe] = useState('')
  const [neu, setNeu] = useState(false)
  const gestartet = useRef(false)

  const senden = async (passwort?: string) => {
    const r = await fetch('/api/users/registrieren/bestaetigen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t, passwort }) })
    const d = (await r.json().catch(() => ({}))) as { fehler?: string; meldung?: string; passwortNoetig?: boolean; neuesPasswort?: boolean }
    return { r, d }
  }
  const fehlerStatus = (f?: string): Status => (f === 'abgelaufen' ? 'abgelaufen' : f === 'ungueltig' ? 'ungueltig' : 'fehler')

  useEffect(() => {
    if (gestartet.current) return
    gestartet.current = true
    senden()
      .then(({ r, d }) => setStatus(r.ok && d.passwortNoetig ? 'passwort' : fehlerStatus(d.fehler)))
      .catch(() => setStatus('fehler'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  async function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    const f = new FormData(e.currentTarget)
    const passwort = String(f.get('passwort') ?? '')
    if (passwort !== f.get('passwort2')) return setFehler('Die beiden Eingaben sind nicht gleich.')
    // Das Passwort von der Registrierung erfüllt die Regeln immer – sonst zeigt die Prüfung gleich, was fehlt
    const regel = passwortFehler(passwort)
    if (regel) return setFehler(regel)
    setLaedt(true)
    try {
      const { r, d } = await senden(passwort)
      if (r.ok) {
        setNeu(d.neuesPasswort === true)
        setStatus('ok')
      } else if (d.fehler === 'passwort') setFehler(d.meldung ?? 'Dieses Passwort passt nicht.')
      else if (r.status === 429) setFehler('Zu viele Versuche. Bitte in ein paar Minuten erneut probieren.')
      else setStatus(fehlerStatus(d.fehler))
    } catch {
      setFehler('Keine Verbindung. Bitte versuche es erneut.')
    }
    setLaedt(false)
  }

  if (status === 'laeuft')
    return (
      <div className="success" style={{ padding: 40 }} role="status">
        <p className="muted" style={{ margin: 0 }}>Einen Moment, wir prüfen den Link …</p>
      </div>
    )
  if (status === 'passwort')
    return (
      <form method="post" className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={absenden}>
        <h2 className="t-2" style={{ fontSize: 26, margin: 0 }}>
          Fast geschafft: dein Passwort
        </h2>
        <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
          Gib zur Sicherheit das Passwort ein, das du bei der Registrierung gewählt hast. Weißt du es nicht mehr, gib einfach ein neues ein – dann gilt ab jetzt das neue.
        </p>
        <label className="field">
          Passwort
          <input name="passwort" type="password" required minLength={10} maxLength={200} autoComplete="new-password" autoFocus aria-describedby="passwort-hinweis" onChange={(e) => setEingabe(e.target.value)} />
        </label>
        <PasswortHinweis id="passwort-hinweis" passwort={eingabe} />
        <label className="field">
          Passwort wiederholen
          <input name="passwort2" type="password" required minLength={10} maxLength={200} autoComplete="new-password" />
        </label>
        {fehler && (
          <p className="form-error" role="alert">
            {fehler}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={laedt} style={{ minHeight: 52 }}>
          {laedt ? 'Bitte warten …' : 'E-Mail-Adresse bestätigen'}
        </button>
      </form>
    )
  if (status === 'ok')
    return (
      <div className="success" style={{ padding: 40 }} role="status">
        <div aria-hidden="true" style={{ fontSize: 44 }}>✓</div>
        <h2 className="t-2" style={{ fontSize: 28 }}>
          Danke, deine E-Mail ist bestätigt.
        </h2>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 380, lineHeight: 1.5 }}>
          {neu ? 'Dein neues Passwort ist gespeichert. ' : ''}Die Verwaltung prüft jetzt kurz, ob du Mitglied bist, und schaltet deinen Zugang frei. Du bekommst dann eine E-Mail. Anmelden kannst du dich schon jetzt.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: 20 }}>
          Zur Anmeldung
        </Link>
      </div>
    )
  return (
    <div className="form" style={{ gridTemplateColumns: '1fr' }}>
      <h2 className="t-2" style={{ fontSize: 26, margin: 0 }}>
        {status === 'abgelaufen' ? 'Der Link ist abgelaufen.' : status === 'ungueltig' ? 'Der Link gilt nicht (mehr).' : 'Das hat nicht geklappt.'}
      </h2>
      <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
        {status === 'ungueltig'
          ? 'Vielleicht hast du schon bestätigt – dann kannst du dich einfach anmelden. Oder du hast dich danach noch einmal registriert; dann gilt nur der Link aus der neuesten E-Mail.'
          : status === 'abgelaufen'
            ? 'Bestätigungslinks gelten 48 Stunden. Lass dir einfach einen neuen schicken.'
            : 'Bitte die Seite neu laden oder dir einen neuen Link schicken lassen.'}
      </p>
      <ErneutSenden />
      <div style={{ fontSize: 15 }}>
        <Link href="/login">Zur Anmeldung</Link>
      </div>
    </div>
  )
}
