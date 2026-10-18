import crypto from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'
import { getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

import { hasRole } from '@/access/roles'
import { sicheresZiel } from '@/bsv/sicheresZiel'
import { ratenGrenze } from '@/hooks/spamSchutz'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Selbst-Registrierung für Mitglieder (E-Mail oder Google) mit Freigabe durch Admin/Kasse,
 * dazu die Freigabe-Schnittstelle für die Verwaltung.
 *
 * Google: klassischer OAuth-Ablauf (Authorization Code + PKCE). Nur aktiv, wenn
 * GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in der .env stehen.
 */
const json = (body: unknown, status = 200, headers?: HeadersInit) => Response.json(body, { status, headers })
export const googleAktiv = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const COOKIE = 'bsv-google'
const prod = () => process.env.NODE_ENV === 'production'
const umleiten = (ziel: string, cookies: string[] = []) => {
  const h = new Headers({ Location: ziel })
  cookies.forEach((c) => h.append('Set-Cookie', c))
  return new Response(null, { status: 302, headers: h })
}
const b64url = (b: Buffer) => b.toString('base64url')

type RohUser = { id: number; email: string; roles?: string[]; sessions?: { id: string; createdAt: Date | string; expiresAt: Date | string }[]; testkonto?: boolean; lockUntil?: string | null }

/**
 * Meldet einen Benutzer an, ohne Passwort (nach Registrierung oder Google-Anmeldung) –
 * genau wie Payloads eigener Login: neue Sitzung, Token, Cookie. Die Zwei-Faktor-Regel gilt danach unverändert.
 */
async function sitzungStarten(req: PayloadRequest, id: number): Promise<string> {
  const { payload } = req
  const coll = payload.collections.users.config
  const user = (await payload.db.findOne({ collection: 'users', where: { id: { equals: id } }, req })) as unknown as RohUser
  for (const hook of coll.hooks?.beforeLogin ?? []) await hook({ collection: coll, context: req.context, req, user } as never)
  let sid: string | undefined
  if (coll.auth.useSessions) {
    sid = crypto.randomUUID()
    const jetzt = new Date()
    const sitzungen = (user.sessions ?? []).filter((s) => new Date(s.expiresAt) > jetzt)
    sitzungen.push({ id: sid, createdAt: jetzt, expiresAt: new Date(jetzt.getTime() + coll.auth.tokenExpiration * 1000) })
    await payload.db.updateOne({ collection: 'users', id, data: { sessions: sitzungen, updatedAt: null } as never, req, returning: false })
  }
  const fieldsToSign = getFieldsToSign({ collectionConfig: coll, email: user.email, user: { ...user, collection: 'users' } as never, ...(sid ? { sid } : {}) })
  const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration: coll.auth.tokenExpiration })
  for (const hook of coll.hooks?.afterLogin ?? []) await hook({ collection: coll, context: req.context, req, token, user } as never)
  return generatePayloadCookie({ collectionAuthConfig: coll.auth, cookiePrefix: payload.config.cookiePrefix, token }) as string
}

/** Wohin nach der Anmeldung: Personal muss erst den zweiten Faktor bestätigen */
const zielNachLogin = (roles: string[] | undefined, testkonto: boolean | undefined, weiter: string) => {
  const personal = (roles ?? []).some((r) => r !== 'mitglied')
  if (personal && process.env.ZWEI_FAKTOR !== 'aus' && !testkonto) return `/login/zwei-faktor?weiter=${encodeURIComponent(weiter)}`
  return weiter
}

/** Bei einer frischen Installation darf sich niemand von außen als Erstes registrieren (das erste Konto wird Web-Admin) */
const eingerichtet = async (req: PayloadRequest) => (await req.payload.count({ collection: 'users', overrideAccess: true })).totalDocs > 0

const darfFreigeben = (req: PayloadRequest) => hasRole(req.user as never, 'admin', 'kasse')

