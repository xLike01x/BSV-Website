'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

type Props = {
  kicker: string
  titel: string
  text: string
  linkText: string
  href: string
  beginn: string
  ende: string | null
  /** Datum und Uhrzeit, schon auf dem Server formatiert (z. B. „Samstag, 4. Juli · 14:00 Uhr“) */
  wann: string
  /** „Heute“ als Berliner Datum (JJJJ-MM-TT) und Uhrzeit des Servers – damit Server und Browser beim ersten Zeichnen übereinstimmen */
  jetzt: number
}

const berlinTag = (ms: number) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })

/**
 * Veranstaltungs-Countdown auf der Startseite (Texte & Bilder → Startseite → Veranstaltungs-Countdown).
 * Zählt jede halbe Minute weiter; am Tag selbst „Heute ist es so weit!“, danach verschwindet die Kachel.
 */
export function Countdown({ kicker, titel, text, linkText, href, beginn, ende, wann, jetzt: serverJetzt }: Props) {
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
  const tage = Math.floor(rest / 86_400_000)
  const stunden = Math.floor((rest % 86_400_000) / 3_600_000)
  const minuten = Math.floor((rest % 3_600_000) / 60_000)
  const laeuft = rest === 0

  const felder: [number, string, string][] = [
    [tage, 'Tag', 'Tage'],
    [stunden, 'Stunde', 'Stunden'],
    [minuten, 'Minute', 'Minuten'],
  ]
  const ansage = laeuft ? `${titel}: heute ist es so weit` : `Noch ${tage} ${tage === 1 ? 'Tag' : 'Tage'}, ${stunden} ${stunden === 1 ? 'Stunde' : 'Stunden'} und ${minuten} ${minuten === 1 ? 'Minute' : 'Minuten'} bis ${titel}`

  return (
    <section className="countdown-sec" aria-label={`Countdown: ${titel}`}>
      <div className="countdown rv">
        <div className="countdown-text">
          <p className="countdown-kicker">{kicker}</p>
          <h2 className="countdown-titel">{titel}</h2>
          <p className="countdown-wann">{wann}</p>
          {text && <p className="countdown-info">{text}</p>}
          <Link href={href} className="countdown-link">
            {linkText}
          </Link>
        </div>
        {laeuft ? (
          <>
            <p className="countdown-heute">Heute ist es so weit!</p>
            {/* Konfetti in Vereinsfarben, einmal beim Laden (Website-Aufbau → Animationen) */}
            <span className="countdown-konfetti" aria-hidden="true">
              {Array.from({ length: 26 }, (_, i) => (
                <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--v': `${(i % 8) * 0.12}s`, '--r': `${(i * 53) % 360}deg` } as React.CSSProperties} />
              ))}
            </span>
          </>
        ) : (
          <div className="countdown-zahlen" role="img" aria-label={ansage}>
            <span className="countdown-noch" aria-hidden="true">
              Noch
            </span>
            {felder.map(([n, eins, mehr]) => (
              <span key={mehr} className="countdown-feld" aria-hidden="true">
                {/* key = Zahl: ändert sie sich, wird sie neu gezeichnet und klappt um wie eine Anzeigetafel */}
                <strong key={n}>{n}</strong>
                <small>{n === 1 ? eins : mehr}</small>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
