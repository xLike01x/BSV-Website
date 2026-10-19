'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type Ausweis = {
  id: number
  name: string
  nummer: string | null
  seit: string | null
  art: string
  kurse: string[]
  gueltig: boolean
  qr: string
}

/** Ein digitaler Mitgliedsausweis – mit laufender Uhr und schimmerndem Streifen (zeigt: live, kein Screenshot) */
function Karte({
  a,
  gross = false,
  onGross,
}: {
  a: Ausweis
  gross?: boolean
  onGross?: () => void
}) {
  const [jetzt, setJetzt] = useState<Date | null>(null)
  useEffect(() => {
    setJetzt(new Date())
    const t = setInterval(() => setJetzt(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div
      className={`ausweis${a.gueltig ? '' : ' ausweis--ungueltig'}${gross ? ' ausweis--gross' : ''}`}
    >
      <div className="ausweis-schimmer" aria-hidden="true" />
      <div className="ausweis-kopf">
        <img src="/bsv-logo.png" alt="" width={34} height={37} />
        <span>
          <strong>Büdericher SV 1919</strong>
          <small>Mitgliedsausweis</small>
        </span>
        <span className={`ausweis-status${a.gueltig ? '' : ' ist-ungueltig'}`}>
          {a.gueltig ? '✓ gültig' : 'nicht gültig'}
        </span>
      </div>
      <div className="ausweis-mitte">
        <div className="ausweis-daten">
          <span className="ausweis-name">{a.name}</span>
          <dl>
            <div>
              <dt>Mitgliedsnummer</dt>
              <dd>{a.nummer || '–'}</dd>
            </div>
            <div>
              <dt>Mitglied seit</dt>
              <dd>{a.seit || '–'}</dd>
            </div>
            <div>
              <dt>Mitgliedschaft</dt>
              <dd>{a.art}</dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          className="ausweis-qr"
          onClick={onGross}
          aria-label="Ausweis groß anzeigen"
          disabled={!onGross}
        >
          <img src={a.qr} alt="QR-Code zur Prüfung der Mitgliedschaft" />
        </button>
      </div>
      {a.kurse.length > 0 && (
        <div className="ausweis-kurse">
          {a.kurse.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
      )}
      <div className="ausweis-fuss">
        <span>
          {jetzt
            ? jetzt.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'medium' })
            : ' '}
        </span>
        <span>Vorzeigen genügt · QR-Code prüft live</span>
      </div>
    </div>
  )
}

/** Alle Ausweise eines Kontos (z. B. Eltern + Kinder); Klick auf den QR-Code zeigt den Ausweis groß */
export function AusweisKarten({ ausweise }: { ausweise: Ausweis[] }) {
  const [gross, setGross] = useState<Ausweis | null>(null)
  useEffect(() => {
    if (!gross) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setGross(null)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [gross])
  return (
    <>
      <div className="ausweis-liste">
        {ausweise.map((a) => (
          <Karte key={a.id} a={a} onGross={() => setGross(a)} />
        ))}
      </div>
      {gross &&
        createPortal(
          <div
            className="ausweis-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Mitgliedsausweis"
            onClick={() => setGross(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <Karte a={gross} gross />
              <button
                type="button"
                className="btn"
                onClick={() => setGross(null)}
                style={{ marginTop: 16, background: '#fff' }}
              >
                Schließen
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