export const registrierungEndpunkte: Endpoint[] = [
  {
    // Registrierung mit E-Mail und Passwort
    path: '/registrieren',
    method: 'post',
    handler: async (req) => {
      const body = (await req.json?.().catch(() => ({}))) as { name?: string; email?: string; passwort?: string; datenschutz?: boolean; website?: string }
      if (body.website) return json({ fehler: 'Die Anfrage konnte nicht verarbeitet werden.' }, 400)
      try {
        ratenGrenze(req, 'registrieren', 5)
      } catch {
        return json({ fehler: 'Zu viele Versuche. Bitte in ein paar Minuten erneut probieren.' }, 429)
      }
      const name = String(body.name ?? '').trim().slice(0, 120)
      const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200)
      const passwort = String(body.passwort ?? '')
      if (name.length < 2) return json({ fehler: 'Bitte gib deinen Namen ein.' }, 400)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ fehler: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, 400)
      if (passwort.length < 10 || passwort.length > 200) return json({ fehler: 'Das Passwort braucht mindestens 10 Zeichen.' }, 400)
      if (!body.datenschutz) return json({ fehler: 'Bitte bestätige die Datenschutzhinweise.' }, 400)
      if (!(await eingerichtet(req))) return json({ fehler: 'Die Website ist noch nicht eingerichtet.' }, 403)
      const vorhanden = await req.payload.count({ collection: 'users', where: { email: { equals: email } }, overrideAccess: true })
      if (vorhanden.totalDocs) return json({ fehler: 'Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an – oder nutze „Passwort vergessen?“.' }, 409)
      const neu = await req.payload.create({
        collection: 'users',
        data: { name, email, password: passwort, roles: ['mitglied'], freigegeben: false } as never,
        overrideAccess: true,
        req,
      })
      await req.payload.db.updateOne({ collection: 'users', id: neu.id, data: { registriertUeber: 'email' } as never, req, returning: false })
      const cookie = await sitzungStarten(req, neu.id as number)
      return json({ ok: true }, 201, { 'Set-Cookie': cookie })
    },
  },
  {
    // Schritt 1: zu Google weiterleiten
    path: '/google/start',
    method: 'get',
    handler: async (req) => {
      if (!googleAktiv()) return umleiten('/login?fehler=google-aus')
      const url = new URL(req.url ?? '', getServerSideURL())
      const weiter = sicheresZiel(url.searchParams.get('weiter'), '/mitglieder')
      const state = b64url(crypto.randomBytes(24))
      const nonce = b64url(crypto.randomBytes(24))
      const verifier = b64url(crypto.randomBytes(48))
      const challenge = b64url(crypto.createHash('sha256').update(verifier).digest())
      const ziel = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      ziel.search = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: `${getServerSideURL()}/api/users/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      }).toString()
      const wert = b64url(Buffer.from(JSON.stringify({ state, nonce, verifier, weiter })))
      const cookie = `${COOKIE}=${wert}; Path=/api/users/google; HttpOnly; SameSite=Lax; Max-Age=600${prod() ? '; Secure' : ''}`
      return umleiten(ziel.toString(), [cookie])
    },
  },
  {
    // Schritt 2: Google schickt zurück → Konto finden/anlegen → anmelden
    path: '/google/callback',
    method: 'get',
    handler: async (req) => {
      const loeschen = `${COOKIE}=; Path=/api/users/google; HttpOnly; SameSite=Lax; Max-Age=0`
      const fehler = (code: string) => umleiten(`/login?fehler=${code}`, [loeschen])
      if (!googleAktiv()) return fehler('google-aus')
      const url = new URL(req.url ?? '', getServerSideURL())
      const roh = (req.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
      let gespeichert: { state: string; nonce: string; verifier: string; weiter: string } | null = null
      try {
        gespeichert = roh ? JSON.parse(Buffer.from(roh, 'base64url').toString('utf8')) : null
      } catch {
        gespeichert = null
      }
      const state = url.searchParams.get('state') ?? ''
      if (!gespeichert || !state || state.length !== gespeichert.state.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(gespeichert.state))) return fehler('google-abgelaufen')
      const code = url.searchParams.get('code')
      if (!code) return fehler('google-abgebrochen')

      // Code gegen Token tauschen (direkt bei Google über HTTPS → Inhalt des ID-Tokens ist vertrauenswürdig)
      const antwort = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${getServerSideURL()}/api/users/google/callback`,
          grant_type: 'authorization_code',
          code_verifier: gespeichert.verifier,
        }),
      }).catch(() => null)
      if (!antwort?.ok) return fehler('google-fehler')
      const tok = (await antwort.json().catch(() => ({}))) as { id_token?: string }
      let profil: { sub?: string; email?: string; email_verified?: boolean; name?: string; aud?: string; iss?: string; exp?: number; nonce?: string } = {}
      try {
        profil = JSON.parse(Buffer.from(String(tok.id_token).split('.')[1] ?? '', 'base64url').toString('utf8'))
      } catch {
        return fehler('google-fehler')
      }
      const gueltig =
        profil.aud === process.env.GOOGLE_CLIENT_ID &&
        (profil.iss === 'https://accounts.google.com' || profil.iss === 'accounts.google.com') &&
        (profil.exp ?? 0) * 1000 > Date.now() &&
        profil.nonce === gespeichert.nonce &&
        profil.sub &&
        profil.email &&
        profil.email_verified === true
      if (!gueltig) return fehler('google-fehler')

      const email = profil.email!.toLowerCase()
      const p = req.payload
      // 1. schon verknüpft? 2. gleiche (von Google bestätigte) E-Mail? 3. neu anlegen (wartet auf Freigabe)
      let user = (await p.find({ collection: 'users', where: { googleId: { equals: profil.sub } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true })).docs[0] as RohUser | undefined
      if (!user) {
        user = (await p.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as RohUser | undefined
        if (user) await p.db.updateOne({ collection: 'users', id: user.id, data: { googleId: profil.sub } as never, req, returning: false })
      }
      if (!user) {
        try {
          ratenGrenze(req, 'registrieren', 5)
        } catch {
          return fehler('zu-viele')
        }
        if (!(await eingerichtet(req))) return fehler('nicht-eingerichtet')
        const neu = await p.create({
          collection: 'users',
          data: { name: (profil.name || email.split('@')[0]!).slice(0, 120), email, password: b64url(crypto.randomBytes(32)), roles: ['mitglied'], freigegeben: false } as never,
          overrideAccess: true,
          req,
        })
        await p.db.updateOne({ collection: 'users', id: neu.id, data: { googleId: profil.sub, registriertUeber: 'google' } as never, req, returning: false })
        user = neu as unknown as RohUser
      }
      if (user.lockUntil && new Date(user.lockUntil) > new Date()) return fehler('gesperrt')
      let cookie: string
      try {
        cookie = await sitzungStarten(req, user.id)
      } catch {
        return fehler('gesperrt')
      }
      return umleiten(zielNachLogin(user.roles, user.testkonto, gespeichert.weiter), [loeschen, cookie])
    },
  },
  {
    // Für die Verwaltung: wartende Registrierungen
    path: '/registrierungen',
    method: 'get',
    handler: async (req) => {
      if (!darfFreigeben(req)) return json({ fehler: 'Keine Berechtigung.' }, 403)
      const r = await req.payload.find({ collection: 'users', where: { freigegeben: { equals: false } }, sort: '-createdAt', limit: 200, depth: 0, overrideAccess: true })
      return json({ anzahl: r.totalDocs })
    },
  },
  {
    // Freigeben oder ablehnen (Ablehnen löscht das Konto)
    path: '/freigabe',
    method: 'post',
    handler: async (req) => {
      if (!darfFreigeben(req)) return json({ fehler: 'Keine Berechtigung.' }, 403)
      const body = (await req.json?.().catch(() => ({}))) as { id?: number; aktion?: 'freigeben' | 'ablehnen' }
      const id = Number(body.id)
      const u = id ? await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true }).catch(() => null) : null
      // Nur selbst registrierte, noch wartende Konten – nie Personal-Konten
      if (!u || (u as { freigegeben?: boolean }).freigegeben !== false || (u.roles ?? []).some((r) => r !== 'mitglied')) return json({ fehler: 'Diese Registrierung gibt es nicht (mehr).' }, 404)
      if (body.aktion === 'freigeben') {
        await req.payload.update({ collection: 'users', id, data: { freigegeben: true } as never, overrideAccess: true, context: { zweiFaktorIntern: true }, req })
        return json({ ok: true })
      }
      if (body.aktion === 'ablehnen') {
        await req.payload.delete({ collection: 'users', id, overrideAccess: true, req })
        return json({ ok: true })
      }
      return json({ fehler: 'Unbekannte Aktion.' }, 400)
    },
  },
]
