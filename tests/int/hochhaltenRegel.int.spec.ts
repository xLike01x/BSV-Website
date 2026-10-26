import { describe, expect, it } from 'vitest'

import { darfKicken } from '@/bsv/components/spiele/hochhaltenRegel'

const feld = { groesse: 64, feldHoehe: 380 }

describe('Ball hochhalten: gültiger Kontakt', () => {
  it('fallender Ball unten zählt', () => expect(darfKicken({ ...feld, y: 250, vy: 400 })).toBe(true))
  it('steigender Ball zählt nicht (kein Nachklicken im Flug)', () => expect(darfKicken({ ...feld, y: 250, vy: -760 })).toBe(false))
  it('Ball oben an der Decke zählt nicht, auch wenn er gerade abprallt', () => expect(darfKicken({ ...feld, y: 0, vy: 228 })).toBe(false))
  it('Ball im Stillstand am höchsten Punkt zählt nicht', () => expect(darfKicken({ ...feld, y: 200, vy: 0 })).toBe(false))
  it('Grenze: Ballmitte genau bei 40 % der Höhe zählt', () => expect(darfKicken({ ...feld, y: 120, vy: 10 })).toBe(true))
  it('knapp darüber zählt nicht', () => expect(darfKicken({ ...feld, y: 119, vy: 10 })).toBe(false))
})
