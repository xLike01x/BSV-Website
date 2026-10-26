import { StatistikZaehler } from '@/bsv/statistik/Zaehler'
import type { Metadata, Viewport } from 'next'

import { cn } from '@/utilities/ui'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import '@fontsource/caveat/700.css'

import { Footer } from '@/bsv/components/Footer'
import { Nav } from '@/bsv/components/Nav'
import { TextZeigen } from '@/bsv/components/TextZeigen'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import './bsv.css'
import { getServerSideURL } from '@/utilities/getURL'
import { getTexte } from '@/bsv/data'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  // Animationen (Texte & Bilder → Animationen): ausgeschaltete Effekte als data-Attribute am <body>, das CSS richtet sich danach
  const a = ((await getTexte().catch(() => null)) as { animationen?: Record<string, boolean | null | undefined> } | null)?.animationen ?? {}
  const aus = (k: string) => (a[k] === false ? 'aus' : undefined)

  return (
    <html className={cn(GeistSans.variable)} lang="de" data-theme="light" suppressHydrationWarning>
      <head>
        <link href="/favicon.png" rel="icon" type="image/png" />
        <link href="/app-symbol-180.png" rel="apple-touch-icon" />
      </head>
      <body
        className="bsv"
        data-anim={aus('alle')}
        data-anim-ball={aus('reglerBall')}
        data-anim-countdown={aus('countdown')}
        data-anim-puls={aus('pulslinie')}
        data-anim-kreide={aus('kreide')}
        data-anim-fehlerseite={aus('fehlerseite')}
        suppressHydrationWarning
      >
        <Providers>
          {/* Besucherstatistik ohne Cookies (siehe /admin/statistik) */}
          <StatistikZaehler />
          <a href="#inhalt" className="sr-only">
            Zum Inhalt springen
          </a>
          {isEnabled && (
            <div style={{ background: 'var(--bsv-ink)', color: '#fff', fontSize: 13, padding: '8px 22px', textAlign: 'center' }}>
              Vorschau mit unveröffentlichten Änderungen · <a href="/next/exit-preview" style={{ color: '#fff' }}>Vorschau beenden</a>
            </div>
          )}
          <Nav />
          <main id="inhalt">{children}</main>
          <Footer />
          <TextZeigen />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'Büdericher Spielverein 1919 e.V. – Fußball und Breitensport in Wesel-Büderich',
    template: '%s | Büdericher SV 1919',
  },
  description:
    'Fußball, Tanzen, Turnen, Fitness, Yoga und Walking für alle von 1 bis 99 Jahren. Über 1.000 Mitglieder im Kutscher-Remy-Sportpark in Wesel-Büderich.',
  openGraph: mergeOpenGraph(),
  twitter: { card: 'summary_large_image' },
  // Web-App (Startbildschirm): Name, Symbol, Farbe – siehe public/site.webmanifest und public/sw.js
  manifest: '/site.webmanifest',
  appleWebApp: { capable: true, title: 'BSV 1919', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#157A43',
  // Die Website ist bewusst hell. „only light“ verhindert, dass Handy-Browser sie im Dunkelmodus automatisch umfärben
  colorScheme: 'only light',
}
