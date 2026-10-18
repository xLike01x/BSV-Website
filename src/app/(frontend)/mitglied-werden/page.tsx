import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import React, { Suspense } from 'react'

import { Mitgliedsantrag, type AntragAngebot } from '@/bsv/components/Mitgliedsantrag'
import { T } from '@/bsv/components/Text'
import { getAngebote, getPlatzhalter, getTexte, getVerein } from '@/bsv/data'
import { BEREICH_LABEL } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = seite('Mitglied werden', 'Online-Mitgliedsantrag des Büdericher Spielvereins: Teams und Kurse wählen, Beitrag berechnen, SEPA-Mandat – in fünf Minuten.')

export default async function MitgliedWerden() {
  const [angebote, verein, tx, w] = await Promise.all([getAngebote(), getVerein(), getTexte(), getPlatzhalter()])
  const liste: AntragAngebot[] = angebote.map((a) => ({ id: a.id, slug: a.slug, name: a.title, gruppe: BEREICH_LABEL[a.bereich] ?? a.bereich }))
  const beitraege = (verein.beitraege ?? []).map((b) => ({ key: b.key, label: b.label, zielgruppe: b.zielgruppe ?? '', quartal: b.quartal }))

  return (
    <div style={{ background: 'var(--bsv-soft)', minHeight: '100vh' }}>
      <section className="wrap-narrow center" style={{ paddingTop: 64, paddingBottom: 24 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 1.04 }}>
          <T text={tx.antrag?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '14px auto 0', maxWidth: 560, fontSize: 19 }}>
          <T text={tx.antrag?.text} werte={w} />
        </p>
      </section>
      <Suspense fallback={<div className="wrap-narrow" style={{ minHeight: 600 }} />}>
        <Mitgliedsantrag angebote={liste} beitraege={beitraege} glaeubigerId={verein.glaeubigerId} />
      </Suspense>
    </div>
  )
}
