import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import type { Payload } from 'payload'

/**
 * Tägliche Paket-Prüfung für Web-Admins (Dashboard-Hinweis und Seite „Datensicherung → Wartung“):
 * - Sicherheitsmeldungen: installierte Versionen aller direkten Laufzeit-Pakete (package.json → dependencies)
 *   gegen die Sicherheitsdatenbank von npm (dieselbe Quelle wie `pnpm audit`). Hoch und kritisch → Warnung.
 *   Indirekte Pakete prüft zusätzlich GitHub täglich (.github/workflows/sicherheit-woechentlich.yml).
 * - Neue Versionen von Next.js und Payload (nur Hinweis – aktualisiert wird bewusst von Hand, mit Tests).
 *
 * Übertragen werden nur Paketnamen und Versionsnummern an registry.npmjs.org – keine Daten des Vereins.
 * Abschalten: BSV_PAKETPRUEFUNG=aus in der .env (z. B. ohne Internet).
 */

export type Meldung = { paket: string; version: string; schwere: 'high' | 'critical'; titel: string; url: string | null; betroffen: string }
export type NeueVersion = { paket: string; name: string; installiert: string; neu: string; hauptversion: boolean }
export type PaketStand = { geprueftAm: string | null; fehlerSeit: string | null; meldungen: Meldung[]; updates: NeueVersion[] }

const REGISTRY = 'https://registry.npmjs.org'
const UPDATE_PAKETE: [string, string][] = [
  ['next', 'Next.js'],
  ['payload', 'Payload'],
]

const g = globalThis as unknown as { __bsvPakete?: PaketStand }
const stand = (): PaketStand => (g.__bsvPakete ??= { geprueftAm: null, fehlerSeit: null, meldungen: [], updates: [] })

/** Letztes Ergebnis (wird täglich und kurz nach dem Start erneuert) */
export const paketStand = (): PaketStand => stand()

export const paketPruefungAus = () => process.env.BSV_PAKETPRUEFUNG === 'aus' || process.env.NODE_ENV === 'test'

const wurzel = () => process.cwd()
const lesenJson = (datei: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(fs.readFileSync(datei, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Installierte Version eines Pakets (aus node_modules, nicht aus package.json – dort stehen oft Bereiche wie ^5.3.0) */
function installiert(paket: string): string | null {
  try {
    const req = createRequire(path.join(wurzel(), 'package.json'))
    const datei = req.resolve(`${paket}/package.json`)
    const v = lesenJson(datei)?.version
    return typeof v === 'string' ? v : null
  } catch {
    // Pakete ohne exportierte package.json: direkt im Ordner nachsehen
    const v = lesenJson(path.join(wurzel(), 'node_modules', paket, 'package.json'))?.version
    return typeof v === 'string' ? v : null
  }
}

/** Versionen vergleichen (nur Zahlen x.y.z; Vorabversionen wie 16.5.0-canary zählen nicht als neuer) */
const teile = (v: string) => v.split('-')[0]!.split('.').map((x) => Number(x) || 0)
export function istNeuer(neu: string, alt: string): boolean {
  if (neu.includes('-')) return false
  const a = teile(neu)
  const b = teile(alt)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  return false
}

const nurGithubLink = (u: unknown): string | null => (typeof u === 'string' && /^https:\/\/github\.com\/advisories\/GHSA-[\w-]+$/.test(u) ? u : null)
const ghsa = (u: string | null) => u?.match(/GHSA-[\w-]+$/)?.[0] ?? null
const text = (t: unknown, max: number) => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim().slice(0, max) : '')

/** Antwort der Sicherheitsdatenbank in eine saubere Liste übersetzen (alles von außen gilt als ungeprüft) */
export function meldungenAus(antwort: unknown, versionen: Record<string, string>, ignorieren: Set<string>): Meldung[] {
  const raus: Meldung[] = []
  if (!antwort || typeof antwort !== 'object') return raus
  for (const [paket, liste] of Object.entries(antwort as Record<string, unknown>)) {
    if (!versionen[paket] || !Array.isArray(liste)) continue
    for (const m of liste as Record<string, unknown>[]) {
      const schwere = m?.severity
      if (schwere !== 'high' && schwere !== 'critical') continue
      const url = nurGithubLink(m.url)
      const id = ghsa(url)
      if (id && ignorieren.has(id)) continue
      raus.push({ paket, version: versionen[paket]!, schwere, titel: text(m.title, 200) || 'Sicherheitslücke', url, betroffen: text(m.vulnerable_versions, 80) })
    }
  }
  return raus.sort((a, b) => (a.schwere === b.schwere ? a.paket.localeCompare(b.paket) : a.schwere === 'critical' ? -1 : 1))
}

async function abrufen(url: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000), redirect: 'error' })
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  return r.json()
}

/** Prüfung ausführen und Ergebnis merken. Wirft nie – Fehler stehen in fehlerSeit. */
export async function paketePruefen(payload?: Payload): Promise<PaketStand> {
  const s = stand()
  if (paketPruefungAus()) return s
  try {
    const pkg = lesenJson(path.join(wurzel(), 'package.json')) ?? {}
    const deps = Object.keys((pkg.dependencies as Record<string, string> | undefined) ?? {})
    const versionen: Record<string, string> = {}
    for (const d of deps) {
      const v = installiert(d)
      if (v) versionen[d] = v
    }
    const ignorieren = new Set(((pkg.pnpm as { auditConfig?: { ignoreGhsas?: string[] } } | undefined)?.auditConfig?.ignoreGhsas ?? []).filter((x) => typeof x === 'string'))
    const bulk = Object.fromEntries(Object.entries(versionen).map(([k, v]) => [k, [v]]))
    const antwort = await abrufen(`${REGISTRY}/-/npm/v1/security/advisories/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bulk) })
    const updates: NeueVersion[] = []
    for (const [paket, name] of UPDATE_PAKETE) {
      const ist = versionen[paket]
      if (!ist) continue
      const info = (await abrufen(`${REGISTRY}/${paket}`, { headers: { Accept: 'application/vnd.npm.install-v1+json' } }).catch(() => null)) as { 'dist-tags'?: { latest?: unknown } } | null
      const neu = info?.['dist-tags']?.latest
      if (typeof neu === 'string' && /^\d+\.\d+\.\d+$/.test(neu) && istNeuer(neu, ist)) updates.push({ paket, name, installiert: ist, neu, hauptversion: teile(neu)[0] !== teile(ist)[0] })
    }
    g.__bsvPakete = { geprueftAm: new Date().toISOString(), fehlerSeit: null, meldungen: meldungenAus(antwort, versionen, ignorieren), updates }
    // Ins Protokoll schreibt die tägliche Runde die Warnung (wartungsHinweise in taeglich.ts)
  } catch (e) {
    s.fehlerSeit ??= new Date().toISOString()
    payload?.logger.warn({ err: e }, 'Paket-Prüfung (Sicherheitsmeldungen) fehlgeschlagen')
  }
  return stand()
}
