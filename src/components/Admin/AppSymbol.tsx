'use client'
import { useEffect } from 'react'

/** Verwaltung als App auf den Startbildschirm: Manifest, Symbol und Farbe einmalig in den Seitenkopf schreiben */
export default function AppSymbol() {
  useEffect(() => {
    const kopf = document.head
    const setzen = (tag: 'link' | 'meta', attr: Record<string, string>) => {
      const key = tag === 'link' ? `link[rel="${attr.rel}"]` : `meta[name="${attr.name}"]`
      if (kopf.querySelector(key)) return
      const el = document.createElement(tag)
      Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, v))
      kopf.appendChild(el)
    }
    setzen('link', { rel: 'manifest', href: '/verwaltung.webmanifest' })
    setzen('link', { rel: 'apple-touch-icon', href: '/app-symbol-180.png' })
    setzen('meta', { name: 'theme-color', content: '#157a43' })
    setzen('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' })
    setzen('meta', { name: 'apple-mobile-web-app-title', content: 'BSV Verwaltung' })
  }, [])
  return null
}
