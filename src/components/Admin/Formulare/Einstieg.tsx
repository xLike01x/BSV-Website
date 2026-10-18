'use client'
import { usePreferences } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { Zusammenhang } from '../Hilfe/Zusammenhang'
import { VORLAGEN } from './vorlagen'
import '../Hilfe/hilfe.scss'
import './formulare.scss'

const PREF = 'bsv-formulare-einstieg'

/** Über der Formular-Liste: Wozu sind Formulare da – und mit einer Vorlage in einem Klick starten. */
export default function FormulareEinstieg() {
  const router = useRouter()
  const { getPreference, setPreference } = usePreferences()
  const [zu, setZu] = useState<boolean | null>(null)
  const [laeuft, setLaeuft] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    getPreference<{ zu?: boolean }>(PREF)
      .then((p) => setZu(Boolean(p?.zu)))
      .catch(() => setZu(false))
  }, [getPreference])

  const umschalten = () => {
    const neu = !zu
    setZu(neu)
    void setPreference(PREF, { zu: neu })
  }

  const anlegen = async (key: string) => {
    const v = VORLAGEN.find((x) => x.key === key)
    if (!v) return
    setLaeuft(key)
    setFehler(null)
    try {
      const r = await fetch('/api/forms', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v.daten) })
      const d = await r.json()
      if (!r.ok || !d?.doc?.id) throw new Error(d?.errors?.[0]?.message ?? 'Fehler')
      router.push(`/admin/collections/forms/${d.doc.id}`)
    } catch {
      setFehler('Das hat nicht geklappt. Bitte noch einmal versuchen oder „Neu erstellen“ nutzen.')
      setLaeuft(null)
    }
  }

  if (zu === null) return null

  return (
    <section className="bsv-formulare">
      <div className="bsv-formulare__kopf">
        <div>
          <h2>Wozu sind eigene Formulare da?</h2>
          {!zu && (
            <p>
              Damit fragt ihr auf der Website etwas ab, das es noch nicht gibt: Anmeldungen, Helferlisten, Bestellungen. Die Antworten landen gesammelt unter
              „Formular-Eingänge“. <strong>Mitgliedsantrag, Probetraining und Kontakt gibt es schon fertig</strong> – die braucht ihr hier nicht.
            </p>
          )}
        </div>
        <button type="button" className="bsv-formulare__zu" onClick={umschalten} aria-expanded={!zu}>
          {zu ? 'Erklärung zeigen' : 'Ausblenden'}
        </button>
      </div>

      {!zu && (
        <div className="bsv-formulare__inhalt">
          <div>
            <h3>Mit einer Vorlage starten</h3>
            <p className="bsv-formulare__klein">Ein Klick legt das Formular an. Danach kannst du alles anpassen.</p>
            <ul className="bsv-formulare__vorlagen">
              {VORLAGEN.map((v) => (
                <li key={v.key}>
                  <button type="button" onClick={() => anlegen(v.key)} disabled={Boolean(laeuft)}>
                    <span aria-hidden="true">{v.symbol}</span>
                    <span>
                      <strong>{laeuft === v.key ? 'Wird angelegt …' : v.titel}</strong>
                      <small>{v.text}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {fehler && <p className="bsv-formulare__fehler">{fehler}</p>}
          </div>
          <Zusammenhang aktiv="forms" />
        </div>
      )}
    </section>
  )
}
