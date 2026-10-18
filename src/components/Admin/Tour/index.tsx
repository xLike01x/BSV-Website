'use client'
import { usePreferences } from '@payloadcms/ui'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import React, { useCallback, useEffect } from 'react'

import { TOUR_PREF } from '../prefs'
import './tour.scss'

const SCHRITTE: (DriveStep & { element?: string })[] = [
  {
    popover: {
      title: 'Willkommen in der BSV-Verwaltung 👋',
      description: 'In einer Minute zeige ich dir die wichtigsten Stellen. Du kannst die Tour jederzeit beenden und später über „? Hilfe“ wieder starten.',
    },
  },
  { element: '.nav__scroll', popover: { title: 'Alle Bereiche', description: 'Hier links findest du alles, was du bearbeiten darfst – z. B. News, Mediathek oder Teams & Kurse.', side: 'right' } },
  { element: '.bsv-dash__karten', popover: { title: 'Auf einen Blick', description: 'Die wichtigsten Zahlen. Ein Klick auf eine Karte öffnet direkt die passende Liste.', side: 'bottom' } },
  { element: '.bsv-dash__aktionen', popover: { title: 'Schnellzugriff', description: 'Die häufigsten Aufgaben mit einem Klick – z. B. eine News schreiben oder einen Ausfall melden.', side: 'bottom' } },
  { element: '.bsv-dash__teams', popover: { title: 'Dein Team', description: 'Deine Teams mit Direktlinks: News schreiben, Team bearbeiten, Seite ansehen.', side: 'top' } },
  { element: '.bsv-dash__aktivitaeten', popover: { title: 'Was zuletzt passiert ist', description: 'Neue Anträge, veröffentlichte News, gemeldete Ausfälle – mit einem Klick öffnest du den Eintrag.', side: 'left' } },
  { element: '.bsv-erste-schritte', popover: { title: 'Erste Schritte', description: 'Eine kleine Checkliste für den Start. Sie verschwindet, wenn alles erledigt ist.', side: 'top' } },
  { element: '.bsv-hilfe__knopf', popover: { title: 'Hilfe auf jeder Seite', description: 'Unsicher? Hier steht für jeden Bereich, was du dort machen kannst – mit Schritt-für-Schritt-Anleitungen.', side: 'bottom', align: 'end' } },
  { element: '.bsv-nav-person', popover: { title: 'Dein Konto', description: 'Hier änderst du Namen, E-Mail und Passwort.', side: 'right' } },
  {
    element: '.bsv-dash__website',
    popover: { title: 'Zur Website', description: 'So siehst du, wie alles für Besucher aussieht. Viel Spaß – und keine Angst: Entwürfe sieht niemand außer euch! 💚', side: 'bottom', align: 'end' },
  },
]

/** Geführte Tour über das Dashboard. Startet beim ersten Besuch automatisch. */
export default function Tour() {
  const { getPreference, setPreference } = usePreferences()

  const starten = useCallback(() => {
    const sichtbar = (sel?: string) => {
      if (!sel) return true
      const el = document.querySelector<HTMLElement>(sel)
      return Boolean(el && el.offsetParent !== null)
    }
    const schritte = SCHRITTE.filter((s) => sichtbar(s.element as string | undefined))
    const d = driver({
      showProgress: true,
      progressText: '{{current}} von {{total}}',
      nextBtnText: 'Weiter ›',
      prevBtnText: '‹ Zurück',
      doneBtnText: 'Fertig',
      popoverClass: 'bsv-tour',
      allowClose: true,
      steps: schritte,
      onDestroyed: () => {
        void setPreference(TOUR_PREF, { erledigt: true })
        window.dispatchEvent(new CustomEvent('bsv-tour-erledigt'))
      },
    })
    d.drive()
  }, [setPreference])

  useEffect(() => {
    const hoeren = () => starten()
    window.addEventListener('bsv-tour-start', hoeren)

    const url = new URL(window.location.href)
    let timer: ReturnType<typeof setTimeout> | undefined
    if (url.searchParams.get('tour') === '1') {
      url.searchParams.delete('tour')
      window.history.replaceState(null, '', url.toString())
      timer = setTimeout(starten, 600)
    } else {
      void getPreference<{ erledigt?: boolean } | undefined>(TOUR_PREF).then((p) => {
        if (!p?.erledigt) timer = setTimeout(starten, 900)
      })
    }
    return () => {
      window.removeEventListener('bsv-tour-start', hoeren)
      if (timer) clearTimeout(timer)
    }
  }, [getPreference, starten])

  return (
    <button type="button" className="bsv-dash__btn" onClick={starten}>
      🧭 Tour starten
    </button>
  )
}
