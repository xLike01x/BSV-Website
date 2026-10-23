import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import type { Payload } from 'payload'
import { satisfies, validRange } from 'semver'

import { NODE_ENDE, POSTGRES_ENDE } from './pruefen'

/**
 * Zentrale Update-Prüfung für Web-Admins (Seite „Sicherheit“ → Reiter „Updates“, Dashboard, Monatsbericht).
 * Läuft täglich und kurz nach dem Start, zusätzlich per Knopf „Jetzt prüfen“.
 *
 * Geprüft wird:
 * - Node.js: neueste Version der installierten Hauptversion, Sicherheitsversionen (nodejs.org), Laufzeitende
 * - PostgreSQL: neueste Unterversion der installierten Hauptversion, Laufzeitende
 * - Website-Pakete (package.json → dependencies): Sicherheitsmeldungen (npm-Sicherheitsdatenbank, hoch/kritisch)
 *   und neuere Versionen. Indirekte Pakete prüft zusätzlich GitHub täglich.
 * - Server (nur Linux, falls vorhanden): ausstehende Betriebssystem-Updates und ob ein Neustart nötig ist
 *
 * Quellen: registry.npmjs.org, endoflife.date, nodejs.org. Übertragen werden nur Paketnamen und Versionsnummern –
 * keine Daten des Vereins. Abschalten: BSV_PAKETPRUEFUNG=aus in der .env.
 */

export type Art = 'sicherheit' | 'update' | 'hauptversion' | 'gesperrt' | 'auslaufend' | 'aktuell'
export type Meldung = { schwere: 'high' | 'critical'; titel: string; url: string | null; betroffen: string }
export type Eintrag = {
  key: string
  gruppe: 'System' | 'Website-Pakete' | 'Server'
  name: string
  installiert: string
  verfuegbar: string | null
  art: Art
  text: string
  tun: string
  meldungen?: Meldung[]
}
/**
 * quellenFehler: beim letzten Lauf nicht erreichbar (dafür gelten die Angaben vom letzten erfolgreichen Abruf).
 * ohneDaten: nicht erreichbar und noch nie erfolgreich abgerufen – das Ergebnis ist unvollständig, also keine Entwarnung.
 */
export type UpdateStand = { geprueftAm: string | null; fehlerSeit: string | null; quellenFehler: string[]; ohneDaten: string[]; eintraege: Eintrag[]; paketeGesamt: number; versionen: Record<string, string> }

/** Rohdaten des letzten erfolgreichen Abrufs je Quelle – Ersatz, wenn eine Quelle ausfällt */
type Roh = {
  meldungen: Record<string, { version: string; liste: Meldung[] }>
  latest: Record<string, string>
  nodeEol: unknown
  nodeIndex: unknown
  pgEol: unknown
}

const REGISTRY = 'https://registry.npmjs.org'
const VORLAUF_TAGE = 180
/** Pakete mit eigenem, verständlichem Namen in der Übersicht */
const NAMEN: Record<string, string> = { next: 'Next.js', payload: 'Payload', react: 'React', 'react-dom': 'React DOM', sharp: 'sharp (Bildbearbeitung)' }

/** Name für Hinweise: alle Payload-Pakete heißen einfach „Payload“ */
const anzeigeName = (p: string) => (p === 'payload' || p.startsWith('@payloadcms/') ? 'Payload' : (NAMEN[p] ?? p))

const g = globalThis as unknown as { __bsvUpdates?: UpdateStand; __bsvUpdatesLaeuft?: Promise<UpdateStand>; __bsvUpdatesRoh?: Partial<Roh> }
const stand = (): UpdateStand => (g.__bsvUpdates ??= { geprueftAm: null, fehlerSeit: null, quellenFehler: [], ohneDaten: [], eintraege: [], paketeGesamt: 0, versionen: {} })

/** Letztes Ergebnis */
export const updateStand = (): UpdateStand => stand()
export const updatePruefungAus = () => process.env.BSV_PAKETPRUEFUNG === 'aus' || process.env.NODE_ENV === 'test'
const live = () => process.env.NODE_ENV === 'production'

// --- Hilfen ---

