'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/** Knopf „Jetzt prüfen“ – startet die Update-Prüfung sofort (sonst täglich) */
export default function JetztPruefen({ aus }: { aus: boolean }) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  if (aus) return <span className="bsv-upd__aus">Prüfung abgeschaltet (BSV_PAKETPRUEFUNG=aus)</span>
  const los = async () => {
    setLaeuft(true)
    setFehler(null)
    const r = await fetch('/api/updates/pruefen', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => null)
    setLaeuft(false)
    if (!r?.ok) return setFehler((await r?.json().catch(() => null))?.fehler ?? 'Das hat nicht geklappt.')
    router.refresh()
  }
  return (
    <div className="bsv-upd__knopf">
      <button type="button" onClick={los} disabled={laeuft}>
        {laeuft ? 'Wird geprüft … (bis zu 30 Sekunden)' : '🔄 Jetzt prüfen'}
      </button>
      {fehler && <small role="alert">{fehler}</small>}
    </div>
  )
}
