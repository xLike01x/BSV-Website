import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const istDev = process.env.NODE_ENV !== 'production'

/**
 * Content-Security-Policy (Audit F-15): Skripte nur von der eigenen Website und – nach Klick – von FuPa/FUSSBALL.DE.
 * 'unsafe-inline' ist nötig, weil Next.js und Payload kleine Skripte direkt in die Seite schreiben.
 * Verstöße meldet der Browser an /api/csp-bericht (erscheinen im Server-Protokoll) – so fällt auf, wenn ein Widget mehr braucht.
 */
const EXTERN = 'https://*.fupa.net https://fupa.net https://*.fussball.de https://fussball.de'
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${istDev ? " 'unsafe-eval'" : ''} ${EXTERN}`,
  `style-src 'self' 'unsafe-inline' ${EXTERN}`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  `connect-src 'self' ${EXTERN}${istDev ? ' ws: wss:' : ''}`,
  `frame-src 'self' ${EXTERN} https://www.openstreetmap.org`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(istDev ? [] : ['upgrade-insecure-requests']),
  'report-uri /api/csp-bericht',
].join('; ')

const nextConfig: NextConfig = {
  // Live: zwei Build-Ordner im Wechsel (.next-a/.next-b), damit ein Update ohne lange Ausfallzeit und mit
  // Rückfallmöglichkeit läuft – siehe deploy/update.sh. Lokal bleibt es bei .next.
  distDir: process.env.BSV_DIST_DIR || '.next',
  // Entwicklungsserver auch über einen Cloudflare-Quick-Tunnel (Vorschau für Kollegen) nutzbar machen.
  // Ohne diese Zeile blockiert Next.js die Skripte → Seite lädt, aber Login-Knopf u. Ä. reagieren nicht.
  // Nur beim Entwickeln wirksam; Testkonten sind über einen Tunnel ohnehin gesperrt.
  // Statt aller Tunnel-Adressen lässt sich die konkrete per BSV_TUNNEL=xyz.trycloudflare.com festlegen.
  allowedDevOrigins: [process.env.BSV_TUNNEL || '*.trycloudflare.com'],
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    // Verkleinerte Bilder höchstens 10 Minuten zwischenspeichern (statt 4 Stunden) – gelöschte Bilder verschwinden so schnell
    minimumCacheTTL: 600,
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  // Verrät nicht, welche Software läuft
  poweredByHeader: false,
  // Sicherheits-Header für alle Seiten
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Nicht in fremde Seiten einbetten (Klickfallen); eigene Vorschau im Admin bleibt möglich
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          // Nur über HTTPS wirksam (Browser ignorieren den Header bei http://localhost)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // Wappen, App-Symbole und Favicon: einen Tag zwischenspeichern, danach im Hintergrund aktualisieren
        // (Standard wäre „jedes Mal neu fragen“)
        source: '/:datei(bsv-logo.png|favicon.png|favicon.ico|app-symbol-180.png|app-symbol-192.png|app-symbol-512.png|app-symbol-maskable-512.png|og-bsv.jpg)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        // Web-App: Browser fragen bei jedem Start nach einer neuen Version des Service Workers
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
