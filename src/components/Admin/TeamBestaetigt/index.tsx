'use client'
import { useDocumentInfo, useField } from '@payloadcms/ui'
import React, { useState } from 'react'

import './team-bestaetigt.scss'

const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Seitenleiste beim Team: „Zuletzt bestätigt: …“ und Knopf „✓ Alles noch aktuell“.
 * Gespeichert wird sofort über einen eigenen Endpunkt – das Formular gilt danach nicht als „ungespeichert“.
 */
export default function TeamBestaetigt() {
  const { id, docPermissions } = useDocumentInfo()
  // Ohne Recht zum Bearbeiten (z. B. „Nur ansehen“): nur das Datum zeigen
  const darf = Boolean((docPermissions as { update?: unknown } | undefined)?.update)
  const am = useField<string | null>({ path: 'bestaetigtAm' })
  const von = useField<string | null>({ path: 'bestaetigtVon' })
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const tage = am.value ? Math.floor((Date.now() - new Date(am.value).getTime()) / 86400000) : null
  const alt = tage === null || tage > 365

  const bestaetigen = async () => {
    setLaeuft(true)
    setFehler(null)
    try {
      const r = await fetch(`/api/angebote/${id}/bestaetigen`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) setFehler(d.fehler ?? 'Das hat nicht geklappt.')
      else {
        am.setValue(d.am, true)
        von.setValue(d.von, true)
      }
    } catch {
      setFehler('Keine Verbindung. Bitte noch einmal versuchen.')
    }
    setLaeuft(false)
  }

  return (
    <div className={`bsv-bestaetigt${alt ? ' is-alt' : ''}`}>
      <span className="bsv-bestaetigt__label">Angaben zuletzt bestätigt</span>
      <strong>{am.value ? `${datum(am.value)}${von.value ? ` · ${von.value}` : ''}` : id ? 'noch nie' : 'beim ersten Speichern'}</strong>
      {id && darf && (
        <>
          <button type="button" onClick={bestaetigen} disabled={laeuft}>
            {laeuft ? 'Wird gespeichert …' : '✓ Alles noch aktuell'}
          </button>
          <small>
            Zeiten, Ort und Infos geprüft? Dann hier bestätigen. Auf der Teamseite steht „Stand: …“. Ändert jemand die Trainingszeiten, gilt das automatisch als bestätigt. Ohne Bestätigung kommt alle 3 Monate eine „Passt noch?“-Mail an die Verantwortlichen.
          </small>
        </>
      )}
      {fehler && (
        <small className="bsv-bestaetigt__fehler" role="alert">
          {fehler}
        </small>
      )}
    </div>
  )
}
