import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Bild } from '@/bsv/components/Bild'
import { GruppenFilter, type Gruppe } from '@/bsv/components/GruppenFilter'
import { T } from '@/bsv/components/Text'
import { getAngebote, getPlatzhalter, getStartseite, getTexte, getVerein } from '@/bsv/data'
import { kurzZeit, UNTERGRUPPE_LABEL } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = seite('Fußball', 'Alle Fußballteams des BSV: Junioren, Juniorinnen, Senioren und Damen. Trainingszeiten, Trainerteams und Probetraining.')

export default async function FussballSeite() {
  const [angebote, start, tx, w, verein] = await Promise.all([getAngebote(), getStartseite(), getTexte(), getPlatzhalter(), getVerein()])
  const teams = angebote.filter((a) => a.bereich === 'fussball')

  const gruppen: Gruppe[] = (['junioren', 'juniorinnen', 'senioren', 'seniorinnen'] as const)
    .map((g) => ({
      id: g,
      title: UNTERGRUPPE_LABEL[g]!,
      items: teams
        .filter((t) => t.untergruppe === g)
        .map((t) => ({ id: t.id, name: t.title, href: `/angebote/${t.slug}`, oben: t.alterText ?? '', untertitel: kurzZeit(t), cta: 'Zum Team ›' })),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      <section className="center" style={{ padding: '110px 22px 80px' }}>
        <p className="kicker in1">Fußball</p>
        <h1 className="t-page in2" style={{ maxWidth: 900, margin: '0 auto' }}>
          <T text={tx.fussball?.titel} werte={w} />
        </h1>
        <p className="lead in3" style={{ margin: '22px auto 0', maxWidth: 620 }}>
          <T text={tx.fussball?.text} werte={w} />
        </p>
        <p className="in3" style={{ margin: '18px 0 0' }}>
          <Link href="/trainingszeiten" className="btn btn-ghost">
            🗓️ Alle Trainingszeiten im Wochenplan
          </Link>
        </p>
        <div className="in3" style={{ maxWidth: 1180, margin: '48px auto 0', borderRadius: 32, overflow: 'hidden', aspectRatio: '21 / 9', boxShadow: '0 30px 60px rgba(21,122,67,0.15)', background: 'var(--bsv-green-tint)' }}>
          <Bild media={start.startseite?.bildFussball} size="xlarge" priority sizes="(max-width: 1220px) 100vw, 1180px" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </section>

      <section style={{ padding: '0 22px 110px' }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          <GruppenFilter gruppen={gruppen} variante="text" />
        </div>
      </section>

      <section className="sec sec-soft">
        <div className="wrap-narrow" style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20 }}>
          <div className="rv" style={{ background: '#fff', borderRadius: 30, padding: 44, minHeight: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="green" style={{ margin: 0, fontWeight: 600 }}>
              Spielbetrieb
            </p>
            <h2 className="t-2">Spielpläne, Ergebnisse, Tabellen.</h2>
            <p className="muted" style={{ margin: 0 }}>
              Jedes Team zeigt seine Spiele und die Tabelle automatisch über FUSSBALL.DE und den Kader über FuPa – direkt auf der Teamseite.
            </p>
            <a href="https://www.fupa.net/club/buedericher-sv" target="_blank" rel="noopener noreferrer" className="link-more" style={{ marginTop: 'auto' }}>
              BSV auf FuPa ↗
            </a>
          </div>
          <Link href="/kunstrasen" className="rv tile" style={{ background: 'var(--bsv-green-tint)', borderRadius: 30, padding: 44, minHeight: 340, justifyContent: 'space-between' }}>
            <div>
              <p className="green" style={{ margin: 0, fontWeight: 600 }}>
                Kunstrasen 2026
              </p>
              <h2 className="t-2" style={{ marginTop: 8 }}>
                Ganzjährig spielen.
                <br />
                Bei jedem Wetter.
              </h2>
            </div>
            <span className="green" style={{ fontSize: 19, fontWeight: 600 }}>
              Mehr zum Projekt ›
            </span>
          </Link>
          <div className="rv" style={{ gridColumn: '1 / -1', background: 'var(--bsv-green-tint)', borderRadius: 30, padding: 44, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 420px' }}>
              <h2 className="t-2">
                <T text={tx.fussball?.mitspielenTitel} werte={w} />
              </h2>
              <p className="muted" style={{ margin: '10px 0 0' }}>
                Such dir dein Team aus und frag ein Probetraining an. {(verein.sportpark ?? '').replace(/\n/g, ', ')}.
              </p>
            </div>
            <Link href="/mitglied-werden" className="btn btn-primary">
              Jetzt anmelden
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
