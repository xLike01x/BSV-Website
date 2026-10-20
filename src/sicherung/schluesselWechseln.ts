/**
 * Schlüsselwechsel für ENCRYPTION_KEY – für den Notfall (Schlüssel bekannt geworden) oder vorsorglich.
 *
 *   pnpm schluessel:wechseln                           → Probelauf: zeigt nur, was passieren würde
 *   pnpm schluessel:wechseln ausfuehren                → Datenbank-Werte und Sicherungen auf den neuen Schlüssel umstellen
 *   pnpm schluessel:wechseln ausfuehren zwei-faktor-neu → zusätzlich Zwei-Faktor aller Konten zurücksetzen
 *
 * Vorher in der .env:  ENCRYPTION_KEY_ALT=<bisheriger Schlüssel>   ENCRYPTION_KEY=<neuer Schlüssel>
 * und die Website anhalten. Ablauf Schritt für Schritt: deploy/README.md, Abschnitt „Schlüssel wechseln“.
 *
 * Die Datenbank wird in EINER Transaktion umgestellt und vor dem Abschluss vollständig geprüft – bei einem Fehler
 * bleibt alles, wie es war. Mehrfaches Ausführen ist unschädlich (schon umgestellte Werte werden übersprungen).
 */
import { createRequire } from 'node:module'
import net from 'node:net'

import { feldSchluessel } from '@/utilities/crypto'
import { basisSchluessel, basisSchluesselAlt, schluessel, schluesselAlt } from '@/utilities/schluessel'

import { sicherungenAuflisten } from './kern'
import { istVerschluesselteSpalte, jsonUmschluesseln, neueZaehler, restAufraeumen, sicherungUmschluesseln, wertUmschluesseln, type Feldschluessel, type Zaehler } from './umschluesseln'

type Client = { connect: () => Promise<void>; end: () => Promise<void>; query: <R = Record<string, unknown>>(s: string, p?: unknown[]) => Promise<{ rows: R[]; rowCount: number | null }> }
const req = createRequire(import.meta.url)
const pg = createRequire(req.resolve('@payloadcms/db-postgres'))('pg') as { Client: new (o: { connectionString?: string }) => Client }

const argumente = process.argv.slice(2).map((a) => a.toLowerCase())
const ausfuehren = argumente.includes('ausfuehren') || argumente.includes('ausführen')
const zweiFaktorNeu = argumente.includes('zwei-faktor-neu')
const q = (n: string) => `"${n.replace(/"/g, '""')}"`

function abbruch(text: string): never {
  console.error(`\n✗ ${text}\n`)
  process.exit(1)
}

// 1. Schlüssel prüfen
const neuRoh = process.env.ENCRYPTION_KEY
const altRoh = process.env.ENCRYPTION_KEY_ALT
if (!altRoh)
  abbruch(
    'ENCRYPTION_KEY_ALT fehlt.\n  So geht es: In der .env den bisherigen Wert von ENCRYPTION_KEY als ENCRYPTION_KEY_ALT eintragen\n  und bei ENCRYPTION_KEY einen neuen Schlüssel (openssl rand -hex 32). Anleitung: deploy/README.md → „Schlüssel wechseln“.',
  )
if (!neuRoh || neuRoh.length < 32) abbruch('ENCRYPTION_KEY (der neue Schlüssel) fehlt oder ist kürzer als 32 Zeichen.')
if (altRoh.length < 32) abbruch('ENCRYPTION_KEY_ALT ist kürzer als 32 Zeichen – ist das wirklich der bisherige Schlüssel?')
if (altRoh === neuRoh) abbruch('ENCRYPTION_KEY und ENCRYPTION_KEY_ALT sind gleich – bei ENCRYPTION_KEY muss der NEUE Schlüssel stehen.')
if (process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET === neuRoh) abbruch('Der neue ENCRYPTION_KEY darf nicht gleich PAYLOAD_SECRET sein.')
basisSchluessel()
if (!basisSchluesselAlt()) abbruch('ENCRYPTION_KEY_ALT ist ungültig.')
const feld: Feldschluessel = { alt: feldSchluessel(altRoh), neu: feldSchluessel(neuRoh) }
const sicherung: Feldschluessel = { alt: schluesselAlt('sicherung')!, neu: schluessel('sicherung') }

console.log(`\nSchlüsselwechsel – ${ausfuehren ? 'AUSFÜHREN' : 'Probelauf (ändert nichts)'}${zweiFaktorNeu ? ' + Zwei-Faktor zurücksetzen' : ''}\n`)

