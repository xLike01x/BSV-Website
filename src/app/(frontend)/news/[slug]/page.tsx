import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import RichText from '@/components/RichText'
import { Bild } from '@/bsv/components/Bild'
import { Teilen } from '@/bsv/components/Teilen'
import { JsonLd } from '@/bsv/components/JsonLd'
import { absolut, brotkrumen } from '@/bsv/seo'
import { getNews, getNewsArtikel } from '@/bsv/data'
import { datum, lesezeit, lexicalText } from '@/bsv/lib'
import type { Category, Post } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'

export const revalidate = 60

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  // Im Testbetrieb (pnpm dev) nichts vorab erzeugen: Next startet dafür bei jedem ersten Aufruf einen eigenen Prozess,
  // der Payload samt Datenbankprüfung („Pulling schema …“) neu hochfährt – 10 Sekunden und mehr. Die Seiten entstehen dann
  // beim Aufruf. Live (next build) werden sie wie bisher vorab erzeugt.
  if (process.env.NODE_ENV === 'development') return []
  const news = await getNews(100)
  return news.docs.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await getNewsArtikel(decodeURIComponent(slug))
  return generateMeta({ doc: post })
}

export default async function Artikel({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug } = await params
  const post = await getNewsArtikel(decodeURIComponent(slug), draft)
  if (!post) notFound()

  // „Passende News“ aus der Verwaltung (nur veröffentlichte, nicht im Papierkorb); sonst die neuesten drei
  const gewaehlt = (post.relatedPosts ?? []).filter(
    (n): n is Post => typeof n === 'object' && n !== null && n.id !== post.id && n._status === 'published' && !n.deletedAt,
  )
  const weitere = gewaehlt.length ? gewaehlt.slice(0, 3) : (await getNews(4)).docs.filter((n) => n.id !== post.id).slice(0, 3)
  const weitereTitel = gewaehlt.length ? 'Passend dazu' : 'Weitere News'
  const team = typeof post.team === 'object' && post.team ? post.team : null
  const kat = team?.title ?? post.categories?.find((c): c is Category => typeof c === 'object')?.title ?? 'Verein'
  const minuten = lesezeit(lexicalText(post.content))
  const autor = post.populatedAuthors?.[0]?.name

  return (
    <>
      <JsonLd
        daten={[
          brotkrumen([
            ['News', '/news'],
            [post.title, `/news/${post.slug}`],
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: post.title,
            datePublished: post.publishedAt ?? post.createdAt,
            dateModified: post.updatedAt,
            image: post.heroImage && typeof post.heroImage === 'object' ? [absolut(post.heroImage.url)] : undefined,
            author: autor ? { '@type': 'Person', name: autor } : { '@type': 'Organization', name: 'Büdericher SV 1919' },
            publisher: { '@type': 'Organization', name: 'Büdericher Spielverein 1919 e.V.', logo: { '@type': 'ImageObject', url: absolut('/bsv-logo.png') } },
            mainEntityOfPage: absolut(`/news/${post.slug}`),
          },
        ]}
      />
      {draft && <LivePreviewListener />}
      <article>
        <header className="wrap-text" style={{ maxWidth: 820, paddingTop: 72, paddingBottom: 40 }}>
          <nav aria-label="Brotkrumen" className="crumbs in1" style={{ fontSize: 14, marginBottom: 20 }}>
            <Link href="/news">News</Link> › {team ? <Link href={`/angebote/${team.slug}`}>{team.title}</Link> : kat}
          </nav>
          <p className="green in1" style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600 }}>
            {kat} · {datum(post.publishedAt)} · {minuten} Min. Lesezeit
          </p>
          <h1 className="t-page in2" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.04 }}>
            {post.title}
          </h1>
          {post.meta?.description && (
            <p className="in3" style={{ margin: '22px 0 0', fontSize: 23, lineHeight: 1.45, color: 'var(--bsv-ink-2)' }}>
              {post.meta.description}
            </p>
          )}
          <div className="in3" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {autor && (
              <p className="muted" style={{ margin: 0, fontSize: 15 }}>
                von <strong style={{ color: 'var(--bsv-ink)' }}>{autor}</strong>
              </p>
            )}
            <Teilen titel={post.title} text={post.title} />
          </div>
        </header>

        {post.heroImage && typeof post.heroImage === 'object' && (
          <div className="wrap-narrow">
            <div style={{ borderRadius: 30, overflow: 'hidden', background: 'var(--bsv-soft)', display: 'flex', justifyContent: 'center', maxHeight: 640 }}>
              <Bild media={post.heroImage} size="xlarge" priority sizes="(max-width: 1220px) 100vw, 1180px" style={{ width: '100%', height: 'auto', maxHeight: 640, objectFit: 'contain', display: 'block' }} />
            </div>
          </div>
        )}

        <div className="wrap-text" style={{ paddingTop: 56, paddingBottom: 40 }}>
          <RichText data={post.content} enableGutter={false} enableProse={false} className="prose-bsv" />
        </div>

        <div className="wrap-text" style={{ paddingBottom: 72 }}>
          <Teilen titel={post.title} />
        </div>
      </article>

      {weitere.length > 0 && (
        <section className="sec-soft" style={{ padding: '80px 22px' }}>
          <div className="wrap-narrow" style={{ padding: 0 }}>
            <h2 className="t-3 rv" style={{ marginBottom: 24 }}>
              {weitereTitel}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
              {weitere.map((n) => (
                <Link key={n.id} href={`/news/${n.slug}`} className="card rv" style={{ padding: 24 }}>
                  <span className="card-cat green">{datum(n.publishedAt)}</span>
                  <strong style={{ display: 'block', fontSize: 21, lineHeight: 1.25, marginTop: 6 }}>{n.title}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
