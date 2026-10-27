import Link from 'next/link'
import React from 'react'

import { animationAn, getAnimationen, getHauptsponsoren, getMenue, getTexte, getVerein } from '@/bsv/data'

import { zuLinks, type MenueEintrag } from './menueLinks'
import { SponsorLogo } from './SponsorLogo'
import { WebApp } from './WebApp'

export async function Footer() {
  const [v, hauptsponsoren, menue, tx, anim] = await Promise.all([getVerein(), getHauptsponsoren(), getMenue(), getTexte(), getAnimationen()])
  const spalten = ((menue?.fusszeile ?? []) as { titel?: string | null; eintraege?: MenueEintrag[] | null }[]).map((sp) => ({ titel: sp.titel ?? '', links: zuLinks(sp.eintraege) }))
  const kontakt = (menue as { kontakt?: { anzeigen?: boolean | null; titel?: string | null; adresseZeigen?: boolean | null; links?: MenueEintrag[] | null } } | null)?.kontakt
  const kontaktLinks = zuLinks(kontakt?.links)
  // Für die Fußzeile: eigenes kompaktes Logo, sonst das normale
  const fussLogo = (s: { logo?: unknown; logoFusszeile?: unknown }) => [s.logoFusszeile, s.logo].find((l) => l && typeof l === 'object') ?? null

  return (
    <footer className="foot">
      {/* Großes Wappen als Wasserzeichen – Website-Aufbau → Animationen → Vereinswappen */}
      {animationAn(anim, 'wappenFusszeile') && <span className="foot-wappen" aria-hidden="true" />}
      <div className="foot-inner">
        <div className="foot-top">
          <img src="/bsv-logo.png" alt="BSV 1919 e.V." width={38} height={41} style={{ objectFit: 'contain' }} />
          {hauptsponsoren.length > 0 && <span>{tx.fusszeile?.sponsor}</span>}
          {hauptsponsoren.map((sponsor) => {
            const logo = fussLogo(sponsor)
            const inhalt = logo ? <SponsorLogo logo={logo} name={sponsor.name} stufe="fuss" /> : sponsor.name
            const stil = { display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--bsv-ink)' }
            return sponsor.url ? (
              <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer" style={stil}>
                {inhalt}
              </a>
            ) : (
              <span key={sponsor.id} style={stil}>
                {inhalt}
              </span>
            )
          })}
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
          <WebApp art="fuss" texte={tx.webApp} />
          <span style={{ display: 'block', marginTop: 4 }}>Konzept, Design und Umsetzung der Website © {new Date().getFullYear()} <a href="mailto:kontakt.thomas.wilms@gmail.com" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Thomas Wilms</a></span>
        </p>
      </div>
    </footer>
  )
}
