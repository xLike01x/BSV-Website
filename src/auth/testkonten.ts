import type { Endpoint, Field, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * Testkonten zum Ausprobieren der Rechte – je Rolle, je Abteilung und je Team.
 * Sie melden sich OHNE Zwei-Faktor an. Deshalb funktionieren sie nur auf dem
 * lokalen Entwicklungs-Server (pnpm dev). Auf der Live-Website (Produktion) ist
 * die Anmeldung immer gesperrt – auch BSV_TESTKONTEN=an wirkt dort nicht (die Website startet damit gar nicht).
 */
export const TESTPASSWORT = 'BSV-Test-2026!'
export const TESTDOMAIN = 'bsv.test'
const LOKAL = ['localhost', '127.0.0.1', '[::1]', '::1']
const hostname = (h?: string | null) => (h ?? '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '')
/**
 * Testkonten nur auf dem eigenen PC: im Entwicklungs-Server UND nur bei Aufruf über localhost.
 * Über einen Tunnel (z. B. Vorschau für Kollegen) oder auf der Live-Website sind sie gesperrt.
 */
export const testkontenErlaubt = (headers?: Headers | null) => {
  if (process.env.NODE_ENV === 'production' || process.env.BSV_TESTKONTEN === 'aus') return false
  if (process.env.BSV_TESTKONTEN === 'an') return true
  if (!headers) return true
  const weitergeleitet = headers.get('x-forwarded-host')
  if (weitergeleitet && !LOKAL.includes(hostname(weitergeleitet))) return false
  return LOKAL.includes(hostname(headers.get('host')))
}

export const testkontoFeld: Field = {
  name: 'testkonto',
  label: 'Testkonto (ohne Zwei-Faktor, nur lokal)',
  type: 'checkbox',
  defaultValue: false,
  // Nur über „Testkonten anlegen“ in der Rollen-Übersicht setzbar
  access: { create: () => false, update: () => false },
  admin: {
    position: 'sidebar',
    readOnly: true,
    condition: (data) => Boolean(data?.testkonto),
    description: 'Zum Ausprobieren der Rechte. Funktioniert nur auf dem lokalen Server. Löschen: Einstellungen → Rollen & Rechte → „Alle Testkonten löschen“.',
  },
}

const ABTEILUNG: Record<string, string> = { fussball: 'Fußball', kids: 'BSV Kids', erwachsene: 'Erwachsene & Senioren' }

type Angebot = { id: number; title: string; slug?: string | null; bereich?: string | null; leitung?: (number | { id: number })[] | null }
type Plan = { email: string; name: string; roles: string[]; teams: number[]; gruppe: string }

const kurz = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/®/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Welche Testkonten es geben soll – abgeleitet aus den aktuellen Teams */
export function testkontenPlan(angebote: Angebot[]): Plan[] {
  const plan: Plan[] = [
    { email: `admin@${TESTDOMAIN}`, name: 'Test Admin', roles: ['admin'], teams: [], gruppe: 'Rollen' },
    { email: `redaktion@${TESTDOMAIN}`, name: 'Test Redaktion', roles: ['redaktion'], teams: [], gruppe: 'Rollen' },
    { email: `kasse@${TESTDOMAIN}`, name: 'Test Kasse', roles: ['kasse'], teams: [], gruppe: 'Rollen' },
    { email: `passwesen@${TESTDOMAIN}`, name: 'Test Passwesen', roles: ['passwesen'], teams: [], gruppe: 'Rollen' },
    { email: `lesen@${TESTDOMAIN}`, name: 'Test Nur ansehen', roles: ['lesen'], teams: [], gruppe: 'Rollen' },
    { email: `mitglied@${TESTDOMAIN}`, name: 'Test Mitglied', roles: ['mitglied'], teams: [], gruppe: 'Rollen' },
  ]
  for (const [key, label] of Object.entries(ABTEILUNG)) {
    const teams = angebote.filter((a) => a.bereich === key)
    if (!teams.length) continue
    plan.push({ email: `abteilung-${kurz(key)}@${TESTDOMAIN}`, name: `Test Abteilungsleitung ${label}`, roles: ['uebungsleitung'], teams: teams.map((t) => t.id), gruppe: 'Abteilungen' })
    plan.push({ email: `pressewart-${kurz(key)}@${TESTDOMAIN}`, name: `Test Pressewart ${label}`, roles: ['teamredaktion'], teams: teams.map((t) => t.id), gruppe: 'Abteilungen' })
  }
  for (const a of angebote) {
    plan.push({ email: `trainer-${kurz(a.slug || a.title)}@${TESTDOMAIN}`, name: `Test Trainer ${a.title}`, roles: ['uebungsleitung'], teams: [a.id], gruppe: ABTEILUNG[a.bereich ?? ''] ?? 'Teams' })
  }
  return plan
}

const idVon = (v: number | { id: number }) => (typeof v === 'object' ? v.id : v)

async function anlegen(req: PayloadRequest) {
  const p = req.payload
  const angebote = (await p.find({ collection: 'angebote', limit: 500, depth: 0, pagination: false, sort: 'title', overrideAccess: true })).docs as unknown as Angebot[]
  const plan = testkontenPlan(angebote)
  const ids = new Map<string, number>()
  for (const k of plan) {
    const vorhanden = await p.find({ collection: 'users', where: { email: { equals: k.email } }, limit: 1, depth: 0, overrideAccess: true })
    const daten = { name: k.name, roles: k.roles, password: TESTPASSWORT, testkonto: true } as never
    // Ohne req: interne Anlage, damit Schutzregeln für echte Konten nicht greifen
    const doc = vorhanden.docs[0]
      ? await p.update({ collection: 'users', id: vorhanden.docs[0].id, data: daten, overrideAccess: true, context: { bsvTestkonto: true } })
      : await p.create({ collection: 'users', data: { ...(daten as object), email: k.email } as never, overrideAccess: true, context: { bsvTestkonto: true } })
    ids.set(k.email, doc.id as number)
  }
  // Teams zuordnen (Verantwortliche) – bestehende Verantwortliche bleiben erhalten
  for (const a of angebote) {
    const neu = plan.filter((k) => k.teams.includes(a.id)).map((k) => ids.get(k.email)!)
    const alt = (a.leitung ?? []).map(idVon)
    const gesamt = [...new Set([...alt, ...neu])]
    if (gesamt.length !== alt.length) await p.update({ collection: 'angebote', id: a.id, data: { leitung: gesamt } as never, overrideAccess: true, context: { ohneRevalidierung: true } })
  }
  return plan.map((k) => ({ email: k.email, name: k.name, rollen: k.roles, gruppe: k.gruppe, teams: k.teams.length }))
}

async function loeschen(req: PayloadRequest) {
  const p = req.payload
  const test = await p.find({ collection: 'users', where: { testkonto: { equals: true } }, limit: 1000, depth: 0, pagination: false, overrideAccess: true })
  const ids = new Set(test.docs.map((d) => d.id as number))
  if (!ids.size) return 0
  const angebote = (await p.find({ collection: 'angebote', limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as unknown as Angebot[]
  for (const a of angebote) {
    const alt = (a.leitung ?? []).map(idVon)
    const rest = alt.filter((i) => !ids.has(i))
    if (rest.length !== alt.length) await p.update({ collection: 'angebote', id: a.id, data: { leitung: rest } as never, overrideAccess: true, context: { ohneRevalidierung: true } })
  }
  await p.delete({ collection: 'users', where: { testkonto: { equals: true } }, overrideAccess: true })
  return ids.size
}

export const testkontenEndpunkte: Endpoint[] = [
  {
    path: '/testkonten',
    method: 'post',
    handler: async (req) => {
      if (!hasRole(req.user as never, 'admin')) return Response.json({ fehler: 'Nur für Admins.' }, { status: 403 })
      if (!testkontenErlaubt(req.headers)) return Response.json({ fehler: 'Testkonten gibt es nur auf dem lokalen Server.' }, { status: 400 })
      const konten = await anlegen(req)
      return Response.json({ konten, passwort: TESTPASSWORT })
    },
  },
  {
    path: '/testkonten',
    method: 'delete',
    handler: async (req) => {
      if (!hasRole(req.user as never, 'admin')) return Response.json({ fehler: 'Nur für Admins.' }, { status: 403 })
      return Response.json({ geloescht: await loeschen(req) })
    },
  },
]
