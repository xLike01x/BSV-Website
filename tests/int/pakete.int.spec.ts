import { describe, expect, it } from 'vitest'

import { istNeuer, meldungenAus } from '@/wartung/pakete'

describe('Paket-Prüfung', () => {
  it.each([
    ['16.4.2', '16.3.8', true],
    ['16.4.2', '16.4.2', false],
    ['16.4.10', '16.4.9', true],
    ['17.0.0', '16.9.9', true],
    ['16.3.9', '16.4.0', false],
    ['16.5.0-canary.3', '16.4.2', false],
  ])('%s neuer als %s: %s', (neu, alt, soll) => expect(istNeuer(neu, alt)).toBe(soll))

  it('nur hoch/kritisch, Ausnahmen beachtet, nur GitHub-Links', () => {
    const antwort = {
      next: [
        { severity: 'critical', title: 'RCE', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc', vulnerable_versions: '<=16.4.0' },
        { severity: 'moderate', title: 'egal', url: 'https://github.com/advisories/GHSA-dddd-eeee-ffff' },
        { severity: 'high', title: 'DoS', url: 'javascript:alert(1)' },
        { severity: 'high', title: 'ignoriert', url: 'https://github.com/advisories/GHSA-xxxx-yyyy-zzzz' },
      ],
      fremd: [{ severity: 'critical', title: 'nicht installiert' }],
    }
    const m = meldungenAus(antwort, { next: '16.3.8' }, new Set(['GHSA-xxxx-yyyy-zzzz']))
    expect(m.map((x) => [x.schwere, x.titel, x.url])).toEqual([
      ['critical', 'RCE', 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc'],
      ['high', 'DoS', null],
    ])
  })

  it('kaputte Antworten führen zu keiner Meldung', () => {
    expect(meldungenAus(null, {}, new Set())).toEqual([])
    expect(meldungenAus('x', { next: '1.0.0' }, new Set())).toEqual([])
    expect(meldungenAus({ next: 'x' }, { next: '1.0.0' }, new Set())).toEqual([])
  })
})
