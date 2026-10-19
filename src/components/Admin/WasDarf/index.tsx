'use client'
import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { EINZELRECHTE } from '@/access/einzelrechte'

import type { Vorschau } from './endpunkt'
import './was-darf.scss'

const liste = (eintraege: { titel: string; eigene: boolean }[]) =>
  eintraege.map((e) => (
    <li key={e.titel}>
      {e.titel}
      {e.eigene && <span className="bsv-was-darf__eigene">nur eigene Teams</span>}
    </li>
  ))

/**
 * „Was darf diese Person?“ – oben beim Benutzer, in Klartext.
 * Rechnet live mit den gerade angeklickten Rollen und Zusatzrechten (noch vor dem Speichern).
 */
export default function WasDarf() {
  const { user } = useAuth<{ roles?: string[] }>()
  const { id } = useDocumentInfo()
  const rollen = useFormFields(([f]) => f.roles?.value) as string[] | undefined
  const zusatz = useFormFields(([f]) => EINZELRECHTE.filter((r) => f[`zusatzrechte.${r.key}`]?.value === true).map((r) => r.key).join(','))
  const [daten, setDaten] = useState<Vorschau | null>(null)
  const [laedt, setLaedt] = useState(false)
  const istAdmin = (user?.roles ?? []).includes('admin')
  const schluessel = `${(rollen ?? []).join(',')}|${zusatz}|${id ?? ''}`

  useEffect(() => {
    if (!istAdmin) return
    setLaedt(true)
    const t = setTimeout(async () => {
      const [r, z, p] = schluessel.split('|')
      const res = await fetch(`/api/rechte-vorschau?rollen=${encodeURIComponent(r ?? '')}&zusatz=${encodeURIComponent(z ?? '')}&person=${encodeURIComponent(p ?? '')}`, { credentials: 'include' }).catch(() => null)
      if (res?.ok) setDaten(await res.json())
      setLaedt(false)
    }, 350)
    return () => clearTimeout(t)
  }, [schluessel, istAdmin])

  if (!istAdmin || !daten) return null
  const teamRolle = (rollen ?? []).some((r) => r === 'uebungsleitung' || r === 'teamredaktion')
  const hatEigene = [...daten.bearbeiten, ...daten.ansehen].some((e) => e.eigene)

  return (
    <section className={`bsv-was-darf${laedt ? ' is-laedt' : ''}`} aria-label="Was darf diese Person?">
      <h3>
        <span aria-hidden="true">🔎</span> Was darf diese Person?
        <small>Live berechnet – ändert sich, sobald du unten Rollen anklickst</small>
      </h3>
      {!daten.verwaltung ? (
        <p className="bsv-was-darf__nur">🙂 Nur Mitgliederbereich auf der Website (Ausweis, Termine, eigene Teams). Kein Zugang zur Verwaltung.</p>
      ) : (
        <>
          {hatEigene && (
            <p className={`bsv-was-darf__teams${teamRolle && !daten.teams.length ? ' is-warn' : ''}`}>
              {daten.teams.length ? (
                <>
                  <strong>Eigene Teams:</strong> {daten.teams.join(', ')}
                </>
              ) : (
                <>⚠️ Noch keinem Team zugeordnet – „nur eigene Teams“ bringt so noch nichts. Zuordnen beim Team unter „Verantwortliche“.</>
              )}
            </p>
          )}
          <div className="bsv-was-darf__spalten">
            <div>
              <h4>✅ Darf bearbeiten</h4>
              {daten.bearbeiten.length ? <ul>{liste(daten.bearbeiten)}</ul> : <p className="bsv-was-darf__leer">Nichts</p>}
            </div>
            <div>
              <h4>👁️ Darf nur ansehen</h4>
              {daten.ansehen.length ? <ul>{liste(daten.ansehen)}</ul> : <p className="bsv-was-darf__leer">Nichts</p>}
            </div>
            <div>
              <h4>🚫 Kein Zugriff</h4>
              <details>
                <summary>{daten.kein.length} Bereiche anzeigen</summary>
                <ul>
                  {daten.kein.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
