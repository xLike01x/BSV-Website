import 'server-only'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { Texte as TexteConfig } from '@/Texte/config'
import { standardTexte, zusammenfuehren } from '@/Texte/standard'
import { hauptsponsorUmziehen } from '@/utilities/hauptsponsorUmziehen'

import type { Angebote, Post, Termine, Texte, User, Verein } from '@/payload-types'

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

/** Pflegbare Menü-Links (Global „Menü“) */
export const getMenue = cache(async () => {
  const p = await payload()
  try {
    return await p.findGlobal({ slug: 'menue', depth: 1 })
  } catch {
    return null
  }
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

/** News für Startseite und Newsroom (Team-News nur, wenn die Redaktion sie freigegeben hat) */
export const getNews = cache(async (limit = 24, page = 1) => {
  const p = await payload()
  return p.find({
    collection: 'posts',
    where: { and: [{ _status: { equals: 'published' } }, { or: [{ aufStartseite: { equals: true } }, { aufStartseite: { exists: false } }] }] },
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
    // Vorschau: nur das, was der angemeldete Benutzer auch im Admin sehen darf
    overrideAccess: false,
    ...(draft ? { user: await aktuellerBenutzer() } : {}),
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

/** Alle veröffentlichten News eines Teams (auch die, die nicht auf der Startseite stehen) */
export const getTeamNews = cache(async (angebotId: number, limit = 6) => {
  const p = await payload()
  const res = await p.find({
    collection: 'posts',
    where: { and: [{ _status: { equals: 'published' } }, { team: { equals: angebotId } }] },
    sort: '-publishedAt',
    depth: 1,
    limit,
    overrideAccess: false,
  })
  return res.docs
})

/** Freigegebene Galeriebilder eines Teams */
export const getTeamGalerie = cache(async (angebotId: number, limit = 48) => {
  const p = await payload()
  const res = await p.find({
    collection: 'media',
    where: { and: [{ team: { equals: angebotId } }, { inGalerie: { equals: true } }, { mimeType: { contains: 'image' } }] },
    sort: '-createdAt',
    depth: 0,
    limit,
    overrideAccess: false,
  })
  return res.docs
})

export const getTexte = cache(async (): Promise<Texte> => {
  const p = await payload()
  const gespeichert = await p.findGlobal({ slug: 'texte', depth: 0 })
  return zusammenfuehren(standardTexte(TexteConfig.fields), gespeichert as unknown as Record<string, unknown>) as unknown as Texte
})

/** Platzhalter wie {teams} durch aktuelle Zahlen ersetzen */
export const getPlatzhalter = cache(async (): Promise<Record<string, string>> => {
  const [v, angebote] = await Promise.all([getVerein(), getAngebote()])
  const teams = angebote.filter((a) => a.bereich === 'fussball').length
  return {
    mitglieder: (v.mitglieder ?? 0).toLocaleString('de-DE'),
    teams: String(teams),
    kurse: String(angebote.length - teams),
    angebote: String(angebote.length),
    kinder: String(v.kinderFussball ?? 0),
    gruendung: String(v.gruendung ?? 1919),
  }
})

/** Aktive Sponsoren, sortiert */
export const getSponsoren = cache(async () => {
  const p = await payload()
  const res = await p.find({ collection: 'sponsoren', where: { aktiv: { not_equals: false } }, sort: 'reihenfolge', limit: 200, depth: 1 })
  return res.docs
})

/** Hauptsponsor (Art „Hauptsponsor“, kleinste Reihenfolge) – für Fußzeile und Sponsoren-Seite */
export const getHauptsponsor = cache(async () => {
  const haupt = (await getSponsoren()).find((s) => s.stufe === 'haupt')
  if (haupt) return haupt
  // Noch nicht übernommen? Dann jetzt – damit die Fußzeile nie leer bleibt
  const p = await payload()
  if (await hauptsponsorUmziehen(p).catch(() => null)) return (await p.find({ collection: 'sponsoren', where: { stufe: { equals: 'haupt' } }, sort: 'reihenfolge', limit: 1, depth: 1 })).docs[0] ?? null
  return null
})

/** Sichtbare Fotoalben (optional nur eines Teams) */
export const getAlben = cache(async (teamId?: number, limit = 60) => {
  const p = await payload()
  const res = await p.find({
    collection: 'alben',
    where: { and: [{ aktiv: { not_equals: false } }, ...(teamId ? [{ team: { equals: teamId } }] : [])] },
    sort: '-datum',
    limit,
    depth: 1,
  })
  return res.docs
})

export const getAlbum = cache(async (slug: string) => {
  const p = await payload()
  const res = await p.find({ collection: 'alben', where: { and: [{ slug: { equals: slug } }, { aktiv: { not_equals: false } }] }, limit: 1, depth: 1 })
  return res.docs[0] ?? null
})

/** Aktive Ehrenamts-Gesuche */
export const getGesuche = cache(async () => {
  const p = await payload()
  const res = await p.find({ collection: 'gesuche', where: { aktiv: { not_equals: false } }, sort: 'reihenfolge', limit: 50, depth: 0 })
  return res.docs
})
