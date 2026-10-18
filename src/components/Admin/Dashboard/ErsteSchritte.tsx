'use client'
import { usePreferences } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { tourStarten } from '../Hilfe/bausteine'
import { ERSTE_SCHRITTE_PREF as AUSGEBLENDET_PREF, HILFE_GESEHEN_PREF, TOUR_PREF } from '../prefs'

type Props = {
  hatName: boolean
  zweiFaktor: boolean
  ersteAufgabe?: { erledigt: boolean; label: string; href: string }
}

/** Checkliste für den Start – verschwindet, wenn alles erledigt oder ausgeblendet ist. */
export default function ErsteSchritte({ hatName, zweiFaktor, ersteAufgabe }: Props) {
  const { getPreference, setPreference } = usePreferences()
  const [tour, setTour] = useState<boolean | null>(null)
  const [hilfe, setHilfe] = useState<boolean | null>(null)
  const [weg, setWeg] = useState<boolean | null>(null)

  useEffect(() => {
    void Promise.all([
      getPreference<{ erledigt?: boolean }>(TOUR_PREF),
      getPreference<{ erledigt?: boolean }>(HILFE_GESEHEN_PREF),
      getPreference<{ ausgeblendet?: boolean }>(AUSGEBLENDET_PREF),
    ]).then(([t, h, a]) => {
      setTour(Boolean(t?.erledigt))
      setHilfe(Boolean(h?.erledigt))
      setWeg(Boolean(a?.ausgeblendet))
    })
    const tourFertig = () => setTour(true)
    const hilfeGesehen = () => setHilfe(true)
    window.addEventListener('bsv-tour-erledigt', tourFertig)
    window.addEventListener('bsv-hilfe-gesehen', hilfeGesehen)
    return () => {
      window.removeEventListener('bsv-tour-erledigt', tourFertig)
      window.removeEventListener('bsv-hilfe-gesehen', hilfeGesehen)
    }
  }, [getPreference])

  if (tour === null || weg) return null

  const punkte = [
    { erledigt: hatName, label: 'Deinen Namen eintragen', href: '/admin/account' },
    { erledigt: zweiFaktor, label: 'Zwei-Faktor-Anmeldung einrichten', href: '/login/zwei-faktor?weiter=/admin' },
    { erledigt: tour, label: 'Die Tour ansehen', onClick: tourStarten },
    { erledigt: Boolean(hilfe), label: 'Einmal auf „? Hilfe“ oben rechts klicken', onClick: () => document.querySelector<HTMLButtonElement>('.bsv-hilfe__knopf')?.click() },
    ...(ersteAufgabe ? [ersteAufgabe] : []),
  ]
  const fertig = punkte.filter((p) => p.erledigt).length
  if (fertig === punkte.length) return null

  return (
    <section className="bsv-dash__box bsv-erste-schritte" aria-label="Erste Schritte">
      <div className="bsv-erste-schritte__kopf">
        <h2>Erste Schritte</h2>
        <span>
          {fertig} von {punkte.length} erledigt
        </span>
      </div>
      <div className="bsv-erste-schritte__balken" aria-hidden="true">
        <span style={{ width: `${(fertig / punkte.length) * 100}%` }} />
      </div>
      <ul>
        {punkte.map((p) => (
          <li key={p.label} className={p.erledigt ? 'is-erledigt' : undefined}>
            <span className="bsv-erste-schritte__haken" aria-hidden="true">
              {p.erledigt ? '✓' : ''}
            </span>
            {p.erledigt ? (
              <span>{p.label}</span>
            ) : 'href' in p && p.href ? (
              <a href={p.href}>{p.label} ›</a>
            ) : (
              <button type="button" onClick={'onClick' in p ? p.onClick : undefined}>
                {p.label} ›
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="bsv-erste-schritte__ausblenden"
        onClick={() => {
          setWeg(true)
          void setPreference(AUSGEBLENDET_PREF, { ausgeblendet: true })
        }}
      >
        Ausblenden
      </button>
    </section>
  )
}
