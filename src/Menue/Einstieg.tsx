'use client'
import { useFormFields, useFormModified, usePreferences } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { Ablauf } from '@/components/Admin/Hilfe/Zusammenhang'
import '@/components/Admin/Hilfe/hilfe.scss'
import '@/components/Admin/Einstieg/einstieg.scss'

const PREF = 'bsv-einstieg-menue'

/** Seiten der Website, die man gut verlinken kann – werden vorgeschlagen, solange sie nirgends im Menü stehen */
const VORSCHLAEGE: [string, string][] = [
  ['Trainingszeiten', '/trainingszeiten'],
  ['Galerie', '/galerie'],
  ['Sponsoren', '/sponsoren'],
  ['Mitmachen', '/mitmachen'],
]

const SCHRITTE = [
  { key: 'seite', titel: 'Seite fertig machen', text: 'Eigene Seite anlegen und veröffentlichen – sonst führt der Link ins Leere.', href: '/admin/collections/pages', wo: 'Inhalte → Seiten' },
  { key: 'eintrag', titel: 'Eintrag hinzufügen', text: 'Unten „Eintrag hinzufügen“: Text eingeben, „Seite öffnen“ oder „Adresse öffnen“ wählen.' },
  { key: 'reihenfolge', titel: 'Reihenfolge ziehen', text: 'Am Griff links (sechs Punkte) ziehen. Oben = weiter links auf der Website.' },
  { key: 'speichern', titel: 'Speichern', text: 'Oben rechts – nach kurzer Zeit überall sichtbar.' },
  { key: 'pruefen', titel: 'Auf der Website prüfen', text: 'Einmal draufklicken, ob alles stimmt.', href: '/', wo: 'Website ↗' },
]

/** Über „Menü & Fußzeile“: Ablauf + Live-Prüfung (unveröffentlichte Seiten, zu viele Einträge) */
export default function MenueEinstieg() {
  const { getPreference, setPreference } = usePreferences()
  const [zu, setZu] = useState<boolean | null>(null)
  const [entwuerfe, setEntwuerfe] = useState<string[]>([])

  // Alle Seiten, auf die das Menü gerade zeigt (auch ungespeicherte Änderungen)
  const geaendert = useFormModified()
  const [laeuft, setLaeuft] = useState<string | null>(null)
  const { seitenIds, anzahlOben, adressen } = useFormFields(([felder]) => {
    const ids = new Set<number>()
    const adr: string[] = []
    let oben = 0
    for (const [pfad, f] of Object.entries(felder)) {
      if (pfad.endsWith('.adresse') && typeof f?.value === 'string') adr.push(f.value.replace(/\/$/, ''))
      if (/^links\.\d+\.label$/.test(pfad)) oben++
      if (pfad.endsWith('.seite') && f?.value) {
        const v = f.value as number | { id?: number; value?: number }
        const id = typeof v === 'object' ? (v.id ?? v.value) : v
        if (id) ids.add(Number(id))
      }
    }
    return { seitenIds: [...ids].sort().join(','), anzahlOben: oben, adressen: adr.join('|') }
  })

  useEffect(() => {
    getPreference<{ zu?: boolean }>(PREF)
      .then((p) => setZu(Boolean(p?.zu)))
      .catch(() => setZu(false))
  }, [getPreference])

  useEffect(() => {
    if (!seitenIds) {
      setEntwuerfe([])
      return
    }
    const filter = seitenIds
      .split(',')
      .map((id, i) => `where[id][in][${i}]=${id}`)
      .join('&')
    fetch(`/api/pages?draft=true&depth=0&limit=100&select[title]=true&select[_status]=true&${filter}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setEntwuerfe(((d?.docs ?? []) as { title: string; _status?: string }[]).filter((p) => p._status !== 'published').map((p) => p.title)))
      .catch(() => {})
  }, [seitenIds])

  const pruefungen = useMemo(() => {
    const p: { art: 'warn' | 'ok'; text: string }[] = []
    if (entwuerfe.length) p.push({ art: 'warn', text: `Nicht veröffentlicht: ${entwuerfe.join(', ')}. Diese Links führen ins Leere – Seite veröffentlichen oder Eintrag entfernen.` })
    if (anzahlOben > 8) p.push({ art: 'warn', text: `${anzahlOben} Einträge in der Menüleiste – ab etwa 8 wird es auf kleineren Bildschirmen eng.` })
    if (!p.length) p.push({ art: 'ok', text: 'Alles in Ordnung: Alle verlinkten Seiten sind veröffentlicht.' })
    return p
  }, [entwuerfe, anzahlOben])

  const fehlend = VORSCHLAEGE.filter(([, a]) => !adressen.split('|').includes(a))
  const eintragen = async (label: string, adresse: string, wo: 'fusszeile' | 'vereinMehr') => {
    if (geaendert) {
      window.alert('Bitte zuerst oben rechts „Speichern“ – sonst gehen deine Änderungen verloren.')
      return
    }
    setLaeuft(adresse + wo)
    await fetch('/api/globals/menue/ergaenzen', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, adresse, wo }) }).catch(() => {})
    window.location.reload()
  }

  if (zu === null) return null

  return (
    <section className="bsv-einstieg" style={{ margin: '0 0 24px' }}>
      <div className="bsv-einstieg__kopf">
        <div>
          <h2>So änderst du Menü und Fußzeile</h2>
          {!zu && (
            <p>
              Oben im Reiter „Hauptmenü“ stehen die Einträge der Menüleiste, im Reiter „Fußzeile“ die Spalten unten auf jeder Seite. „Fußball“ und „Breitensport“ füllen sich
              automatisch aus „Teams & Kurse“ – dort musst du nichts eintragen.
            </p>
          )}
        </div>
        <button type="button" className="bsv-einstieg__zu" onClick={() => (setZu(!zu), void setPreference(PREF, { zu: !zu }))} aria-expanded={!zu}>
          {zu ? 'Erklärung zeigen' : 'Ausblenden'}
        </button>
      </div>
      <ul className="bsv-menue-pruefung" aria-live="polite">
        {pruefungen.map((x) => (
          <li key={x.text} className={`is-${x.art}`}>
            <span aria-hidden="true">{x.art === 'warn' ? '⚠️' : '✅'}</span> {x.text}
          </li>
        ))}
      </ul>
      {fehlend.length > 0 && (
        <div className="bsv-menue-vorschlag">
          <p>
            <strong>Diese Seiten sind noch nirgends verlinkt:</strong>
          </p>
          <ul>
            {fehlend.map(([label, adresse]) => (
              <li key={adresse}>
                <a href={adresse} target="_blank" rel="noopener">
                  {label} ↗
                </a>
                <button type="button" onClick={() => eintragen(label, adresse, 'fusszeile')} disabled={Boolean(laeuft)}>
                  {laeuft === adresse + 'fusszeile' ? '…' : '+ In die Fußzeile'}
                </button>
                <button type="button" onClick={() => eintragen(label, adresse, 'vereinMehr')} disabled={Boolean(laeuft)}>
                  {laeuft === adresse + 'vereinMehr' ? '…' : '+ Ins Menü „Verein“'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!zu && (
        <div className="bsv-einstieg__inhalt is-einspaltig">
          <Ablauf schritte={SCHRITTE} titel="In fünf Schritten" />
        </div>
      )}
    </section>
  )
}
