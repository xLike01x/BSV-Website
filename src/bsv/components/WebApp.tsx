'use client'
import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { T } from './Text'

/** Chrome/Edge/Android: Ereignis, mit dem der Browser den eigenen „Installieren“-Dialog anbietet */
type InstallEreignis = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Texte aus Texte & Bilder → Weitere Seiten → Web-App */
export type WebAppTexte = {
  label?: string | null
  titel?: string | null
  text?: string | null
  knopf?: string | null
  fusszeile?: string | null
  trainingszeiten?: string | null
} | null

/** Gemeinsam für alle Knöpfe auf der Seite: der Browser erlaubt prompt() nur einmal pro Ereignis */
let gemerkt: InstallEreignis | null = null

const STANDALONE = '(display-mode: standalone)'
const alsAppGeoeffnet = () =>
  window.matchMedia(STANDALONE).matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
const abonnieren = (melden: () => void) => {
  const m = window.matchMedia(STANDALONE)
  m.addEventListener('change', melden)
  return () => m.removeEventListener('change', melden)
}

/**
 * Web-App für alle Besucher (ohne Anmeldung). Meldet den Service Worker an (nur Offline-Seite, siehe public/sw.js)
 * und zeigt einen Installieren-Hinweis:
 * - art="kachel": Kachel auf der Startseite
 * - art="zeile": kurze Zeile (Trainingszeiten)
 * - art="fuss": Link in der Fußzeile
 * Mit Browser-Unterstützung (Chrome, Edge, Android) öffnet der Knopf direkt den Installieren-Dialog,
 * sonst eine kurze Anleitung (iPhone, Android, PC). In der installierten App ist alles ausgeblendet.
 */
export function WebApp({ art, texte }: { art: 'kachel' | 'zeile' | 'fuss'; texte?: WebAppTexte }) {
  // Auf dem Server (und in der installierten App) nichts zeigen – erst im Browser entscheiden
  const istApp = useSyncExternalStore(abonnieren, alsAppGeoeffnet, () => true)
  const [installiert, setInstalliert] = useState(false)
  const titelId = useId()
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    // Service Worker nur in sicherer Umgebung (HTTPS oder localhost) – sonst lehnt der Browser ihn ohnehin ab
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }
    const merken = (e: Event) => {
      e.preventDefault() // eigene Leiste des Browsers unterdrücken – installiert wird nur auf Klick
      gemerkt = e as InstallEreignis
    }
    const fertig = () => {
      gemerkt = null
      setInstalliert(true)
    }
    window.addEventListener('beforeinstallprompt', merken)
    window.addEventListener('appinstalled', fertig)
    return () => {
      window.removeEventListener('beforeinstallprompt', merken)
      window.removeEventListener('appinstalled', fertig)
    }
  }, [])

  if (istApp || installiert) return null

  const klick = async () => {
    const e = gemerkt
    if (e) {
      gemerkt = null
      await e.prompt().catch(() => {})
      return
    }
    dialog.current?.showModal()
  }

  const knopfText = texte?.knopf || 'App installieren'

  return (
    <>
      {art === 'kachel' && (
        <div className="tile rv webapp-kachel">
          <div style={{ flex: '1 1 320px' }}>
            <p className="tile-label" style={{ color: 'var(--bsv-lavender)' }}>
              {texte?.label}
            </p>
            <h3 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>
              <T text={texte?.titel} werte={{}} />
            </h3>
            <p
              style={{ margin: '12px 0 0', maxWidth: 460, color: 'var(--bsv-ink-2)', fontSize: 17 }}
            >
              <T text={texte?.text} werte={{}} />
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 20 }}
              onClick={klick}
            >
              {knopfText}
            </button>
          </div>
          <div aria-hidden="true" className="webapp-symbole">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
              i === 5 ? (
                <span key={i} className="webapp-symbol webapp-symbol--bsv">
                  <img src="/app-icon-192.png" alt="" width={64} height={64} />
                  <small>BSV 1919</small>
                </span>
              ) : (
                <span key={i} className="webapp-symbol" />
              ),
            )}
          </div>
        </div>
      )}
      {art === 'zeile' && (
        <p className="webapp-zeile in2">
          {texte?.trainingszeiten}{' '}
          <button type="button" className="webapp-link" onClick={klick}>
            {knopfText} ›
          </button>
        </p>
      )}
      {art === 'fuss' && (
        <>
          {' · '}
          <button type="button" className="webapp-link webapp-link--fuss" onClick={klick}>
            {texte?.fusszeile || 'Als App installieren'}
          </button>
        </>
      )}
      {/* Dialog direkt in <body>: der Fußzeilen-Link steht in einem Absatz, darin dürfen keine Überschriften stehen */}
      {createPortal(
        <dialog
          ref={dialog}
          className="webapp-dialog"
          aria-labelledby={titelId}
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        >
          <div className="webapp-dialog-inner">
            <h2 id={titelId}>BSV 1919 als App</h2>
            <p>
              Mit Vereinswappen auf dem Startbildschirm, ohne Browser-Leiste – kostenlos, ohne
              App-Store und ohne Anmeldung.
            </p>
            <dl>
              <dt>iPhone / iPad (Safari)</dt>
              <dd>
                Unten auf „Teilen“ (Quadrat mit Pfeil) tippen → „Zum Home-Bildschirm“ →
                „Hinzufügen“.
              </dd>
              <dt>Android (Chrome)</dt>
              <dd>
                Oben rechts auf ⋮ tippen → „App installieren“ oder „Zum Startbildschirm hinzufügen“.
              </dd>
              <dt>PC (Chrome oder Edge)</dt>
              <dd>
                In der Adressleiste rechts auf das Symbol „App installieren“ klicken – oder im Menü
                ⋮ → „Installieren“.
              </dd>
            </dl>
            <form method="dialog">
              <button type="submit" className="btn btn-primary">
                Verstanden
              </button>
            </form>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  )
}
