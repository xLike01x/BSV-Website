import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = { title: 'Seite nicht gefunden' }

export default function NotFound() {
  return (
    <section className="wrap-narrow" style={{ paddingTop: 96, paddingBottom: 120, textAlign: 'center' }}>
      <p className="kicker" style={{ fontSize: 18 }}>
        Fehler 404
      </p>
      <h1 className="t-page" style={{ fontSize: 'clamp(40px, 6vw, 68px)' }}>
        Abseits!
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