const wurzel = () => process.cwd()
const lesenJson = (datei: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(fs.readFileSync(datei, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

/** package.json eines installierten Pakets */
function paketJson(paket: string): Record<string, unknown> | null {
  try {
    const j = lesenJson(createRequire(path.join(wurzel(), 'package.json')).resolve(`${paket}/package.json`))
    if (j) return j
  } catch {
    // ohne exportierte package.json: direkt nachsehen
  }
  return lesenJson(path.join(wurzel(), 'node_modules', paket, 'package.json'))
}

function installiert(paket: string): string | null {
  const v = paketJson(paket)?.version
  return typeof v === 'string' ? v : null
}

const teile = (v: string) => v.replace(/^v/, '').split(/[-+ ]/)[0]!.split('.').map((x) => Number(x) || 0)
const istVorab = (v: string) => /-/.test(v.replace(/^v/, ''))
/** Ist `neu` eine neuere stabile Version als `alt`? (Vorabversionen wie 16.5.0-canary zählen nicht; 3.0.0 ist neuer als 3.0.0-beta.1) */
export function istNeuer(neu: string, alt: string): boolean {
  if (istVorab(neu)) return false
  const a = teile(neu)
  const b = teile(alt)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  return istVorab(alt)
}
const haupt = (v: string) => teile(v)[0] ?? 0
/** Bricht `neu` die Kompatibilität? Neue Hauptversion – bei 0.x schon eine neue zweite Stelle (Semver-Regel) */
export function istHauptversion(neu: string, alt: string): boolean {
  const a = teile(neu)
  const b = teile(alt)
  return (a[0] ?? 0) !== (b[0] ?? 0) || ((a[0] ?? 0) === 0 && (a[1] ?? 0) !== (b[1] ?? 0))
}
export type Anforderung = { von: string; bereich: string }
/**
 * Passt `neu` zu dem, was die anderen installierten Pakete verlangen (peerDependencies)?
 * Liefert die erste Anforderung, die `neu` ausschließt – z. B. Payload verlangt graphql ^16.8.1, neu ist 17.0.2.
 */
export function sperre(neu: string, anforderungen: Anforderung[]): Anforderung | null {
  for (const a of anforderungen) {
    if (!validRange(a.bereich)) continue
    if (!satisfies(neu, a.bereich)) return a
  }
  return null
}

/** URL-Pfad für ein Paket in der Registry (@scope/name → @scope%2Fname) */
export const registryPfad = (p: string) => (p.startsWith('@') ? `@${encodeURIComponent(p.slice(1))}` : encodeURIComponent(p))
const tageBis = (iso: string) => Math.ceil((new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime() - Date.now()) / 86400000)
const datumDe = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
const text = (t: unknown, max: number) => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const nurGithubLink = (u: unknown): string | null => (typeof u === 'string' && /^https:\/\/github\.com\/advisories\/GHSA-[\w-]+$/.test(u) ? u : null)
const versionOk = (v: unknown): v is string => typeof v === 'string' && /^v?\d+\.\d+(\.\d+)?$/.test(v)

async function abrufen(url: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000), redirect: 'error', headers: { 'User-Agent': 'bsv-website-updatepruefung', ...(init?.headers ?? {}) } })
  if (!r.ok) throw new Error(`${new URL(url).host}: ${r.status}`)
  return r.json()
}

// --- Auswertung (ohne Netz, getestet in tests/int/updates.int.spec.ts) ---

/** Sicherheitsdatenbank von npm → Meldungen je Paket (nur hoch/kritisch, ohne bewusst geprüfte Ausnahmen) */
export function meldungenAus(antwort: unknown, versionen: Record<string, string>, ignorieren: Set<string>): Record<string, Meldung[]> {
  const raus: Record<string, Meldung[]> = {}
  if (!antwort || typeof antwort !== 'object') return raus
  for (const [paket, liste] of Object.entries(antwort as Record<string, unknown>)) {
    if (!versionen[paket] || !Array.isArray(liste)) continue
    for (const m of liste as Record<string, unknown>[]) {
      const schwere = m?.severity
      if (schwere !== 'high' && schwere !== 'critical') continue
      const url = nurGithubLink(m.url)
      const id = url?.match(/GHSA-[\w-]+$/)?.[0]
      if (id && ignorieren.has(id)) continue
      ;(raus[paket] ??= []).push({ schwere, titel: text(m.title, 200) || 'Sicherheitslücke', url, betroffen: text(m.vulnerable_versions, 80) })
    }
  }
  for (const l of Object.values(raus)) l.sort((a, b) => (a.schwere === b.schwere ? 0 : a.schwere === 'critical' ? -1 : 1))
  return raus
}

