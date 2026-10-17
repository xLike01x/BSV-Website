import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import { Mitgliedsantrag, type AntragAngebot } from '@/bsv/components/Mitgliedsantrag'
import { getAngebote, getVerein } from '@/bsv/data'
import { BEREICH_LABEL } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Mitglied werden',
  description: 'Online-Mitgliedsantrag des Büdericher Spielvereins: Teams und Kurse wählen, Beitrag berechnen, SEPA-Mandat – in fünf Minuten.',
}

export default async function MitgliedWerden() {
  const [angebote, verein] = await Promise.all([getAngebote(), getVerein()])
  const liste: AntragAngebot[] = angebote.map((a) => ({ id: a.id, slug: a.slug, name: a.title, gruppe: BEREICH_LABEL[a.bereich] ?? a.bereich }))
  const beitraege = (verein.beitraege ?? []).map((b) => ({ key: b.key, label: b.label, zielgruppe: b.zielgruppe ?? '', quartal: b.quartal }))

  return (
    <div style={{ background: 'var(--bsv-soft)', minHeight: '100vh' }}>
      <section className="wrap-narrow center" style={{ paddingTop: 64, paddingBottom: 24 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 1.04 }}>
          Anmelden beim BSV.
        </h1>
        <p className="lead in2" style={{ margin: '14px auto 0', maxWidth: 560, fontSize: 19 }}>
          Wähle deine Teams und Kurse, gib deine Daten ein, fertig. Die Übungsleitungen werden automatisch informiert.
        </p>
      </section>
      <Suspense fallback={<div className="wrap-narrow" style={{ minHeight: 600 }} />}>
        <Mitgliedsantrag angebote={liste} beitraege={beitraege} glaeubigerId={verein.glaeubigerId} />
      </Suspense>
    </div>
  )
}
