import { describe, expect, it } from 'vitest'

import { ersterTagDanach, quartalsende } from '@/kuendigungen/quartal'
import { berlinDatum } from '@/utilities/berlinDatum'

describe('Kündigung: wirksam zum Quartalsende (deutsche Zeit)', () => {
  it('Beispiel aus der Satzung: Kündigung am 31.12.2026 → raus zum 01.01.2027', () => {
    const ende = quartalsende(new Date('2026-12-31T10:00:00+01:00'))
    expect(ende).toBe('2026-12-31')
    expect(ersterTagDanach(ende)).toBe('2027-01-01')
  })
  it('31.12. um 23:59 Uhr deutscher Zeit zählt noch zum alten Quartal', () =>
    expect(quartalsende(new Date('2026-12-31T22:59:59Z'))).toBe('2026-12-31'))
  it('01.01. um 00:00 Uhr deutscher Zeit → Ende des 1. Quartals', () =>
    expect(quartalsende(new Date('2026-12-31T23:00:00Z'))).toBe('2027-03-31'))
  it('Sommerzeit: 30.06. um 23:59 Uhr (21:59 UTC) → 30.06.', () =>
    expect(quartalsende(new Date('2026-06-30T21:59:00Z'))).toBe('2026-06-30'))
  it('Sommerzeit: 01.07. um 00:30 Uhr (22:30 UTC am 30.06.) → 30.09.', () =>
    expect(quartalsende(new Date('2026-06-30T22:30:00Z'))).toBe('2026-09-30'))
  it('mitten im Quartal', () => {
    expect(quartalsende(new Date('2026-02-10T12:00:00Z'))).toBe('2026-03-31')
    expect(quartalsende(new Date('2026-05-02T12:00:00Z'))).toBe('2026-06-30')
    expect(quartalsende(new Date('2026-08-15T12:00:00Z'))).toBe('2026-09-30')
    expect(quartalsende(new Date('2026-10-27T12:00:00Z'))).toBe('2026-12-31')
  })
  it('Schaltjahr ändert nichts am Quartalsende', () =>
    expect(quartalsende(new Date('2028-02-29T12:00:00Z'))).toBe('2028-03-31'))
  it('Tag danach über den Monatswechsel', () => {
    expect(ersterTagDanach('2027-03-31')).toBe('2027-04-01')
    expect(ersterTagDanach('2026-09-30')).toBe('2026-10-01')
  })
  it('deutscher Kalendertag unabhängig von der Server-Zeitzone', () => {
    expect(berlinDatum(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
    expect(berlinDatum(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01')
  })
})