/** endoflife.date: Eintrag der passenden Hauptversion ({ cycle, latest, eol }) */
export function zyklus(antwort: unknown, hauptversion: number): { latest: string | null; eol: string | null } | null {
  if (!Array.isArray(antwort)) return null
  const z = (antwort as Record<string, unknown>[]).find((x) => String(x?.cycle) === String(hauptversion))
  if (!z) return null
  const latest = versionOk(z.latest) ? z.latest : null
  const eol = typeof z.eol === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(z.eol) ? z.eol : null
  return { latest, eol }
}

/** nodejs.org/dist/index.json: gibt es zwischen installierter und neuester Version eine Sicherheitsversion? */
export function nodeSicherheit(antwort: unknown, installiertV: string): string | null {
  if (!Array.isArray(antwort)) return null
  const h = haupt(installiertV)
  const treffer = (antwort as Record<string, unknown>[])
    .filter((x) => versionOk(x?.version) && x.security === true && haupt(x.version as string) === h && istNeuer(x.version as string, installiertV))
    .map((x) => (x.version as string).replace(/^v/, ''))
  return treffer.length ? treffer.sort((a, b) => (istNeuer(a, b) ? -1 : 1))[0]! : null
}

/** /var/lib/update-notifier/updates-available (Ubuntu): „12 updates can be applied immediately. 5 of these updates are standard security updates.“ */
export function ubuntuUpdates(inhalt: string): { alle: number; sicherheit: number } | null {
  const alle = inhalt.match(/(\d+)\s+updates?\s+can be applied/i)
  if (!alle) return /0 updates|already up to date/i.test(inhalt) ? { alle: 0, sicherheit: 0 } : null
  const sich = inhalt.match(/(\d+)\s+of these updates?\s+(?:are|is) (?:a )?(?:standard )?security/i)
  return { alle: Number(alle[1]), sicherheit: sich ? Number(sich[1]) : 0 }
}

// --- Einträge bauen ---

function laufzeitEintrag(key: string, name: string, ist: string, latest: string | null, eol: string | null, sicherheitsVersion: string | null, tun: { update: string; wechsel: string }): Eintrag {
  const tage = eol ? tageBis(eol) : null
  if (tage !== null && tage < 0)
    return { key, gruppe: 'System', name, installiert: ist, verfuegbar: latest, art: 'sicherheit', text: `Bekommt seit ${datumDe(eol!)} keine Sicherheits-Updates mehr.`, tun: tun.wechsel }
  if (sicherheitsVersion)
    return { key, gruppe: 'System', name, installiert: ist, verfuegbar: latest ?? sicherheitsVersion, art: 'sicherheit', text: `Sicherheitsupdate verfügbar (${sicherheitsVersion}${latest && latest !== sicherheitsVersion ? `, neueste ${latest}` : ''}).`, tun: tun.update }
  if (latest && istNeuer(latest, ist))
    return { key, gruppe: 'System', name, installiert: ist, verfuegbar: latest, art: 'update', text: 'Neuere Version verfügbar (Fehler- und meist auch Sicherheitskorrekturen).', tun: tun.update }
  if (tage !== null && tage <= VORLAUF_TAGE)
    return { key, gruppe: 'System', name, installiert: ist, verfuegbar: latest, art: 'auslaufend', text: `Sicherheits-Updates nur noch bis ${datumDe(eol!)} – Wechsel auf die nächste Hauptversion einplanen.`, tun: tun.wechsel }
  const ohneVergleich = latest ? '' : ' Neueste Version gerade nicht abrufbar.'
  return { key, gruppe: 'System', name, installiert: ist, verfuegbar: latest, art: 'aktuell', text: `${eol ? `Aktuell. Sicherheits-Updates bis ${datumDe(eol)}.` : 'Aktuell.'}${ohneVergleich}`, tun: '' }
}

