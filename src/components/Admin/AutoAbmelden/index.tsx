'use client'
import { useAuth } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import './auto-abmelden.scss'

const SPEICHER = 'bsv-letzte-aktivitaet'
const KANAL = 'bsv-aktivitaet'
const EREIGNISSE = ['mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

const lesen = () => {
  try {
    const t = Number(localStorage.getItem(SPEICHER)) || 0
    // Werte aus der Zukunft (Uhr des Rechners wurde zurückgestellt) nicht übernehmen – sonst verzögert sich die Abmeldung
    return t > Date.now() + 60_000 ? 0 : t
  } catch {
    return 0
  }
}
const schreiben = (t: number) => {
  try {
    localStorage.setItem(SPEICHER, String(t))
  } catch {
    /* privates Fenster: dann zählt nur dieser Tab */
  }
}

/**
 * Meldet nach X Minuten ohne Klick, Taste oder Scrollen automatisch ab – vorher Warnung mit Countdown.
 * Gilt für alle Tabs gemeinsam (letzte Aktivität im Browser-Speicher). Zeiten: Einstellungen → „Sicherheit“ → Reiter „Einstellungen“.
 */
export default function AutoAbmelden({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth()
  const [zeiten, setZeiten] = useState<{ minuten: number; warnen: number; aus: boolean } | null>(null)
  const [rest, setRest] = useState<number | null>(null) // Sekunden bis zur Abmeldung, wenn die Warnung sichtbar ist
  const letzte = useRef(Date.now())
  const geschrieben = useRef(0)
  const laeuft = useRef(false)
  // Zweiter Weg zwischen den Tabs, falls der Browser-Speicher gesperrt ist (privates Fenster o. Ä.)
  const kanal = useRef<BroadcastChannel | null>(null)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const k = new BroadcastChannel(KANAL)
    k.onmessage = (e) => {
      const t = Number(e.data)
      if (t && t <= Date.now() + 60_000 && t > letzte.current) letzte.current = t
    }
    kanal.current = k
    return () => k.close()
  }, [])

  // Einstellungen laden
  useEffect(() => {
    if (!user) return
    fetch('/api/globals/sicherheit?depth=0', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setZeiten({ minuten: Number(d?.minuten) || 30, warnen: Number(d?.warnenMinuten) || 5, aus: Boolean(d?.aus) }))
      .catch(() => setZeiten({ minuten: 30, warnen: 5, aus: false }))
  }, [user])

  const abmelden = useCallback(async () => {
    if (laeuft.current) return
    laeuft.current = true
    try {
      localStorage.removeItem(SPEICHER)
    } catch {
      /* egal */
    }
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => null)
    window.location.href = '/login?abgemeldet=inaktiv&weiter=/admin'
  }, [])

  const aktiv = useCallback(() => {
    const jetzt = Date.now()
    letzte.current = jetzt
    // Nicht bei jeder Mausbewegung in den Speicher schreiben
    if (jetzt - geschrieben.current > 5000) {
      geschrieben.current = jetzt
      schreiben(jetzt)
      kanal.current?.postMessage(jetzt)
    }
  }, [])

  // Aktivität beobachten
  useEffect(() => {
    if (!user || !zeiten || zeiten.aus) return
    // Beim Öffnen: War der Browser schon zu lange untätig (z. B. Tab geschlossen und später wieder geöffnet)?
    // Eine frische Anmeldung setzt die Uhr selbst zurück (LoginForm schreibt den Zeitpunkt).
    const gespeichert = lesen()
    if (gespeichert && Date.now() - gespeichert > zeiten.minuten * 60_000) {
      void abmelden()
    } else {
      aktiv()
      schreiben(Date.now())
    }
    for (const e of EREIGNISSE) window.addEventListener(e, aktiv, { passive: true, capture: true })
    return () => {
      for (const e of EREIGNISSE) window.removeEventListener(e, aktiv, { capture: true })
    }
  }, [user, zeiten, aktiv, abmelden])

  // Uhr: jede Sekunde prüfen (auch Aktivität in anderen Tabs zählt)
  useEffect(() => {
    if (!user || !zeiten || zeiten.aus) return
    const t = window.setInterval(() => {
      const zuletzt = Math.max(letzte.current, lesen())
      const uebrig = Math.round((zuletzt + zeiten.minuten * 60_000 - Date.now()) / 1000)
      if (uebrig <= 0) return void abmelden()
      setRest(uebrig <= zeiten.warnen * 60 ? uebrig : null)
    }, 1000)
    return () => window.clearInterval(t)
  }, [user, zeiten, abmelden])

  const bleiben = async () => {
    const jetzt = Date.now()
    letzte.current = jetzt
    geschrieben.current = jetzt
    schreiben(jetzt)
    setRest(null)
    // Anmeldung gleich mit verlängern
    await fetch('/api/users/refresh-token', { method: 'POST', credentials: 'include' }).catch(() => null)
  }

  const mm = rest !== null ? `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}` : ''

  return (
    <>
      {children}
      {rest !== null && (
        <div className="bsv-auto-abmelden" role="alertdialog" aria-modal="true" aria-labelledby="bsv-auto-abmelden-titel">
          <div className="bsv-auto-abmelden__box">
            <span className="bsv-auto-abmelden__symbol" aria-hidden="true">
              ⏳
            </span>
            <h2 id="bsv-auto-abmelden-titel">Bist du noch da?</h2>
            <p>
              Du wirst wegen Inaktivität in <strong className="bsv-auto-abmelden__zeit">{mm}</strong> Minuten automatisch abgemeldet. Nicht gespeicherte Änderungen gehen dabei verloren.
            </p>
            <div className="bsv-auto-abmelden__knoepfe">
              <button type="button" className="bsv-auto-abmelden__bleiben" onClick={bleiben} onKeyDown={(e) => e.key === 'Escape' && void bleiben()} autoFocus>
                Angemeldet bleiben
              </button>
              <button type="button" className="bsv-auto-abmelden__raus" onClick={() => void abmelden()}>
                Jetzt abmelden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
