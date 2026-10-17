import React from 'react'

/**
 * Anfahrt ohne eingebettete Fremdkarte: Ein Klick öffnet die Adresse in OpenStreetMap
 * oder der Karten-App. So werden beim Seitenaufruf keine Daten an Dritte übertragen.
 */
export function Karte({ titel, adresse }: { titel: string; adresse: string }) {
  const q = encodeURIComponent(adresse)
  return (
    <div style={{ borderRadius: 24, background: 'var(--bsv-green-tint)', padding: 32, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 220, justifyContent: 'center' }}>
      <span aria-hidden="true" style={{ fontSize: 36 }}>
        📍
      </span>
      <strong style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{titel}</strong>
      <span className="muted">{adresse}</span>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        <a href={`https://www.openstreetmap.org/search?query=${q}`} target="_blank" rel="noopener noreferrer" className="btn btn-white">
          Karte öffnen ↗
        </a>
        <a href={`https://maps.apple.com/?q=${q}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          Route planen ↗
        </a>
      </div>
    </div>
  )
}
