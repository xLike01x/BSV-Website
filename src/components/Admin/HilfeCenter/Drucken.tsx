'use client'
import React from 'react'

export default function Drucken() {
  return (
    <button type="button" className="bsv-hilfe__btn bsv-hilfe__btn--primaer" onClick={() => window.print()}>
      🖨️ Drucken / als PDF speichern
    </button>
  )
}
