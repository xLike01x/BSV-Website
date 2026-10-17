import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import { LoginForm } from '@/bsv/components/LoginForm'

export const metadata: Metadata = { title: 'Anmelden', robots: { index: false } }

export default function LoginSeite() {
  return (
    <section className="sec-warm" style={{ padding: '96px 22px 120px', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" className="blob blob1" style={{ left: -140, top: -60, width: 380, height: 380, background: '#FFE3D3', borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' }} />
      <div aria-hidden="true" className="blob blob2" style={{ right: -160, bottom: -180, width: 480, height: 480, background: '#DDF3E5', borderRadius: '58% 42% 38% 62% / 52% 61% 39% 48%' }} />
      <div style={{ position: 'relative', maxWidth: 460, margin: '0 auto' }}>
        <div className="center" style={{ marginBottom: 28 }}>
          <img src="/bsv-logo.png" alt="" width={56} height={60} style={{ objectFit: 'contain', margin: '0 auto' }} />
          <h1 className="t-page in1" style={{ fontSize: 'clamp(40px, 6vw, 56px)', marginTop: 12 }}>
            Hallo im BSV.
          </h1>
          <p className="lead in2" style={{ margin: '10px 0 0', fontSize: 19 }}>
            Melde dich an für Mitgliederbereich, Kursausfälle und Verwaltung.
          </p>
        </div>
        <Suspense fallback={<div className="form" style={{ minHeight: 320 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  )
}
