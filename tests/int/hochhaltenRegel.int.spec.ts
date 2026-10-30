import { describe, expect, it } from 'vitest'

import { amBoden, darfKicken } from '@/bsv/components/spiele/hochhaltenRegel'

const feld = { groesse: 64, feldHoehe: 380 }

describe('Ball hochhalten: gültiger Kontakt', () => {
  it('fallender Ball unten zählt', () => expect(darfKicken({ ...feld, y: 250, vy: 400 })).toBe(true))
  it('steigender Ball zählt nicht (kein Nachklicken im Flug)', () => expect(darfKicken({ ...feld, y: 250, vy: -760 })).toBe(false))
  it('Ball oben an der Decke zählt nicht, auch wenn er gerade abprallt', () => expect(darfKicken({ ...feld, y: 0, vy: 228 })).toBe(false))
  it('Ball im Stillstand am höchsten Punkt zählt nicht', () => expect(darfKicken({ ...feld, y: 200, vy: 0 })).toBe(false))
  it('Grenze: Ballmitte genau bei 40 % der Höhe zählt', () => expect(darfKicken({ ...feld, y: 120, vy: 10 })).toBe(true))
  it('knapp darüber zählt nicht', () => expect(darfKicken({ ...feld, y: 119, vy: 10 })).toBe(false))
})

describe('Ball hochhalten: Runde vorbei', () => {
  const boden = feld.feldHoehe - feld.groesse - 18
  it('Anstoß: Ball liegt auf dem Rasen und steigt – auch beim ersten Bild-Schritt ohne Zeitdifferenz läuft die Runde weiter', () =>
    expect(amBoden({ ...feld, y: boden, vy: -760 })).toBe(false))
  it('fallender Ball erreicht den Rasen – Runde vorbei', () => expect(amBoden({ ...feld, y: boden, vy: 500 })).toBe(true))
  it('fallender Ball schon unter der Rasenkante – Runde vorbei', () => expect(amBoden({ ...feld, y: boden + 5, vy: 500 })).toBe(true))
  it('fallender Ball knapp über dem Rasen – Runde läuft', () => expect(amBoden({ ...feld, y: boden - 1, vy: 500 })).toBe(false))
})
