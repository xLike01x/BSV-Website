'use client'
import React from 'react'

/** Spalte „Zuständig“ in der Liste – zeigt den gespeicherten Namen (auch für alle, die Konten nicht öffnen dürfen) */
export default function ZustaendigZelle({ rowData }: { rowData?: { zustaendigName?: string | null } }) {
  const name = rowData?.zustaendigName
  return name ? <span>🙋 {name}</span> : <span style={{ color: 'var(--theme-elevation-500)' }}>–</span>
}
