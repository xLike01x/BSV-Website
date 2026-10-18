'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Status = { angemeldet: boolean; personal?: boolean; eingerichtet?: boolean; offen?: boolean; abgeschaltet?: boolean }

const post = async (pfad: string, body?: unknown) => {
  const res = await fetch(`/api/users/zwei-faktor/${pfad}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

/** Nur interne Ziele erlauben (kein Open Redirect) */
const sicheresZiel = (w: string | null, fallback: string) => (w && w.startsWith('/') && !w.startsWith('//') ? w : fallback)

export function ZweiFaktor() {
  const router = useRouter()
  const sp = useSearchParams()
  const ziel = sicheresZiel(sp.get('weiter'), '/admin')
  const [status, setStatus] = useState<Status | null>(null)
  const [einrichtung, setEinrichtung] = useState<{ qr: string; geheimnis: string } | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [code, setCode] = useState('')
  const [modusCode, setModusCode] = useState<'app' | 'wiederherstellung'>('app')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)
  const [kopiert, setKopiert] = useState(false)
  const eingabe = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/users/zwei-faktor/status', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((s: Status) => {
        setStatus(s)
        if (!s.angemeldet) router.replace(`/login?weiter=${encodeURIComponent(ziel)}`)
        else if (!s.offen) router.replace(s.personal ? ziel : '/mitglieder')
      })
      .catch(() => setFehler('Keine Verbindung.'))
  }, [router, ziel])

  // Einrichtung starten, sobald klar ist, dass noch keine App verbunden ist
  useEffect(() => {
    if (status?.offen && !status.eingerichtet && !einrichtung) {
      post('einrichten').then(({ ok, data }) => (ok ? setEinrichtung(data) : setFehler(data.fehler ?? 'Einrichtung fehlgeschlagen.')))
    }
  }, [status, einrichtung])

  useEffect(() => {
    eingabe.current?.focus()
  }, [einrichtung, modusCode, status])

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setFehler(null)
    setLaedt(true)
    const { ok, data } = await post(status?.eingerichtet ? 'pruefen' : 'bestaetigen', { code })
    setLaedt(false)
    if (!ok) {
      setFehler(data.fehler ?? 'Das hat nicht geklappt.')
      setCode('')
      return
    }
    if (data.wiederherstellungscodes) return setCodes(data.wiederherstellungscodes)
    router.replace(ziel)
    router.refresh()
  }

  if (!status || !status.offen) {
    return <div className="form" style={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><span className="muted">Einen Moment …</span></div>
  }

  // Nach der Einrichtung: Wiederherstellungscodes einmalig anzeigen
  if (codes) {
    return (
      <div className="form" style={{ gridTemplateColumns: '1fr' }}>
        <h2 className="t-2" style={{ fontSize: 26 }}>
          Fertig! Bewahre diese Codes sicher auf.
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Falls dein Handy verloren geht, meldest du dich mit einem dieser Codes an. Jeder Code funktioniert nur einmal. Sie werden nur jetzt angezeigt.
        </p>
        <ol style={{ margin: 0, padding: 18, background: 'var(--bsv-soft)', borderRadius: 14, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 20px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 16, listStyle: 'none' }}>
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard?.writeText(codes.join('\n')).catch(() => null)
              setKopiert(true)
            }}
          >
            {kopiert ? '✓ Kopiert' : 'Codes kopieren'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            Drucken
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => (router.replace(ziel), router.refresh())} style={{ minHeight: 52 }}>
          Ich habe die Codes gesichert – weiter
        </button>
      </div>
    )
  }

  return (
    <form className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={absenden}>
      {!status.eingerichtet ? (
        <>
          <h2 className="t-2" style={{ fontSize: 26 }}>
            Zwei-Faktor-Anmeldung einrichten
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Für den Zugang zur Verwaltung brauchst du zusätzlich zum Passwort einen Code aus einer Authenticator-App – zum Beispiel Google Authenticator, Microsoft Authenticator oder die Passwörter-App auf dem iPhone.
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, color: 'var(--bsv-ink-2)' }}>
            <li>App öffnen und „Konto hinzufügen“ bzw. „QR-Code scannen“ wählen.</li>
            <li>Diesen QR-Code scannen.</li>
            <li>Den 6-stelligen Code aus der App unten eingeben.</li>
          </ol>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, padding: 12 }}>
            {einrichtung ? <img src={einrichtung.qr} alt="QR-Code für die Authenticator-App" width={220} height={220} style={{ borderRadius: 12 }} /> : <span className="muted">QR-Code wird erzeugt …</span>}
            {einrichtung && (
              <details style={{ fontSize: 14, color: 'var(--bsv-muted)', textAlign: 'center' }}>
                <summary style={{ cursor: 'pointer' }}>QR-Code lässt sich nicht scannen?</summary>
                <p style={{ margin: '8px 0 0' }}>Schlüssel manuell eingeben:</p>
                <code style={{ display: 'inline-block', marginTop: 4, padding: '6px 10px', background: 'var(--bsv-soft)', borderRadius: 8, fontSize: 15, letterSpacing: '0.04em', color: 'var(--bsv-ink)' }}>{einrichtung.geheimnis}</code>
              </details>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="t-2" style={{ fontSize: 26 }}>
            Bestätige deine Anmeldung
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {modusCode === 'app' ? 'Gib den 6-stelligen Code aus deiner Authenticator-App ein.' : 'Gib einen deiner Wiederherstellungscodes ein (Format ABCD-EFGH).'}
          </p>
        </>
      )}

      <label className="field">
        {modusCode === 'app' ? 'Code aus der App' : 'Wiederherstellungscode'}
        <input
          ref={eingabe}
          value={code}
          onChange={(e) => setCode(modusCode === 'app' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value.toUpperCase().slice(0, 9))}
          inputMode={modusCode === 'app' ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          placeholder={modusCode === 'app' ? '123456' : 'ABCD-EFGH'}
          required
          style={{ fontSize: 26, letterSpacing: '0.3em', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
        />
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={laedt || (modusCode === 'app' ? code.length !== 6 : code.length < 8)} style={{ minHeight: 52 }}>
        {laedt ? 'Prüfe …' : status.eingerichtet ? 'Anmelden' : 'Einrichtung abschließen'}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 15 }}>
        {status.eingerichtet ? (
          <button type="button" onClick={() => (setCode(''), setFehler(null), setModusCode(modusCode === 'app' ? 'wiederherstellung' : 'app'))} style={{ font: 'inherit', background: 'none', border: 0, color: 'var(--bsv-green)', cursor: 'pointer', padding: 0 }}>
            {modusCode === 'app' ? 'Handy nicht dabei?' : 'Code aus der App verwenden'}
          </button>
        ) : (
          <span />
        )}
        <Link href="/mitglieder">Nur Mitgliederbereich</Link>
      </div>
    </form>
  )
}
