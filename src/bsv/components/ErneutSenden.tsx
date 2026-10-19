'use client'

import React, { useState } from 'react'

/** „Bestätigungs-E-Mail noch einmal senden“ – antwortet immer gleich (verrät nicht, ob es die Adresse gibt) */
export function ErneutSenden({ email: vorgabe = '' }: { email?: string }) {
  const [email, setEmail] = useState(vorgabe)
  const [status, setStatus] = useState<'leer' | 'laeuft' | 'gesendet' | 'fehler'>('leer')

  async function senden() {
    if (!email.includes('@')) return
    setStatus('laeuft')
    const res = await fetch('/api/users/registrieren/erneut', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null)
    setStatus(res?.ok ? 'gesendet' : 'fehler')
  }

  if (status === 'gesendet')
    return (
      <p className="muted" role="status" style={{ margin: 0, fontSize: 15 }}>
        ✓ Falls dieses Konto noch nicht bestätigt ist, ist eine neue E-Mail unterwegs. Bitte auch im Spam-Ordner nachsehen.
      </p>
    )
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {!vorgabe && (
        <label className="field">
          Deine E-Mail-Adresse
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
      )}
      <button type="button" className="btn" disabled={status === 'laeuft' || !email.includes('@')} onClick={senden} style={{ color: 'var(--bsv-green)', background: 'transparent', border: '1.5px solid currentColor' }}>
        {status === 'laeuft' ? 'Wird gesendet …' : 'Bestätigungs-E-Mail noch einmal senden'}
      </button>
      {status === 'fehler' && <p className="form-error">Das hat nicht geklappt. Bitte in ein paar Minuten erneut versuchen.</p>}
    </div>
  )
}
