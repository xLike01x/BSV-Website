import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'

/**
 * Web-App (public/sw.js, public/site.webmanifest): Der Service Worker darf nie Seiten oder Daten zwischenspeichern
 * (sonst lägen Mitgliederbereich oder Ausweis auf dem Gerät) und Verwaltung/Schnittstellen nie anfassen.
 * Geprüft wird das echte Verhalten: sw.js läuft in einer Sandbox mit nachgebauten Browser-Schnittstellen.
 */
const SW = fs.readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf8')
const URSPRUNG = 'https://bsv.test'

type Anfrage = { url: string; mode: string; method: string }
type Ereignis = {
  request: Anfrage
  respondWith: (p: Promise<unknown>) => void
  preloadResponse: Promise<unknown>
  waitUntil: (p: Promise<unknown>) => void
}

function starten({ online }: { online: boolean }) {
  const handler: Record<string, (e: unknown) => void> = {}
  const gespeichert: string[] = []
  const zwischenspeicher = {
    addAll: async (reqs: { url: string }[]) =>
      void gespeichert.push(...reqs.map((r) => new URL(r.url, URSPRUNG).pathname)),
    put: async (r: { url: string } | string) =>
      void gespeichert.push(typeof r === 'string' ? r : r.url),
  }
  const netz: string[] = []
  const umgebung = {
    self: {
      location: { origin: URSPRUNG },
      addEventListener: (typ: string, fn: (e: unknown) => void) => (handler[typ] = fn),
      skipWaiting: async () => {},
      registration: { navigationPreload: { enable: async () => {} } },
      clients: { claim: async () => {} },
    },
    caches: {
      open: async () => zwischenspeicher,
      keys: async () => ['bsv-offline-v0', 'bsv-offline-v1'],
      delete: async () => true,
      match: async (u: string) => (gespeichert.includes(u) ? { offline: u } : undefined),
    },
    fetch: async (r: Anfrage) => {
      netz.push(r.url)
      if (!online) throw new TypeError('Failed to fetch')
      return { netz: r.url }
    },
    Request: class {
      url: string
      constructor(u: string) {
        this.url = u
      }
    },
    Response: { error: () => ({ fehler: true }) },
    URL,
    Promise,
  }
  vm.runInNewContext(SW, umgebung)
  const abrufen = async (url: string, mode = 'navigate', method = 'GET') => {
    let antwort: Promise<unknown> | null = null
    const e: Ereignis = {
      request: { url, mode, method },
      respondWith: (p) => (antwort = p),
      preloadResponse: Promise.resolve(undefined),
      waitUntil: () => {},
    }
    handler.fetch!(e)
    return antwort
      ? { eingegriffen: true, ergebnis: await antwort }
      : { eingegriffen: false, ergebnis: null }
  }
  const installieren = async () => {
    let p: Promise<unknown> = Promise.resolve()
    handler.install!({ waitUntil: (x: Promise<unknown>) => (p = x) })
    await p
  }
  return { abrufen, installieren, gespeichert, netz, handler }
}

describe('Web-App: Service Worker', () => {
  it('speichert bei der Installation nur Offline-Seite und Wappen', async () => {
    const sw = starten({ online: true })
    await sw.installieren()
    expect(sw.gespeichert.sort()).toEqual(['/bsv-logo.png', '/offline.html'])
  })

  it('legt beim Surfen nichts im Zwischenspeicher ab (keine privaten Seiten auf dem Gerät)', async () => {
    const sw = starten({ online: true })
    await sw.installieren()
    for (const u of ['/', '/mitglieder', '/ausweis/abc', '/news/test', '/login'])
      await sw.abrufen(URSPRUNG + u)
    await sw.abrufen(URSPRUNG + '/bsv-logo.png', 'no-cors')
    expect(sw.gespeichert.sort()).toEqual(['/bsv-logo.png', '/offline.html'])
    expect(SW).not.toMatch(/\.put\(/)
  })

  it('lässt Verwaltung, Schnittstellen, fremde Seiten, Formular-Absendungen und Dateien unberührt', async () => {
    const sw = starten({ online: true })
    for (const [u, mode, method] of [
      ['/admin', 'navigate', 'GET'],
      ['/admin/collections/posts', 'navigate', 'GET'],
      ['/api/users/me', 'navigate', 'GET'],
      ['/api/media/file/bild.jpg', 'no-cors', 'GET'],
      ['/kontakt', 'navigate', 'POST'],
      ['/_next/static/chunk.js', 'no-cors', 'GET'],
    ] as const)
      expect((await sw.abrufen(URSPRUNG + u, mode, method)).eingegriffen, u).toBe(false)
    expect((await sw.abrufen('https://fupa.net/widget', 'navigate')).eingegriffen).toBe(false)
  })

  it('online: Seiten kommen immer frisch aus dem Netz', async () => {
    const sw = starten({ online: true })
    const r = await sw.abrufen(URSPRUNG + '/termine')
    expect(r.ergebnis).toEqual({ netz: URSPRUNG + '/termine' })
  })

  it('offline: Offline-Seite statt Fehler – aber nicht für die Verwaltung', async () => {
    const sw = starten({ online: false })
    await sw.installieren()
    expect((await sw.abrufen(URSPRUNG + '/trainingszeiten')).ergebnis).toEqual({
      offline: '/offline.html',
    })
    expect((await sw.abrufen(URSPRUNG + '/bsv-logo.png', 'no-cors')).ergebnis).toEqual({
      offline: '/bsv-logo.png',
    })
    expect((await sw.abrufen(URSPRUNG + '/admin')).eingegriffen).toBe(false)
  })
})

describe('Web-App: Manifest', () => {
  const m = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'public/site.webmanifest'), 'utf8'),
  )
  it('ist vollständig und verweist nur auf vorhandene Dateien', () => {
    expect(m).toMatchObject({
      short_name: 'BSV 1919',
      start_url: '/',
      scope: '/',
      display: 'standalone',
    })
    for (const i of m.icons)
      expect(fs.existsSync(path.resolve(process.cwd(), 'public' + i.src)), i.src).toBe(true)
    expect(
      m.icons.some((i: { sizes: string }) => i.sizes === '512x512' && i.purpose === 'any'),
    ).toBe(true)
    expect(m.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
    expect(fs.existsSync(path.resolve(process.cwd(), 'public/offline.html'))).toBe(true)
  })
})
