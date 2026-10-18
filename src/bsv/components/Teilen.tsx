'use client'
import React, { useEffect, useState } from 'react'

/**
 * Teilen-Knopf: auf dem Handy das normale Teilen-Menü (WhatsApp, Signal, …),
 * am Computer WhatsApp, Facebook, E-Mail und „Link kopieren“.
 */
export function Teilen({ titel, pfad, text, klein }: { titel: string; pfad?: string; text?: string; klein?: boolean }) {
  const [url, setUrl] = useState('')
  const [offen, setOffen] = useState(false)
  const [kopiert, setKopiert] = useState(false)
  const [nativ, setNativ] = useState(false)
  useEffect(() => {
    setUrl(pfad ? new URL(pfad, window.location.origin).toString() : window.location.href)
    setNativ(typeof navigator !== 'undefined' && 'share' in navigator && window.matchMedia('(pointer: coarse)').matches)
  }, [pfad])

  const teilen = async () => {
    if (nativ) {
      try {
        await navigator.share({ title: titel, text: text ?? titel, url })
        return
      } catch {
        /* abgebrochen */
      }
    }
    setOffen((o) => !o)
  }
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 2000)
    } catch {
      /* ignorieren */
    }
  }
  const nachricht = `${text ?? titel} ${url}`

  return (
    <span className="teilen">
      <button type="button" className={klein ? 'teilen-knopf teilen-knopf--klein' : 'teilen-knopf'} onClick={teilen} aria-expanded={offen}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        Teilen
      </button>
      {offen && (
        <span className="teilen-menue" role="menu">
          <a role="menuitem" href={`https://wa.me/?text=${encodeURIComponent(nachricht)}`} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a role="menuitem" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a role="menuitem" href={`mailto:?subject=${encodeURIComponent(titel)}&body=${encodeURIComponent(nachricht)}`}>E-Mail</a>
          <button type="button" role="menuitem" onClick={kopieren}>
            {kopiert ? '✓ Kopiert' : 'Link kopieren'}
          </button>
        </span>
      )}
    </span>
  )
}