const NODE_TUN = {
  update: () => 'Auf dem Server: sudo apt update && sudo apt upgrade nodejs – danach sudo systemctl restart bsv. (Automatische Updates installieren es meist von selbst.)',
  wechsel: 'Neue Hauptversion: vorher testen lassen (GitHub-Workflow), dann auf dem Server umstellen – Auftrag geben.',
}
const PG_TUN = {
  update: () => 'Auf dem Server: sudo apt update && sudo apt upgrade postgresql* – automatische Updates erledigen das meist von selbst.',
  wechsel: 'Neue Hauptversion: nur mit Sicherung und Anleitung (Daten müssen umgezogen werden) – Auftrag geben.',
}

async function postgresVersion(payload?: Payload): Promise<string | null> {
  try {
    const pool = (payload?.db as unknown as { pool?: { query: (s: string) => Promise<{ rows: { server_version: string }[] }> } })?.pool
    if (!pool) return null
    const abfrage = pool.query('SHOW server_version')
    abfrage.catch(() => undefined)
    const zeit = new Promise<null>((fertig) => setTimeout(() => fertig(null), 5000).unref())
    const v = (await Promise.race([abfrage, zeit]))?.rows[0]?.server_version
    return v ? (v.split(' ')[0] ?? null) : null
  } catch {
    return null
  }
}

function serverEintraege(): Eintrag[] {
  const raus: Eintrag[] = []
  if (process.platform !== 'linux') return raus
  const notifier = (() => {
    try {
      return fs.readFileSync('/var/lib/update-notifier/updates-available', 'utf8')
    } catch {
      return null
    }
  })()
  const u = notifier ? ubuntuUpdates(notifier) : null
  if (u && u.alle > 0)
    raus.push({
      key: 'server-os',
      gruppe: 'Server',
      name: 'Betriebssystem (Ubuntu)',
      installiert: '–',
      verfuegbar: `${u.alle} Updates`,
      art: u.sicherheit > 0 ? 'sicherheit' : 'update',
      text: u.sicherheit > 0 ? `${u.alle} Updates ausstehend, davon ${u.sicherheit} Sicherheitsupdates.` : `${u.alle} Updates ausstehend.`,
      tun: 'Auf dem Server: sudo apt update && sudo apt upgrade. Sicherheitsupdates installieren die automatischen Updates normalerweise nachts von selbst.',
    })
  if (fs.existsSync('/var/run/reboot-required'))
    raus.push({
      key: 'server-neustart',
      gruppe: 'Server',
      name: 'Server-Neustart',
      installiert: '–',
      verfuegbar: null,
      art: 'sicherheit',
      text: 'Installierte Updates werden erst nach einem Neustart wirksam.',
      tun: 'Zu einer ruhigen Zeit: sudo reboot. Die Website startet danach von selbst (ca. 1–2 Minuten nicht erreichbar).',
    })
  return raus
}

