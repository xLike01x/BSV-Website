import { SponsorenLaufband } from '@/bsv/components/SponsorenLaufband'
import { JsonLd } from '@/bsv/components/JsonLd'
import { absolut } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Karussell } from '@/bsv/components/Karussell'
import { Bild } from '@/bsv/components/Bild'
import { AgeFinder, type Vorschlag } from '@/bsv/components/home/AgeFinder'
import { CountUp } from '@/bsv/components/home/CountUp'
import { OfferFinder, type FinderItem } from '@/bsv/components/OfferFinder'
import { T } from '@/bsv/components/Text'
import { getAngebote, getNews, getPlatzhalter, getTexte, getVerein } from '@/bsv/data'
import { bildUrl, datum, farbe } from '@/bsv/lib'

export const revalidate = 60

export default async function Startseite() {
  const [verein, angebote, news, tx, w] = await Promise.all([getVerein(), getAngebote(), getNews(6), getTexte(), getPlatzhalter()])
  /** Erste Zeile normal, weitere Zeilen grün hervorgehoben */
  const zweifarbig = (text?: string | null) => {
    const [erste, ...rest] = (text ?? '').split('\n')
    return (
      <>
        <T text={erste} werte={w} />
        {rest.length > 0 && (
          <>
            <br />
            <span className="green">
              <T text={rest.join('\n')} werte={w} />
            </span>
          </>
        )}
      </>
    )
  }
  const s = verein.startseite
  const hero = (s?.heroBilder ?? []).filter((b) => typeof b === 'object')

  const finder: FinderItem[] = angebote.map((a) => {
    const [tint, tintBg] = farbe(a.kategorie)
    return {
      id: a.id,
      name: a.title,
      href: `/angebote/${a.slug}`,
      kategorie: a.kategorie ?? '',
      alter: a.alterText ?? '',
      von: a.alterVon ?? 0,
      bis: a.alterBis ?? 99,
      img: bildUrl(a.bild, 'small'),
      tint,
      tintBg,
    }
  })
  // Für die Übersicht abwechselnd Kids, Erwachsene und Fußball zeigen
  const nachBereich = ['kids', 'erwachsene', 'fussball'].map((b) => finder.filter((f) => angebote.find((a) => a.id === f.id)?.bereich === b))
  const gemischt: FinderItem[] = []
  for (let i = 0; nachBereich.some((l) => l[i]); i++) nachBereich.forEach((l) => l[i] && gemischt.push(l[i]!))

  const vorschlaege: Vorschlag[] = finder.map((f) => ({ name: f.name, href: f.href, von: f.von, bis: f.bis, img: bildUrl(angebote.find((a) => a.id === f.id)?.bild, 'thumbnail'), bg: f.tintBg }))

  const verein_ld = {
    '@context': 'https://schema.org',
    '@type': 'SportsClub',
    name: verein.name ?? 'Büdericher Spielverein 1919 e.V.',
    alternateName: 'BSV 1919',
    url: absolut('/'),
    logo: absolut('/bsv-logo.png'),
    image: absolut('/og-bsv.jpg'),
    foundingDate: String(verein.gruendung ?? 1919),
    sport: ['Fußball', 'Tanzen', 'Turnen', 'Fitness', 'Yoga', 'Walking'],
    address: { '@type': 'PostalAddress', streetAddress: (verein.postanschrift ?? '').split('\n')[0], postalCode: '46487', addressLocality: 'Wesel', addressCountry: 'DE' },
    location: {
      '@type': 'SportsActivityLocation',
      name: 'Kutscher-Remy-Sportpark',
      address: { '@type': 'PostalAddress', streetAddress: 'Schützenstraße 25a', postalCode: '46487', addressLocality: 'Wesel', addressCountry: 'DE' },
      geo: { '@type': 'GeoCoordinates', latitude: verein.sportparkLat ?? 51.62638, longitude: verein.sportparkLon ?? 6.58253 },
    },
    sameAs: [verein.social?.instagram, verein.social?.facebook].filter(Boolean),
  }

  return (
    <>
      <JsonLd daten={verein_ld} />
      <section className="hero">
        <div aria-hidden="true" className="blob blob1" style={{ left: -120, top: -80, width: 420, height: 420, background: '#FFE3D3', borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' }} />
        <div aria-hidden="true" className="blob blob2" style={{ right: -140, bottom: -160, width: 520, height: 520, background: '#DDF3E5', borderRadius: '58% 42% 38% 62% / 52% 61% 39% 48%' }} />
        <div aria-hidden="true" className="blob blob3" style={{ right: '38%', top: 40, width: 160, height: 160, background: '#FFF0C2', borderRadius: '50%' }} />
        <div className="hero-inner">
          <div className="hero-text">
            <p className="pill in1" style={{ margin: '0 0 18px' }}>
              <img src="/bsv-logo.png" alt="" width={26} height={28} style={{ objectFit: 'contain' }} />
              {verein.name}
            </p>
            <h1 className="t-hero in2">
              <T text={tx.heroTitel} werte={w} />
            </h1>
            <p className="hand in2" style={{ margin: '6px 0 0', fontSize: 'clamp(38px, 4.5vw, 56px)', lineHeight: 1, transform: 'rotate(-3deg)', transformOrigin: 'left' }}>
              <T text={tx.heroHand} werte={w} />
            </p>
            <p className="in3" style={{ margin: '22px 0 0', maxWidth: 500, fontSize: 20, lineHeight: 1.5, color: 'var(--bsv-ink-2)' }}>
              <T text={tx.heroText} werte={w} />
            </p>
            <AgeFinder angebote={vorschlaege} frage={tx.alterFrage ?? undefined} keinTreffer={tx.alterKeinTreffer ?? undefined} />
          </div>

          <div aria-hidden="true" className="hero-art">
            {[
              { cls: 'c1', style: { left: '6%', top: 0, width: '52%', height: '58%', borderRadius: '46% 54% 42% 58% / 52% 44% 56% 48%' } },
              { cls: 'c2', style: { right: 0, top: '6%', width: '42%', height: '44%', borderRadius: 36, transform: 'rotate(4deg)' } },
              { cls: 'c3', style: { left: 0, bottom: 0, width: '44%', height: '40%', borderRadius: 36, transform: 'rotate(-4deg)' } },
              { cls: 'c4', style: { right: '4%', bottom: '2%', width: '50%', height: '46%', borderRadius: '52% 48% 40% 60% / 46% 56% 44% 54%' } },
            ].map((p, i) => (
              <div key={p.cls} className={`ph ${p.cls}`} style={p.style as React.CSSProperties}>
                <Bild media={hero[i]} size="medium" sizes="(max-width: 900px) 50vw, 360px" priority={i < 2} />
              </div>
            ))}
            <span className="dot dot1" style={{ left: '54%', top: '46%', width: 34, height: 34, background: '#FFB938' }} />
            <span className="dot dot2" style={{ left: '2%', top: '52%', width: 22, height: 22, background: '#FF7A59' }} />
            <span className="dot dot3" style={{ right: '2%', top: 0, width: 26, height: 26, background: '#4C8DF6' }} />
            <span className="dot dot4" style={{ left: '44%', bottom: '4%', width: 18, height: 18, background: '#3DAE6A' }} />
            {s?.heroTag1 && (
              <span className="tag tag1" style={{ left: '30%', top: '54%', color: 'var(--bsv-coral-dark)' }}>
                {s.heroTag1}
              </span>
            )}
            {s?.heroTag2 && (
              <span className="tag tag2" style={{ right: '6%', top: '50%', color: 'var(--bsv-green)' }}>
                {s.heroTag2}
              </span>
            )}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 22px 90px', background: 'linear-gradient(var(--bsv-warm) 0 36px, #fff 36px)' }}>
        <div className="stats">
          <div>
            <div className="stat-num" style={{ color: 'var(--bsv-green)' }}>
              <CountUp bis={verein.mitglieder ?? 0} />
            </div>
            <div style={{ color: 'var(--bsv-ink-2)' }}>{tx.zahlMitglieder || 'Mitglieder'}</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: 'var(--bsv-coral)' }}>
              <CountUp bis={angebote.length} />
            </div>
            <div style={{ color: 'var(--bsv-ink-2)' }}>{tx.zahlAngebote || 'Teams und Kurse'}</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: 'var(--bsv-blue)' }}>
              <CountUp bis={verein.kinderFussball ?? 0} />
            </div>
            <div style={{ color: 'var(--bsv-ink-2)' }}>{tx.zahlKinder || 'Kinder in der Fußballjugend'}</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: 'var(--bsv-lavender)' }}>
              <CountUp bis={verein.gruendung ?? 1919} von={1800} tausender={false} />
            </div>
            <div style={{ color: 'var(--bsv-ink-2)' }}>{tx.zahlGruendung || 'gegründet'}</div>
          </div>
        </div>
      </section>

      <section id="welten" style={{ padding: '0 22px 110px' }}>
        <div className="wrap" style={{ padding: 0 }}>
          <h2 className="t-sec rv center" style={{ marginBottom: 48 }}>
            {zweifarbig(tx.weltenTitel)}
          </h2>
          <div className="worlds">
            <Link href="/fussball" className="tile tile-wide rv" style={{ minHeight: 500, justifyContent: 'flex-end', color: '#fff' }}>
              <Bild media={s?.bildFussball} size="xlarge" sizes="(max-width: 760px) 100vw, 820px" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'relative', margin: 20, background: 'rgba(255,255,255,0.94)', color: 'var(--bsv-ink)', borderRadius: 24, padding: '26px 28px', maxWidth: 520, backdropFilter: 'blur(8px)' }}>
                <p className="tile-label green">{tx.kachelFussball?.label}</p>
                <h3>
                  <T text={tx.kachelFussball?.titel} werte={w} />
                </h3>
                <p style={{ margin: '8px 0 0', color: 'var(--bsv-ink-2)' }}><T text={tx.kachelFussball?.text} werte={w} /></p>
                <span style={{ display: 'inline-block', marginTop: 10, color: 'var(--bsv-green)', fontWeight: 600 }}>{tx.kachelFussball?.link}</span>
              </div>
            </Link>

            <Link href="/breitensport#kids" className="tile rv" style={{ minHeight: 500, background: 'var(--bsv-coral-tint)' }}>
              <div className="tile-pad">
                <p className="tile-label" style={{ color: 'var(--bsv-coral-dark)' }}>
                  {tx.kachelKids?.label}
                </p>
                <h3>
                  <T text={tx.kachelKids?.titel} werte={w} />
                </h3>
                <div aria-hidden="true" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 56, marginTop: 10 }}>
                  <span className="b1" style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF7A59' }} />
                  <span className="b2" style={{ width: 22, height: 22, borderRadius: '50%', background: '#FFB938' }} />
                  <span className="b3" style={{ width: 22, height: 22, borderRadius: '50%', background: '#3DAE6A' }} />
                </div>
              </div>
              <div className="tile-media">
                <Bild media={s?.bildKids} size="medium" sizes="(max-width: 760px) 100vw, 400px" />
              </div>
            </Link>

            <Link href="/breitensport#erwachsene" className="tile rv" style={{ minHeight: 480, background: 'var(--bsv-blue-tint)' }}>
              <div className="tile-pad">
                <p className="tile-label" style={{ color: 'var(--bsv-blue)' }}>
                  {tx.kachelFitness?.label}
                </p>
                <h3>
                  <T text={tx.kachelFitness?.titel} werte={w} />
                </h3>
                <p style={{ margin: '8px 0 0', color: 'var(--bsv-ink-2)' }}><T text={tx.kachelFitness?.text} werte={w} /></p>
              </div>
              <div className="tile-media" style={{ minHeight: 200 }}>
                <Bild media={s?.bildFitness} size="medium" sizes="(max-width: 760px) 100vw, 400px" />
              </div>
            </Link>

            <div className="tile tile-wide rv" style={{ minHeight: 480, background: 'var(--bsv-green-tint)', padding: 44, flexDirection: 'row', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 320px' }}>
                <p className="tile-label green">{tx.kachelMitglieder?.label}</p>
                <h3 style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                  <T text={tx.kachelMitglieder?.titel} werte={w} />
                </h3>
                <p style={{ margin: '12px 0 0', maxWidth: 400, color: 'var(--bsv-ink-2)', fontSize: 18 }}>
                  <T text={tx.kachelMitglieder?.text} werte={w} />
                </p>
                <Link href="/mitglieder" className="link-more" style={{ display: 'inline-block', marginTop: 18 }}>
                  {tx.kachelMitglieder?.link}
                </Link>
              </div>
              <div aria-hidden="true" className="phone">
                <div style={{ position: 'absolute', top: 10, left: '50%', width: 80, height: 22, marginLeft: -40, borderRadius: 999, background: 'var(--bsv-ink)' }} />
                <div className="nt" style={{ position: 'absolute', top: 46, left: 10, right: 10, background: 'var(--bsv-soft)', borderRadius: 18, padding: '10px 12px', fontSize: 12, lineHeight: 1.35, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
                  <strong style={{ display: 'block' }}>{tx.kachelMitglieder?.handyTitel}</strong>
                  <span style={{ color: 'var(--bsv-ink-2)' }}>{tx.kachelMitglieder?.handyText}</span>
                </div>
                <div style={{ position: 'absolute', bottom: 24, left: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ height: 44, borderRadius: 12, background: 'var(--bsv-soft)' }} />
                  <span style={{ height: 44, borderRadius: 12, background: 'var(--bsv-soft)' }} />
                  <span style={{ height: 44, borderRadius: 12, background: 'var(--bsv-green)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="finder" className="sec sec-warm">
        <div className="wrap" style={{ padding: 0 }}>
          <h2 className="t-sec rv center">
            <T text={tx.finderTitel} werte={w} />
          </h2>
          <OfferFinder items={gemischt} linkText={tx.finderLink ?? undefined} />
        </div>
      </section>

      {verein.aktion?.aktiv && (
        <section className="sec">
          <div className="feature rv">
            <div style={{ flex: '1 1 460px', padding: 'clamp(32px, 5vw, 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
              {verein.aktion.kicker && <p style={{ margin: 0, fontWeight: 600, color: '#BFE6CF' }}>{verein.aktion.kicker}</p>}
              <h2 style={{ margin: 0, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.045em' }}>{verein.aktion.titel}</h2>
              {verein.aktion.text && <p style={{ margin: 0, fontSize: 19, color: '#D7F0E1', maxWidth: 480 }}>{verein.aktion.text}</p>}
              {verein.aktion.linkUrl && (
                <Link href={verein.aktion.linkUrl} className="btn btn-white" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                  {verein.aktion.linkText || 'Mehr erfahren'}
                </Link>
              )}
            </div>
            <div style={{ flex: '1 1 380px', minHeight: 340, background: '#2E9A5B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20, flexWrap: 'wrap' }}>
              <svg viewBox="0 0 1000 640" style={{ width: 'min(100%, 380px)', height: 'auto' }} aria-hidden="true">
                <path className="pl" pathLength={1} d="M40 40 H960 V600 H40 Z" />
                <path className="pl" pathLength={1} d="M500 40 V600" />
                <path className="pl" pathLength={1} d="M430 320 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0" />
                <path className="pl" pathLength={1} d="M40 170 H200 V470 H40" />
                <path className="pl" pathLength={1} d="M960 170 H800 V470 H960" />
                <circle r={14} cx={0} cy={0} style={{ fill: '#fff' }}>
                  <animateMotion dur="7s" repeatCount="indefinite" path="M180 520 C 360 160, 560 560, 760 260 S 900 120, 640 420 S 260 600, 180 520" />
                </circle>
              </svg>
              {verein.aktion.bild && typeof verein.aktion.bild === 'object' && (
                <Bild media={verein.aktion.bild} size="small" sizes="170px" style={{ width: 170, height: 'auto', borderRadius: 14, boxShadow: '0 16px 36px rgba(0,0,0,0.25)', transform: 'rotate(4deg)' }} />
              )}
            </div>
          </div>
        </section>
      )}

      {news.docs.length > 0 && (
        <section id="news" className="sec-soft" style={{ padding: '110px 0' }}>
          <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <h2 className="rv" style={{ margin: 0, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.04em' }}>
              <T text={tx.newsUeberschrift} werte={w} />
            </h2>
            <Link href="/news" className="link-more" style={{ fontSize: 19 }}>
              {tx.newsLink}
            </Link>
          </div>
          <Karussell label="Neues aus dem BSV" automatisch={(tx as { newsAutomatisch?: boolean | null }).newsAutomatisch === false ? 0 : 6000}>
              {news.docs.map((n) => (
                <Link key={n.id} href={`/news/${n.slug}`} className="tile news-card">
                  <span style={{ display: 'block', aspectRatio: '4 / 3', overflow: 'hidden', background: 'var(--bsv-green-tint)' }}>
                    <Bild media={n.heroImage} size="small" sizes="360px" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </span>
                  <span style={{ padding: '20px 22px 24px' }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--bsv-green)' }}>{datum(n.publishedAt)}</span>
                    <strong style={{ display: 'block', fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.02em', marginTop: 4 }}>{n.title}</strong>
                  </span>
                </Link>
              ))}
          </Karussell>
        </section>
      )}

      <section id="mitglied" className="center" style={{ padding: '120px 22px' }}>
        <h2 className="rv" style={{ margin: '0 auto', maxWidth: 900, fontSize: 'clamp(48px, 7vw, 92px)', lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.05em' }}>
          {zweifarbig(tx.mitgliedTitel)}
        </h2>
        <p className="rv lead" style={{ margin: '18px auto 0', maxWidth: 560 }}>
          <T text={tx.mitgliedText} werte={w} />
        </p>
        <div className="steps3">
          {[
            [tx.schritte?.t1, tx.schritte?.d1],
            [tx.schritte?.t2, tx.schritte?.d2],
            [tx.schritte?.t3, tx.schritte?.d3],
          ].map(([t, d], i) => (
            <div key={i} className="rv" style={{ background: 'var(--bsv-soft)', borderRadius: 26, padding: 28 }}>
              <div className="step-num">{i + 1}</div>
              <h3 style={{ margin: '16px 0 6px', fontSize: 22 }}>{t}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
        <Link href="/mitglied-werden" className="btn btn-primary rv" style={{ marginTop: 48, fontSize: 19, padding: '16px 34px' }}>
          {tx.schritte?.button}
        </Link>
      </section>
      <SponsorenLaufband />
    </>
  )
}
