import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = { title: 'Seite nicht gefunden' }

export default function NotFound() {
  return (
    <section className="wrap-narrow" style={{ paddingTop: 96, paddingBottom: 120, textAlign: 'center' }}>
      {/* Strich-Tor, der Ball fliegt knapp daneben (ausschaltbar unter Texte & Bilder → Animationen) */}
      <div className="daneben" aria-hidden="true">
        <svg className="daneben-tor" viewBox="0 0 320 170" focusable="false">
          <path d="M8 160 H312" className="daneben-boden" />
          <path d="M196 160 V58 H300 V160" />
          <path d="M206 68 L292 68 M196 58 L206 68 M300 58 L292 68 M206 68 V160 M292 68 V160" className="daneben-netz" />
          <path d="M218 68 V160 M232 68 V160 M246 68 V160 M260 68 V160 M274 68 V160 M206 90 H292 M206 112 H292 M206 136 H292" className="daneben-netz" />
        </svg>
        {/* Außen: Flugbahn, innen: Drehung (getrennt, sonst würde die Drehung die Flugbahn mitdrehen) */}
        <span className="daneben-ball">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="10.5" />
            <path d="M12 7.6l3.6 2.6-1.4 4.2H9.8L8.4 10.2z" className="daneben-fleck" />
            <path d="M12 7.6V1.6M15.6 10.2l5.6-1.8M14.2 14.4l3.4 4.8M9.8 14.4l-3.4 4.8M8.4 10.2L2.8 8.4" />
          </svg>
        </span>
      </div>
      <p className="kicker" style={{ fontSize: 18 }}>
        Fehler 404
      </p>
      <h1 className="t-page" style={{ fontSize: 'clamp(40px, 6vw, 68px)' }}>
        Daneben!
      </h1>
      <p className="lead muted" style={{ maxWidth: 520, margin: '12px auto 32px' }}>
        Diese Seite gibt es nicht (mehr). Vielleicht hilft dir einer dieser Wege weiter:
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn btn-primary" href="/">
          Zur Startseite
        </Link>
        <Link className="btn btn-ghost" href="/suche">
          Suchen
        </Link>
        <Link className="btn btn-ghost" href="/trainingszeiten">
          Trainingszeiten
        </Link>
        <Link className="btn btn-ghost" href="/kontakt">
          Kontakt
        </Link>
      </div>
    </section>
  )
}
