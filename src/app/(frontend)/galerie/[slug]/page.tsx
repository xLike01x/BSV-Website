import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Fotogalerie } from '@/bsv/components/Fotogalerie'
import { Teilen } from '@/bsv/components/Teilen'
import { seite } from '@/bsv/seo'
import { getAlbum } from '@/bsv/data'
import { bildSrcSet, bildUrl, datum } from '@/bsv/lib'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getAlbum((await params).slug)
  if (!a) return { title: 'Album nicht gefunden' }
  const erstes = (a.bilder ?? []).find((b) => typeof b === 'object')
  const og = bildUrl(erstes, 'og')
  return seite(a.titel, a.beschreibung ?? `Fotos: ${a.titel}`, og)
}

export default async function Album({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getAlbum((await params).slug)
  if (!a) notFound()
  const bilder = (a.bilder ?? [])
    .filter((b): b is Exclude<typeof b, number> => typeof b === 'object' && b !== null)
    .map((b) => ({ id: b.id, src: bildUrl(b, 'medium') ?? '', srcSet: bildSrcSet(b), gross: bildUrl(b, 'xlarge') ?? bildUrl(b) ?? '', alt: b.alt ?? '', breite: b.width ?? 4, hoehe: b.height ?? 3 }))
  const team = a.team && typeof a.team === 'object' ? a.team : null
  return (
    <>
      <section className="wrap-narrow" style={{ paddingTop: 64, paddingBottom: 28 }}>
        <p className="muted" style={{ fontSize: 15 }}>
          <Link href="/galerie">Galerie</Link> › {a.titel}
        </p>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(40px, 6vw, 72px)', marginTop: 8 }}>
          {a.titel}
        </h1>
        <p className="lead in2" style={{ margin: '10px 0 0' }}>
          {datum(a.datum, { day: 'numeric', month: 'long', year: 'numeric' })} · {bilder.length} Fotos
          {team && (
            <>
              {' · '}
              <Link href={`/angebote/${team.slug}`}>{team.title}</Link>
            </>
          )}
        </p>
        {a.beschreibung && <p style={{ maxWidth: 720, marginTop: 12, whiteSpace: 'pre-line' }}>{a.beschreibung}</p>}
        <div style={{ marginTop: 16 }}>
          <Teilen titel={a.titel} text={`Fotos: ${a.titel}`} />
        </div>
      </section>
      <section className="wrap-narrow" style={{ paddingBottom: 110 }}>
        <Fotogalerie bilder={bilder} />
      </section>
    </>
  )
}
