import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Bild } from '@/bsv/components/Bild'
import { T } from '@/bsv/components/Text'
import { animationAn, getAnimationen, getPlatzhalter, getStartseite, getTexte, getVerein } from '@/bsv/data'
import { WappenGlanz } from '@/bsv/components/wappen/WappenGlanz'
import { abMonat, euroKurz, proMonat } from '@/bsv/beitrag'
import { bildUrl, initialen, zahl } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = seite('Verein', 'Seit 1919 in Büderich: Vorstand, Mitgliedsbeiträge, Satzung und Datenschutz des Büdericher Spielvereins.')

export default async function VereinSeite() {
  const [v, tx, w, start, anim] = await Promise.all([getVerein(), getTexte(), getPlatzhalter(), getStartseite(), getAnimationen()])
  const beitraege = v.beitraege ?? []
  // Günstigster Monatsbeitrag für aktive Mitglieder (passiv zählt nicht – „alle Kurse inklusive“)
  const guenstigster = abMonat(beitraege)

  return (
    <>
      <section className="center" style={{ padding: '120px 22px 90px' }}>
        {animationAn(anim, 'wappenGlanz') && <WappenGlanz bewegt={animationAn(anim, 'alle')} className="in1" />}
        <p className="kicker in1" style={{ color: 'var(--bsv-muted)' }}>
          Über uns
        </p>
        <h1 className="t-page in2" style={{ maxWidth: 980, margin: '0 auto', fontSize: 'clamp(60px, 10vw, 140px)', lineHeight: 0.95, letterSpacing: '-0.05em' }}>
          <T text={tx.verein?.titel} werte={w} />
        </h1>
        <p className="lead in3" style={{ margin: '26px auto 0', maxWidth: 620 }}>
          <T text={tx.verein?.text} werte={w} />
        </p>
        <nav aria-label="Auf dieser Seite" className="in3 chips" style={{ marginTop: 36, justifyContent: 'center' }}>
          {[
            ['#vorstand', 'Vorstand'],
            ['#beitraege', 'Mitgliedsbeiträge'],
            ['#downloads', 'Satzung & Downloads'],
            ['#dsgvo', 'Datenschutz'],
            ['#shop', 'Shop'],
          ].map(([h, l]) => (
            <a key={h} href={h} className="chip" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              {l}
            </a>
          ))}
        </nav>
        {start.startseite?.bildVerein && (
          <div className="in3" style={{ maxWidth: 1100, margin: '48px auto 0', borderRadius: 32, overflow: 'hidden', aspectRatio: '21 / 9' }}>
            <Bild media={start.startseite.bildVerein} size="xlarge" priority sizes="(max-width: 1140px) 100vw, 1100px" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
      </section>

      {(v.vorstand?.length ?? 0) > 0 && (
        <section id="vorstand" className="sec sec-soft" style={{ scrollMarginTop: 56 }}>
          <div className="wrap-narrow" style={{ padding: 0 }}>
            <h2 className="t-sec rv" style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
              Vorstand
            </h2>
            <p className="rv lead" style={{ margin: '8px 0 40px', fontSize: 19 }}>
              <T text={tx.verein?.vorstandText} werte={w} />
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {v.vorstand!.map((b, i) => {
                // Verknüpftes Konto: aktueller Name, Nachricht direkt an die Person, Foto nur mit Haken
                const konto = b.konto && typeof b.konto === 'object' ? b.konto : null
                const name = konto?.name || b.name || ''
                const kontoFoto = konto && b.fotoAusKonto && konto.profilbild && b.id ? `/api/vorstand-foto/${b.id}` : null
                const link = konto && b.id ? `/kontakt?an=${encodeURIComponent(`vorstand-${b.id}`)}` : `/kontakt?thema=${encodeURIComponent(`An: ${b.rolle}`)}`
                return (
                  <div key={b.id ?? i} className="rv" style={{ background: '#fff', borderRadius: 26, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <span className="avatar" style={{ width: 80, height: 80, fontSize: 24, overflow: 'hidden' }}>
                      {b.foto && typeof b.foto === 'object' ? (
                        <Bild media={b.foto} size="small" sizes="80px" alt="" />
                      ) : kontoFoto ? (
                        <img src={kontoFoto} alt="" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initialen(name)
                      )}
                    </span>
                    <span>
                      <strong style={{ display: 'block', fontSize: 20 }}>{name}</strong>
                      <span className="muted">{b.rolle}</span>
                    </span>
                    <Link href={link} className="link-more" style={{ fontSize: 15 }}>
                      Nachricht senden ›
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <section id="beitraege" style={{ padding: '120px 22px', scrollMarginTop: 56 }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          <h2 className="t-sec rv center" style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
            {guenstigster !== null ? `Ab ${euroKurz(guenstigster)} im Monat.` : 'Mitgliedsbeiträge'}
          </h2>
          <p className="rv lead center" style={{ margin: '16px auto 48px', maxWidth: 560, fontSize: 19 }}>
            <T text={tx.verein?.beitraegeText} werte={w} />
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {beitraege.map((b) => {
              const hervor = b.key === 'familie'
              return (
                <div key={b.key} className="rv" style={{ background: hervor ? 'var(--bsv-green)' : 'var(--bsv-soft)', color: hervor ? '#fff' : undefined, borderRadius: 28, padding: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: hervor ? '#D7F0E1' : 'var(--bsv-muted)' }}>{b.label}</span>
                  <span style={{ fontSize: 13, color: hervor ? '#D7F0E1' : 'var(--bsv-muted)' }}>{b.zielgruppe}</span>
                  <strong style={{ fontSize: 52, letterSpacing: '-0.04em', marginTop: 16 }}>{euroKurz(Number(b.quartal))}</strong>
                  <span style={{ color: hervor ? '#D7F0E1' : 'var(--bsv-muted)' }}>
                    pro Quartal · entspricht {euroKurz(proMonat(b.quartal))} im Monat
                  </span>
                </div>
              )
            })}
          </div>
          <div className="rv center" style={{ marginTop: 32 }}>
            <Link href="/mitglied-werden" className="btn btn-primary">
              Jetzt online anmelden
            </Link>
          </div>
        </div>
      </section>

      <section id="downloads" className="sec sec-soft" style={{ scrollMarginTop: 56 }}>
        <div className="wrap-narrow" style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
          <Link href="/mitglied-werden" className="card rv" style={{ padding: 32 }}>
            <span className="card-cat muted">Online statt PDF</span>
            <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>Beitrittserklärung</strong>
            <span className="green">Zum Online-Antrag ›</span>
          </Link>
          {(v.downloads ?? []).map((d, i) => {
            const url = bildUrl(d.datei)
            const href = d.nurMitglieder ? '/mitglieder#downloads' : url
            if (!href) return null
            return (
              <a key={d.id ?? i} href={href} className="card rv" style={{ padding: 32 }} {...(!d.nurMitglieder ? { target: '_blank', rel: 'noopener' } : {})}>
                <span className="card-cat muted">{d.nurMitglieder ? 'Nur für Mitglieder' : d.hinweis || 'PDF'}</span>
                <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{d.titel}</strong>
                <span className="green">{d.nurMitglieder ? 'Im Mitgliederbereich ›' : 'Herunterladen ›'}</span>
              </a>
            )
          })}
          {(v.downloads ?? []).length === 0 && (
            <div className="card rv" style={{ padding: 32 }}>
              <span className="card-cat muted">PDF</span>
              <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>Satzung</strong>
              <span className="muted">Folgt in Kürze</span>
            </div>
          )}
        </div>
      </section>

      {(v.dsgvo?.length ?? 0) > 0 && (
        <section id="dsgvo" style={{ padding: '110px 22px', scrollMarginTop: 56 }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 className="t-sec rv" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: 32 }}>
              Informationspflichten nach DSGVO
            </h2>
            {v.dsgvo!.map((q, i) => (
              <details key={q.id ?? i} className="acc" open={i === 0}>
                <summary>{q.frage}</summary>
                {/* Absätze aus dem Textfeld übernehmen */}
                <p style={{ whiteSpace: 'pre-line' }}>{q.antwort}</p>
              </details>
            ))}
            <p className="muted" style={{ marginTop: 24 }}>
              Ausführliche Informationen in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
            </p>
          </div>
        </section>
      )}

      <section id="shop" className="sec sec-soft" style={{ scrollMarginTop: 56 }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          <h2 className="t-sec rv center" style={{ fontSize: 'clamp(40px, 5vw, 64px)', marginBottom: 32 }}>
            <T text={tx.verein?.shopTitel} werte={w} />
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20 }}>
            <a href="https://team.jako.de/de/team/buederichersv/" target="_blank" rel="noopener noreferrer" className="tile rv" style={{ background: 'var(--bsv-green-tint)', padding: 44, minHeight: 280, justifyContent: 'space-between' }}>
              <span>
                <span className="muted" style={{ fontSize: 15 }}>
                  Teamshop bei JAKO
                </span>
                <strong style={{ display: 'block', fontSize: 36, letterSpacing: '-0.03em', marginTop: 6 }}>Vereinskollektion</strong>
              </span>
              <span className="green">Zum Shop ↗</span>
            </a>
            <a href="https://buedericher-spielverein.fan12.de" target="_blank" rel="noopener noreferrer" className="tile rv" style={{ background: '#fff', padding: 44, minHeight: 280, justifyContent: 'space-between' }}>
              <span>
                <span className="muted" style={{ fontSize: 15 }}>
                  Fanartikel bei fan12
                </span>
                <strong style={{ display: 'block', fontSize: 36, letterSpacing: '-0.03em', marginTop: 6 }}>Merch</strong>
              </span>
              <span className="green">Zum Shop ↗</span>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
