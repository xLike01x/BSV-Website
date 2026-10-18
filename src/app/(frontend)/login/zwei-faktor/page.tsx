import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import { ZweiFaktor } from '@/bsv/components/ZweiFaktor'

export const metadata: Metadata = { title: 'Zwei-Faktor-Anmeldung', robots: { index: false } }

export default function ZweiFaktorSeite() {
  return (
    <section className="sec-warm" style={{ padding: '80px 22px 120px', minHeight: '70vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="center" style={{ marginBottom: 24 }}>
          <span aria-hidden="true" style={{ fontSize: 44 }}>
            🔐
          </span>
          <p className="kicker" style={{ fontSize: 17, marginTop: 8 }}>
            Sicher in die Verwaltung
          </p>
        </div>
        <Suspense fallback={<div className="form" style={{ minHeight: 280 }} />}>
          <ZweiFaktor />
        </Suspense>
      </div>
    </section>
  )
}
