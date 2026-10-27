'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/**
 * Überschrift einer Zeile in einer Liste (Array-Feld) – zeigt den Inhalt statt „Beitraege 01“.
 * felder: welche Felder (in dieser Reihenfolge) angezeigt werden, getrennt durch „ – “.
 * ersatz: Text, solange noch nichts ausgefüllt ist (mit laufender Nummer).
 */
export default function ZeilenTitel({
  felder = [],
  ersatz = 'Eintrag',
}: {
  felder?: string[]
  ersatz?: string
}) {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>()
  const teile = felder
    .map((f) => data?.[f])
    .filter(
      (v): v is string | number =>
        (typeof v === 'string' && v.trim() !== '') || typeof v === 'number',
    )
    .map(String)
  return <span>{teile.length ? teile.join(' – ') : `${ersatz} ${(rowNumber ?? 0) + 1}`}</span>
}
