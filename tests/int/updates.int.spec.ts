import { afterEach, describe, expect, it, vi } from 'vitest'

import { istHauptversion, istNeuer, meldungenAus, nodeSicherheit, registryPfad, ubuntuUpdates, updatesPruefen, zyklus } from '@/wartung/updates'

describe('Update-Prüfung: Versionen', () => {
  it.each([
    ['16.4.2', '16.3.8', true],
    ['16.4.2', '16.4.2', false],
    ['16.4.10', '16.4.9', true],
    ['17.0.0', '16.9.9', true],
    ['16.3.9', '16.4.0', false],
    ['16.5.0-canary.3', '16.4.2', false],
    ['v24.22.1', '24.22.0', true],
    ['16.16', '16.15', true],
    ['3.0.0', '3.0.0-beta.1', true],
    ['3.0.0-beta.2', '3.0.0-beta.1', false],
  ])('%s neuer als %s: %s', (neu, alt, soll) => expect(istNeuer(neu, alt)).toBe(soll))

  it.each([
    ['17.0.0', '16.9.9', true],
    ['16.5.0', '16.4.2', false],
    ['0.8.0', '0.7.1', true],
    ['0.7.2', '0.7.1', false],
    ['1.0.0', '0.9.0', true],
  ])('%s ist Hauptversion gegenüber %s: %s', (neu, alt, soll) => expect(istHauptversion(neu, alt)).toBe(soll))

  it('Registry-Pfad kodiert Paketnamen', () => {
    expect(registryPfad('next')).toBe('next')
    expect(registryPfad('@payloadcms/next')).toBe('@payloadcms%2Fnext')
    expect(registryPfad('../x?y')).toBe('..%2Fx%3Fy')
  })
})

describe('Update-Prüfung: Ausfall einzelner Quellen', () => {
  const g = globalThis as unknown as Record<string, unknown>
  const umgebung = process.env.NODE_ENV
  afterEach(() => {
    vi.unstubAllGlobals()
    ;(process.env as Record<string, string | undefined>).NODE_ENV = umgebung
  })
  const antwort = (daten: unknown) => ({ ok: true, status: 200, json: async () => daten })
  const allesKlappt = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.includes('/advisories/bulk')) return antwort({ next: [{ severity: 'critical', title: 'Testlücke', url: 'https://github.com/advisories/GHSA-test-test-test' }] })
    if (url.endsWith('/latest')) return antwort({ version: '999.0.0' })
    return antwort([])
  })
  const nichtsKlappt = vi.fn(async () => {
    throw new Error('offline')
  })

  it('ohne je erreichte Quellen: unvollständig statt Entwarnung; danach gelten bei Ausfall die letzten Angaben', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    delete g.__bsvUpdates
    delete g.__bsvUpdatesRoh

    vi.stubGlobal('fetch', nichtsKlappt)
    const offline = await updatesPruefen()
    expect(offline.ohneDaten).toEqual(expect.arrayContaining(['npm-Sicherheitsdatenbank', 'npm (neueste Versionen)', 'nodejs.org']))
    expect(offline.eintraege.some((e) => e.gruppe === 'Website-Pakete')).toBe(false)

    vi.stubGlobal('fetch', allesKlappt)
    const online = await updatesPruefen()
    expect(online.ohneDaten).toEqual([])
    expect(online.quellenFehler).toEqual([])
    expect(online.eintraege.find((e) => e.key === 'pkt-next')?.art).toBe('sicherheit')

    vi.stubGlobal('fetch', nichtsKlappt)
    const wiederOffline = await updatesPruefen()
    expect(wiederOffline.ohneDaten).toEqual([])
    expect(wiederOffline.quellenFehler).toContain('npm-Sicherheitsdatenbank')
    expect(wiederOffline.eintraege.find((e) => e.key === 'pkt-next')?.art).toBe('sicherheit')
    expect(wiederOffline.eintraege.filter((e) => e.gruppe === 'Website-Pakete').length).toBe(online.eintraege.filter((e) => e.gruppe === 'Website-Pakete').length)

    // Nur die Sicherheitsdatenbank fällt aus, der Rest antwortet: bekannte Lücke bleibt sichtbar
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => (url.includes('/advisories/bulk') ? nichtsKlappt() : allesKlappt(url, init)))
    const teilweise = await updatesPruefen()
    expect(teilweise.quellenFehler).toEqual(['npm-Sicherheitsdatenbank'])
    expect(teilweise.eintraege.find((e) => e.key === 'pkt-next')?.art).toBe('sicherheit')
  })
})

describe('Update-Prüfung: Quellen auswerten', () => {
  it('npm: nur hoch/kritisch, Ausnahmen beachtet, nur GitHub-Links', () => {
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
    expect(Object.keys(m)).toEqual(['next'])
    expect(m.next!.map((x) => [x.schwere, x.titel, x.url])).toEqual([
      ['critical', 'RCE', 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc'],
      ['high', 'DoS', null],
    ])
  })

  it('kaputte Antworten führen zu nichts', () => {
    expect(meldungenAus(null, {}, new Set())).toEqual({})
    expect(meldungenAus({ next: 'x' }, { next: '1.0.0' }, new Set())).toEqual({})
    expect(zyklus('x', 24)).toBeNull()
    expect(nodeSicherheit({}, '24.22.0')).toBeNull()
    expect(ubuntuUpdates('irgendwas')).toBeNull()
  })

  it('endoflife.date: passende Hauptversion', () => {
    const a = [
      { cycle: '26', latest: '26.1.0', eol: '2029-04-30' },
      { cycle: '24', latest: '24.22.1', eol: '2028-04-30', lts: '2025-10-28' },
      { cycle: 16, latest: '16.16', eol: '2028-11-09' },
    ]
    expect(zyklus(a, 24)).toEqual({ latest: '24.22.1', eol: '2028-04-30' })
    expect(zyklus(a, 16)).toEqual({ latest: '16.16', eol: '2028-11-09' })
    expect(zyklus(a, 22)).toBeNull()
    expect(zyklus([{ cycle: '24', latest: '<script>', eol: 'bald' }], 24)).toEqual({ latest: null, eol: null })
  })

  it('nodejs.org: Sicherheitsversion zwischen installiert und neuester', () => {
    const index = [
      { version: 'v26.1.0', security: true },
      { version: 'v24.22.2', security: false },
      { version: 'v24.22.1', security: true },
      { version: 'v24.22.0', security: false },
      { version: 'v24.21.0', security: true },
    ]
    expect(nodeSicherheit(index, '24.22.0')).toBe('24.22.1')
    expect(nodeSicherheit(index, '24.22.1')).toBeNull()
    expect(nodeSicherheit(index, '22.20.0')).toBeNull()
  })

  it('Ubuntu: ausstehende Updates', () => {
    expect(ubuntuUpdates('12 updates can be applied immediately.\n5 of these updates are standard security updates.')).toEqual({ alle: 12, sicherheit: 5 })
    expect(ubuntuUpdates('1 update can be applied immediately.\n1 of these updates is a standard security update.')).toEqual({ alle: 1, sicherheit: 1 })
    expect(ubuntuUpdates('3 updates can be applied immediately.')).toEqual({ alle: 3, sicherheit: 0 })
    expect(ubuntuUpdates('0 updates can be applied immediately.')).toEqual({ alle: 0, sicherheit: 0 })
  })
})
