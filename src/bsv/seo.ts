import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'

/** Metadaten einer Seite inkl. Vorschau beim Teilen (WhatsApp, Facebook …) */
export function seite(titel: string, beschreibung?: string, bild?: string | null, extra: Metadata = {}): Metadata {
  return {
    title: titel,
    description: beschreibung,
    openGraph: mergeOpenGraph({ title: `${titel} | BSV 1919`, description: beschreibung, ...(bild ? { images: [{ url: bild, width: 1200, height: 630 }] } : {}) }),
    ...extra,
  }
}

export const absolut = (pfad?: string | null) => (pfad ? (pfad.startsWith('http') ? pfad : `${getServerSideURL()}${pfad}`) : undefined)

/** Brotkrumen für Google */
export const brotkrumen = (teile: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: teile.map(([name, pfad], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolut(pfad) })),
})
