import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  return [
    // Alte Vorlagen-Pfade
    { source: '/posts', destination: '/news', permanent: true },
    { source: '/posts/:slug', destination: '/news/:slug', permanent: true },
    // Häufige Pfade der alten WordPress-Seite
    { source: '/kontakt-:name', destination: '/kontakt', permanent: true },
    { source: '/mitgliedsbeitraege', destination: '/verein#beitraege', permanent: true },
    { source: '/vorstand', destination: '/verein#vorstand', permanent: true },
    { source: '/satzung', destination: '/verein#downloads', permanent: true },
  ]
}
