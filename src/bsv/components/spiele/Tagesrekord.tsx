'use client'
import React, { useEffect, useState } from 'react'

import type { Tageswerte } from './melden'

const zahl = (n: number) => n.toLocaleString('de-DE')

/** „Heute in der Spielecke“ – Summen des Tages ohne Namen, aktualisiert sich nach jeder eigenen Runde */
export function Tagesrekord({ elfmeter, hochhalten, memory }: { elfmeter: boolean; hochhalten: boolean; memory: boolean }) {
  const [w, setW] = useState<Tageswerte | null>(null)
  useEffect(() => {
    let aktiv = true
    fetch('/api/spielstatistik/heute', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Tageswerte | null) => aktiv && d && setW(d))
      .catch(() => {})
    const neu = (e: Event) => setW((e as CustomEvent<Tageswerte>).detail)
    window.addEventListener('bsv-spielstatistik', neu)
    return () => {
      aktiv = false
      window.removeEventListener('bsv-spielstatistik', neu)
    }
  }, [])
  if (!w) return <p className="tagesrekord" aria-hidden="true">&nbsp;</p>
  const nichts = (!elfmeter || w.elfmeterSchuesse === 0) && (!hochhalten || w.hochhaltenSpiele === 0) && (!memory || w.memorySpiele === 0)
  const teile: React.ReactNode[] = []
  if (elfmeter) teile.push(<span key="e">⚽ {zahl(w.elfmeterSchuesse)} Elfmeter · {zahl(w.elfmeterTore)} Tore</span>)
  if (hochhalten) teile.push(<span key="h">🤹 Tagesrekord: {zahl(w.hochhaltenRekord)}× hochgehalten</span>)
  if (memory && w.memoryBester > 0) teile.push(<span key="m">🧠 Memory in {zahl(w.memoryBester)} Zügen</span>)
  return (
    <p className="tagesrekord" role="status">
      <strong>Heute in der Spielecke:</strong>{' '}
      {nichts ? (
        'noch keine Spiele – mach den Anfang!'
      ) : (
        teile.map((t, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {t}
          </React.Fragment>
        ))
      )}
    </p>
  )
}
