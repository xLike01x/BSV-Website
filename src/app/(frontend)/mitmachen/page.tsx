import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import Link from 'next/link'
import React from 'react'

import { Teilen } from '@/bsv/components/Teilen'
import { T } from '@/bsv/components/Text'
import { getGesuche, getPlatzhalter, getTexte } from '@/bsv/data'

export const revalidate = 60
export const metadata: Metadata = seite('Mitmachen & Ehrenamt', 'Der BSV sucht Trainerinnen, Trainer, Helferinnen und Helfer – mach mit im Ehrenamt!')

export default async function Mitmachen() {
  const [gesuche, tx, w] = await Promise.all([getGesuche(), getTexte(), getPlatzhalter()])
  return (
    <>
      <section className="wrap-narrow center" style={{ paddingTop: 88, paddingBottom: 40 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(52px, 8vw, 96px)' }}>
          <T text={tx.mitmachen?.titel} werte={w} />
        </h1>
        <p className="lead in2" style={{ margin: '16px auto 0', maxWidth: 680 }}>
          <T text={tx.mitmachen?.text} werte={w} />
        </p>
      </section>
      <section className="sec-soft" style={{ padding: '56px 22px 100px' }}>
        <div className="wrap-narrow" style={{ padding: 0 }}>
          {gesuche.length === 0 && (
            <p className="muted center">
              Gerade suchen wir niemanden Bestimmten – Hilfe ist trotzdem immer willkommen. <Link href="/kontakt?thema=Ehrenamt">Schreib uns!</Link>
            </p>
          )}
          <div className="gesuch-raster">
            {gesuche.map((g) => (
              <article key={g.id} className="gesuch-karte rv">
                <span className="gesuch-symbol" aria-hidden="true">
                  {g.symbol ?? '🙋'}
                </span>
                <h2>{g.titel}</h2>
                {g.aufwand && <p className="gesuch-aufwand">⏱ {g.aufwand}</p>}
                <p style={{ whiteSpace: 'pre-line' }}>{g.text}</p>
                <div className="gesuch-aktionen">
                  <Link href={`/kontakt?thema=${encodeURIComponent(`Ehrenamt: ${g.titel}`)}`} className="btn btn-primary">
                    Ich bin dabei
                  </Link>
                  <Teilen klein titel={g.titel} pfad="/mitmachen" text={`Der BSV sucht: ${g.titel}`} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
