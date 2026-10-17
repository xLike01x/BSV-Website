import 'server-only'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Angebote, Post, Termine, User, Verein } from '@/payload-types'

export const payload = cache(async () => getPayload({ config: configPromise }))

/** Angemeldeter Benutzer (aus dem Cookie), oder null */
export const aktuellerBenutzer = cache(async (): Promise<User | null> => {
  const p = await payload()
  const { user } = await p.auth({ headers: await getHeaders() })
  return (user as User | null) ?? null
})

export const getVerein = cache(async (): Promise<Verein> => {
  const p = await payload()
  return p.findGlobal({ slug: 'verein', depth: 1 })
})

/** Alle aktiven Angebote, sortiert nach Reihenfolge und Name */
export const getAngebote = cache(async (): Promise<Angebote[]> => {
  const p = await payload()
  const res = await p.find({
    collection: 'angebote',
    where: { aktiv: { not_equals: false } },
    sort: ['reihenfolge', 'title'],
    depth: 1,
    limit: 200,
    pagination: false,
    overrideAccess: false,
  })
  return res.docs
})

export const getAngebot = cache(async (slug: string): Promise<Angebote | null> => {
  const p = await payload()
  const res = await p.find({
    collection: 'angebote',
    where: { and: [{ slug: { equals: slug } }, { aktiv: { not_equals: false } }] },
    depth: 1,
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
})

/** Kommende Trainingsausfälle (ab heute) für ein Angebot oder alle */
export const getAusfaelle = cache(async (angebotIds?: number[]) => {
  const p = await payload()
  const heute = new Date()
  heute.setHours(0, 0, 0, 0)
  const res = await p.find({
    collection: 'ausfaelle',
    where: {
      and: [
        { datum: { greater_than_equal: heute.toISOString() } },
        ...(angebotIds ? [{ angebot: { in: angebotIds } }] : []),
      ],
    },
    sort: 'datum',
    depth: 1,
    limit: 50,
    overrideAccess: false,
  })
  return res.docs
})

export const getNews = cache(async (limit = 24, page = 1) => {
  const p = await payload()
  return p.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 1,
    limit,
    page,
    overrideAccess: false,
  })
})

export const getNewsArtikel = cache(async (slug: string, draft = false): Promise<Post | null> => {
  const p = await payload()
  const res = await p.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    draft,
    overrideAccess: draft,
  })
  return res.docs[0] ?? null
})

export const getTermine = cache(async (limit = 50): Promise<Termine[]> => {
  const p = await payload()
  const user = await aktuellerBenutzer()
  const jetzt = new Date()
  jetzt.setHours(0, 0, 0, 0)
  const res = await p.find({
    collection: 'termine',
    where: { beginn: { greater_than_equal: jetzt.toISOString() } },
    sort: 'beginn',
    limit,
    depth: 0,
    overrideAccess: false,
    user,
  })
  return res.docs
})
