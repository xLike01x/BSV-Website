'use client'
import { useAuth } from '@payloadcms/ui'
import React from 'react'

import './reiter.scss'

/** Zwei Reiter oben auf „Rollen & Rechte“: Übersicht (wer hat welche Rolle) und Rechte anpassen (Zusatzrechte je Rolle) */
export default function RollenReiter({ aktiv }: { aktiv?: 'uebersicht' | 'rechte' }) {
  const { user } = useAuth<{ roles?: string[] }>()
  const webadmin = (user?.roles ?? []).includes('webadmin')
  const jetzt = aktiv ?? 'rechte'
  return (
    <nav className="bsv-rollen-reiter" aria-label="Rollen & Rechte">
      <a href="/admin/rollen" aria-current={jetzt === 'uebersicht' ? 'page' : undefined}>
        <span aria-hidden="true">👥</span> Übersicht
        <small>Wer hat welche Rolle, was darf jede Rolle?</small>
      </a>
      <a href="/admin/globals/rollenRechte" aria-current={jetzt === 'rechte' ? 'page' : undefined}>
        <span aria-hidden="true">⚙️</span> Rechte anpassen
        <small>{webadmin ? 'Zusatzrechte je Rolle ein- und ausschalten' : 'Ansehen – ändern kann nur ein Web-Admin'}</small>
      </a>
    </nav>
  )
}
