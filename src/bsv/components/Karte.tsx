'use client'
import React, { useState } from 'react'

/**
 * Anfahrt: Karte von OpenStreetMap lädt erst nach Klick (vorher gehen keine Daten an Dritte).
 * Ohne Koordinaten gibt es nur die Knöpfe zum Öffnen in der Karten-App.
 */
export function Karte({ titel, adresse, lat, lon }: { titel: string; adresse: string; lat?: number | null; lon?: number | null }) {
  const [an, setAn] = useState(false)
  const q = encodeURIComponent(adresse)
  const hatPunkt = typeof lat === 'number' && typeof lon === 'number'
  const ziel = hatPunkt ? `${lat},${lon}` : q
  const d = 0.006
  const bbox = hatPunkt ? `${lon! - d * 1.6},${lat! - d},${lon! + d * 1.6},${lat! + d}` : ''
  return (
    <div className="karte">
      <div className="karte-kopf">
        <span aria-hidden="true" style={{ fontSize: 30 }}>
          📍
        </span>
        <div>
          <strong>{titel}</strong>
          <span className="muted">{adresse}</span>
        </div>
      </div>
      {hatPunkt && (
        <div className="karte-flaeche">
          {an ? (
            <iframe
              title={`Karte: ${titel}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <button type="button" onClick={() => setAn(true)}>
              <span aria-hidden="true">🗺️</span>
              <strong>Karte anzeigen</strong>
              <small>Wird von OpenStreetMap geladen. Dabei wird deine IP-Adresse dorthin übertragen.</small>
            </button>
          )}
        </div>
      )}
      <div className="karte-knoepfe">
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${ziel}`} target="_blank" rel="noopener noreferrer" className="btn btn-white">
          Route planen ↗
        </a>
        <a href={hatPunkt ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}` : `https://www.openstreetmap.org/search?query=${q}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          In OpenStreetMap ↗
        </a>
        <a href={`https://maps.apple.com/?q=${encodeURIComponent(titel)}&${hatPunkt ? `ll=${ziel}` : `address=${q}`}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          Apple Karten ↗
        </a>
      </div>
    </div>
  )
}
