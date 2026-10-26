'use client'
import React, { useEffect, useState } from 'react'

import type { Tageswerte } from './melden'

const zahl = (n: number) => n.toLocaleString('de-DE')

/** „Heute in der Spielecke“ – Summen des Tages ohne Namen, aktualisiert sich nach jeder eigenen Runde */
export function Tagesrekord({ elfmeter, hochhalten }: { elfmeter: boolean; hochhalten: boolean }) {
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
  const nichts = (!elfmeter || w.elfmeterSchuesse === 0) && (!hochhalten || w.hochhaltenSpiele === 0)
  return (
    <p className="tagesrekord" role="status">
      <strong>Heute in der Spielecke:</strong>{' '}
      {nichts ? (
        'noch keine Spiele – mach den Anfang!'
      ) : (
        <>
          {elfmeter && (
            <span>
              ⚽ {zahl(w.elfmeterSchuesse)} Elfmeter · {zahl(w.elfmeterTore)} Tore
            </span>
          )}
          {elfmeter && hochhalten && <span aria-hidden="true"> · </span>}
          {hochhalten && <span>🤹 Tagesrekord: {zahl(w.hochhaltenRekord)}× hochgehalten</span>}
        </>
      )}
    </p>
  )
}
