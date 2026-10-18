import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import { Karte } from '@/bsv/components/Karte'
import { KontaktForm } from '@/bsv/components/KontaktForm'
import { T } from '@/bsv/components/Text'
import { getPlatzhalter, getTexte, getVerein } from '@/bsv/data'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Schreib dem Büdericher Spielverein – Anfahrt zum Kutscher-Remy-Sportpark und zur Sporthalle Petristraße.',
}

export default async function KontaktSeite() {
  const [v, tx, w] = await Promise.all([getVerein(), getTexte(), getPlatzhalter()])
  const empfaenger = (v.vorstand ?? []).map((b) => `${b.name} (${b.rolle})`)

  return (
    <>
      <section className="wrap-narrow center" style={{ paddingTop: 96, paddingBottom: 48 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 1 }}>
          <T text={tx.kontakt?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '16px auto 0', maxWidth: 560 }}>
          <T text={tx.kontakt?.text} werte={w} />
        </p>
      </section>

      <section className="sec-soft" style={{ padding: '72px 22px 100px' }}>
        <div className="wrap-narrow" style={{ padding: 0, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: '999 1 520px', minWidth: 0 }}>
            <Suspense fallback={<div className="form" style={{ minHeight: 480 }} />}>
              <KontaktForm empfaenger={empfaenger} />
            </Suspense>
          </div>
          <aside style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 26, padding: 28 }}>
              <p className="info-label">Sportplatz &amp; Sportheim</p>
              <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line', fontWeight: 600 }}>{v.sportpark}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 26, padding: 28 }}>
              <p className="info-label">Sporthalle</p>
              <p style={{ margin: '6px 0 0', fontWeight: 600 }}>
                Sporthalle Petristraße
                <br />
                46487 Wesel
              </p>
            </div>
            <div style={{ background: '#fff', borderRadius: 26, padding: 28 }}>
              <p className="info-label">Postanschrift</p>
              <p style={{ margin: '6px 0 0', whiteSpace: 'pre-line', fontWeight: 600 }}>
                {v.name}
                {'\n'}
                {v.postanschrift}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="sec">
        <div className="wrap-narrow" style={{ padding: 0 }}>
          <h2 className="t-sec rv" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: 28 }}>
            So findest du uns.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20 }}>
            <Karte titel="Kutscher-Remy-Sportpark" adresse="Schützenstraße 25a, 46487 Wesel" />
            <Karte titel="Sporthalle Petristraße" adresse="Petristraße, 46487 Wesel" />
          </div>
        </div>
      </section>
    </>
  )
}
