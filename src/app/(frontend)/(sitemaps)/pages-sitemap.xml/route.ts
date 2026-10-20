import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const results = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 0,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const dateFallback = new Date().toISOString()

    // Feste Seiten der Website (ohne /search: die ist „noindex“ und doppelt /suche)
    const FEST = ['/', '/verein', '/fussball', '/breitensport', '/termine', '/trainingszeiten', '/news', '/galerie', '/sponsoren', '/kontakt', '/mitmachen', '/mitglied-werden']
    const defaultSitemap = FEST.map((p) => ({ loc: `${SITE_URL}${p === '/' ? '/' : p}`, lastmod: dateFallback }))

    // Teams & Kurse sowie Galerie-Alben
    const angebote = await payload.find({ collection: 'angebote', overrideAccess: false, depth: 0, limit: 0, pagination: false, where: { aktiv: { not_equals: false } }, select: { slug: true, updatedAt: true } })
    const alben = await payload.find({ collection: 'alben', overrideAccess: false, depth: 0, limit: 0, pagination: false, select: { slug: true, updatedAt: true } }).catch(() => ({ docs: [] }))
    const weitere = [
      ...angebote.docs.filter((a) => a.slug).map((a) => ({ loc: `${SITE_URL}/angebote/${a.slug}`, lastmod: a.updatedAt || dateFallback })),
      ...(alben.docs as { slug?: string; updatedAt?: string }[]).filter((a) => a.slug).map((a) => ({ loc: `${SITE_URL}/galerie/${a.slug}`, lastmod: a.updatedAt || dateFallback })),
    ]

    const sitemap = results.docs
      ? results.docs
          .filter((page) => Boolean(page?.slug))
          .map((page) => {
            return {
              loc: page?.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${page?.slug}`,
              lastmod: page.updatedAt || dateFallback,
            }
          })
      : []

    const doppelt = new Set(defaultSitemap.map((x) => x.loc))
    return [...defaultSitemap, ...weitere, ...sitemap.filter((x) => !doppelt.has(x.loc))]
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPagesSitemap()

  return getServerSideSitemap(sitemap)
}
