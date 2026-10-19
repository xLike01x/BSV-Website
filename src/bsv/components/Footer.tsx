import Link from 'next/link'
import React from 'react'

import { getHauptsponsor, getMenue, getTexte, getVerein } from '@/bsv/data'

import { zuLinks, type MenueEintrag } from './menueLinks'
import { SponsorLogo } from './SponsorLogo'

export async function Footer() {
  const [v, sponsor, menue, tx] = await Promise.all([getVerein(), getHauptsponsor(), getMenue(), getTexte()])
  const spalten = ((menue?.fusszeile ?? []) as { titel?: string | null; eintraege?: MenueEintrag[] | null }[]).map((sp) => ({ titel: sp.titel ?? '', links: zuLinks(sp.eintraege) }))
  const kontakt = (menue as { kontakt?: { anzeigen?: boolean | null; titel?: string | null; adresseZeigen?: boolean | null; links?: MenueEintrag[] | null } } | null)?.kontakt
  const kontaktLinks = zuLinks(kontakt?.links)
  const logo = sponsor?.logo && typeof sponsor.logo === 'object' ? sponsor.logo : null

  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-top">
          <img src="/bsv-logo.png" alt="BSV 1919 e.V." width={38} height={41} style={{ objectFit: 'contain' }} />
          {sponsor?.name && <span>{tx.fusszeile?.sponsor}</span>}
          {sponsor?.name &&
            (sponsor.url ? (
              <a href={sponsor.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--bsv-ink)' }}>
                {logo ? <SponsorLogo logo={logo} name={sponsor.name} stufe="fuss" /> : sponsor.name}
              </a>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--bsv-ink)' }}>
                {logo ? <SponsorLogo logo={logo} name={sponsor.name} stufe="fuss" /> : sponsor.name}
              </span>
            ))}
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
          {kontakt?.anzeigen !== false && (
            <div>
              <strong>{kontakt?.titel || 'Kontakt'}</strong>
              {kontakt?.adresseZeigen !== false && v.sportpark && <span style={{ display: 'block', whiteSpace: 'pre-line', marginBottom: 6 }}>{v.sportpark}</span>}
              {kontaktLinks.map((l) =>
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
          )}
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
