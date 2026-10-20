/**
 * Hilfen für die Sicherheits-Regressionstests (pnpm test:sicherheit).
 * Voraussetzung: Entwicklungsserver läuft auf http://localhost:3000, Testkonten sind angelegt
 * (Verwaltung → Rollen & Rechte → Testkonten). Die Tests legen eigene Datensätze an und räumen sie wieder ab.
 */
import { createRequire } from 'node:module'

const req = createRequire(import.meta.url)
const pg = createRequire(req.resolve('@payloadcms/db-postgres'))('pg')

export const B = process.env.BSV_TEST_URL || 'http://localhost:3000'
export const PASSWORT = 'BSV-Test-2026!'

let fehler = 0
let geprueft = 0

export async function db() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  return { q: async (s, p) => (await c.query(s, p)).rows, ende: () => c.end() }
}

export async function login(email) {
  const r = await fetch(B + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORT }) })
  const c = r.headers.get('set-cookie')?.match(/payload-token=[^;]+/)?.[0]
  if (!c) throw new Error(`Anmeldung ${email} fehlgeschlagen (${r.status}) – Testkonten angelegt?`)
  return c
}

export async function api(cookie, method, pfad, body, kopf = {}) {
  const r = await fetch(B + pfad, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...kopf }, body: body === undefined ? undefined : JSON.stringify(body) })
  let j = null
  try {
    j = await r.json()
  } catch {}
  return { s: r.status, j, h: r.headers }
}

export function pruefe(name, ok, info) {
  geprueft++
  if (!ok) fehler++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok ? '' : '  → ' + JSON.stringify(info ?? null).slice(0, 300)}`)
}

/** Kurzzeitig Web-Admin-Rolle für ein Testkonto (wird immer wieder entfernt) */
export async function mitWebAdmin(d, email, fn) {
  const [u] = await d.q('select id from users where email=$1 and testkonto = true', [email])
  if (!u) throw new Error('Testkonto fehlt: ' + email)
  await d.q(`insert into users_roles ("order", parent_id, value) values (99, $1, 'webadmin')`, [u.id])
  try {
    return await fn()
  } finally {
    await d.q(`delete from users_roles where parent_id=$1 and value='webadmin'`, [u.id])
  }
}

export const ergebnis = () => ({ fehler, geprueft })
