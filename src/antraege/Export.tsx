'use client'
import { useAuth } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import '@/posteingang/posteingang.scss'

const ZAEHLEN = '/api/mitgliedsantraege?where[and][0][status][equals]=aufgenommen&where[and][1][exportiertAm][exists]=false&limit=1&depth=0&select[id]=true'

/** Leiste über der Antragsliste: aufgenommene Anträge als Datei für die Kasse (ohne Bankdaten) */
export default function AntragExport() {
  const { user } = useAuth<{ roles?: string[] }>()
  const darf = Boolean(user?.roles?.some((r) => r === 'admin' || r === 'kasse'))
  const [neu, setNeu] = useState<number | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)

  const zaehlen = useCallback(async () => {
    const r = await fetch(ZAEHLEN, { credentials: 'include' }).catch(() => null)
    if (r?.ok) setNeu((await r.json()).totalDocs ?? 0)
  }, [])

  useEffect(() => {
    if (darf) void zaehlen()
  }, [darf, zaehlen])

  if (!darf) return null

  const exportieren = async (alle: boolean) => {
    setLaeuft(true)
    setMeldung(null)
    try {
      const r = await fetch('/api/mitgliedsantraege/export', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alle }) })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setMeldung(d.fehler ?? 'Export fehlgeschlagen.')
        return
      }
      const anzahl = Number(r.headers.get('X-Anzahl') ?? 0)
      if (!anzahl) {
        setMeldung(alle ? 'Es gibt noch keine aufgenommenen Anträge.' : 'Keine neuen aufgenommenen Anträge – alles schon exportiert.')
        return
      }
      const name = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') ?? '')?.[1] ?? 'mitgliedsantraege.csv'
      const url = URL.createObjectURL(await r.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setMeldung(`${anzahl} Antr${anzahl === 1 ? 'ag' : 'äge'} exportiert („${name}“). Die Datei enthält persönliche Daten: nach dem Übertragen ins DFBnet bitte löschen.`)
      await zaehlen()
    } catch {
      setMeldung('Keine Verbindung. Bitte noch einmal versuchen.')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="bsv-export">
      <span className="bsv-export__text">
        <strong>Für die Kasse:</strong> aufgenommene Anträge als Excel-Datei (CSV) – ohne Bankdaten, z. B. zum Übertragen ins DFBnet.
        {neu !== null && <> Noch nicht exportiert: <strong>{neu}</strong>.</>}
      </span>
      <button type="button" className="bsv-posteingang__btn bsv-posteingang__btn--primaer" disabled={laeuft || neu === 0} onClick={() => exportieren(false)}>
        📥 {neu ? `${neu} neue exportieren` : 'Exportieren'}
      </button>
      <button type="button" className="bsv-export__link" disabled={laeuft} onClick={() => exportieren(true)}>
        alle aufgenommenen (auch schon exportierte)
      </button>
      {meldung && (
        <span className="bsv-export__text" role="status" style={{ flexBasis: '100%' }}>
          {meldung}
        </span>
      )}
    </div>
  )
}
