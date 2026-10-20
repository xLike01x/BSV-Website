'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Wünscht der Browser keine Erfassung (Do Not Track / Global Privacy Control)? Dann zählen wir nicht. */
const nichtZaehlen = () => {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string }
  return n.globalPrivacyControl === true || n.doNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1'
}

/** Ein Ereignis an /api/besuch schicken (ohne Cookies, blockiert nie die Seite) */
export function statistikSenden(daten: Record<string, unknown>) {
  try {
    if (nichtZaehlen()) return
    const body = JSON.stringify(daten)
    if (navigator.sendBeacon?.(`/api/besuch`, new Blob([body], { type: 'application/json' }))) return
    void fetch('/api/besuch', { method: 'POST', body, keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }).catch(() => {})
  } catch {
    /* Statistik darf nie stören */
  }
}

// Doppelte Meldungen vermeiden (z. B. React-Entwicklungsmodus, schnelles Hin und Her)
let zuletzt = { pfad: '', zeit: 0 }

/** Zählt jeden Seitenaufruf auf der Website (auch Wechsel ohne Neuladen) */
export function StatistikZaehler() {
  const pfad = usePathname()
  const erster = useRef(true)
  useEffect(() => {
    if (!pfad) return
    if (zuletzt.pfad === pfad && Date.now() - zuletzt.zeit < 2000) return
    zuletzt = { pfad, zeit: Date.now() }
    const utm = new URLSearchParams(window.location.search).get('utm_source') ?? undefined
    // Woher jemand kam, zählt nur beim ersten Aufruf – danach ist es ein Klick innerhalb der Website („intern“)
    statistikSenden({ t: 'aufruf', p: pfad, r: erster.current ? document.referrer || undefined : window.location.origin, u: erster.current ? utm : undefined })
    erster.current = false
  }, [pfad])
  return null
}
