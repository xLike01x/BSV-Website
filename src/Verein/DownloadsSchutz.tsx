'use client'
import { useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

/** Warnt, wenn eine Datei „Nur für Mitglieder“ noch öffentlich liegt – mit Knopf zum Umziehen */
export default function DownloadsSchutz() {
  const offen = useFormFields(([f]) => {
    let n = 0
    for (const [pfad, feld] of Object.entries(f)) {
      const m = pfad.match(/^downloads\.(\d+)\.nurMitglieder$/)
      if (!m || !feld?.value) continue
      if (f[`downloads.${m[1]}.datei`]?.value && !f[`downloads.${m[1]}.dokument`]?.value) n++
    }
    return n
  })
  const [laeuft, setLaeuft] = useState(false)
  if (!offen) return null
  const los = async () => {
    setLaeuft(true)
    await fetch('/api/dokumente/umziehen', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.reload()
  }
  return (
    <div className="bsv-hinweise" role="alert" style={{ marginBottom: 16 }}>
      <p className="bsv-hinweise__titel">Achtung</p>
      <ul>
        <li className="bsv-hinweise__warn">
          <span aria-hidden="true">⚠️</span>
          <span>
            {offen === 1 ? 'Eine Datei' : `${offen} Dateien`} „Nur für Mitglieder“ {offen === 1 ? 'liegt' : 'liegen'} noch öffentlich in der Mediathek – wer den Link kennt, kann sie öffnen.{' '}
            <button type="button" className="bsv-hinweise__knopf" onClick={los} disabled={laeuft} style={{ marginTop: 8 }}>
              {laeuft ? 'Wird umgezogen …' : '🔒 Jetzt in den geschützten Bereich umziehen'}
            </button>
          </span>
        </li>
      </ul>
    </div>
  )
}
