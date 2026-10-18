import 'server-only'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload, type Field } from 'payload'
import { cache } from 'react'

import { Texte as TexteConfig } from '@/Texte/config'

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

/** Standardtexte aus der Konfiguration – greifen, solange in der Verwaltung nichts eingetragen ist */
const standardTexte = (felder: Field[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const f of felder) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs) {
        const inner = standardTexte(tab.fields)
        if ('name' in tab && tab.name) out[tab.name] = inner
        else Object.assign(out, inner)
      }
    } else if (f.type === 'group' && 'name' in f && f.name) out[f.name] = standardTexte(f.fields)
    else if ('name' in f && 'defaultValue' in f && typeof f.defaultValue === 'string') out[f.name] = f.defaultValue
  }
  return out
}

const zusammenfuehren = (basis: Record<string, unknown>, werte: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...basis }
  for (const [k, v] of Object.entries(werte ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = zusammenfuehren((basis[k] as Record<string, unknown>) ?? {}, v as Record<string, unknown>)
    else if (v !== null && v !== undefined && v !== '') out[k] = v
  }
  return out
}

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
