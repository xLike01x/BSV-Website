/**
 * Verwaiste Dateien finden: liegen in medien/, profilbilder/, passantraege/ oder dokumente/, gehören aber zu keinem Eintrag mehr.
 *   pnpm dateien:aufraeumen        → nur auflisten
 *   pnpm dateien:aufraeumen ja     → auflisten und löschen
 * Vorher am besten eine Sicherung erstellen.
 */
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const req = createRequire(import.meta.url)
type Zeile = Record<string, string>
type Client = { connect: () => Promise<void>; end: () => Promise<void>; query: (s: string, p?: unknown[]) => Promise<{ rows: Zeile[] }> }
const pg = createRequire(req.resolve('@payloadcms/db-postgres'))('pg') as { Client: new (o: { connectionString?: string }) => Client }

const ORDNER: Record<string, string> = { medien: 'media', profilbilder: 'profilbilder', passantraege: 'passdokumente', dokumente: 'dokumente' }
const loeschen = process.argv.slice(2).includes('ja')

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
let gesamt = 0
for (const [ordner, tabelle] of Object.entries(ORDNER)) {
  const dir = path.resolve(process.cwd(), ordner)
  if (!fs.existsSync(dir)) continue
  const spalten = (await c.query(`select column_name from information_schema.columns where table_name=$1 and column_name like '%filename'`, [tabelle])).rows.map((r) => r.column_name as string)
  const bekannt = new Set<string>()
  for (const sp of spalten) for (const r of (await c.query(`select "${sp}" f from "${tabelle}" where "${sp}" is not null`)).rows) bekannt.add(r.f)
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('.') || bekannt.has(f)) continue
    gesamt++
    console.log(`${loeschen ? 'gelöscht' : 'verwaist'}: ${ordner}/${f}`)
    if (loeschen) fs.rmSync(path.join(dir, f), { force: true })
  }
}
await c.end()
console.log(gesamt ? `${gesamt} verwaiste Dateien${loeschen ? ' gelöscht' : ' – zum Löschen: pnpm dateien:aufraeumen ja'}` : 'Keine verwaisten Dateien.')
