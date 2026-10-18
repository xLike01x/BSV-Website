import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Bild } from '@/bsv/components/Bild'
import { NewsListe, type NewsKarte } from '@/bsv/components/NewsListe'
import { T } from '@/bsv/components/Text'
import { getNews, getPlatzhalter, getTexte } from '@/bsv/data'
import { bildUrl, datum, fokus } from '@/bsv/lib'
import type { Category, Post } from '@/payload-types'

export const revalidate = 60
export const metadata: Metadata = seite('News', 'Was im BSV los ist – auf dem Platz, in der Halle, im Verein.')

const kategorie = (p: Post) => {
  const c = p.categories?.find((x): x is Category => typeof x === 'object')
  return c?.title ?? 'Verein'
}

export default async function NewsSeite() {
  const [news, tx, w] = await Promise.all([getNews(60), getTexte(), getPlatzhalter()])
  const [top, ...rest] = news.docs

  const items: NewsKarte[] = rest.map((n) => ({
    id: n.id,
    href: `/news/${n.slug}`,
    titel: n.title,
    datum: datum(n.publishedAt),
    kategorie: kategorie(n),
    img: bildUrl(n.heroImage, 'small'),
    pos: fokus(n.heroImage),
  }))
  const kategorien = Array.from(new Set(items.map((i) => i.kategorie)))

  return (
    <>
      <section className="wrap-narrow" style={{ paddingTop: 80, paddingBottom: 40 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 1 }}>
          <T text={tx.news?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '14px 0 0' }}>
          <T text={tx.news?.text} werte={w} />
        </p>
      </section>

      {!top && (
        <section className="wrap-narrow" style={{ paddingBottom: 110 }}>
          <p className="muted">Noch keine News veröffentlicht.</p>
        </section>
      )}

      {top && (
        <section className="wrap-narrow" style={{ paddingBottom: 40 }}>
          <Link href={`/news/${top.slug}`} className="tile in2" style={{ background: 'var(--bsv-green-tint)', flexDirection: 'row', flexWrap: 'wrap', minHeight: 440 }}>
            <span style={{ flex: '1 1 520px', minHeight: 320, background: 'var(--bsv-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
              <Bild media={top.heroImage} size="large" priority sizes="(max-width: 900px) 100vw, 640px" style={{ maxWidth: '100%', maxHeight: 420, width: 'auto', height: 'auto', borderRadius: 18, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }} />
            </span>
            <span style={{ flex: '1 1 360px', padding: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
              <span className="green" style={{ fontSize: 15, fontWeight: 600 }}>
                {kategorie(top)} · {datum(top.publishedAt)}
              </span>
              <strong style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.08, letterSpacing: '-0.035em' }}>{top.title}</strong>
              <span className="green" style={{ fontSize: 17, marginTop: 8, fontWeight: 600 }}>
                Weiterlesen ›
              </span>
            </span>
          </Link>
        </section>
      )}

      {items.length > 0 && (
        <section className="wrap-narrow" style={{ paddingTop: 24, paddingBottom: 110 }}>
          <NewsListe items={items} kategorien={kategorien} />
        </section>
      )}
    </>
  )
}
