'use client'

import React, { useState } from 'react'

/** „✓ Ja, passt noch“ – bestätigt die Angaben eines Teams mit dem Link aus der Erinnerungs-Mail */
export function TeamBestaetigenKnopf({ t }: { t: string }) {
  const [status, setStatus] = useState<'bereit' | 'laeuft' | 'ok' | 'fehler'>('bereit')
  const [meldung, setMeldung] = useState('')

  const senden = async () => {
    setStatus('laeuft')
    try {
      const r = await fetch('/api/angebote/bestaetigen-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t }) })
      const d = (await r.json().catch(() => ({}))) as { fehler?: string }
      if (r.ok) setStatus('ok')
      else {
        setStatus('fehler')
        setMeldung(d.fehler === 'abgelaufen' ? 'Der Link ist abgelaufen.' : d.fehler === 'nicht-mehr' ? 'Dieses Team betreust du laut Website nicht mehr.' : 'Das hat nicht geklappt. Bitte später noch einmal versuchen.')
      }
    } catch {
      setStatus('fehler')
      setMeldung('Keine Verbindung. Bitte noch einmal versuchen.')
    }
  }

  if (status === 'ok')
    return (
      <div className="success" style={{ padding: 24 }} role="status">
        <div aria-hidden="true" style={{ fontSize: 36 }}>
          ✓
        </div>
        <p style={{ margin: '6px 0 0', fontWeight: 700 }}>Danke! Auf der Teamseite steht jetzt der aktuelle Stand.</p>
      </div>
    )
  return (
    <div>
      <button type="button" className="btn btn-primary" onClick={senden} disabled={status === 'laeuft'} style={{ width: '100%' }}>
        {status === 'laeuft' ? 'Wird gespeichert …' : '✓ Ja, passt noch'}
      </button>
      {status === 'fehler' && (
        <p role="alert" style={{ margin: '10px 0 0', color: '#b42318' }}>
          {meldung}
        </p>
      )}
    </div>
  )
}
