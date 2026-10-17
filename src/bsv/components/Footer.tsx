import Link from 'next/link'
import React from 'react'

import { getVerein } from '@/bsv/data'
import { bildUrl } from '@/bsv/lib'

export async function Footer() {
  const v = await getVerein()
  const sponsor = v.hauptsponsor
  const logo = bildUrl(sponsor?.logo, 'small')

  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-top">
          <img src="/bsv-logo.png" alt="BSV 1919 e.V." width={38} height={41} style={{ objectFit: 'contain' }} />
          <span>Hauptsponsor</span>
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
            Sponsor werden ›
          </Link>
        </div>
        <div className="foot-cols">
          <div>
            <strong>Fußball</strong>
            <Link href="/fussball#junioren">Junioren</Link>
            <Link href="/fussball#juniorinnen">Juniorinnen</Link>
            <Link href="/fussball#senioren">Senioren</Link>
            <Link href="/fussball#seniorinnen">Damen</Link>
          </div>
          <div>
            <strong>Breitensport</strong>
            <Link href="/breitensport#kids">BSV Kids</Link>
            <Link href="/breitensport#erwachsene">Erwachsene &amp; Senioren</Link>
            <Link href="/termine">Termine</Link>
          </div>
          <div>
            <strong>Verein</strong>
            <Link href="/verein#vorstand">Vorstand</Link>
            <Link href="/verein#downloads">Satzung</Link>
            <Link href="/verein#beitraege">Mitgliedsbeiträge</Link>
            <Link href="/mitglied-werden">Mitglied werden</Link>
          </div>
          <div>
            <strong>Entdecken</strong>
            <Link href="/news">News</Link>
            <Link href="/kunstrasen">Kunstrasen 2026</Link>
            <a href="https://team.jako.de/de/team/buederichersv/" target="_blank" rel="noopener noreferrer">
              Vereinskollektion ↗
            </a>
            <a href="https://buedericher-spielverein.fan12.de" target="_blank" rel="noopener noreferrer">
              Merch-Shop ↗
            </a>
          </div>
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
