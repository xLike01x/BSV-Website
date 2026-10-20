'use client'
import { FieldError, useAuth, useField } from '@payloadcms/ui'
import React from 'react'

import './rollen-kacheln.scss'

/** Eine Zeile pro Rolle – was die Rolle im Alltag bedeutet */
const ROLLEN: { value: string; titel: string; text: string; symbol: string; nurWebAdmin?: boolean; team?: boolean }[] = [
  { value: 'mitglied', titel: 'Mitglied', symbol: '🙂', text: 'Nur Mitgliederbereich auf der Website: Ausweis, Termine, eigene Teams.' },
  { value: 'uebungsleitung', titel: 'Trainer', symbol: '⚽', text: 'Eigene Teams: News, Bilder, Zeiten, Ausfälle, Probetraining, Passanträge.', team: true },
  { value: 'teamredaktion', titel: 'Team-Redaktion', symbol: '📰', text: 'Eigene Teams: News, Bilder, Zeiten – z. B. Pressewart einer Mannschaft.', team: true },
  { value: 'redaktion', titel: 'Redaktion', symbol: '✏️', text: 'Alle News, Termine, Seiten, Menü, Texte & Bilder, Sponsoren, Kontaktanfragen.' },
  { value: 'kasse', titel: 'Kasse', symbol: '💶', text: 'Mitgliedsanträge mit Bankdaten, Mitgliedschaften, Registrierungen.' },
  { value: 'passwesen', titel: 'Passwesen', symbol: '🪪', text: 'Fußball-Passanträge aller Teams.' },
  { value: 'admin', titel: 'Admin', symbol: '🛡️', text: 'Alles im Verein, auch Benutzer und Rollen – außer Admin-Rechte vergeben.', nurWebAdmin: true },
  { value: 'webadmin', titel: 'Web-Admin', symbol: '🔧', text: 'Technik und oberste Rechte: Admin-Konten, Datensicherung, Rechte-Einstellungen.', nurWebAdmin: true },
]

/**
 * Rollen als Kacheln mit Häkchen und einer Zeile Erklärung (statt Auswahlliste).
 * Admin/Web-Admin kann nur ein Web-Admin vergeben – für alle anderen sind die Kacheln gesperrt.
 */
export default function RollenKacheln({ path, readOnly }: { path: string; readOnly?: boolean }) {
  const { value, setValue, showError, disabled } = useField<string[]>({ path })
  const { user } = useAuth<{ roles?: string[] }>()
  const binWebAdmin = (user?.roles ?? []).includes('webadmin')
  const gewaehlt = Array.isArray(value) ? value : []

  const umschalten = (r: string) => {
    let neu = gewaehlt.includes(r) ? gewaehlt.filter((x) => x !== r) : [...gewaehlt, r]
    // Web-Admin hat immer auch Admin
    if (r === 'webadmin' && neu.includes('webadmin') && !neu.includes('admin')) neu = [...neu, 'admin']
    if (r === 'admin' && !neu.includes('admin')) neu = neu.filter((x) => x !== 'webadmin')
    setValue(neu)
  }

  const teamRolle = gewaehlt.some((r) => ROLLEN.find((x) => x.value === r)?.team)

  return (
    <div className={`field-type bsv-rollen-kacheln${showError ? ' error' : ''}`}>
      <div className="bsv-rollen-kacheln__kopf">
        <span className="field-label">Rollen</span>
        <span className="bsv-rollen-kacheln__tipp">Mehrere möglich. Die Person bekommt alles, was ihre Rollen zusammen dürfen.</span>
      </div>
      <FieldError path={path} showError={showError} />
      <div className="bsv-rollen-kacheln__liste" role="group" aria-label="Rollen">
        {ROLLEN.map((r) => {
          const an = gewaehlt.includes(r.value)
          const gesperrt = readOnly || disabled || (r.nurWebAdmin && !binWebAdmin)
          return (
            <label key={r.value} className={`bsv-rollen-kachel${an ? ' is-an' : ''}${gesperrt ? ' is-gesperrt' : ''}`} title={r.nurWebAdmin && !binWebAdmin ? 'Vergibt nur ein Web-Admin' : undefined}>
              <input type="checkbox" checked={an} disabled={gesperrt} onChange={() => umschalten(r.value)} />
              <span className="bsv-rollen-kachel__symbol" aria-hidden="true">
                {r.symbol}
              </span>
              <span className="bsv-rollen-kachel__text">
                <strong>{r.titel}</strong>
                <small>{r.text}</small>
                {r.nurWebAdmin && !binWebAdmin && <em>Vergibt nur ein Web-Admin</em>}
              </span>
            </label>
          )
        })}
      </div>
      {teamRolle && (
        <p className="bsv-rollen-kacheln__hinweis">
          👉 Für welche Teams? Direkt darunter bei „Team-Berechtigungen“ auswählen.
        </p>
      )}
    </div>
  )
}
