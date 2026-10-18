import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Bild } from '@/bsv/components/Bild'
import { T } from '@/bsv/components/Text'
import { getAlben, getPlatzhalter, getTexte } from '@/bsv/data'
import { datum } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = seite('Galerie', 'Fotos aus dem Vereinsleben des Büdericher Spielvereins – Feste, Turniere und Training.')

export default async function Galerie() {
  const [alben, tx, w] = await Promise.all([getAlben(), getTexte(), getPlatzhalter()])
  return (
    <>
      <section className="wrap-narrow" style={{ paddingTop: 80, paddingBottom: 32 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
          <T text={tx.galerie?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '14px 0 0', maxWidth: 680 }}>
          <T text={tx.galerie?.text} werte={w} />
        </p>
      </section>
      <section className="sec-soft" style={{ padding: '48px 22px 110px' }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          {alben.length === 0 && <p className="muted">Bald findest du hier Fotos aus dem Vereinsleben.</p>}
          <div className="alben-raster">
            {alben.map((a) => {
              const bilder = (a.bilder ?? []).filter((b) => typeof b === 'object')
              const team = a.team && typeof a.team === 'object' ? a.team.title : null
              return (
                <Link key={a.id} href={`/galerie/${a.slug}`} className="card album-karte rv">
                  <span className="album-cover">{bilder[0] && <Bild media={bilder[0]} size="medium" sizes="(max-width: 700px) 100vw, 380px" />}</span>
                  <span style={{ padding: '16px 20px 20px' }}>
                    <span className="card-cat" style={{ color: 'var(--bsv-green)' }}>
                      {datum(a.datum, { day: 'numeric', month: 'long', year: 'numeric' })}
                      {team ? ` · ${team}` : ''}
                    </span>
                    <strong style={{ display: 'block', fontSize: 20, margin: '4px 0 2px' }}>{a.titel}</strong>
                    <span className="muted">{bilder.length} Fotos</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