// 2. Nur ein Lauf gleichzeitig, und die Website muss stehen – sonst schreibt sie während des Wechsels noch mit dem alten Schlüssel
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
const sperre = (await db.query<{ ok: boolean }>(`SELECT pg_try_advisory_lock(hashtext('bsv-schluesselwechsel')) AS ok`)).rows[0]?.ok
if (!sperre) abbruch('Der Schlüsselwechsel läuft gerade schon (in einem anderen Fenster). Bitte warten, bis er fertig ist.')

const port = process.env.PORT || '3000'
// Schon eine angenommene Verbindung zählt (auch eine hängende Website hält noch Datenbank-Verbindungen)
const laeuft = await new Promise<boolean>((fertig) => {
  const s = net.connect({ host: '127.0.0.1', port: Number(port) })
  s.setTimeout(2000)
  s.once('connect', () => (s.destroy(), fertig(true)))
  s.once('timeout', () => (s.destroy(), fertig(false)))
  s.once('error', () => fertig(false))
})
// Unabhängig vom Port: Hat noch jemand die Datenbank offen (Website auf anderem Port, Datenbank-Programm)?
const andere = (await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()`)).rows[0]?.n ?? 0
if (laeuft || andere) {
  const grund = laeuft ? `Die Website läuft noch (Port ${port})` : `Es sind noch ${andere} andere Verbindungen zur Datenbank offen (Website, Datenbank-Programm?)`
  if (ausfuehren) abbruch(`${grund}. Bitte erst anhalten: auf dem Server „sudo systemctl stop bsv“, am PC das Server-Fenster schließen.`)
  console.log(`⚠ ${grund} – vor „ausfuehren“ bitte anhalten.\n`)
}

// Abbruch mit Strg+C: entschlüsselte Zwischendateien sofort entfernen (offene Transaktion verwirft die Datenbank selbst)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    restAufraeumen()
    console.error('\n✗ Abgebrochen. Die Datenbank bleibt, wie sie war, wenn der Abschnitt „Datenbank“ noch nicht fertig war. Einfach erneut starten.')
    process.exit(130)
  })
restAufraeumen()

// 3. Datenbank: alle Text- und JSON-Spalten nach verschlüsselten Werten durchsuchen.
// Streng nur in Spalten, die verschlüsselt sein MÜSSEN (IBAN, Zwei-Faktor). Anderswo kann „enc:v1:…“ auch ein
// eingegebener Text sein (z. B. Kontaktformular) – das wird übersprungen und nur gemeldet.
const zDb: Zaehler = neueZaehler()
const fundstellen = new Map<string, number>()
const unlesbarOrte: string[] = []
const fremdOrte = new Map<string, unknown[]>()
type Aenderung = { tabelle: string; spalte: string; id: unknown; vorher: unknown; nachher: unknown; json: false | 'json' | 'jsonb' }
const aenderungen: Aenderung[] = []

const spalten = (
  await db.query<{ table_name: string; column_name: string; data_type: string }>(
    `SELECT table_name, column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND data_type IN ('character varying', 'text', 'json', 'jsonb')`,
  )
).rows
const mitId = new Set(
  (await db.query<{ table_name: string }>(`SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'id'`)).rows.map((r) => r.table_name),
)

for (const s of spalten) {
  const json = s.data_type === 'json' || s.data_type === 'jsonb'
  const pflicht = !json && istVerschluesselteSpalte(s.column_name)
  const ort = `${s.table_name}.${s.column_name}`
  const r = await db.query<{ id: unknown; wert: unknown }>(
    `SELECT ${mitId.has(s.table_name) ? 'id' : 'NULL'} AS id, ${q(s.column_name)} AS wert FROM ${q(s.table_name)} WHERE ${q(s.column_name)}::text LIKE '%enc:v1:%'`,
  )
  for (const zeile of r.rows) {
    const vorher = { ...zDb }
    const nachher = json ? jsonUmschluesseln(zeile.wert, feld, zDb) : wertUmschluesseln(String(zeile.wert), feld, zDb, pflicht)
    const neu = zDb.umgeschluesselt - vorher.umgeschluesselt
    if (zDb.unlesbar > vorher.unlesbar) unlesbarOrte.push(`${ort} (id ${String(zeile.id)})`)
    if (zDb.fremd > vorher.fremd) fremdOrte.set(ort, [...(fremdOrte.get(ort) ?? []), zeile.id])
    const gefunden = neu + (zDb.schonNeu - vorher.schonNeu) + (zDb.unlesbar - vorher.unlesbar)
    if (!gefunden) continue
    fundstellen.set(ort, (fundstellen.get(ort) ?? 0) + gefunden)
    if (neu) {
      if (!mitId.has(s.table_name)) abbruch(`Tabelle ${s.table_name} hat keine id-Spalte – kann ${s.column_name} nicht sicher ändern.`)
      aenderungen.push({ tabelle: s.table_name, spalte: s.column_name, id: zeile.id, vorher: zeile.wert, nachher, json: json ? (s.data_type as 'json' | 'jsonb') : false })
    }
  }
}

console.log('Datenbank:')
for (const [ort, n] of fundstellen) console.log(`  ${ort}: ${n} verschlüsselte Werte`)
if (!fundstellen.size) console.log('  keine verschlüsselten Werte gefunden')
console.log(`  → ${zDb.umgeschluesselt} umzustellen, ${zDb.schonNeu} schon mit dem neuen Schlüssel, ${zDb.unlesbar} mit keinem der beiden lesbar`)
for (const [ort, ids] of fremdOrte) console.log(`  · übersprungen (sieht nur verschlüsselt aus, z. B. eingegebener Text): ${ort} – id ${ids.slice(0, 10).map(String).join(', ')}${ids.length > 10 ? ' …' : ''}`)
if (zDb.unlesbar)
  abbruch(`Diese verschlüsselten Werte sind weder mit dem alten noch mit dem neuen Schlüssel lesbar: ${unlesbarOrte.slice(0, 20).join(', ')}${unlesbarOrte.length > 20 ? ' …' : ''}. Stimmt ENCRYPTION_KEY_ALT? Es wurde nichts geändert.`)

const zf = (
  await db.query<{ aktiv: string; codes: string }>(
    `SELECT count(*) FILTER (WHERE zwei_faktor_aktiv IS TRUE OR zwei_faktor_geheimnis IS NOT NULL)::int AS aktiv,
            count(*) FILTER (WHERE zwei_faktor_codes IS NOT NULL)::int AS codes FROM users`,
  )
).rows[0]!

const dateien = sicherungenAuflisten()
const verschluesselt = dateien.filter((d) => d.datei.endsWith('.enc'))
const klartext = dateien.filter((d) => !d.datei.endsWith('.enc'))
console.log(`\nSicherungen im Ordner backups: ${verschluesselt.length} verschlüsselt${klartext.length ? `, ${klartext.length} UNverschlüsselt (werden nicht angefasst)` : ''}`)
console.log(`Konten mit Zwei-Faktor: ${zf.aktiv}${zweiFaktorNeu ? ' → werden zurückgesetzt (beim nächsten Anmelden neu einrichten)' : ''}`)

if (!ausfuehren) {
  console.log('\nProbelauf beendet – nichts geändert. Zum Ausführen: pnpm schluessel:wechseln ausfuehren')
  await db.end()
  process.exit(0)
}

// 4. Datenbank umstellen – alles oder nichts
try {
  await db.query('BEGIN')
  for (const a of aenderungen) {
    const r = a.json
      ? await db.query(`UPDATE ${q(a.tabelle)} SET ${q(a.spalte)} = $1::text::${a.json} WHERE id = $2 AND ${q(a.spalte)}::jsonb = $3::jsonb`, [JSON.stringify(a.nachher), a.id, JSON.stringify(a.vorher)])
      : await db.query(`UPDATE ${q(a.tabelle)} SET ${q(a.spalte)} = $1 WHERE id = $2 AND ${q(a.spalte)} = $3`, [a.nachher, a.id, a.vorher])
    if (r.rowCount !== 1) throw new Error(`${a.tabelle}.${a.spalte} (id ${String(a.id)}) hat sich während des Wechsels geändert.`)
  }
  if (zweiFaktorNeu) {
    await db.query(
      `UPDATE users SET zwei_faktor_aktiv = false, zwei_faktor_geheimnis = NULL, zwei_faktor_codes = NULL, zwei_faktor_sitzungen = NULL,
       zwei_faktor_letzter_schritt = NULL, zwei_faktor_fehler = NULL, zwei_faktor_fehler_seit = NULL, zwei_faktor_einrichtung_seit = NULL
       WHERE zwei_faktor_aktiv IS TRUE OR zwei_faktor_geheimnis IS NOT NULL OR zwei_faktor_codes IS NOT NULL`,
    )
  }
  // Gegenprobe: jeder verschlüsselte Wert muss jetzt mit dem neuen Schlüssel lesbar sein
  const probe = neueZaehler()
  const nurNeu: Feldschluessel = { alt: feld.neu, neu: feld.neu }
  for (const s of spalten) {
    const r = await db.query<{ wert: unknown }>(`SELECT ${q(s.column_name)} AS wert FROM ${q(s.table_name)} WHERE ${q(s.column_name)}::text LIKE '%enc:v1:%'`)
    for (const z of r.rows) {
      if (s.data_type === 'json' || s.data_type === 'jsonb') jsonUmschluesseln(z.wert, nurNeu, probe)
      else wertUmschluesseln(String(z.wert), nurNeu, probe, istVerschluesselteSpalte(s.column_name))
    }
  }
  // Nichts darf unlesbar sein – außer genau den Texten, die schon vorher nur „verschlüsselt aussahen“
  if (probe.unlesbar || probe.fremd !== zDb.fremd) throw new Error(`${probe.unlesbar + probe.fremd - zDb.fremd} Werte sind nach dem Umstellen nicht mit dem neuen Schlüssel lesbar.`)
  await db.query('COMMIT')
  console.log(`\n✓ Datenbank: ${zDb.umgeschluesselt} Werte umgestellt und geprüft${zweiFaktorNeu ? `, Zwei-Faktor bei ${zf.aktiv} Konten zurückgesetzt` : ''}.`)
} catch (e) {
  await db.query('ROLLBACK').catch(() => {})
  await db.end()
  abbruch(`Datenbank: ${(e as Error).message} – es wurde nichts geändert.`)
}

// 5. Sicherungen umschlüsseln (jede einzeln; das Original bleibt bei einem Fehler erhalten)
const zSich = neueZaehler()
const unlesbar: string[] = []
let umgestellt = 0
for (const d of verschluesselt) {
  try {
    const e = await sicherungUmschluesseln(d.datei, sicherung, feld, zSich)
    if (e === 'unlesbar') unlesbar.push(d.datei)
    if (e === 'umgeschluesselt') umgestellt++
    console.log(`  ${e === 'umgeschluesselt' ? '✓' : e === 'schon-neu' ? '·' : '✗'} ${d.datei}${e === 'schon-neu' ? ' (schon neu)' : e === 'unlesbar' ? ' (mit keinem Schlüssel lesbar – unverändert)' : ''}`)
  } catch (e) {
    unlesbar.push(d.datei)
    console.log(`  ✗ ${d.datei}: ${(e as Error).message} – Original unverändert`)
  }
}
console.log(`✓ Sicherungen: ${umgestellt} umgestellt (darin ${zSich.umgeschluesselt} verschlüsselte Werte)${unlesbar.length ? `, ${unlesbar.length} NICHT umgestellt` : ''}.`)

console.log(`
Nächste Schritte:
  1. Website wieder starten (Server: sudo systemctl start bsv · PC: BSV-Website-Update.bat).
  2. Neuen Schlüssel im Passwortmanager des Vorstands speichern; den alten dort als „ALT – nicht mehr gültig“ markieren.
  3. Externe Kopien der Sicherungen (Storage Box) sind noch mit dem ALTEN Schlüssel verschlüsselt:
     löschen und eine neue Sicherung hochladen (Verwaltung → Datensicherung → „Jetzt sichern“).
  4. Gedruckte Mitgliedsausweise: Der QR-Code gilt nur noch, solange ENCRYPTION_KEY_ALT gesetzt ist – neu drucken.
  5. Wiederherstellungscodes (${zf.codes} Konten${zweiFaktorNeu ? ', jetzt zurückgesetzt' : ''}) gelten ebenfalls nur noch mit ENCRYPTION_KEY_ALT.
  6. Danach ENCRYPTION_KEY_ALT aus der .env löschen und die Website neu starten. Bei einem echten Leck: sofort.
  7. War die ganze .env betroffen? Dann auch PAYLOAD_SECRET, PREVIEW_SECRET und das SMTP-Passwort wechseln.`)
await db.end() // gibt auch die Sperre gegen einen zweiten gleichzeitigen Lauf frei
process.exit(unlesbar.length ? 1 : 0)
