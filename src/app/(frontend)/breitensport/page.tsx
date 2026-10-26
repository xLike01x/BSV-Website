import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Bild } from '@/bsv/components/Bild'
import { GruppenFilter, type Gruppe } from '@/bsv/components/GruppenFilter'
import { T } from '@/bsv/components/Text'
import { animationAn, getAngebote, getAnimationen, getPlatzhalter, getStartseite, getTexte } from '@/bsv/data'
import { Ball } from '@/bsv/components/spiele/Ball'
import { bildUrl, farbe, kurzZeit } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = seite('Breitensport', 'Tanzen, Turnen, Fitness, Gesundheit und Ausdauer beim BSV – Kurse für jedes Alter, Schnuppern erwünscht.')

export default async function BreitensportSeite() {
  const [angebote, start, tx, w, anim] = await Promise.all([getAngebote(), getStartseite(), getTexte(), getPlatzhalter(), getAnimationen()])
  const spielecke = animationAn(anim, 'elfmeter') || animationAn(anim, 'hochhalten') || animationAn(anim, 'memory')
  const kids = angebote.filter((a) => a.bereich === 'kids')
  const erw = angebote.filter((a) => a.bereich === 'erwachsene')
  const s = start.startseite

  const karte = (a: (typeof angebote)[number]) => ({
    id: a.id,
    name: a.title,
    href: `/angebote/${a.slug}`,
    oben: a.kategorie ?? '',
    untertitel: a.alterText ?? '',
    zeile: a.zeiten?.length ? kurzZeit(a) : undefined,
    img: bildUrl(a.bild, 'small'),
    tint: farbe(a.kategorie)[0],
    cta: 'Zeiten & Anmeldung ›',
  })
  const alter = (l: typeof kids) => {
    const v = Math.min(...l.map((a) => a.alterVon ?? 0))
    const b = Math.max(...l.map((a) => a.alterBis ?? 99))
    return `von ${v} bis ${b} Jahren`
  }

  const gruppen: Gruppe[] = [
    { id: 'kids', title: 'BSV Kids', sub: `${kids.length} Angebote · ${kids.length ? alter(kids) : ''}`, items: kids.map(karte) },
    { id: 'erwachsene', title: 'Erwachsene & Senioren', sub: `${erw.length} Kurse · Fitness, Gesundheit, Ausdauer`, items: erw.map(karte) },
  ].filter((g) => g.items.length > 0)

  return (
    <>
      <section className="center sec-warm" style={{ padding: '110px 22px 80px' }}>
        <div aria-hidden="true" style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'flex-end', height: 80, marginBottom: 20 }}>
          <span className="b1" style={{ width: 30, height: 30, borderRadius: '50%', background: '#FF9F0A' }} />
          <span className="b2" style={{ width: 30, height: 30, borderRadius: '50%', background: '#FF375F' }} />
          <span className="b3" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bsv-green)' }} />
        </div>
        <p className="kicker in1" style={{ color: 'var(--bsv-coral-dark)' }}>
          Breitensport
        </p>
        <h1 className="t-page in2" style={{ maxWidth: 960, margin: '0 auto' }}>
          <T text={tx.breitensport?.titel} werte={w} />
        </h1>
        <p className="lead in3" style={{ margin: '22px auto 0', maxWidth: 640 }}>
          <T text={tx.breitensport?.text} werte={w} />
        </p>
        <p className="in3" style={{ margin: '18px 0 0' }}>
          <Link href="/trainingszeiten" className="btn btn-ghost">
            🗓️ Alle Trainingszeiten im Wochenplan
          </Link>
        </p>
        <div className="in3" style={{ maxWidth: 1180, margin: '48px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[s?.bildBreitensport1, s?.bildBreitensport2, s?.bildBreitensport3].map((b, i) => (
            <Bild key={i} media={b} size="medium" priority={i === 0} sizes="(max-width: 800px) 100vw, 390px" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 26 }} />
          ))}
        </div>
      </section>

      <section className="sec-soft" style={{ padding: '90px 22px 110px' }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          <GruppenFilter gruppen={gruppen} variante="bild" />
        </div>
      </section>

      {spielecke && (
        <section className="sec-soft" style={{ padding: '0 22px 90px' }}>
          <Link href="/spielecke" className="spielecke-teaser rv">
            <span className="ball-hupf" aria-hidden="true">
              <Ball />
            </span>
            <span style={{ flex: '1 1 260px' }}>
              <strong>Spielecke für BSV Kids</strong>
              <span>Elfmeterschießen, Ball hochhalten und Memory – direkt im Browser.</span>
            </span>
            <span className="link-more">Jetzt spielen ›</span>
          </Link>
        </section>
      )}

      <section className="sec center">
        <h2 className="t-sec rv" style={{ maxWidth: 820, margin: '0 auto', fontSize: 'clamp(40px, 6vw, 72px)' }}>
          <T text={tx.breitensport?.schnupperTitel} werte={w} />
        </h2>
        <p className="rv lead" style={{ margin: '18px auto 0', maxWidth: 560, fontSize: 19 }}>
          <T text={tx.breitensport?.schnupperText} werte={w} />
        </p>
        <div className="rv" style={{ marginTop: 32, display: 'flex', gap: '14px 28px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/#finder" className="btn btn-primary">
            Passenden Kurs finden
          </Link>
          <Link href="/mitglied-werden" className="link-more" style={{ padding: '14px 0' }}>
            Direkt anmelden ›
          </Link>
        </div>
      </section>
    </>
  )
}
