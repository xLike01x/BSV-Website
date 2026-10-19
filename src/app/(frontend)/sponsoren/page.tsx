import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Bild } from '@/bsv/components/Bild'
import { T } from '@/bsv/components/Text'
import { getPlatzhalter, getSponsoren, getTexte } from '@/bsv/data'

export const revalidate = 60
export const metadata: Metadata = seite('Sponsoren & Partner', 'Die Sponsoren und Partner des Büdericher Spielvereins 1919 – danke für eure Unterstützung!')

const STUFEN: [string, string][] = [
  ['premium', 'Premium-Partner'],
  ['partner', 'Partner'],
  ['foerderer', 'Förderer & Freunde'],
]

export default async function SponsorenSeite() {
  const [sponsoren, tx, w] = await Promise.all([getSponsoren(), getTexte(), getPlatzhalter()])
  const haupt = sponsoren.find((s) => s.stufe === 'haupt')
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
          {haupt?.name && (
            <div className="sponsor-haupt rv">
              <p className="kicker" style={{ fontSize: 16 }}>
                Hauptsponsor
              </p>
              {(() => {
                const inhalt = haupt.logo && typeof haupt.logo === 'object' ? <Bild media={haupt.logo} size="medium" sizes="320px" alt={haupt.name} /> : <strong>{haupt.name}</strong>
                return haupt.url ? (
                  <a href={haupt.url} target="_blank" rel="noopener noreferrer">
                    {inhalt}
                  </a>
                ) : (
                  inhalt
                )
              })()}
              {haupt.text && <p className="muted" style={{ margin: '12px 0 0' }}>{haupt.text}</p>}
            </div>
          )}
          {STUFEN.map(([key, label]) => {
            const liste = sponsoren.filter((s) => s.id !== haupt?.id && (s.stufe === 'haupt' ? 'premium' : (s.stufe ?? 'partner')) === key)
            if (!liste.length) return null
            return (
              <div key={key} style={{ marginTop: 48 }}>
                <h2 className="t-3" style={{ marginBottom: 16 }}>
                  {label}
                </h2>
                <div className={`sponsor-raster sponsor-raster--${key}`}>
                  {liste.map((s) => {
                    const inhalt = (
                      <>
                        {/* Mit Logo: Logo + Name darunter. Ohne Logo: Name nur einmal, groß */}
                        <span className="sponsor-logo">
                          {s.logo && typeof s.logo === 'object' ? <Bild media={s.logo} size="small" sizes="240px" alt={s.name} /> : <strong>{s.name}</strong>}
                        </span>
                        {s.logo && typeof s.logo === 'object' && <span className="sponsor-name">{s.name}</span>}
                        {s.text && <span className="muted sponsor-text">{s.text}</span>}
                      </>
                    )
                    return s.url ? (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="sponsor-karte rv">
                        {inhalt}
                      </a>
                    ) : (
                      <div key={s.id} className="sponsor-karte rv">
                        {inhalt}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {sponsoren.length === 0 && <p className="muted">Hier stellen wir bald unsere Partner vor.</p>}
          <div className="sponsor-cta rv">
            <div>
              <strong>Sponsor werden</strong>
              <span>Bandenwerbung, Trikots, Turniere oder einfach den Nachwuchs fördern – wir finden das passende Paket.</span>
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
