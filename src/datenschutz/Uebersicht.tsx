'use client'
import React, { useEffect, useState } from 'react'

import type { Faellig } from './aufraeumen'

/** Oben in „Datenschutz-Fristen“: Was ist gerade über der Frist? + Knopf zum Aufräumen */
export default function Uebersicht() {
  const [faellig, setFaellig] = useState<Faellig[] | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)

  const laden = () =>
    fetch('/api/datenschutz/faellig', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setFaellig(d?.faellig ?? []))
      .catch(() => setFaellig([]))
  useEffect(() => {
    void laden()
  }, [])

  const los = async () => {
    setLaeuft(true)
    try {
      const r = await fetch('/api/datenschutz/aufraeumen', { method: 'POST', credentials: 'include' })
      const d = await r.json()
      setMeldung(`${d.verschoben} Einträge in den Papierkorb verschoben. Dort lassen sie sich noch 30 Tage zurückholen.`)
      await laden()
    } catch {
      setMeldung('Hat nicht geklappt.')
    }
    setLaeuft(false)
  }

  return (
    <section className="bsv-datenschutz">
      <h3>Aktuell über der Frist</h3>
      {faellig === null ? (
        <p>Wird geprüft …</p>
      ) : faellig.length === 0 ? (
        <p className="bsv-datenschutz__ok">✅ Nichts zu tun – alle Einträge sind innerhalb der Fristen.</p>
      ) : (
        <>
          <ul>
            {faellig.map((f) => (
              <li key={f.slug}>
                <strong>{f.anzahl}</strong> {f.label} älter als {f.monate} Monate –{' '}
                <a href={`/admin/collections/${f.slug}`}>ansehen ›</a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={los} disabled={laeuft}>
            {laeuft ? 'Wird aufgeräumt …' : '🧹 Jetzt in den Papierkorb verschieben'}
          </button>
        </>
      )}
      {meldung && <p className="bsv-datenschutz__ok">{meldung}</p>}
      <p className="bsv-datenschutz__klein">
        Gelöschtes landet zuerst im <strong>Papierkorb</strong> (in jeder Liste oben „Papierkorb“) und wird nach 30 Tagen endgültig entfernt.
      </p>
    </section>
  )
}
