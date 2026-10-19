import React from 'react'

import { logoMasse } from '@/sponsoren/masse'

export const LOGO_STUFEN = {
  haupt: { flaeche: 300 * 130, maxBreite: 460, maxHoehe: 190 },
  karte: { flaeche: 170 * 74, maxBreite: 220, maxHoehe: 110 },
  laufband: { flaeche: 130 * 50, maxBreite: 170, maxHoehe: 70 },
  fuss: { flaeche: 90 * 34, maxBreite: 130, maxHoehe: 44 },
}

/** Sponsor-Logo in einheitlicher optischer Größe (gleiche Fläche, leerer Rand entfernt) */
export function SponsorLogo({ logo, name, stufe, className, sofort }: { logo: unknown; name: string; stufe: keyof typeof LOGO_STUFEN; className?: string; sofort?: boolean }) {
  const m = logoMasse(logo, LOGO_STUFEN[stufe])
  if (!m) return null
  return <img src={m.src} alt={name} width={m.breite} height={m.hoehe} loading={sofort ? 'eager' : 'lazy'} decoding="async" className={className} style={{ width: m.breite, height: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
}
