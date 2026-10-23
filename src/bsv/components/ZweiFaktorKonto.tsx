'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type Status = { angemeldet: boolean; eingerichtet?: boolean; freiwillig?: boolean; abgeschaltet?: boolean }

const post = async (pfad: string, body?: unknown) => {
  const res = await fetch(`/api/users/zwei-faktor/${pfad}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, data }
}

const linkKnopf: React.CSSProperties = { font: 'inherit', background: 'none', border: 0, color: 'var(--bsv-green)', cursor: 'pointer', padding: 0 }

/**
 * „Mein Konto“ im Mitgliederbereich: Zwei-Faktor-Anmeldung – für Mitglieder freiwillig ein- und ausschaltbar,
 * für Verwaltungszugänge nur als Hinweis (dort Pflicht).
 */
export function ZweiFaktorKonto() {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const [schritt, setSchritt] = useState<'ruhe' | 'passwort' | 'scannen' | 'codes' | 'aus'>('ruhe')
  const [einrichtung, setEinrichtung] = useState<{ qr: string; geheimnis: string } | null>(null)
  const [codes, setCodes] = useState<string[]>([])
  const [passwort, setPasswort] = useState('')
  const [code, setCode] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)

  const laden = () =>
    fetch('/api/users/zwei-faktor/status', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
  useEffect(() => {
    laden()
  }, [])

  const zurueck = () => {
    setSchritt('ruhe')
    setPasswort('')
    setCode('')
    setFehler(null)
    setEinrichtung(null)
  }

  if (!status?.angemeldet) return null

  if (!status.freiwillig) {
    return (
      <p className="muted" style={{ fontSize: 15, margin: '14px 0 0' }}>
        🔐 Zwei-Faktor-Anmeldung: {status.abgeschaltet ? 'auf diesem Rechner abgeschaltet (Testkonto)' : 'eingeschaltet – für deinen Zugang zur Verwaltung Pflicht.'}
      </p>
    )
  }

  async function einschalten(e: React.FormEvent) {
    e.preventDefault()
    setFehler(null)
    setLaedt(true)
    const { ok, data } = await post('einrichten', { passwort })
    setLaedt(false)
    if (!ok) return setFehler(String(data.fehler ?? 'Das hat nicht geklappt.'))
    setPasswort('')
    setEinrichtung(data as { qr: string; geheimnis: string })
    setSchritt('scannen')
  }

  async function bestaetigen(e: React.FormEvent) {
    e.preventDefault()
    setFehler(null)
    setLaedt(true)
    const { ok, data } = await post('bestaetigen', { code })
    setLaedt(false)
    setCode('')
    if (!ok) return setFehler(String(data.fehler ?? 'Der Code stimmt nicht.'))
    setCodes((data.wiederherstellungscodes as string[]) ?? [])
    setSchritt('codes')
  }

  async function ausschalten(e: React.FormEvent) {
    e.preventDefault()
    setFehler(null)
    setLaedt(true)
    const { ok, data } = await post('ausschalten', { passwort, code })
    setLaedt(false)
    if (!ok) return setFehler(String(data.fehler ?? 'Das hat nicht geklappt.'))
    zurueck()
    await laden()
    router.refresh()
  }

  const fehlerZeile = fehler && (
    <p className="form-error" role="alert" style={{ margin: 0 }}>
      {fehler}
    </p>
  )
  const codeFeld = (beschriftung: string, erlaubeWiederherstellung = false) => (
    <label className="field">
      {beschriftung}
      <input
        value={code}
        onChange={(e) => setCode(erlaubeWiederherstellung ? e.target.value.toUpperCase().slice(0, 9) : e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode={erlaubeWiederherstellung ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        placeholder={erlaubeWiederherstellung ? '123456 oder ABCD-EFGH' : '123456'}
        required
        style={{ fontSize: 22, letterSpacing: '0.2em', textAlign: 'center', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
      />
    </label>
  )

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--bsv-line)' }}>
      <h3 style={{ fontSize: 17, margin: '0 0 6px' }}>🔐 Zwei-Faktor-Anmeldung</h3>

      {schritt === 'ruhe' &&
        (status.eingerichtet ? (
          <>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              <strong>Eingeschaltet.</strong> Beim Anmelden fragen wir zusätzlich nach dem Code aus deiner App.
            </p>
            <button type="button" style={{ ...linkKnopf, marginTop: 8 }} onClick={() => setSchritt('aus')}>
              Ausschalten …
            </button>
          </>
        ) : (
          <>
            <p className="muted" style={{ margin: 0, lineHeight: 1.5, fontSize: 15 }}>
              Freiwillig: Zusätzlich zum Passwort ein Code aus einer Handy-App (z. B. Google Authenticator, Microsoft Authenticator oder die Passwörter-App auf dem iPhone). Dann kommt niemand mit deinem Passwort allein in dein Konto.
            </p>
            <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setSchritt('passwort')}>
              Einschalten
            </button>
          </>
        ))}

      {schritt === 'passwort' && (
        <form method="post" onSubmit={einschalten} style={{ display: 'grid', gap: 10 }}>
          <label className="field">
            Zur Sicherheit: dein Passwort
            <input type="password" value={passwort} onChange={(e) => setPasswort(e.target.value)} autoComplete="current-password" required autoFocus />
          </label>
          {fehlerZeile}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={laedt || !passwort}>
              {laedt ? 'Bitte warten …' : 'Weiter'}
            </button>
            <button type="button" style={linkKnopf} onClick={zurueck}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {schritt === 'scannen' && einrichtung && (
        <form method="post" onSubmit={bestaetigen} style={{ display: 'grid', gap: 10 }}>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, fontSize: 15 }}>
            <li>In der App „Konto hinzufügen“ bzw. „QR-Code scannen“ wählen.</li>
            <li>Diesen QR-Code scannen.</li>
            <li>Den 6-stelligen Code aus der App eingeben.</li>
          </ol>
          <div style={{ display: 'grid', placeItems: 'center', gap: 6 }}>
            <img src={einrichtung.qr} alt="QR-Code für die Authenticator-App" width={200} height={200} style={{ borderRadius: 12 }} />
            <details style={{ fontSize: 14, color: 'var(--bsv-muted)', textAlign: 'center' }}>
              <summary style={{ cursor: 'pointer' }}>QR-Code lässt sich nicht scannen?</summary>
              <code style={{ display: 'inline-block', marginTop: 6, padding: '6px 10px', background: 'var(--bsv-soft)', borderRadius: 8, fontSize: 14, color: 'var(--bsv-ink)' }}>{einrichtung.geheimnis}</code>
            </details>
          </div>
          {codeFeld('Code aus der App')}
          {fehlerZeile}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={laedt || code.length !== 6}>
              {laedt ? 'Prüfe …' : 'Einschalten'}
            </button>
            <button type="button" style={linkKnopf} onClick={zurueck}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {schritt === 'codes' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ margin: 0 }}>
            <strong>Eingeschaltet ✓</strong> Bewahre diese Wiederherstellungscodes sicher auf – falls dein Handy verloren geht, meldest du dich damit an. Jeder Code geht nur einmal, und sie werden nur jetzt angezeigt.
          </p>
          <ol style={{ margin: 0, padding: 14, background: 'var(--bsv-soft)', borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 15, listStyle: 'none' }}>
            {codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(codes.join('\n')).catch(() => null)}>
              Codes kopieren
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                setCodes([])
                zurueck()
                await laden()
              }}
            >
              Ich habe die Codes gesichert
            </button>
          </div>
        </div>
      )}

      {schritt === 'aus' && (
        <form method="post" onSubmit={ausschalten} style={{ display: 'grid', gap: 10 }}>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            Zum Ausschalten brauchst du dein Passwort und einen Code aus der App (oder einen Wiederherstellungscode).
          </p>
          <label className="field">
            Passwort
            <input type="password" value={passwort} onChange={(e) => setPasswort(e.target.value)} autoComplete="current-password" required autoFocus />
          </label>
          {codeFeld('Code aus der App oder Wiederherstellungscode', true)}
          {fehlerZeile}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={laedt || !passwort || code.length < 6}>
              {laedt ? 'Bitte warten …' : 'Ausschalten'}
            </button>
            <button type="button" style={linkKnopf} onClick={zurueck}>
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
