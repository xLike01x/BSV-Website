/*
 * Service Worker der BSV-Web-App.
 *
 * Bewusst minimal und datensparsam:
 * - Speichert NUR die Offline-Seite und das Wappen – keine Seiten, keine Daten, keine Antworten des Servers.
 *   Dadurch kann nie etwas Privates (Mitgliederbereich, Ausweis, Verwaltung) im Gerät liegen bleiben
 *   und niemand bekommt veraltete Inhalte zu sehen.
 * - Greift nur bei Seitenaufrufen der Website (und beim Wappen für die Offline-Seite) ein: Server erreichbar → ganz normal laden.
 *   Kein Netz → freundliche Offline-Seite statt Browser-Fehler.
 * - Verwaltung (/admin), Schnittstellen (/api) und alles andere (Bilder, Skripte) bleiben unberührt.
 *
 * Neue Version: CACHE-Namen erhöhen – alte Zwischenspeicher werden dann beim Aktivieren gelöscht.
 * Notfall (Service Worker soll auf allen Geräten verschwinden): Dateiinhalt ersetzen durch
 *   self.addEventListener('install', () => self.skipWaiting())
 *   self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((n) => Promise.all(n.map((k) => caches.delete(k)))).then(() => self.registration.unregister())))
 * und die Anmeldung in src/bsv/components/WebApp.tsx entfernen. Browser holen sw.js bei jedem Seitenaufruf neu (no-cache).
 */
const CACHE = 'bsv-offline-v1'
const OFFLINE = '/offline.html'
const DATEIEN = [OFFLINE, '/bsv-logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(DATEIEN.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const namen = await caches.keys()
      await Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      // Lädt Seiten parallel zum Start des Service Workers – kein Zeitverlust beim Öffnen
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Wappen auf der Offline-Seite: erst aus dem Netz, ohne Netz aus dem Zwischenspeicher
  if (req.mode !== 'navigate') {
    if (url.pathname === '/bsv-logo.png') {
      event.respondWith(fetch(req).catch(async () => (await caches.match('/bsv-logo.png', { cacheName: CACHE })) || Response.error()))
    }
    return
  }
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) return

  event.respondWith(
    (async () => {
      try {
        const vorab = await event.preloadResponse
        if (vorab) return vorab
        return await fetch(req)
      } catch {
        const offline = await caches.match(OFFLINE, { cacheName: CACHE })
        return offline || Response.error()
      }
    })(),
  )
})
