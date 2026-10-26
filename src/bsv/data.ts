import { abMonat, euroKurz } from '@/bsv/beitrag'
import 'server-only'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { Texte as TexteConfig } from '@/Texte/config'
import { standardTexte, zusammenfuehren } from '@/Texte/standard'
import { hauptsponsorUmziehen } from '@/utilities/hauptsponsorUmziehen'
import { abFilter, aufloesen, berlinTag, terminSchluessel, type Vorkommen } from '@/bsv/wiederholung'

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

/** Bilder und Aktions-Box – stehen unter „Texte & Bilder“ beim jeweiligen Reiter (gleiche Form wie früher) */
export const getStartseite = cache(async () => {
  const t = (await getTexte()) as unknown as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    aktion: t.aktion as Texte['aktion'],
    startseite: {
      heroBilder: (t.heroBilder ?? []) as Texte['heroBilder'],
      heroTag1: t.heroTag1 as string | null | undefined,
      heroTag2: t.heroTag2 as string | null | undefined,
      bildFussball: t.bildFussball as Texte['bildFussball'],
      bildKids: t.bildKids as Texte['bildKids'],
      bildFitness: t.bildFitness as Texte['bildFitness'],
      bildBreitensport1: t.breitensport?.bild1 as Texte['bildFussball'],
      bildBreitensport2: t.breitensport?.bild2 as Texte['bildFussball'],
      bildBreitensport3: t.breitensport?.bild3 as Texte['bildFussball'],
      bildVerein: t.verein?.titelbild as Texte['bildFussball'],
    },
  }
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

export const getTermine = cache(async (limit = 50): Promise<Vorkommen[]> => {
  const p = await payload()
  const user = await aktuellerBenutzer()
  const jetzt = new Date()
  jetzt.setHours(0, 0, 0, 0)
  const bis = new Date(jetzt)
  bis.setFullYear(bis.getFullYear() + 1)
  const res = await p.find({
    collection: 'termine',
    where: abFilter(jetzt),
    sort: 'beginn',
    limit: 300,
    depth: 0,
    overrideAccess: false,
    user,
  })
  // Wiederkehrende Termine in Einzeltermine auflösen
  return aufloesen(res.docs, jetzt, bis, limit)
})

/** Countdown auf der Startseite: nächster Beginn aller öffentlichen Termine mit Haken „Countdown“ – ohne Anmeldung abgefragt,
 *  damit die Startseite statisch bleibt und Mitglieder-Termine nie erscheinen */
export type CountdownDaten = { kicker: string; titel: string; text: string; linkText: string; href: string; beginn: string; ende: string | null; jetzt: number }
export const getCountdown = cache(async (): Promise<CountdownDaten | null> => {
  const p = await payload()
  // Ohne Anmeldung abgefragt: Termine „nur für Mitglieder“ fallen dadurch immer heraus
  const res = await p.find({ collection: 'termine', where: { countdown: { equals: true } }, depth: 0, limit: 50, pagination: false, overrideAccess: false })
  if (!res.docs.length) return null
  const jetzt = Date.now()
  const ab = new Date(jetzt - 24 * 60 * 60 * 1000)
  const bis = new Date(jetzt + 2 * 366 * 24 * 60 * 60 * 1000)
  // Nächstes Vorkommen aller Termine mit Haken, das noch nicht vorbei ist (ohne Ende: bis zum Ende des Tages, Berliner Zeit)
  const heute = berlinTag(new Date(jetzt))
  const nochNichtVorbei = (x: Vorkommen) => (x.ende ? new Date(x.ende).getTime() > jetzt : berlinTag(x.beginn) >= heute)
  const v = aufloesen(res.docs, ab, bis).find(nochNichtVorbei)
  if (!v) return null
  const schluessel = terminSchluessel(v)
  // Ziel des Buttons: gewählte eigene Seite – ohne Anmeldung abgefragt, also nur, wenn sie veröffentlicht ist; sonst der Termin
  const s = (v as { countdownSeite?: unknown }).countdownSeite
  const seitenId = s ? (typeof s === 'object' ? (s as { id: number }).id : Number(s)) : null
  const seite = seitenId
    ? ((await p.find({ collection: 'pages', where: { id: { equals: seitenId } }, depth: 0, limit: 1, overrideAccess: false, select: { slug: true, breadcrumbs: true } })).docs[0] as
        | { slug?: string | null; breadcrumbs?: { url?: string | null }[] | null }
        | undefined)
    : undefined
  const seitenAdresse = seite ? (seite.breadcrumbs?.at(-1)?.url ?? (seite.slug ? `/${seite.slug}` : null)) : null
  const t = ((await getTexte()) as unknown as { countdown?: { kicker?: string; linkText?: string } }).countdown
  return {
    kicker: t?.kicker || 'Bald im BSV',
    titel: v.title,
    text: (v as { countdownText?: string | null }).countdownText || v.ort || '',
    linkText: t?.linkText || 'Alle Infos zum Termin ›',
    href: seitenAdresse ?? `/termine#termin-${schluessel}`,
    beginn: v.beginn,
    ende: v.ende ?? null,
    jetzt,
  }
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

/** Website-Aufbau → Animationen (Schalter für Effekte und Spielecke); fehlt etwas, gilt „an“ */
export type AnimationenDaten = Partial<Record<'alle' | 'reglerBall' | 'countdown' | 'pulslinie' | 'kreide' | 'fehlerseite' | 'elfmeter' | 'hochhalten', boolean | null>>
export const getAnimationen = cache(async (): Promise<AnimationenDaten> => {
  const p = await payload()
  return ((await p.findGlobal({ slug: 'animationen', depth: 0 }).catch(() => null)) ?? {}) as AnimationenDaten
})
/** Ist der Effekt eingeschaltet? (Standard: ja) */
export const animationAn = (a: AnimationenDaten, k: keyof AnimationenDaten) => a[k] !== false

export const getTexte = cache(async (): Promise<Texte> => {
  const p = await payload()
  // depth 1: Bilder kommen als vollständige Medien mit (Größen, Alt-Text)
  const gespeichert = await p.findGlobal({ slug: 'texte', depth: 1 })
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
    // Günstigster Monatsbeitrag (aktiv), z. B. „5“ oder „6,67“ – aus Vereinsdaten → Mitgliedsbeiträge
    abMonat: euroKurz(abMonat(v.beitraege ?? []) ?? 0).replace(' €', ''),
  }
})

/** Aktive Sponsoren, sortiert */
export const getSponsoren = cache(async () => {
  const p = await payload()
  const res = await p.find({ collection: 'sponsoren', where: { aktiv: { not_equals: false } }, sort: ['reihenfolge', 'name'], limit: 200, depth: 1 })
  return res.docs
})

/** Alle Hauptsponsoren (Art „Hauptsponsor“) in ihrer Reihenfolge – für die Fußzeile */
export const getHauptsponsoren = cache(async () => {
  const alle = (await getSponsoren()).filter((s) => s.stufe === 'haupt')
  if (alle.length) return alle
  const einer = await getHauptsponsor()
  return einer ? [einer] : []
})

/** Hauptsponsor (Art „Hauptsponsor“, kleinste Reihenfolge) – für Fußzeile und Sponsoren-Seite */
export const getHauptsponsor = cache(async () => {
  const haupt = (await getSponsoren()).find((s) => s.stufe === 'haupt')
  if (haupt) return haupt
  // Noch nicht übernommen? Dann jetzt – damit die Fußzeile nie leer bleibt
  const p = await payload()
  if (await hauptsponsorUmziehen(p).catch(() => null)) return (await p.find({ collection: 'sponsoren', where: { stufe: { equals: 'haupt' } }, sort: ['reihenfolge', 'name'], limit: 1, depth: 1 })).docs[0] ?? null
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
  const res = await p.find({ collection: 'gesuche', where: { aktiv: { not_equals: false } }, sort: ['reihenfolge', 'titel'], limit: 50, depth: 0 })
  return res.docs
})
