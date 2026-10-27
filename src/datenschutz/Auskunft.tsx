'use client'
import React, { useState } from 'react'

/** In „Datenschutz-Fristen“: Auskunft für eine Person als Datei herunterladen (Art. 15/20 DSGVO) */
export default function Auskunft() {
  const [email, setEmail] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim())
  return (
    <section className="bsv-datenschutz">
      <h3>Auskunft für eine Person (Art. 15 DSGVO)</h3>
      <p className="bsv-datenschutz__klein">
        Will jemand wissen, was über ihn gespeichert ist, oder seine Daten mitnehmen: E-Mail-Adresse eingeben und die Datei herunterladen. Enthalten sind Konto, Anträge, Mitgliedschaften,
        Anfragen, Formular-Eingänge, Passanträge, Zu- und Absagen, Kündigungen und Fotos – auch aus dem Papierkorb. Die Datei enthält persönliche Daten (auch die IBAN): nur an die Person selbst geben, danach löschen.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" aria-label="E-Mail-Adresse der Person" style={{ minWidth: 260, padding: '8px 10px' }} />
        <button
          type="button"
          disabled={!ok}
          onClick={async () => {
            setFehler(null)
            const r = await fetch(`/api/datenschutz/auskunft?email=${encodeURIComponent(email.trim())}`, { credentials: 'include' }).catch(() => null)
            if (!r?.ok) return setFehler((await r?.json().catch(() => null))?.fehler ?? 'Hat nicht geklappt.')
            const blob = await r.blob()
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = r.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'auskunft.json'
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          📄 Auskunft herunterladen
        </button>
      </div>
      {fehler && <p style={{ color: 'var(--theme-error-500)' }}>{fehler}</p>}
    </section>
  )
}
