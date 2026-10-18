import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'
import React from 'react'

import { aktuellerBenutzer, payload } from '@/bsv/data'
import { datum, KATEGORIE_FARBE } from '@/bsv/lib'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Suche', robots: { index: false } }

type Treffer = { href: string; art: string; titel: string; text?: string }

/** Suche über Teams & Kurse, News, Seiten und Termine */
export default async function Suche({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 80)
  const gruppen: { titel: string; treffer: Treffer[] }[] = []

  if (q.length >= 2) {
    const p = await payload()
    const user = await aktuellerBenutzer()
    const enthaelt = (...felder: string[]): Where => ({ or: felder.map((f) => ({ [f]: { like: q } })) })
    const kategorien = Object.keys(KATEGORIE_FARBE).filter((k) => k.toLowerCase().includes(q.toLowerCase()))
    const heute = new Date()
    heute.setHours(0, 0, 0, 0)
    const [angebote, news, seiten, termine] = await Promise.all([
      p.find({
        collection: 'angebote',
        where: {
          and: [
            { aktiv: { not_equals: false } },
            // Kategorie ist eine feste Liste – passende Kategorien (z. B. „Tanz“ → Tanzen) mitsuchen
            { or: [enthaelt('title', 'kurzbeschreibung', 'alterText'), ...(kategorien.length ? [{ kategorie: { in: kategorien } }] : [])] },
          ],
        },
        limit: 20,
        depth: 0,
      }),
      p.find({ collection: 'posts', where: { and: [{ _status: { equals: 'published' } }, enthaelt('title', 'meta.description')] }, sort: '-publishedAt', limit: 10, depth: 0 }),
      p.find({ collection: 'pages', where: { and: [{ _status: { equals: 'published' } }, enthaelt('title', 'meta.description')] }, limit: 10, depth: 0 }),
      p.find({ collection: 'termine', where: { and: [{ beginn: { greater_than_equal: heute.toISOString() } }, enthaelt('title', 'beschreibung', 'ort')] }, sort: 'beginn', limit: 10, depth: 0, overrideAccess: false, user }),
    ])
    gruppen.push(
      { titel: 'Teams & Kurse', treffer: angebote.docs.map((a) => ({ href: `/angebote/${a.slug}`, art: a.kategorie ?? 'Team', titel: a.title, text: a.kurzbeschreibung ?? a.alterText ?? undefined })) },
      { titel: 'News', treffer: news.docs.map((n) => ({ href: `/news/${n.slug}`, art: datum(n.publishedAt), titel: n.title, text: n.meta?.description ?? undefined })) },
      { titel: 'Termine', treffer: termine.docs.map((t) => ({ href: `/termine#termin-${t.id}`, art: datum(t.beginn, { weekday: 'short', day: 'numeric', month: 'long' }), titel: t.title, text: t.ort ?? undefined })) },
      { titel: 'Seiten', treffer: seiten.docs.map((s) => ({ href: s.slug === 'home' ? '/' : `/${s.slug}`, art: 'Seite', titel: s.title, text: s.meta?.description ?? undefined })) },
    )
  }
  const anzahl = gruppen.reduce((s, g) => s + g.treffer.length, 0)

  return (
    <>
      <section className="wrap-narrow" style={{ paddingTop: 80, paddingBottom: 32 }}>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(48px, 7vw, 84px)', lineHeight: 1 }}>
          Suche
        </h1>
        <form action="/suche" className="suche-form in2" role="search" style={{ marginTop: 24 }}>
          <input type="search" name="q" defaultValue={q} placeholder="z. B. Zumba, E-Jugend, Sommerfest" aria-label="Suchbegriff" autoFocus={!q} />
          <button type="submit" className="btn btn-primary">
            Suchen
          </button>
        </form>
      </section>
      <section className="sec-soft" style={{ padding: '24px 0 110px', minHeight: 360 }}>
        <div className="wrap-narrow">
          {q.length >= 2 && (
            <p className="muted" style={{ margin: '16px 0 0' }}>
              {anzahl === 0 ? `Keine Treffer für „${q}“.` : `${anzahl} ${anzahl === 1 ? 'Treffer' : 'Treffer'} für „${q}“`}
            </p>
          )}
          {q.length >= 2 && anzahl === 0 && (
            <p style={{ marginTop: 12 }}>
              Tipp: Schau in den <Link href="/trainingszeiten">Wochenplan</Link>, die <Link href="/fussball">Fußball-Teams</Link> oder die{' '}
              <Link href="/breitensport">Kurse</Link> – oder <Link href="/kontakt">schreib uns</Link>.
            </p>
          )}
          {gruppen
            .filter((g) => g.treffer.length)
            .map((g) => (
              <div key={g.titel} className="suche-gruppe">
                <h2 className="t-3">{g.titel}</h2>
                <ul className="suche-liste">
                  {g.treffer.map((t) => (
                    <li key={t.href}>
                      <Link href={t.href} className="suche-treffer">
                        <small>{t.art}</small>
                        <strong>{t.titel}</strong>
                        {t.text && <span>{t.text}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </section>
    </>
  )
}
