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
      const r = await fetch('/api/datenschutz/aufraeumen', {
        method: 'POST',
        credentials: 'include',
      })
      const d = await r.json()
      setMeldung(
        `${d.verschoben} Einträge aufgeräumt. Aus dem Papierkorb lassen sie sich noch 30 Tage zurückholen (liegengebliebene Passanträge werden direkt gelöscht).`,
      )
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
        <p className="bsv-datenschutz__ok">
          ✅ Nichts zu tun – alle Einträge sind innerhalb der Fristen.
        </p>
      ) : (
        <>
          <ul>
            {faellig.map((f) => (
              <li key={f.id}>
                <strong>{f.anzahl}</strong> {f.label} – älter als {f.monate} Monate –{' '}
                <a href={f.link ?? `/admin/collections/${f.slug}`}>ansehen ›</a>
                {f.hinweis && (
                  <em>
                    {' '}
                    (nur Hinweis: bitte selbst prüfen und ggf. löschen – wird nie automatisch
                    entfernt)
                  </em>
                )}
              </li>
            ))}
          </ul>
          {faellig.some((f) => !f.hinweis) && (
            <button type="button" onClick={los} disabled={laeuft}>
              {laeuft ? 'Wird aufgeräumt …' : '🧹 Jetzt aufräumen'}
            </button>
          )}
        </>
      )}
      {meldung && <p className="bsv-datenschutz__ok">{meldung}</p>}
      <p className="bsv-datenschutz__klein">
        Ablauf: Fällige Einträge kommen in den <strong>Papierkorb</strong> (30 Tage zurückholbar),
        danach in den Web-Admin-Papierkorb und werden dort nach der Frist unten
        („Web-Admin-Papierkorb – persönliche Daten“) endgültig gelöscht. Bei Mitgliedsanträgen wird
        die IBAN schon beim Wechsel in den Web-Admin-Papierkorb entfernt.
      </p>
    </section>
  )
}
