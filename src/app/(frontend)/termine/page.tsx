import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Teilen } from '@/bsv/components/Teilen'
import { JsonLd } from '@/bsv/components/JsonLd'
import { absolut } from '@/bsv/seo'
import { T } from '@/bsv/components/Text'
import { googleKalender } from '@/bsv/ical'
import { getServerSideURL } from '@/utilities/getURL'
import { aktuellerBenutzer, getPlatzhalter, getTermine, getTexte } from '@/bsv/data'
import { terminSchluessel } from '@/bsv/wiederholung'
import { datum, uhrzeit } from '@/bsv/lib'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = seite('Termine', 'Vereinstermine, Turniere und Veranstaltungen des Büdericher Spielvereins.')

const BEREICH: Record<string, [string, string, string]> = {
  verein: ['Verein', '#1D4ED8', '#EAF1FF'],
  fussball: ['Fußball', '#157A43', '#E8F6EE'],
  kids: ['BSV Kids', '#C2410C', '#FFEDE7'],
  erwachsene: ['Breitensport', '#7C3AED', '#F3EEFF'],
}

export default async function TerminSeite() {
  const [termine, user, tx, w] = await Promise.all([getTermine(100), aktuellerBenutzer(), getTexte(), getPlatzhalter()])

  // Nach Monat gruppieren
  const monate = new Map<string, typeof termine>()
  for (const t of termine) {
    const m = datum(t.beginn, { month: 'long', year: 'numeric' })
    monate.set(m, [...(monate.get(m) ?? []), t])
  }

  const ereignisse = termine
    .filter((t) => !t.nurMitglieder)
    .map((t) => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: t.title,
      startDate: t.beginn,
      endDate: t.ende ?? undefined,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: t.ort || 'Kutscher-Remy-Sportpark', address: t.ort || 'Schützenstraße 25a, 46487 Wesel' },
      description: t.beschreibung ?? undefined,
      organizer: { '@type': 'SportsOrganization', name: 'Büdericher Spielverein 1919 e.V.', url: absolut('/') },
      url: absolut(`/termine#termin-${terminSchluessel(t)}`),
    }))

  return (
    <>
      {ereignisse.length > 0 && <JsonLd daten={ereignisse} />}
      <section className="wrap-narrow" style={{ paddingTop: 80, paddingBottom: 40 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 1 }}>
          <T text={tx.termine?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '14px 0 0' }}>
          <T text={tx.termine?.text} werte={w} />
          {!user && ' Mitglieder sehen nach dem Login weitere Termine.'}
        </p>
      </section>

      <section className="wrap-narrow" style={{ paddingBottom: 110 }}>
        {termine.length > 0 && (
          <div className="kalender-abo">
            <p>
              <strong>Alle Termine automatisch im eigenen Kalender</strong>
              <br />
              <span className="muted">Einmal abonnieren – neue Termine erscheinen von selbst auf Handy, Outlook oder Google.</span>
            </p>
            <a className="btn btn-primary" href={`webcal://${getServerSideURL().replace(/^https?:\/\//, '')}/termine/kalender.ics`}>
              📅 Kalender abonnieren
            </a>
            <a className="termin-link" href="/termine/kalender.ics" download>
              Als Datei
            </a>
          </div>
        )}
        {termine.length === 0 && (
          <div className="info" style={{ padding: 40, textAlign: 'center' }}>
            <p className="info-value" style={{ marginTop: 0 }}>
              Gerade stehen keine Termine an.
            </p>
            <p className="info-sub">
              Neues erfährst du in den <Link href="/news">News</Link> und auf Instagram.
            </p>
          </div>
        )}
        {Array.from(monate.entries()).map(([monat, liste]) => (
          <div key={monat} style={{ marginBottom: 48 }}>
            <h2 className="t-3" style={{ marginBottom: 16 }}>
              {monat}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {liste.map((t) => {
                const [label, tint, bg] = BEREICH[t.bereich ?? 'verein'] ?? BEREICH.verein!
                return (
                  <div key={terminSchluessel(t)} id={`termin-${terminSchluessel(t)}`} className="info rv" style={{ scrollMarginTop: 90, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', background: '#fff', border: '1px solid var(--bsv-line-2)' }}>
                    <div style={{ width: 76, textAlign: 'center', background: bg, borderRadius: 18, padding: '10px 0', flex: '0 0 auto' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tint }}>{datum(t.beginn, { weekday: 'short' })}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{datum(t.beginn, { day: 'numeric' })}</div>
                    </div>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: tint }}>
                        {label}
                        {t.nurMitglieder ? ' · nur für Mitglieder' : ''}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}>{t.title}</p>
                      <p className="muted" style={{ margin: '2px 0 0' }}>
                        {uhrzeit(t.beginn)} Uhr{t.ende ? ` – ${uhrzeit(t.ende)} Uhr` : ''}
                        {t.ort ? ` · ${t.ort}` : ''}
                      </p>
                      {t.beschreibung && <p style={{ margin: '8px 0 0', color: 'var(--bsv-ink-2)', whiteSpace: 'pre-line' }}>{t.beschreibung}</p>}
                      {t.anmeldung && (!t.wiederholung || t.wiederholung === 'keine') && (
                        <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
                          <Link href="/mitglieder#zusagen" className="link-more">
                            Zu- oder Absage für Mitglieder{t.anmeldeschluss ? ` bis ${datum(t.anmeldeschluss, { day: 'numeric', month: 'long' })}` : ''}: im Mitgliederbereich ›
                          </Link>
                        </p>
                      )}
                      {!t.nurMitglieder && (
                        <div className="termin-aktionen">
                          <a className="termin-link" href={`/termine/kalender.ics?id=${t.id}`} download>
                            📅 In meinen Kalender
                          </a>
                          <a className="termin-link" href={googleKalender(t)} target="_blank" rel="noopener noreferrer">
                            Google Kalender
                          </a>
                          <Teilen klein titel={t.title} pfad={`/termine#termin-${terminSchluessel(t)}`} text={`${t.title} – ${datum(t.beginn, { weekday: 'long', day: 'numeric', month: 'long' })}, ${uhrzeit(t.beginn)} Uhr`} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
