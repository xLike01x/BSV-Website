import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pipeline } from 'stream/promises'
import * as tar from 'tar'

import { schluessel } from '@/utilities/schluessel'

/**
 * Datensicherung: alle Tabellen der Datenbank (als JSON) + alle hochgeladenen Bilder/Dateien
 * in EINER Datei (.tar.gz) im Ordner „backups“. Braucht kein pg_dump – läuft überall, wo die Website läuft.
 *
 * Die Datei ist verschlüsselt (AES-256-GCM, Endung .tar.gz.enc) – Schlüssel abgeleitet aus ENCRYPTION_KEY,
 * der absichtlich NICHT in der Sicherung liegt. Ohne die .env (bzw. den Schlüssel im Passwortmanager des
 * Vorstands) ist die Sicherung wertlos – für Unbefugte und für den Verein. Dateirechte: nur der Server-Nutzer.
 * Aufbewahrung: die letzten 14 Sicherungen, dazu je eine pro Woche (8 Wochen) und pro Monat (12 Monate).
 */

export const WURZEL = process.cwd()
export const SICHERUNGS_ORDNER = path.join(WURZEL, 'backups')
const DATEI_ORDNER = [
  { name: 'media', pfad: path.join(WURZEL, 'medien') },
  { name: 'profilbilder', pfad: path.join(WURZEL, 'profilbilder') },
  { name: 'passantraege', pfad: path.join(WURZEL, 'passantraege') },
  { name: 'dokumente', pfad: path.join(WURZEL, 'dokumente') },
]
const VERSION = 1
const AUSLASSEN = new Set(['payload_migrations'])

/** Das Nötigste aus node-postgres (den Pool stellt der Payload-Datenbankadapter) */
type Ergebnis<R> = { rows: R[]; rowCount: number | null }
type Abfrage = <R = Record<string, unknown>>(text: string, values?: unknown[]) => Promise<Ergebnis<R>>
export type Pool = { query: Abfrage; connect: () => Promise<{ query: Abfrage; release: () => void }> }

export type SicherungInfo = { datei: string; groesse: number; erstellt: string }

const q = (name: string) => `"${name.replace(/"/g, '""')}"`

