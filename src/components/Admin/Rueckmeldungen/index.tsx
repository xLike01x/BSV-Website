'use client'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import './rueckmeldungen.scss'

type Antwort = { id: number; name?: string | null; teilnahme: 'ja' | 'nein'; personen?: number | null; bemerkung?: string | null; updatedAt: string }

const zeit = (iso: string) => new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** CSV-Zelle: Anführungszeichen verdoppeln; Formeln (=, +, -, @ …) entschärfen, damit Excel nichts ausführt */
const zelle = (v: unknown) => {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}
const html = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Im Termin: Zu- und Absagen der Mitglieder mit Summen, Drucken und Herunterladen */
export default function Rueckmeldungen() {
  const { id } = useDocumentInfo()
  const titel = useFormFields(([f]) => f.title?.value as string | undefined) ?? 'Termin'
  const [liste, setListe] = useState<Antwort[] | null>(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/termin-rueckmeldungen?where[termin][equals]=${encodeURIComponent(String(id))}&limit=1000&depth=0&sort=name`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { docs: Antwort[] }) => setListe(d.docs))
      .catch(() => setFehler(true))
  }, [id])

  if (!id) return <p className="bsv-rueckmeldungen__leer">Nach dem Speichern erscheinen hier die Zu- und Absagen.</p>
  if (fehler) return null

  const zu = (liste ?? []).filter((a) => a.teilnahme === 'ja')
  const ab = (liste ?? []).filter((a) => a.teilnahme === 'nein')
  const personen = zu.reduce((n, a) => n + (a.personen || 1), 0)
  const sortiert = [...zu, ...ab]

  const herunterladen = () => {
    const zeilen = [['Name', 'Antwort', 'Personen', 'Bemerkung', 'Geantwortet am'], ...sortiert.map((a) => [a.name, a.teilnahme === 'ja' ? 'Ich komme' : 'Ich komme nicht', a.teilnahme === 'ja' ? a.personen || 1 : 0, a.bemerkung, zeit(a.updatedAt)])]
    const csv = '﻿' + zeilen.map((z) => z.map(zelle).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `Zu-und-Absagen-${titel.replace(/[^\wäöüÄÖÜß-]+/g, '-')}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const drucken = () => {
    const w = window.open('', '_blank', 'noopener=no')
    if (!w) return
    const zeilen = sortiert
      .map((a) => `<tr><td>${html(a.name)}</td><td>${a.teilnahme === 'ja' ? 'Ich komme' : 'Ich komme nicht'}</td><td>${a.teilnahme === 'ja' ? a.personen || 1 : '–'}</td><td>${html(a.bemerkung)}</td></tr>`)
      .join('')
    w.document.write(
      `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Zu- und Absagen – ${html(titel)}</title><style>body{font:14px system-ui,sans-serif;margin:24px}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 16px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3f3f3}</style></head><body><h1>Zu- und Absagen: ${html(titel)}</h1><p>${zu.length} Zusagen · ${personen} Personen · ${ab.length} Absagen · Stand ${html(zeit(new Date().toISOString()))}</p><table><thead><tr><th>Name</th><th>Antwort</th><th>Personen</th><th>Bemerkung</th></tr></thead><tbody>${zeilen}</tbody></table></body></html>`,
    )
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="bsv-rueckmeldungen">
      <div className="bsv-rueckmeldungen__kopf">
        <strong>Zu- und Absagen</strong>
        {liste && (
          <span className="bsv-rueckmeldungen__summe">
            ✓ {zu.length} {zu.length === 1 ? 'Zusage' : 'Zusagen'} · {personen} {personen === 1 ? 'Person' : 'Personen'} · ✗ {ab.length} {ab.length === 1 ? 'Absage' : 'Absagen'}
          </span>
        )}
      </div>
      <p className="bsv-rueckmeldungen__leer">
        Mitglieder antworten nach dem Login unter „Mein BSV“. Nur für die Verwaltung sichtbar. Wird automatisch nach der Frist unter Datenschutz-Fristen gelöscht (Standard: 30 Tage nach dem Termin).
      </p>
      {liste && liste.length === 0 && <p className="bsv-rueckmeldungen__leer">Noch keine Antworten.</p>}
      {liste && liste.length > 0 && (
        <>
          <div className="bsv-rueckmeldungen__knoepfe">
            <button type="button" onClick={drucken}>
              Drucken
            </button>
            <button type="button" onClick={herunterladen}>
              Als Tabelle herunterladen (Excel)
            </button>
          </div>
          <div className="bsv-rueckmeldungen__tabelle">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Antwort</th>
                  <th>Personen</th>
                  <th>Bemerkung</th>
                  <th>Geantwortet</th>
                </tr>
              </thead>
              <tbody>
                {sortiert.map((a) => (
                  <tr key={a.id} className={a.teilnahme === 'nein' ? 'ist-absage' : undefined}>
                    <td>{a.name}</td>
                    <td>{a.teilnahme === 'ja' ? '✓ Ich komme' : '✗ Ich komme nicht'}</td>
                    <td>{a.teilnahme === 'ja' ? a.personen || 1 : '–'}</td>
                    <td>{a.bemerkung}</td>
                    <td>{zeit(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
