import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { SponsorLogo } from '@/bsv/components/SponsorLogo'
import { T } from '@/bsv/components/Text'
import { getPlatzhalter, getSponsoren, getTexte } from '@/bsv/data'

export const revalidate = 60
export const metadata: Metadata = seite(
  'Sponsoren & Partner',
  'Die Sponsoren und Partner des Büdericher Spielvereins 1919 – danke für eure Unterstützung!',
)

const STUFE: Record<string, { label: string; farbe: string; rang: number }> = {
  premium: { label: 'Premium-Partner', farbe: '#b8860b', rang: 1 },
  partner: { label: 'Partner', farbe: 'var(--bsv-green)', rang: 2 },
  foerderer: { label: 'Förderer & Freunde', farbe: '#2f6fb3', rang: 3 },
}

const initialen = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÄÖÜäöü]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

export default async function SponsorenSeite() {
  const [sponsoren, tx, w] = await Promise.all([getSponsoren(), getTexte(), getPlatzhalter()])
  const haupts = sponsoren.filter((s) => s.stufe === 'haupt')
  // Darunter alle anderen: erst Premium, dann Partner, dann Förderer – innerhalb nach „Reihenfolge“
  const weitere = sponsoren
    .filter((s) => s.stufe !== 'haupt')
    .map((s, i) => ({
      s,
      i,
      rang: STUFE[s.stufe === 'haupt' ? 'premium' : (s.stufe ?? 'partner')]?.rang ?? 2,
    }))
    .sort((a, b) => a.rang - b.rang || a.i - b.i)
    .map((x) => x.s)
  return (
    <>
      <section className="wrap-narrow center" style={{ paddingTop: 88, paddingBottom: 40 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
          <T text={tx.sponsoren?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '16px auto 0', maxWidth: 680 }}>
          <T text={tx.sponsoren?.text} werte={w} />
        </p>
      </section>
      <section className="sec-soft" style={{ padding: '56px 22px 100px' }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          {haupts.length > 0 && (
            <div
              className={`sponsor-haupt-reihe${haupts.length > 1 ? ' sponsor-haupt-reihe--mehrere' : ''}`}
            >
              {haupts.map((haupt) => (
                <div key={haupt.id} className="sponsor-haupt rv">
                  <p className="kicker" style={{ fontSize: 16 }}>
                    Hauptsponsor
                  </p>
                  {(() => {
                    const inhalt = (
                      <SponsorLogo logo={haupt.logo} name={haupt.name} stufe="haupt" sofort />
                    )
                    const zeigen =
                      haupt.logo && typeof haupt.logo === 'object' ? (
                        inhalt
                      ) : (
                        <strong style={{ fontSize: 28 }}>{haupt.name}</strong>
                      )
                    return haupt.url ? (
                      <a
                        href={haupt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sponsor-haupt-link"
                      >
                        {zeigen}
                      </a>
                    ) : (
                      zeigen
                    )
                  })()}
                  {haupt.logo && typeof haupt.logo === 'object' ? (
                    <p className="sponsor-haupt-name">{haupt.name}</p>
                  ) : null}
                  {haupt.text && (
                    <p className="muted" style={{ margin: '8px 0 0' }}>
                      {haupt.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {weitere.length > 0 && (
            <div className="grid-cards" style={{ marginTop: 40 }}>
              {weitere.map((s) => {
                const stufe = s.stufe === 'haupt' ? 'premium' : (s.stufe ?? 'partner')
                const inhalt = (
                  <>
                    <span className="card-img sponsor-bild">
                      {s.logo && typeof s.logo === 'object' ? (
                        <SponsorLogo logo={s.logo} name={s.name} stufe="karte" />
                      ) : (
                        <span className="sponsor-initialen" aria-hidden="true">
                          {initialen(s.name)}
                        </span>
                      )}
                    </span>
                    <span className="card-body">
                      <span className="card-cat" style={{ color: STUFE[stufe]?.farbe }}>
                        {STUFE[stufe]?.label ?? 'Partner'}
                      </span>
                      <strong className="card-title">{s.name}</strong>
                      {s.text && <span className="card-meta">{s.text}</span>}
                      {s.url && <span className="card-cta">Zur Website ›</span>}
                    </span>
                  </>
                )
                return s.url ? (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card rv"
                  >
                    {inhalt}
                  </a>
                ) : (
                  <div key={s.id} className="card rv">
                    {inhalt}
                  </div>
                )
              })}
            </div>
          )}
          {sponsoren.length === 0 && (
            <p className="muted">Hier stellen wir bald unsere Partner vor.</p>
          )}
          <div className="sponsor-cta rv">
            <div>
              <strong>Sponsor werden</strong>
              <span>
                Bandenwerbung, Trikots, Turniere oder einfach den Nachwuchs fördern – wir finden das
                passende Paket.
              </span>
            </div>
            <Link href="/kontakt?thema=Sponsoring" className="btn btn-primary">
              Jetzt anfragen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
