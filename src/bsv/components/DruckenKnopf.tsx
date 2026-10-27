'use client'
import React from 'react'

/** Öffnet den Druckdialog (dort auch „Als PDF speichern“) */
export function DruckenKnopf({ text = '🖨️ Drucken oder als PDF speichern' }: { text?: string }) {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      {text}
    </button>
  )
}
