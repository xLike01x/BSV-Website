import type { Metadata } from 'next'
import React from 'react'

import { payload } from '@/bsv/data'
import { istGueltig, MITGLIEDSART } from '@/mitgliedschaften/Mitgliedschaften'
import { ausweisTokenPruefen } from '@/mitgliedschaften/token'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mitgliedsausweis prüfen', robots: { index: false, follow: false } }

/** Ziel des QR-Codes auf dem Ausweis: zeigt live, ob die Mitgliedschaft gültig ist (mit möglichst wenig Daten) */
export default async function AusweisPruefen({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const id = ausweisTokenPruefen(decodeURIComponent(token))
  const p = await payload()
  const m = id ? await p.findByID({ collection: 'mitgliedschaften', id, depth: 0, overrideAccess: true }).catch(() => null) : null
  const ok = Boolean(m && istGueltig(m))
  const jetzt = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' })
  return (
    <section className="sec-soft" style={{ padding: '96px 22px 120px', minHeight: '70vh' }}>
      <div style={{ maxWidth: 460, margin: '0 auto', background: '#fff', borderRadius: 28, padding: 36, textAlign: 'center' }}>
        <img src="/bsv-logo.png" alt="" width={52} height={56} style={{ margin: '0 auto', objectFit: 'contain' }} />
        <div style={{ fontSize: 64, lineHeight: 1, margin: '18px 0 8px' }} aria-hidden="true">
          {ok ? '✅' : '❌'}
        </div>
        <h1 className="t-3" style={{ fontSize: 30, color: ok ? 'var(--bsv-green)' : '#b91c1c' }}>
          {ok ? 'Gültige Mitgliedschaft' : m ? 'Mitgliedschaft nicht mehr gültig' : 'Ausweis nicht gefunden'}
        </h1>
        {m && (
          <p style={{ margin: '14px 0 0', fontSize: 18, lineHeight: 1.6 }}>
            <strong>
              {m.vorname} {m.nachname.slice(0, 1)}.
            </strong>
            <br />
            {m.mitgliedsnummer ? `Nr. ${m.mitgliedsnummer} · ` : ''}
            {MITGLIEDSART[m.art] ?? m.art}
            {m.eintritt ? ` · seit ${new Date(m.eintritt).getFullYear()}` : ''}
          </p>
        )}
        <p className="muted" style={{ margin: '18px 0 0', fontSize: 14 }}>Geprüft am {jetzt} – Büdericher SV 1919 e.V.</p>
      </div>
    </section>
  )
}
