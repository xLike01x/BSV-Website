'use client'
import { useEffect, useState } from 'react'

/**
 * Für „Auf der Website zeigen“ aus den Website-Texten: ?zeigen=<Text> sucht den Text auf der Seite,
 * scrollt dorthin und lässt ihn kurz aufleuchten. Ohne Parameter passiert nichts.
 */
export function TextZeigen() {
  const [hinweis, setHinweis] = useState<string | null>(null)

  useEffect(() => {
    const suche = new URLSearchParams(window.location.search).get('zeigen')
    if (!suche) return
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
    const ziel = norm(suche)
    const finden = (): HTMLElement | null => {
      const walker = document.createTreeWalker(document.querySelector('main') ?? document.body, NodeFilter.SHOW_ELEMENT)
      let bestes: HTMLElement | null = null
      let laenge = Infinity
      for (let n = walker.currentNode as HTMLElement | null; n; n = walker.nextNode() as HTMLElement | null) {
        const t = norm(n.textContent ?? '')
        if (t.includes(ziel) && t.length < laenge && n.offsetParent !== null) {
          bestes = n
          laenge = t.length
        }
      }
      return bestes
    }
    // Kurz warten, bis Bilder/Animationen stehen
    const zeit = window.setTimeout(() => {
      const el = finden() ?? (norm(document.querySelector('footer')?.textContent ?? '').includes(ziel) ? document.querySelector('footer') : null)
      if (!el) {
        setHinweis('Dieser Text ist gerade nicht zu sehen – er erscheint nur in bestimmten Situationen, oder die Änderung ist noch nicht gespeichert.')
        return
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bsv-text-zeigen')
      window.setTimeout(() => el.classList.remove('bsv-text-zeigen'), 4500)
    }, 600)
    return () => window.clearTimeout(zeit)
  }, [])

  if (!hinweis) return null
  return (
    <div role="status" className="bsv-text-zeigen-hinweis">
      {hinweis}
      <button type="button" onClick={() => setHinweis(null)} aria-label="Schließen">
        ×
      </button>
    </div>
  )
}
