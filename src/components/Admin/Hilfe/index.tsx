'use client'
import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React, { lazy, Suspense, useEffect, useState } from 'react'

import './hilfe.scss'

// Inhalt erst beim Öffnen laden: Hilfetexte, Anleitungen und FAQ sind über 200 KB – die brauchen nicht
// auf jeder Seite der Verwaltung mitgeladen zu werden
const HilfePanel = lazy(() => import('./Panel'))

/** „? Hilfe“-Knopf oben rechts: erklärt in einfachen Worten den aktuellen Bereich. */
export default function Hilfe() {
  const pfad = usePathname() ?? '/admin'
  const { user } = useAuth<{ roles?: string[] }>()
  // Offen nur auf der Seite, auf der geöffnet wurde – nach einem Seitenwechsel automatisch zu
  const [offenAuf, setOffenAuf] = useState<string | null>(null)
  const offen = offenAuf === pfad
  const setOffen = (an: boolean) => setOffenAuf(an ? pfad : null)
  useEffect(() => {
    if (!offen) return
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && setOffenAuf(null)
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [offen])

  return (
    <>
      <button type="button" className="bsv-hilfe__knopf" onClick={() => setOffen(true)} aria-haspopup="dialog" aria-expanded={offen} aria-label="Hilfe">
        <span aria-hidden="true">?</span> <span className="bsv-hilfe__knopf-text">Hilfe</span>
      </button>
      {offen && (
        <Suspense fallback={null}>
          <HilfePanel pfad={pfad} rollen={user?.roles} schliessen={() => setOffenAuf(null)} />
        </Suspense>
      )}
    </>
  )
}
