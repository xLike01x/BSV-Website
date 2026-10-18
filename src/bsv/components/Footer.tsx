import Link from 'next/link'
import React from 'react'

import { getMenue, getTexte, getVerein } from '@/bsv/data'
import { bildUrl } from '@/bsv/lib'

import { zuLinks, type MenueEintrag } from './menueLinks'

export async function Footer() {
  const [v, menue, tx] = await Promise.all([getVerein(), getMenue(), getTexte()])
  const spalten = ((menue?.fusszeile ?? []) as { titel?: string | null; eintraege?: MenueEintrag[] | null }[]).map((sp) => ({ titel: sp.titel ?? '', links: zuLinks(sp.eintraege) }))
  const sponsor = v.hauptsponsor
  const logo = bildUrl(sponsor?.logo, 'small')

  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-top">
          <img src="/bsv-logo.png" alt="BSV 1919 e.V." width={38} height={41} style={{ objectFit: 'contain' }} />
          <span>{tx.fusszeile?.sponsor}</span>
          {sponsor?.name && (
            <a
              href={sponsor.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--bsv-ink)' }}
            >
              {logo ? <img src={logo} alt={sponsor.name} style={{ height: 32, width: 'auto' }} /> : sponsor.name}
            </a>
          )}
          <Link href="/kontakt?thema=Sponsoring" style={{ color: 'var(--bsv-green)', marginLeft: 'auto' }}>
            {tx.fusszeile?.sponsorLink}
          </Link>
        </div>
        <div className="foot-cols">
          {spalten.map((sp, i) => (
            <div key={sp.titel + i}>
              <strong>{sp.titel}</strong>
              {sp.links.map((l) =>
                l.external ? (
                  <a key={l.href + l.label} href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href + l.label} href={l.href}>
                    {l.label}
                  </Link>
                ),
              )}
            </div>
          ))}
          <div>
            <strong>Kontakt</strong>
            <span style={{ display: 'block', whiteSpace: 'pre-line' }}>{v.sportpark}</span>
            {v.social?.instagram && (
              <a href={v.social.instagram} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6 }}>
                Instagram ↗
              </a>
            )}
            {v.social?.facebook && (
              <a href={v.social.facebook} target="_blank" rel="noopener noreferrer">
                Facebook ↗
              </a>
            )}
          </div>
        </div>
        <p className="foot-bottom">
          © {v.name} · Postanschrift: {(v.postanschrift ?? '').replace(/\n/g, ', ')} · <Link href="/kontakt">Kontakt</Link> ·{' '}
          <Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link>
          <span style={{ display: 'block', marginTop: 4 }}>Konzept, Design und Umsetzung der Website © {new Date().getFullYear()} Thomas Wilms</span>
        </p>
      </div>
    </footer>
  )
}
