import React, { Suspense } from 'react'

/** Gemeinsamer Rahmen für Anmelden, Registrieren, E-Mail bestätigen und Passwort neu */
export function AuthSeite({ titel, text, breite = 460, children }: { titel: string; text?: string; breite?: number; children: React.ReactNode }) {
  return (
    <section className="sec-warm" style={{ padding: '96px 22px 120px', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" className="blob blob1" style={{ left: -140, top: -60, width: 380, height: 380, background: '#FFE3D3', borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' }} />
      <div aria-hidden="true" className="blob blob2" style={{ right: -160, bottom: -180, width: 480, height: 480, background: '#DDF3E5', borderRadius: '58% 42% 38% 62% / 52% 61% 39% 48%' }} />
      <div style={{ position: 'relative', maxWidth: breite, margin: '0 auto' }}>
        <div className="center" style={{ marginBottom: 28 }}>
          <img src="/bsv-logo.png" alt="" width={56} height={60} style={{ objectFit: 'contain', margin: '0 auto' }} />
          <h1 className="t-page in1" style={{ fontSize: 'clamp(40px, 6vw, 56px)', marginTop: 12 }}>
            {titel}
          </h1>
          {text && (
            <p className="lead in2" style={{ margin: '10px 0 0', fontSize: 19 }}>
              {text}
            </p>
          )}
        </div>
        <Suspense fallback={<div className="form" style={{ minHeight: 320 }} />}>{children}</Suspense>
      </div>
    </section>
  )
}
