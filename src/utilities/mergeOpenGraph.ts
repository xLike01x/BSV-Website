import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Fußball und Breitensport für alle von 1 bis 99 Jahren in Wesel-Büderich.',
  images: [
    {
      url: `${getServerSideURL()}/og-bsv.jpg`,
    },
  ],
  siteName: 'Büdericher Spielverein 1919 e.V.',
  title: 'Büdericher Spielverein 1919 e.V.',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
