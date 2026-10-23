'use client'
import React from 'react'

import '../Rollen/reiter.scss'

/**
 * Zwei Reiter oben auf „Sicherheit“: Updates (Übersicht /admin/updates) und Einstellungen (Global „sicherheit“:
 * automatisch abmelden, Frist des Web-Admin-Papierkorbs). Beide Seiten sind nur für Web-Admins.
 * Auf der Einstellungsseite als ui-Feld eingebunden – ohne Angabe ist dort „Einstellungen“ aktiv.
 */
export default function SicherheitReiter({ aktiv }: { aktiv?: 'updates' | 'einstellungen' }) {
  const jetzt = aktiv ?? 'einstellungen'
  return (
    <nav className="bsv-rollen-reiter" aria-label="Sicherheit">
      <a href="/admin/updates" aria-current={jetzt === 'updates' ? 'page' : undefined}>
        <span aria-hidden="true">🔄</span> Updates
        <small>Node.js, Datenbank, Website-Pakete, Server</small>
      </a>
      <a href="/admin/globals/sicherheit" aria-current={jetzt === 'einstellungen' ? 'page' : undefined}>
        <span aria-hidden="true">⚙️</span> Einstellungen
        <small>Automatisch abmelden, Papierkorb-Frist</small>
      </a>
    </nav>
  )
}
