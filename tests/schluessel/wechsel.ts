/**
 * pnpm test:schluessel – prüft den Schlüsselwechsel (pnpm schluessel:wechseln) in einer eigenen, leeren Test-Datenbank
 * und einem eigenen Sicherungsordner. Die echte Datenbank und die echten Sicherungen werden nicht angefasst.
 * Braucht nur DATABASE_URL (Konto mit Recht „CREATEDB“, lokal gegeben).
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

import { codePasst, hashCode } from '@/auth/totp'
import { loesungPruefen, neueAufgabe } from '@/auth/botschutz'
import { ausweisToken, ausweisTokenPruefen } from '@/mitgliedschaften/token'
import { decrypt, decryptMit, encrypt, encryptMit, feldSchluessel } from '@/utilities/crypto'
import { konfigurationPruefen } from '@/utilities/startpruefung'

import type { Pool } from '@/sicherung/kern'

type Client = { connect: () => Promise<void>; end: () => Promise<void>; query: (s: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }> }
const req = createRequire(import.meta.url)
const pg = createRequire(req.resolve('@payloadcms/db-postgres'))('pg') as {
  Client: new (o: { connectionString?: string }) => Client
  Pool: new (o: { connectionString?: string }) => Pool & { end: () => Promise<void> }
}

const WURZEL = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const K1 = crypto.randomBytes(32).toString('hex')
const K2 = crypto.randomBytes(32).toString('hex')
const K3 = crypto.randomBytes(32).toString('hex')
const basisUrl = process.env.DATABASE_URL!
const NAME = `bsv_schluesseltest_${process.pid}`
const testUrl = basisUrl.replace(/\/[^/?]+(\?|$)/, `/${NAME}$1`)
const arbeit = fs.mkdtempSync(path.join(os.tmpdir(), 'bsv-schluesseltest-'))
// Der Sicherungsordner hängt am Arbeitsverzeichnis – erst wechseln, dann laden (sonst landet die Test-Sicherung bei den echten)
process.chdir(arbeit)
const { entschluesseln, sicherungErstellen, SICHERUNGS_ORDNER } = await import('@/sicherung/kern')
if (!SICHERUNGS_ORDNER.startsWith(arbeit)) throw new Error('Sicherungsordner zeigt nicht in den Testordner – Abbruch')

let fehler = 0
let geprueft = 0
const pruefe = (name: string, ok: boolean, info?: unknown) => {
  geprueft++
  if (!ok) fehler++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok ? '' : '  → ' + JSON.stringify(info ?? null).slice(0, 300)}`)
}
const schluessel = (neu: string, alt?: string) => {
  process.env.ENCRYPTION_KEY = neu
  if (alt) process.env.ENCRYPTION_KEY_ALT = alt
  else delete process.env.ENCRYPTION_KEY_ALT
}
const lesbarMit = (wert: string, k: string) => {
  try {
    decryptMit(wert, feldSchluessel(k))
    return true
  } catch {
    return false
  }
}
const wirft = (f: () => unknown) => {
  try {
    f()
    return false
  } catch {
    return true
  }
}

function lauf(args: string[], env: Record<string, string | undefined>) {
  const r = spawnSync(path.join(WURZEL, 'node_modules/.bin/tsx'), ['--tsconfig', path.join(WURZEL, 'tsconfig.json'), path.join(WURZEL, 'src/sicherung/schluesselWechseln.ts'), ...args], {
    cwd: arbeit,
    env: { ...process.env, DATABASE_URL: testUrl, PORT: '3999', ...env },
    encoding: 'utf8',
  })
  return { code: r.status, text: `${r.stdout}${r.stderr}` }
}

const admin = new pg.Client({ connectionString: basisUrl })
await admin.connect()
await admin.query(`CREATE DATABASE ${NAME}`)
// Jede Abfrage mit eigener, sofort geschlossener Verbindung – das Skript bricht ab, solange andere Verbindungen offen sind
const db = {
  query: async (sqlText: string, p?: unknown[]) => {
    const c = new pg.Client({ connectionString: testUrl })
    await c.connect()
    try {
      return await c.query(sqlText, p)
    } finally {
      await c.end()
    }
  },
}
let pool: (Pool & { end: () => Promise<void> }) | null = new pg.Pool({ connectionString: testUrl })
try {
  // Kleines Abbild der echten Tabellen: Text-, jsonb- und Versions-Spalten mit verschlüsselten Werten
  await db.query(`
    CREATE TABLE users (id serial PRIMARY KEY, email varchar, zwei_faktor_aktiv boolean, zwei_faktor_geheimnis varchar, zwei_faktor_codes jsonb,
      zwei_faktor_sitzungen jsonb, zwei_faktor_letzter_schritt numeric, zwei_faktor_fehler numeric, zwei_faktor_fehler_seit timestamptz, zwei_faktor_einrichtung_seit timestamptz);
    CREATE TABLE mitgliedsantraege (id serial PRIMARY KEY, name varchar, iban varchar);
    CREATE TABLE _mitgliedsantraege_v (id serial PRIMARY KEY, version_iban varchar);
    CREATE TABLE payload_preferences (id serial PRIMARY KEY, value jsonb);
    CREATE TABLE kontaktanfragen (id serial PRIMARY KEY, betreff varchar);
    CREATE TABLE ohne_id (text varchar);`)

  console.log('\nGrundlagen (Rückfall auf ENCRYPTION_KEY_ALT)')
  schluessel(K1)
  const iban = encrypt('DE89370400440532013000')
  const geheimnis = encrypt('JBSWY3DPEHPK3PXP')
  const codeHash = hashCode('ABCD-EFGH')
  const ausweis = ausweisToken(42)
  const aufgabe = neueAufgabe()
  pruefe('Wert mit K1 verschlüsselt', lesbarMit(iban, K1) && !lesbarMit(iban, K2))
  schluessel(K2)
  pruefe('Ohne ENCRYPTION_KEY_ALT: alter Wert nicht lesbar', wirft(() => decrypt(iban)))
  pruefe('Ohne ALT: alter Ausweis-QR ungültig', ausweisTokenPruefen(ausweis) === null)
  pruefe('Ohne ALT: alter Wiederherstellungscode ungültig', !codePasst('ABCD-EFGH', codeHash))
  schluessel(K2, K1)
  pruefe('Mit ALT: alter Wert lesbar', decrypt(iban) === 'DE89370400440532013000')
  pruefe('Mit ALT: neue Werte werden mit dem NEUEN Schlüssel verschlüsselt', lesbarMit(encrypt('x'), K2) && !lesbarMit(encrypt('x'), K1))
  pruefe('Mit ALT: alter Ausweis-QR gilt weiter', ausweisTokenPruefen(ausweis) === 42)
  pruefe('Mit ALT: neuer Ausweis-QR gilt', ausweisTokenPruefen(ausweisToken(7)) === 7)
  pruefe('Mit ALT: gefälschter Ausweis-QR ungültig', ausweisTokenPruefen(`${(42).toString(36)}.${'A'.repeat(22)}`) === null)
  pruefe('Mit ALT: Ausweis-QR einer anderen Nummer ungültig', ausweisTokenPruefen(`${(43).toString(36)}.${ausweis.split('.')[1]}`) === null)
  pruefe('Mit ALT: alter Wiederherstellungscode gilt weiter', codePasst('ABCD-EFGH', codeHash))
  pruefe('Mit ALT: falscher Code ungültig', !codePasst('ABCD-EFGX', codeHash))
  // Frisch erstellte Aufgabe: Ist die Signatur gültig, kommt als Nächstes „zu schnell“ – sonst „ungültig“
  const lsg = { ...aufgabe, zahl: 0 }
  pruefe('Mit ALT: Bot-Schutz-Aufgabe mit altem Schlüssel ungültig (kein Rückfall)', loesungPruefen(lsg)?.includes('ungültig') === true, loesungPruefen(lsg))
  schluessel(K1)
  pruefe('Bot-Schutz-Aufgabe mit passendem Schlüssel gültig (nur zu schnell)', loesungPruefen(lsg)?.includes('zu schnell') === true, loesungPruefen(lsg))
  schluessel(K2)
  pruefe('Bot-Schutz: Signatur kein Text → ungültig statt Absturz', !!loesungPruefen({ ...lsg, signatur: { a: 1 } as never }))
  schluessel(K2, K3)
  pruefe('Falscher ALT: alter Wert nicht lesbar', wirft(() => decrypt(iban)))
  pruefe('Falscher ALT: alter Ausweis-QR ungültig', ausweisTokenPruefen(ausweis) === null)
  pruefe('Startprüfung: ALT gesetzt → Warnung', konfigurationPruefen({ ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1, PAYLOAD_SECRET: K3, DATABASE_URL: 'x' } as unknown as NodeJS.ProcessEnv, false).warnungen.some((w) => w.includes('Schlüsselwechsel')))
  pruefe('Startprüfung: ALT gleich neu → Fehler', konfigurationPruefen({ ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K2, PAYLOAD_SECRET: K3, DATABASE_URL: 'x' } as unknown as NodeJS.ProcessEnv, false).fehler.length > 0)
  pruefe('Startprüfung: ALT zu kurz → Fehler', konfigurationPruefen({ ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: 'kurz', PAYLOAD_SECRET: K3, DATABASE_URL: 'x' } as unknown as NodeJS.ProcessEnv, false).fehler.length > 0)

  // Testdaten mit K1
  schluessel(K1)
  await db.query(`INSERT INTO users (email, zwei_faktor_aktiv, zwei_faktor_geheimnis, zwei_faktor_codes) VALUES ('a@test', true, $1, $2), ('b@test', false, NULL, NULL)`, [geheimnis, JSON.stringify([codeHash])])
  await db.query(`INSERT INTO mitgliedsantraege (name, iban) VALUES ('Test', $1), ('Ohne', NULL)`, [iban])
  await db.query(`INSERT INTO _mitgliedsantraege_v (version_iban) VALUES ($1)`, [encrypt('DE02120300000000202051')])
  await db.query(`INSERT INTO payload_preferences (value) VALUES ($1)`, [JSON.stringify({ tief: { liste: [encrypt('geheim'), 'klar'] } })])
  await db.query(`INSERT INTO ohne_id (text) VALUES ('Text mit enc:v1: mittendrin')`)
  // Von Besuchern eingegeben, sieht nur verschlüsselt aus – darf den Wechsel nicht blockieren
  await db.query(`INSERT INTO kontaktanfragen (betreff) VALUES ('enc:v1:AAAA'), ($1)`, [encryptMit('kein echter Schlüssel', feldSchluessel(K3))])
  const alteSicherung = await sicherungErstellen(pool!, 'test')
  await pool!.end()
  pool = null

  console.log('\nProbelauf und Schutzmechanismen')
  let r = lauf([], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: undefined })
  pruefe('Ohne ENCRYPTION_KEY_ALT → Abbruch mit Anleitung', r.code === 1 && r.text.includes('ENCRYPTION_KEY_ALT fehlt'), r.text)
  r = lauf([], { ENCRYPTION_KEY: K1, ENCRYPTION_KEY_ALT: K1 })
  pruefe('ALT gleich neu → Abbruch', r.code === 1 && r.text.includes('sind gleich'), r.text)
  r = lauf([], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  pruefe('Probelauf zählt 4 Werte (Text, Versionen, Zwei-Faktor, jsonb)', r.code === 0 && r.text.includes('4 umzustellen'), r.text)
  const nachProbe = (await db.query('SELECT iban FROM mitgliedsantraege WHERE iban IS NOT NULL')).rows[0]!.iban as string
  pruefe('Probelauf ändert nichts', nachProbe === iban)
  r = lauf(['ausfuehren'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K3 })
  pruefe('Falscher ALT → Abbruch mit Tabelle und id, nichts geändert', r.code === 1 && r.text.includes('weder mit dem alten') && r.text.includes('mitgliedsantraege.iban (id') && ((await db.query('SELECT iban FROM mitgliedsantraege WHERE iban IS NOT NULL')).rows[0]!.iban as string) === iban, r.text)
  // Zweiter Lauf gleichzeitig (Sperre wird von einer anderen Verbindung gehalten)
  const halter = new pg.Client({ connectionString: testUrl })
  await halter.connect()
  await halter.query(`SELECT pg_advisory_lock(hashtext('bsv-schluesselwechsel'))`)
  r = lauf(['ausfuehren'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  pruefe('Zweiter gleichzeitiger Lauf → Abbruch', r.code === 1 && r.text.includes('läuft gerade schon'), r.text)
  await halter.query(`SELECT pg_advisory_unlock_all()`)
  r = lauf(['ausfuehren'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  pruefe('Andere offene Datenbank-Verbindung → Abbruch', r.code === 1 && r.text.includes('andere Verbindungen'), r.text)
  await halter.end()
  // Eigener Prozess, damit der „Server“ antwortet, während dieser Test auf das Skript wartet
  const server = spawn(process.execPath, ['-e', "require('http').createServer((q,s)=>s.end('ok')).listen(3999,'127.0.0.1',()=>console.log('bereit'))"])
  await new Promise((ok) => server.stdout.once('data', ok))
  r = lauf(['ausfuehren'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  server.kill()
  pruefe('Website läuft noch → Abbruch', r.code === 1 && r.text.includes('läuft noch'), r.text)

  console.log('\nAusführen')
  r = lauf(['ausfuehren'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  pruefe('Läuft durch', r.code === 0 && r.text.includes('4 Werte umgestellt') && r.text.includes('1 umgestellt'), r.text)
  pruefe('Fremder „enc:v1:“-Text wird übersprungen und gemeldet', r.text.includes('übersprungen') && r.text.includes('kontaktanfragen.betreff'), r.text)
  pruefe('Fremder Text bleibt unverändert', ((await db.query(`SELECT count(*)::int n FROM kontaktanfragen WHERE betreff = 'enc:v1:AAAA'`)).rows[0]!.n as number) === 1)
  const u = (await db.query(`SELECT zwei_faktor_geheimnis g, zwei_faktor_codes c, zwei_faktor_aktiv a FROM users WHERE email='a@test'`)).rows[0]!
  const a = (await db.query('SELECT iban FROM mitgliedsantraege WHERE iban IS NOT NULL')).rows[0]!.iban as string
  const v = (await db.query('SELECT version_iban FROM _mitgliedsantraege_v')).rows[0]!.version_iban as string
  const p = (await db.query('SELECT value FROM payload_preferences')).rows[0]!.value as { tief: { liste: string[] } }
  schluessel(K2)
  pruefe('IBAN mit neuem Schlüssel lesbar, mit altem nicht', lesbarMit(a, K2) && !lesbarMit(a, K1) && decrypt(a) === 'DE89370400440532013000')
  pruefe('Versions-Tabelle umgestellt', lesbarMit(v, K2) && decrypt(v) === 'DE02120300000000202051')
  pruefe('Zwei-Faktor-Geheimnis umgestellt, Zwei-Faktor bleibt aktiv', lesbarMit(String(u.g), K2) && decrypt(String(u.g)) === 'JBSWY3DPEHPK3PXP' && u.a === true)
  pruefe('Wert tief in jsonb umgestellt, Klartext daneben unverändert', lesbarMit(p.tief.liste[0]!, K2) && p.tief.liste[1] === 'klar')
  pruefe('Wiederherstellungscodes unverändert (gelten nur mit ALT)', JSON.stringify(u.c) === JSON.stringify([codeHash]))
  pruefe('Text, der „enc:v1:“ nur enthält, unverändert', ((await db.query('SELECT text FROM ohne_id')).rows[0]!.text as string).startsWith('Text mit enc:v1:'))
  // Sicherung: außen und innen neu, ohne den alten Schlüssel vollständig lesbar
  schluessel(K2)
  const klar = path.join(arbeit, 'probe.tar.gz')
  await entschluesseln(path.join(arbeit, 'backups', alteSicherung.datei), klar)
  const aus = path.join(arbeit, 'aus')
  fs.mkdirSync(aus)
  execFileSync('tar', ['-xzf', klar, '-C', aus])
  const zeilen = JSON.parse(fs.readFileSync(path.join(aus, 'datenbank', 'mitgliedsantraege.json'), 'utf8')) as { iban: string | null }[]
  const ibanAlt = zeilen.find((z) => z.iban)?.iban ?? ''
  pruefe('Sicherung ohne ALT entschlüsselbar und IBAN darin mit neuem Schlüssel', lesbarMit(ibanAlt, K2) && !lesbarMit(ibanAlt, K1))
  pruefe('Keine Zwischendateien im Sicherungsordner', fs.readdirSync(path.join(arbeit, 'backups')).every((f) => !f.startsWith('.umschluesseln-')))
  pruefe('Sicherungsdatei nur für den Besitzer lesbar', (fs.statSync(path.join(arbeit, 'backups', alteSicherung.datei)).mode & 0o077) === 0)

  console.log('\nWiederholen und Zwei-Faktor zurücksetzen')
  r = lauf(['ausfuehren'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  pruefe('Zweiter Lauf: nichts mehr umzustellen, Sicherung „schon neu“', r.code === 0 && r.text.includes('0 umzustellen') && r.text.includes('schon neu'), r.text)
  r = lauf(['ausfuehren', 'zwei-faktor-neu'], { ENCRYPTION_KEY: K2, ENCRYPTION_KEY_ALT: K1 })
  const u2 = (await db.query(`SELECT zwei_faktor_geheimnis g, zwei_faktor_codes c, zwei_faktor_aktiv a FROM users WHERE email='a@test'`)).rows[0]!
  pruefe('zwei-faktor-neu: Geheimnis und Codes gelöscht, Zwei-Faktor aus', r.code === 0 && u2.g === null && u2.c === null && u2.a === false, r.text)
  pruefe('Andere Daten bleiben', ((await db.query('SELECT count(*)::int n FROM mitgliedsantraege')).rows[0]!.n as number) === 2)
} finally {
  await pool?.end().catch(() => {})
  await admin.query(`DROP DATABASE IF EXISTS ${NAME}`).catch(() => {})
  await admin.end()
  fs.rmSync(arbeit, { recursive: true, force: true })
}
console.log(`\n${geprueft - fehler}/${geprueft} Prüfungen bestanden`)
process.exit(fehler ? 1 : 0)
