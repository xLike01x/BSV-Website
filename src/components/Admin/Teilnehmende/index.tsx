'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import './teilnehmende.scss'

type Person = { id: number; name: string; foto: string | null }

/** Im Team/Kurs: wer ist als Mitglied eingetragen – mit Profilfoto, damit Trainer Gesichter zuordnen können */
export default function Teilnehmende() {
  const { id } = useDocumentInfo()
  const [personen, setPersonen] = useState<Person[] | null>(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/angebote/${id}/teilnehmende`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { personen: Person[] }) => setPersonen(d.personen))
      .catch(() => setFehler(true))
  }, [id])

  if (!id || fehler) return null
  return (
    <div className="bsv-teilnehmende">
      <div className="bsv-teilnehmende__kopf">
        <strong>Mitglieder in diesem Team / Kurs</strong>
        <span>{personen ? personen.length : '…'}</span>
      </div>
      <p className="bsv-teilnehmende__hinweis">
        Mitglieder, die diesen Kurs in ihrem Konto eingetragen haben – mit Foto, wenn sie eines hochgeladen haben. Nur für Verwaltung und die Verantwortlichen sichtbar.
      </p>
      {personen && personen.length === 0 && <p className="bsv-teilnehmende__leer">Noch niemand eingetragen.</p>}
      {personen && personen.length > 0 && (
        <ul>
          {personen.map((p) => (
            <li key={p.id}>
              {p.foto ? <img src={p.foto} alt="" /> : <span className="bsv-teilnehmende__initial">{p.name.slice(0, 1).toUpperCase()}</span>}
              <span>{p.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
