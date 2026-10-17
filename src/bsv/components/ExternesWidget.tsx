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
export function ExternesWidget({ anbieter, titel, widgetId, typ }: Props) {
  const [aktiv, setAktiv] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aktiv || !ref.current) return
    const el = ref.current
    el.innerHTML = ''
    const script = document.createElement('script')
    if (anbieter === 'FuPa') {
      const root = document.createElement('div')
      root.id = widgetId.startsWith('fp-widget_root-') ? widgetId : `fp-widget_root-${widgetId}`
      el.appendChild(root)
      script.src = 'https://widget-api.fupa.net/vendor/widget.js?v1'
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
        <button type="button" className="btn btn-ghost" onClick={() => setAktiv(true)}>
          Inhalt von {anbieter} laden
        </button>
      </div>
    )
  }
  return <div ref={ref} style={{ minHeight: 200 }} />
}
