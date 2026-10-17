'use client'

import React, { useEffect, useState } from 'react'

/** Teilen-Leiste: Link kopieren, WhatsApp, Facebook – ohne eingebettete Tracking-Buttons */
export function Teilen({ titel }: { titel: string }) {
  const [kopiert, setKopiert] = useState(false)
  const [url, setUrl] = useState('')
  useEffect(() => setUrl(window.location.href), [])
  const stil: React.CSSProperties = { fontSize: 15, textDecoration: 'none', padding: '10px 16px', borderRadius: 999, background: 'var(--bsv-soft)', color: 'var(--bsv-ink)' }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      <span className="muted" style={{ fontSize: 15, marginRight: 6 }}>
        Teilen
      </span>
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href)
            setKopiert(true)
            setTimeout(() => setKopiert(false), 2000)
          } catch {
            /* Zwischenablage nicht verfügbar */
          }
        }}
        style={{ fontSize: 15, padding: '10px 16px', minHeight: 44, background: kopiert ? '#E8F7EC' : 'var(--bsv-ink)', color: kopiert ? '#248A3D' : '#fff' }}
      >
        {kopiert ? '✓ Link kopiert' : 'Link kopieren'}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${titel} ${url}`)}`} target="_blank" rel="noopener noreferrer" style={stil}>
        WhatsApp
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" style={stil}>
        Facebook
      </a>
    </div>
  )
}