async function tabellen(pool: Pick<Pool, 'query'>): Promise<string[]> {
  const r = await pool.query<{ tablename: string }>(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`)
  return r.rows.map((x) => x.tablename).filter((t) => !AUSLASSEN.has(t))
}

// Aufbau der verschlüsselten Datei: „BSVENC1\n“ + 12 Byte IV + Inhalt + 16 Byte Prüfsumme (GCM-Tag)
const KENNUNG = Buffer.from('BSVENC1\n')

export async function verschluesseln(quelle: string, ziel: string) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', schluessel('sicherung'), iv)
  const fd = fs.openSync(ziel, 'w', 0o600)
  fs.writeSync(fd, KENNUNG)
  fs.writeSync(fd, iv)
  fs.closeSync(fd)
  await pipeline(fs.createReadStream(quelle), c, fs.createWriteStream(ziel, { flags: 'a', mode: 0o600 }))
  fs.appendFileSync(ziel, c.getAuthTag())
}

export const istVerschluesselt = (datei: string) => {
  const fd = fs.openSync(datei, 'r')
  try {
    const b = Buffer.alloc(KENNUNG.length)
    fs.readSync(fd, b, 0, b.length, 0)
    return b.equals(KENNUNG)
  } finally {
    fs.closeSync(fd)
  }
}

export async function entschluesseln(quelle: string, ziel: string) {
  const groesse = fs.statSync(quelle).size
  const fd = fs.openSync(quelle, 'r')
  const iv = Buffer.alloc(12)
  const tag = Buffer.alloc(16)
  fs.readSync(fd, iv, 0, 12, KENNUNG.length)
  fs.readSync(fd, tag, 0, 16, groesse - 16)
  fs.closeSync(fd)
  const d = crypto.createDecipheriv('aes-256-gcm', schluessel('sicherung'), iv)
  d.setAuthTag(tag)
  try {
    await pipeline(fs.createReadStream(quelle, { start: KENNUNG.length + 12, end: groesse - 17 }), d, fs.createWriteStream(ziel, { mode: 0o600 }))
  } catch {
    fs.rmSync(ziel, { force: true })
    throw new Error('Die Sicherung lässt sich nicht entschlüsseln – falscher ENCRYPTION_KEY oder beschädigte Datei.')
  }
}

/** Alte Sicherungen entfernen: die neuesten 14 behalten, dazu die neueste je Woche (8 Wochen) und je Monat (12 Monate) */
export function sicherungenAusduennen(): string[] {
  const alle = sicherungenAuflisten()
  const behalten = new Set(alle.slice(0, 14).map((s) => s.datei))
  const woche = new Set<string>()
  const monat = new Set<string>()
  for (const s of alle) {
    const d = new Date(s.erstellt)
    const alterTage = (Date.now() - d.getTime()) / 86400000
    const w = `${d.getFullYear()}-${Math.floor((d.getTime() / 86400000 + 3) / 7)}`
    const m = `${d.getFullYear()}-${d.getMonth()}`
    if (alterTage <= 56 && !woche.has(w)) {
      woche.add(w)
      behalten.add(s.datei)
    }
    if (alterTage <= 366 && !monat.has(m)) {
      monat.add(m)
      behalten.add(s.datei)
    }
  }
  const weg = alle.filter((s) => !behalten.has(s.datei)).map((s) => s.datei)
  for (const f of weg) fs.rmSync(path.join(SICHERUNGS_ORDNER, f), { force: true })
  return weg
}

/** Sicherung erstellen – gibt den Dateinamen zurück */
export async function sicherungErstellen(pool: Pool, anlass = 'manuell'): Promise<SicherungInfo> {
  fs.mkdirSync(SICHERUNGS_ORDNER, { recursive: true, mode: 0o700 })
  try {
    fs.chmodSync(SICHERUNGS_ORDNER, 0o700)
  } catch {}
  // Ortszeit im Dateinamen, z. B. bsv-sicherung_2026-10-18_19-30
  const d = new Date()
  const zw = (n: number) => String(n).padStart(2, '0')
  const stempel = `${d.getFullYear()}-${zw(d.getMonth() + 1)}-${zw(d.getDate())}_${zw(d.getHours())}-${zw(d.getMinutes())}`
  let datei = `bsv-sicherung_${stempel}.tar.gz.enc`
  for (let i = 2; fs.existsSync(path.join(SICHERUNGS_ORDNER, datei)); i++) datei = `bsv-sicherung_${stempel}-${i}.tar.gz.enc`
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bsv-sicherung-'))
  try {
    const dbOrdner = path.join(tmp, 'datenbank')
    fs.mkdirSync(dbOrdner)
    const zaehler: Record<string, number> = {}
    // Alle Tabellen aus EINEM Stand lesen (gleichzeitige Änderungen landen nicht halb in der Sicherung)
    const client = await pool.connect()
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      for (const t of await tabellen(client)) {
        const r = await client.query(`SELECT * FROM ${q(t)}`)
        fs.writeFileSync(path.join(dbOrdner, `${t}.json`), JSON.stringify(r.rows))
        zaehler[t] = r.rowCount ?? r.rows.length
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {})
      throw e
    } finally {
      client.release()
    }
    fs.writeFileSync(path.join(tmp, 'info.json'), JSON.stringify({ version: VERSION, erstellt: new Date().toISOString(), anlass, tabellen: zaehler }, null, 2))
    const eintraege = ['info.json', 'datenbank']
    // Datei-Ordner als Verknüpfung einbinden (werden beim Packen aufgelöst, nichts wird kopiert)
    for (const o of DATEI_ORDNER) {
      if (!fs.existsSync(o.pfad)) continue
      fs.symlinkSync(o.pfad, path.join(tmp, o.name), 'junction')
      eintraege.push(o.name)
    }
    const roh = path.join(os.tmpdir(), `${path.basename(tmp)}.tar.gz`)
    try {
      await tar.c({ gzip: true, file: roh, cwd: tmp, follow: true, portable: true }, eintraege)
      await verschluesseln(roh, path.join(SICHERUNGS_ORDNER, datei))
    } finally {
      fs.rmSync(roh, { force: true })
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
  const st = fs.statSync(path.join(SICHERUNGS_ORDNER, datei))
  sicherungenAusduennen()
  return { datei, groesse: st.size, erstellt: st.mtime.toISOString() }
}

export function sicherungenAuflisten(): SicherungInfo[] {
  if (!fs.existsSync(SICHERUNGS_ORDNER)) return []
  return fs
    .readdirSync(SICHERUNGS_ORDNER)
    .filter((f) => /^bsv-sicherung_.*\.tar\.gz(\.enc)?$/.test(f))
    .map((f) => {
      const st = fs.statSync(path.join(SICHERUNGS_ORDNER, f))
      return { datei: f, groesse: st.size, erstellt: st.mtime.toISOString() }
    })
    .sort((a, b) => b.erstellt.localeCompare(a.erstellt))
}

/** Nur Dateinamen aus dem Sicherungsordner zulassen (kein „../“) */
export function sicherungsPfad(datei: string): string | null {
  if (!/^bsv-sicherung_[\w-]+\.tar\.gz(\.enc)?$/.test(datei)) return null
  const p = path.join(SICHERUNGS_ORDNER, datei)
  return fs.existsSync(p) ? p : null
}

/** Tabellen so sortieren, dass referenzierte Tabellen vor den verweisenden kommen */
async function reihenfolge(pool: Pool, namen: string[]): Promise<string[]> {
  const r = await pool.query<{ von: string; nach: string }>(`
    SELECT tc.table_name AS von, ccu.table_name AS nach
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`)
  const abh = new Map<string, Set<string>>(namen.map((n) => [n, new Set()]))
  for (const { von, nach } of r.rows) if (von !== nach && abh.has(von) && abh.has(nach)) abh.get(von)!.add(nach)
  const fertig: string[] = []
  const besucht = new Set<string>()
  const besuche = (n: string, pfad = new Set<string>()) => {
    if (besucht.has(n) || pfad.has(n)) return
    pfad.add(n)
    for (const d of abh.get(n) ?? []) besuche(d, pfad)
    besucht.add(n)
    fertig.push(n)
  }
  namen.forEach((n) => besuche(n))
  return fertig
}

/** Sicherung einspielen: ersetzt ALLE Inhalte der Datenbank und legt die Dateien zurück */
export async function sicherungEinspielen(pool: Pool, archivDatei: string, log: (s: string) => void = () => {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bsv-einspielen-'))
  let archiv = archivDatei
  try {
    // Verschlüsselte Sicherung zuerst entschlüsseln (ältere, unverschlüsselte .tar.gz gehen weiterhin)
    if (istVerschluesselt(archivDatei)) {
      archiv = path.join(os.tmpdir(), `${path.basename(tmp)}.tar.gz`)
      await entschluesseln(archivDatei, archiv)
    }
    // Nur normale Dateien und Ordner entpacken – keine Verknüpfungen (Symlinks), die auf Server-Dateien
    // wie die .env zeigen könnten. Dazu eine Größengrenze gegen „Zip-Bomben“.
    let groesse = 0
    const MAX = 20 * 1024 * 1024 * 1024
    await tar.x({
      file: archiv,
      cwd: tmp,
      strict: true,
      preservePaths: false,
      filter: (_pfad, eintrag) => {
        const e = eintrag as { type?: string; size?: number }
        if (e.type !== 'File' && e.type !== 'OldFile' && e.type !== 'Directory') return false
        groesse += e.size ?? 0
        if (groesse > MAX) throw new Error('Die Sicherung ist unerwartet groß – Abbruch.')
        return true
      },
    })
    const info = JSON.parse(fs.readFileSync(path.join(tmp, 'info.json'), 'utf8')) as { version: number; erstellt: string }
    log(`Sicherung vom ${new Date(info.erstellt).toLocaleString('de-DE')}`)
    const dbOrdner = path.join(tmp, 'datenbank')
    const imArchiv = fs.readdirSync(dbOrdner).map((f) => f.replace(/\.json$/, ''))
    const vorhanden = await tabellen(pool)
    const ziel = vorhanden.filter((t) => imArchiv.includes(t))
    const typen = await pool.query<{ table_name: string; column_name: string; data_type: string; is_nullable: string }>(
      `SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public'`,
    )
    const spalten = new Map<string, Map<string, string>>()
    const leerErlaubt = new Set<string>()
    for (const c of typen.rows) {
      if (!spalten.has(c.table_name)) spalten.set(c.table_name, new Map())
      spalten.get(c.table_name)!.set(c.column_name, c.data_type)
      if (c.is_nullable === 'YES') leerErlaubt.add(`${c.table_name}.${c.column_name}`)
    }
    // Fremdschlüssel-Spalten, die leer sein dürfen: zuerst leer einfügen, am Ende nachtragen.
    // So klappen auch Kreise (z. B. Bild → Team → Titelbild) ohne Superuser-Rechte.
    const fk = await pool.query<{ tabelle: string; spalte: string }>(`
      SELECT kcu.table_name AS tabelle, kcu.column_name AS spalte
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`)
    const spaeter = new Map<string, Set<string>>()
    for (const { tabelle, spalte } of fk.rows) {
      if (!leerErlaubt.has(`${tabelle}.${spalte}`)) continue
      if (!spaeter.has(tabelle)) spaeter.set(tabelle, new Set())
      spaeter.get(tabelle)!.add(spalte)
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // Fremdschlüssel-Prüfungen während des Einspielens aussetzen (klappt mit dem Docker-Standardnutzer)
      await client.query('SAVEPOINT rolle')
      try {
        await client.query(`SET LOCAL session_replication_role = 'replica'`)
      } catch {
        await client.query('ROLLBACK TO SAVEPOINT rolle')
      }
      const replica = (await client.query<{ session_replication_role: string }>('SHOW session_replication_role')).rows[0]?.session_replication_role === 'replica'
      if (vorhanden.length) await client.query(`TRUNCATE ${vorhanden.map(q).join(', ')} RESTART IDENTITY CASCADE`)
      const nachtragen: { t: string; spalte: string; id: unknown; wert: unknown }[] = []
      for (const t of await reihenfolge(pool, ziel)) {
        const zeilen = JSON.parse(fs.readFileSync(path.join(dbOrdner, `${t}.json`), 'utf8')) as Record<string, unknown>[]
        if (!zeilen.length) continue
        const typ = spalten.get(t)!
        const cols = Object.keys(zeilen[0]!).filter((c) => typ.has(c))
        const verschieben = !replica && typ.has('id') ? (spaeter.get(t) ?? new Set<string>()) : new Set<string>()
        for (let i = 0; i < zeilen.length; i += 200) {
          const teil = zeilen.slice(i, i + 200)
          const werte: unknown[] = []
          const platz = teil.map((z) => `(${cols.map((c) => {
            let v = z[c]
            if (verschieben.has(c) && v != null) {
              nachtragen.push({ t, spalte: c, id: z.id, wert: v })
              v = null
            }
            werte.push(v !== null && typeof v === 'object' && /json/.test(typ.get(c)!) ? JSON.stringify(v) : v)
            return `$${werte.length}`
          }).join(', ')})`)
          await client.query(`INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES ${platz.join(', ')}`, werte)
        }
        log(`  ${t}: ${zeilen.length}`)
      }
      for (const n of nachtragen) await client.query(`UPDATE ${q(n.t)} SET ${q(n.spalte)} = $1 WHERE id = $2`, [n.wert, n.id])
      if (nachtragen.length) log(`  ${nachtragen.length} Verweise nachgetragen`)
      // Zähler für neue IDs hinter die höchste vorhandene ID setzen
      for (const t of ziel) {
        if (!spalten.get(t)?.has('id')) continue
        const seq = await client.query<{ s: string | null }>(`SELECT pg_get_serial_sequence($1, 'id') AS s`, [q(t)])
        const s = seq.rows[0]?.s
        if (s) await client.query(`SELECT setval($1, GREATEST(COALESCE((SELECT MAX(id) FROM ${q(t)}), 0), 1), (SELECT COUNT(*) > 0 FROM ${q(t)}))`, [s])
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    // Dateien zurücklegen (vorhandene werden überschrieben, nichts wird gelöscht)
    for (const o of DATEI_ORDNER) {
      const quelle = path.join(tmp, o.name)
      if (!fs.existsSync(quelle)) continue
      fs.mkdirSync(o.pfad, { recursive: true })
      fs.cpSync(quelle, o.pfad, { recursive: true, force: true, verbatimSymlinks: false, filter: (q) => !fs.lstatSync(q).isSymbolicLink() })
      log(`  Dateien „${o.name}“ zurückgelegt`)
    }
    return info
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
    if (archiv !== archivDatei) fs.rmSync(archiv, { force: true })
  }
}
