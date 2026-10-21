import { execFile } from 'child_process'
import fs from 'fs'
import type { Payload } from 'payload'

/**
 * Wartungs-Prüfungen für Web-Admins (Dashboard-Hinweise, Datensicherungs-Seite, tägliches Protokoll):
 * Speicherplatz, Alter der installierten Website-Version, auslaufende Node.js-/PostgreSQL-Versionen,
 * offener Schlüsselwechsel, letzter Test einer Wiederherstellung.
 */

/** Ende der Sicherheits-Updates (offizielle Zeitpläne von Node.js und PostgreSQL). Bei neuen Versionen ergänzen. */
export const NODE_ENDE: Record<number, string> = { 18: '2025-04-30', 20: '2026-04-30', 22: '2027-04-30', 24: '2028-04-30', 26: '2029-04-30' }
export const POSTGRES_ENDE: Record<number, string> = { 13: '2025-11-13', 14: '2026-11-12', 15: '2027-11-11', 16: '2028-11-09', 17: '2029-11-08', 18: '2030-11-14' }
export const SPEICHER_WARNEN_AB = 80
export const WIEDERHERSTELLUNG_TAGE = 365
export const CODE_ALT_TAGE = 90
const VORLAUF_TAGE = 180

export type Speicher = { prozent: number; freiGB: number; gesamtGB: number }

export function speicherplatz(pfad = process.cwd()): Speicher | null {
  try {
    const s = fs.statfsSync(pfad)
    const belegt = s.blocks - s.bfree
    const nutzbar = belegt + s.bavail
    if (!nutzbar) return null
    return { prozent: Math.round((belegt / nutzbar) * 100), freiGB: (s.bavail * s.bsize) / 1e9, gesamtGB: (nutzbar * s.bsize) / 1e9 }
  } catch {
    return null
  }
}

export type Laufzeit = { name: string; version: string; ende: string | null; tage: number | null }
const tageBis = (iso: string) => Math.ceil((new Date(`${iso}T00:00:00Z`).getTime() - Date.now()) / 86400000)
const laufzeit = (name: string, version: string, haupt: number, tabelle: Record<number, string>): Laufzeit => {
  const ende = tabelle[haupt] ?? null
  return { name, version, ende, tage: ende ? tageBis(ende) : null }
}

export const nodeLaufzeit = (): Laufzeit => laufzeit('Node.js', process.versions.node, Number(process.versions.node.split('.')[0]), NODE_ENDE)

export async function postgresLaufzeit(payload: Payload): Promise<Laufzeit | null> {
  try {
    const pool = (payload.db as unknown as { pool: { query: (s: string) => Promise<{ rows: { server_version: string }[] }> } }).pool
    const v = (await pool.query('SHOW server_version')).rows[0]?.server_version ?? ''
    const haupt = Number(v.split('.')[0])
    return Number.isFinite(haupt) && haupt > 0 ? laufzeit('PostgreSQL', v.split(' ')[0]!, haupt, POSTGRES_ENDE) : null
  } catch {
    return null
  }
}

/** Datum der installierten Version (letzter Git-Stand) – einmal pro Stunde ermittelt */
let codeCache: { wann: number; datum: string | null } | null = null
export async function codeStand(): Promise<string | null> {
  if (codeCache && Date.now() - codeCache.wann < 3600_000) return codeCache.datum
  const datum = await new Promise<string | null>((fertig) =>
    execFile('git', ['log', '-1', '--format=%cI'], { cwd: process.cwd(), timeout: 3000 }, (e, out) => fertig(e ? null : out.trim() || null)),
  )
  codeCache = { wann: Date.now(), datum }
  return datum
}

export const schluesselwechselOffen = () => Boolean(process.env.ENCRYPTION_KEY_ALT)

export type WartungStand = { wiederherstellungGetestetAm?: string | null; wiederherstellungVon?: string | null; saisonwechselAm?: string | null; saisonwechselVon?: string | null; monatsberichtAm?: string | null }
export async function wartungLesen(payload: Payload): Promise<WartungStand> {
  return ((await payload.findGlobal({ slug: 'wartung' as never, depth: 0, overrideAccess: true }).catch(() => null)) ?? {}) as WartungStand
}

export type Hinweis = { key: string; art: 'warn' | 'info'; symbol: string; text: string }

/** Alle Wartungs-Hinweise, die gerade zutreffen (für Web-Admins) */
export async function wartungsHinweise(payload: Payload): Promise<Hinweis[]> {
  const h: Hinweis[] = []
  const sp = speicherplatz()
  if (sp && sp.prozent >= SPEICHER_WARNEN_AB)
    h.push({ key: 'speicher', art: 'warn', symbol: '💽', text: `Der Speicherplatz ist zu ${sp.prozent} % belegt (noch ${sp.freiGB.toFixed(1)} GB frei). Alte Bilder aufräumen oder mehr Speicher buchen.` })
  if (schluesselwechselOffen())
    h.push({ key: 'schluessel', art: 'warn', symbol: '🔑', text: 'Der Schlüsselwechsel ist nicht abgeschlossen: ENCRYPTION_KEY_ALT steht noch in der .env. Wenn alles umgestellt ist, Zeile löschen und neu starten.' })
  if (process.env.NODE_ENV === 'production' && process.env.BSV_ERINNERUNGEN === 'aus')
    h.push({
      key: 'erinnerungen-aus',
      art: 'warn',
      symbol: '📭',
      text: 'Automatische Mails sind abgeschaltet (BSV_ERINNERUNGEN=aus in der .env, z. B. von der Generalprobe): keine „Passt noch?“-Mails, kein Monatsbericht. Für den echten Betrieb Zeile löschen und neu starten.',
    })
  for (const l of [nodeLaufzeit(), await postgresLaufzeit(payload)]) {
    if (!l?.ende || l.tage === null || l.tage > VORLAUF_TAGE) continue
    const wann = new Date(`${l.ende}T00:00:00Z`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    h.push({
      key: `laufzeit-${l.name}`,
      art: 'warn',
      symbol: '⏳',
      text: l.tage < 0 ? `${l.name} ${l.version} bekommt seit ${wann} keine Sicherheits-Updates mehr – bitte aktualisieren.` : `${l.name} ${l.version} bekommt ab ${wann} keine Sicherheits-Updates mehr – Wechsel einplanen.`,
    })
  }
  const code = await codeStand()
  const codeTage = code ? Math.floor((Date.now() - new Date(code).getTime()) / 86400000) : null
  if (process.env.NODE_ENV === 'production' && codeTage !== null && codeTage > CODE_ALT_TAGE)
    h.push({ key: 'update', art: 'info', symbol: '🔄', text: `Die Website wurde seit ${Math.floor(codeTage / 30)} Monaten nicht aktualisiert. Zeit für den Update-Tag (Pakete und Sicherheits-Updates).` })
  const w = await wartungLesen(payload)
  const getestet = w.wiederherstellungGetestetAm ? Math.floor((Date.now() - new Date(w.wiederherstellungGetestetAm).getTime()) / 86400000) : null
  if (getestet === null || getestet > WIEDERHERSTELLUNG_TAGE)
    h.push({
      key: 'wiederherstellung',
      art: 'info',
      symbol: '🧪',
      text: getestet === null ? 'Das Einspielen einer Sicherung wurde noch nie ausprobiert. Einmal im Jahr testen – sonst merkt man erst im Ernstfall, ob es klappt.' : `Das Einspielen einer Sicherung wurde zuletzt vor über einem Jahr ausprobiert.`,
    })
  return h
}
