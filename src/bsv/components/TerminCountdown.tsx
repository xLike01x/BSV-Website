'use client'
import React, { useEffect, useState } from 'react'

const berlinTag = (ms: number) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
const mz = (n: number, eins: string, mehr: string) => `${n} ${n === 1 ? eins : mehr}`

/**
 * Kleiner Countdown in jeder Termin-Karte (/termine).
 * Zählt jede halbe Minute weiter; am Tag selbst „Heute ist es so weit!“, danach verschwindet er.
 */
export function TerminCountdown({ beginn, ende, jetzt: serverJetzt }: { beginn: string; ende: string | null; jetzt: number }) {
  const [jetzt, setJetzt] = useState(serverJetzt)
  useEffect(() => {
    const tick = () => setJetzt(Date.now())
    const start = setTimeout(tick, 0)
    const t = setInterval(tick, 30_000)
    return () => {
      clearTimeout(start)
      clearInterval(t)
    }
  }, [])

  const b = new Date(beginn).getTime()
  const vorbei = ende ? new Date(ende).getTime() <= jetzt : berlinTag(b) < berlinTag(jetzt)
  if (vorbei) return null
  const rest = Math.max(0, b - jetzt)
  if (rest === 0) return <p className="termin-countdown">🎉 Heute ist es so weit!</p>
  const tage = Math.floor(rest / 86_400_000)
  const std = Math.floor((rest % 86_400_000) / 3_600_000)
  const min = Math.floor((rest % 3_600_000) / 60_000)
  const lang = `Noch ${mz(tage, 'Tag', 'Tage')}, ${mz(std, 'Stunde', 'Stunden')} und ${mz(min, 'Minute', 'Minuten')}`
  return (
    <p className="termin-countdown" aria-label={lang}>
      <span aria-hidden="true">
        ⏳ Noch {tage > 0 && <strong>{mz(tage, 'Tag', 'Tage')}</strong>}
        {tage > 0 && ' · '}
        <strong>{std} Std.</strong> · <strong>{min} Min.</strong>
      </span>
    </p>
  )
}
