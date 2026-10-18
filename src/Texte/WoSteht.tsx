'use client'
import { useField } from '@payloadcms/ui'
import React from 'react'

/** Welche Seite der Website gehört zu welchem Teil der Website-Texte? */
const SEITE: [RegExp, string | null][] = [
  [/^fusszeile\./, '/'],
  [/^fussball\./, '/fussball'],
  [/^breitensport\./, '/breitensport'],
  [/^verein\./, '/verein'],
  [/^news\./, '/news'],
  [/^termine\./, '/termine'],
  [/^kontakt\./, '/kontakt'],
  [/^antrag\./, '/mitglied-werden'],
  [/^probetraining\./, null],
  [/.*/, '/'],
]

/** Längstes Stück, das wörtlich auf der Website steht (ohne Platzhalter und Zeilenumbrüche) */
const suchStueck = (wert: string) =>
  wert
    .split(/\{[a-z]+\}|\n/)
    .map((t) => t.replace(/[›»]/g, '').trim())
    .sort((a, b) => b.length - a.length)[0] ?? ''

/** Unter jedem Website-Text: „Auf der Website zeigen ↗“ */
export default function WoSteht({ path }: { path: string }) {
  const { initialValue } = useField<string>({ path })
  const seite = SEITE.find(([re]) => re.test(path))?.[1]
  const stueck = suchStueck(String(initialValue ?? ''))
  if (seite === null)
    return <p className="bsv-wo-steht bsv-wo-steht--leise">Erscheint auf jeder Team- und Kursseite im Bereich „Probetraining“.</p>
  if (!seite || stueck.length < 3) return null
  return (
    <a className="bsv-wo-steht" href={`${seite}?zeigen=${encodeURIComponent(stueck)}`} target="_blank" rel="noopener">
      📍 Auf der Website zeigen ↗
    </a>
  )
}
