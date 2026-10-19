'use client'
import React from 'react'

import './status.scss'

/** Farbige Status-Pille in der Liste */
export default function StatusPille({ cellData, farben }: { cellData?: unknown; farben?: Record<string, { text: string; klasse: string }> }) {
  const wert = String(cellData ?? '')
  const f = farben?.[wert]
  if (!f) return <span>{wert}</span>
  return <span className={`bsv-pille bsv-pille--${f.klasse}`}>{f.text}</span>
}