/** Prüfung ausführen und Ergebnis merken. Wirft nie; nicht erreichbare Quellen stehen in quellenFehler. */
export async function updatesPruefen(payload?: Payload): Promise<UpdateStand> {
  if (updatePruefungAus()) return stand()
  if (g.__bsvUpdatesLaeuft) return g.__bsvUpdatesLaeuft
  g.__bsvUpdatesLaeuft = (async () => {
    const fehler: string[] = []
    const eintraege: Eintrag[] = []
    try {
      const pkg = lesenJson(path.join(wurzel(), 'package.json')) ?? {}
      const versionen: Record<string, string> = {}
      for (const d of Object.keys((pkg.dependencies as Record<string, string> | undefined) ?? {})) {
        const v = installiert(d)
        if (v) versionen[d] = v
      }
      // Was verlangen die installierten Pakete voneinander? (peerDependencies, z. B. Payload → graphql ^16.8.1)
      const anforderungen: Record<string, Anforderung[]> = {}
      for (const von of Object.keys(versionen)) {
        const peers = paketJson(von)?.peerDependencies
        if (!peers || typeof peers !== 'object') continue
        for (const [p, bereich] of Object.entries(peers as Record<string, unknown>)) if (versionen[p] && typeof bereich === 'string') (anforderungen[p] ??= []).push({ von, bereich })
      }
      const ignorieren = new Set(((pkg.pnpm as { auditConfig?: { ignoreGhsas?: string[] } } | undefined)?.auditConfig?.ignoreGhsas ?? []).filter((x) => typeof x === 'string'))
      const nodeIst = process.versions.node
      const pgIst = await postgresVersion(payload)

      const [sicherheit, neueste, nodeEolNeu, nodeIndexNeu, pgEolNeu] = await Promise.all([
        abrufen(`${REGISTRY}/-/npm/v1/security/advisories/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(Object.entries(versionen).map(([k, v]) => [k, [v]]))) }).catch(() => null),
        Promise.all(Object.keys(versionen).map(async (p) => [p, ((await abrufen(`${REGISTRY}/${registryPfad(p)}/latest`).catch(() => null)) as { version?: unknown } | null)?.version] as const)),
        abrufen('https://endoflife.date/api/nodejs.json').catch(() => null),
        abrufen('https://nodejs.org/dist/index.json').catch(() => null),
        pgIst ? abrufen('https://endoflife.date/api/postgresql.json').catch(() => null) : Promise.resolve(null),
      ])

      // Fällt eine Quelle aus, gelten ihre Angaben vom letzten erfolgreichen Abruf; fehlen auch die, ist das Ergebnis unvollständig
      const roh = (g.__bsvUpdatesRoh ??= {})
      const ohneDaten: string[] = []
      const quelle = <T,>(name: string, neu: T | null, schluessel: keyof Roh): T | null => {
        if (neu !== null && neu !== undefined) {
          ;(roh as Record<string, unknown>)[schluessel] = neu
          return neu
        }
        fehler.push(name)
        const alt = (roh as Record<string, unknown>)[schluessel] as T | undefined
        if (alt === undefined) ohneDaten.push(name)
        return alt ?? null
      }

      // Sicherheitsmeldungen je Paket – alte Meldungen nur, solange dieselbe Version installiert ist
      let meldungen: Record<string, Meldung[]>
      if (sicherheit !== null) {
        meldungen = meldungenAus(sicherheit, versionen, ignorieren)
        roh.meldungen = Object.fromEntries(Object.keys(versionen).map((p) => [p, { version: versionen[p]!, liste: meldungen[p] ?? [] }]))
      } else {
        fehler.push('npm-Sicherheitsdatenbank')
        if (!roh.meldungen) ohneDaten.push('npm-Sicherheitsdatenbank')
        meldungen = Object.fromEntries(Object.entries(roh.meldungen ?? {}).filter(([p, m]) => versionen[p] === m.version && m.liste.length).map(([p, m]) => [p, m.liste]))
      }
      const neuJetzt = Object.fromEntries(neueste.filter(([, v]) => versionOk(v)) as [string, string][])
      if (Object.keys(versionen).length && !Object.keys(neuJetzt).length) {
        fehler.push('npm (neueste Versionen)')
        if (!roh.latest) ohneDaten.push('npm (neueste Versionen)')
      }
      const latest = { ...(roh.latest ?? {}), ...neuJetzt }
      if (Object.keys(neuJetzt).length) roh.latest = latest
      const nodeEol = quelle('endoflife.date (Node.js)', nodeEolNeu, 'nodeEol')
      const nodeIndex = quelle('nodejs.org', nodeIndexNeu, 'nodeIndex')
      const pgEol = pgIst ? quelle('endoflife.date (PostgreSQL)', pgEolNeu, 'pgEol') : null

      // System
      const nz = zyklus(nodeEol, haupt(nodeIst))
      eintraege.push(laufzeitEintrag('node', 'Node.js', nodeIst, nz?.latest ?? null, nz?.eol ?? NODE_ENDE[haupt(nodeIst)] ?? null, nodeSicherheit(nodeIndex, nodeIst), { update: NODE_TUN.update(), wechsel: NODE_TUN.wechsel }))
      if (pgIst) {
        const pz = zyklus(pgEol, haupt(pgIst))
        eintraege.push(laufzeitEintrag('postgres', 'PostgreSQL', pgIst, pz?.latest ?? null, pz?.eol ?? POSTGRES_ENDE[haupt(pgIst)] ?? null, null, { update: PG_TUN.update(), wechsel: PG_TUN.wechsel }))
      }

      // Website-Pakete
      for (const [p, ist] of Object.entries(versionen)) {
        const neu = latest[p] ?? null
        const m = meldungen[p]
        const name = NAMEN[p] ?? p
        const tun = 'Update in Auftrag geben (Paket aktualisieren, alle Tests) – danach auf dem Server ./deploy/update.sh (sichert vorher, fällt bei Fehlern zurück).'
        if (m?.length)
          eintraege.push({ key: `pkt-${p}`, gruppe: 'Website-Pakete', name, installiert: ist, verfuegbar: neu, art: 'sicherheit', text: `${m.some((x) => x.schwere === 'critical') ? 'Kritische' : 'Hohe'} Sicherheitslücke bekannt – zeitnah aktualisieren.`, tun, meldungen: m })
        else if (neu && istNeuer(neu, ist)) {
          const gesperrt = sperre(neu, anforderungen[p] ?? [])
          if (gesperrt) {
            eintraege.push({
              key: `pkt-${p}`,
              gruppe: 'Website-Pakete',
              name,
              installiert: ist,
              verfuegbar: neu,
              art: 'gesperrt',
              text: `Passt noch nicht: ${anzeigeName(gesperrt.von)} verlangt ${name} ${gesperrt.bereich}. Möglich, sobald ${anzeigeName(gesperrt.von)} umstellt.`,
              tun: 'Nichts zu tun – die Übersicht meldet es, sobald das Update passt.',
            })
            continue
          }
          const gross = istHauptversion(neu, ist)
          eintraege.push({
            key: `pkt-${p}`,
            gruppe: 'Website-Pakete',
            name,
            installiert: ist,
            verfuegbar: neu,
            art: gross ? 'hauptversion' : 'update',
            text: gross ? 'Neue Hauptversion – größerer Umbau, nur mit ausführlichen Tests.' : 'Update verfügbar – beim nächsten Update-Tag mitnehmen.',
            tun,
          })
        }
      }

      eintraege.push(...serverEintraege())
      const rang: Record<Art, number> = { sicherheit: 0, auslaufend: 1, update: 2, hauptversion: 3, gesperrt: 4, aktuell: 5 }
      eintraege.sort((a, b) => rang[a.art] - rang[b.art] || a.gruppe.localeCompare(b.gruppe) || a.name.localeCompare(b.name))
      const alt = stand()
      g.__bsvUpdates = { geprueftAm: new Date().toISOString(), fehlerSeit: fehler.length ? (alt.fehlerSeit ?? new Date().toISOString()) : null, quellenFehler: fehler, ohneDaten, eintraege, paketeGesamt: Object.keys(versionen).length, versionen }
      if (fehler.length) payload?.logger.warn(`Update-Prüfung: nicht erreichbar: ${fehler.join(', ')}`)
    } catch (e) {
      stand().fehlerSeit ??= new Date().toISOString()
      payload?.logger.warn({ err: e }, 'Update-Prüfung fehlgeschlagen')
    }
    return stand()
  })().finally(() => {
    g.__bsvUpdatesLaeuft = undefined
  })
  return g.__bsvUpdatesLaeuft
}

/** Kurzfassung für Dashboard und Monatsbericht */
export function updateZusammenfassung(s: UpdateStand = stand()): { sicherheit: Eintrag[]; updates: Eintrag[]; auslaufend: Eintrag[] } {
  return {
    sicherheit: s.eintraege.filter((e) => e.art === 'sicherheit'),
    updates: s.eintraege.filter((e) => e.art === 'update' || e.art === 'hauptversion'),
    auslaufend: s.eintraege.filter((e) => e.art === 'auslaufend'),
  }
}
