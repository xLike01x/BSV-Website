'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { ErneutSenden } from './ErneutSenden'

/** Wird über den Link in der Bestätigungs-E-Mail geöffnet und bestätigt die Adresse automatisch */
export function EmailBestaetigen() {
  const t = useSearchParams().get('t') ?? ''
  const [status, setStatus] = useState<'laeuft' | 'ok' | 'ungueltig' | 'abgelaufen' | 'fehler'>('laeuft')
  const gestartet = useRef(false)

  useEffect(() => {
    if (gestartet.current) return
    gestartet.current = true
    fetch('/api/users/registrieren/bestaetigen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t }) })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as { fehler?: string }
        setStatus(r.ok ? 'ok' : d.fehler === 'abgelaufen' ? 'abgelaufen' : d.fehler === 'ungueltig' ? 'ungueltig' : 'fehler')
      })
      .catch(() => setStatus('fehler'))
  }, [t])

  if (status === 'laeuft')
    return (
      <div className="success" style={{ padding: 40 }} role="status">
        <p className="muted" style={{ margin: 0 }}>Einen Moment, wir bestätigen deine E-Mail-Adresse …</p>
      </div>
    )
  if (status === 'ok')
    return (
      <div className="success" style={{ padding: 40 }} role="status">
        <div aria-hidden="true" style={{ fontSize: 44 }}>✓</div>
        <h2 className="t-2" style={{ fontSize: 28 }}>
          Danke, deine E-Mail ist bestätigt.
        </h2>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 380, lineHeight: 1.5 }}>
          Die Verwaltung prüft jetzt kurz, ob du Mitglied bist, und schaltet deinen Zugang frei. Du bekommst dann eine E-Mail. Anmelden kannst du dich schon jetzt.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: 20 }}>
          Zur Anmeldung
        </Link>
      </div>
    )
  return (
    <div className="form" style={{ gridTemplateColumns: '1fr' }}>
      <h2 className="t-2" style={{ fontSize: 26, margin: 0 }}>
        {status === 'abgelaufen' ? 'Der Link ist abgelaufen.' : status === 'ungueltig' ? 'Der Link gilt nicht (mehr).' : 'Das hat nicht geklappt.'}
      </h2>
      <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
        {status === 'ungueltig'
          ? 'Vielleicht hast du schon bestätigt – dann kannst du dich einfach anmelden. Oder du hast dich danach noch einmal registriert; dann gilt nur der Link aus der neuesten E-Mail.'
          : status === 'abgelaufen'
            ? 'Bestätigungslinks gelten 48 Stunden. Lass dir einfach einen neuen schicken.'
            : 'Bitte die Seite neu laden oder dir einen neuen Link schicken lassen.'}
      </p>
      <ErneutSenden />
      <div style={{ fontSize: 15 }}>
        <Link href="/login">Zur Anmeldung</Link>
      </div>
    </div>
  )
}
