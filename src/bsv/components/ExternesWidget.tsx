'use client'

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  anbieter: 'FuPa' | 'FUSSBALL.DE'
  titel: string
  /** FuPa: Widget-ID (fp-widget_root-…); FUSSBALL.DE: Widget-ID aus dem Widget-Baukasten */
  widgetId: string
  typ?: 'spielplan' | 'tabelle'
}

/**
 * Datenschutzfreundliche Einbindung: Das fremde Skript lädt erst nach Klick.
 * Vorher werden keine Daten an FuPa oder FUSSBALL.DE übertragen.
 */
const SCHLUESSEL = (anbieter: string) => `bsv-extern-${anbieter.toLowerCase()}`
const EREIGNIS = 'bsv-extern-erlaubt'

/** „Immer laden“ merkt sich der Browser des Besuchers (kein Cookie, nur auf diesem Gerät) */
const merken = (anbieter: string, an: boolean) => {
  try {
    if (an) localStorage.setItem(SCHLUESSEL(anbieter), 'ja')
    else localStorage.removeItem(SCHLUESSEL(anbieter))
  } catch {
    // privater Modus o. Ä.: dann eben nur für diesen Besuch
  }
}
const gemerkt = (anbieter: string) => {
  try {
    return localStorage.getItem(SCHLUESSEL(anbieter)) === 'ja'
  } catch {
    return false
  }
}

export function ExternesWidget({ anbieter, titel, widgetId, typ }: Props) {
  const [aktiv, setAktiv] = useState(false)
  const [immer, setImmer] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Schon einmal „Immer laden“ gewählt? Dann sofort laden. Ein Klick lädt alle Widgets desselben Anbieters auf der Seite.
  useEffect(() => {
    if (gemerkt(anbieter)) {
      setImmer(true)
      setAktiv(true)
    }
    const los = (e: Event) => (e as CustomEvent<string>).detail === anbieter && setAktiv(true)
    window.addEventListener(EREIGNIS, los)
    return () => window.removeEventListener(EREIGNIS, los)
  }, [anbieter])

  const laden = (dauerhaft: boolean) => {
    if (dauerhaft) {
      merken(anbieter, true)
      setImmer(true)
    }
    setAktiv(true)
    window.dispatchEvent(new CustomEvent(EREIGNIS, { detail: anbieter }))
  }

  useEffect(() => {
    if (!aktiv || !ref.current) return
    const el = ref.current
    el.innerHTML = ''
    const script = document.createElement('script')
    if (anbieter === 'FuPa') {
      const root = document.createElement('div')
      // Auch ältere Einträge, in denen noch der komplette FuPa-Code steht, funktionieren
      const id = widgetId.match(/fp-widget_root-([A-Za-z0-9_-]+)/)?.[1] ?? widgetId.trim()
      root.id = `fp-widget_root-${id}`
      el.appendChild(root)
      // Nach Seitenwechsel neu laden, damit FuPa das neue Widget findet
      script.src = `https://widget-api.fupa.net/vendor/widget.js?v1&t=${Date.now()}`
    } else {
      const root = document.createElement('div')
      root.className = 'fussballde_widget'
      root.dataset.id = widgetId
      root.dataset.type = typ === 'tabelle' ? 'table' : 'team-matches'
      el.appendChild(root)
      script.src = 'https://www.fussball.de/widgets.js'
    }
    script.async = true
    el.appendChild(script)
  }, [aktiv, anbieter, widgetId, typ])

  if (!aktiv) {
    return (
      <div style={{ border: '1.5px dashed var(--bsv-line)', borderRadius: 24, padding: 32, textAlign: 'center', color: 'var(--bsv-muted)' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--bsv-ink)' }}>{titel}</p>
        <p style={{ margin: '0 0 16px', fontSize: 14 }}>Wird von {anbieter} geladen. Dabei wird deine IP-Adresse an {anbieter} übertragen.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={() => laden(false)}>
            Einmal laden
          </button>
          <button type="button" className="btn btn-primary" onClick={() => laden(true)}>
            Immer laden
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13 }}>„Immer laden“ merkt sich dieser Browser – dann erscheinen {anbieter}-Inhalte künftig sofort.</p>
      </div>
    )
  }
  return (
    <div>
      <div ref={ref} style={{ minHeight: 200 }} />
      {immer && (
        <button
          type="button"
          onClick={() => {
            merken(anbieter, false)
            setImmer(false)
          }}
          style={{ font: 'inherit', fontSize: 13, background: 'none', border: 0, padding: 0, marginTop: 8, color: 'var(--bsv-muted)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {anbieter} nicht mehr automatisch laden
        </button>
      )}
    </div>
  )
}
