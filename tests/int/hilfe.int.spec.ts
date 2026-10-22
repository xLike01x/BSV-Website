import { describe, expect, it } from 'vitest'

import { ANLEITUNGEN, FAQ, FELDER } from '@/components/Admin/Hilfe/extras'

// Doppelte Einträge erzeugen in der Verwaltung den Fehler „Encountered two children with the same key“
const doppelte = (namen: string[]) => namen.filter((n, i) => namen.indexOf(n) !== i)

describe('Hilfe-Inhalte ohne Doppelte', () => {
  it('Begriffe je Bereich eindeutig', () => {
    for (const [bereich, liste] of Object.entries(FELDER)) expect({ bereich, doppelt: doppelte(liste.map((f) => f.name)) }).toEqual({ bereich, doppelt: [] })
  })
  it('Fragen eindeutig', () => {
    expect(doppelte(FAQ.map((f) => f.frage))).toEqual([])
  })
  it('Anleitungen je Bereich eindeutig', () => {
    for (const [bereich, liste] of Object.entries(ANLEITUNGEN)) expect({ bereich, doppelt: doppelte(liste.map((a) => a.id)) }).toEqual({ bereich, doppelt: [] })
  })
})
