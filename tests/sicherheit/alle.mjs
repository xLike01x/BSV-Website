/**
 * Sicherheits-Regressionstests – prüfen die Befunde aus dem Audit vom Oktober 2026.
 * Start: Entwicklungsserver starten, dann `pnpm test:sicherheit` (nur gegen localhost, nie gegen die Live-Website).
 */
import { db, ergebnis } from './lib.mjs'
import anmeldung from './anmeldung.mjs'
import bestaetigung from './bestaetigung.mjs'
import datenschutz from './datenschutz.mjs'
import formulare from './formulare.mjs'
import haertung from './haertung.mjs'
import papierkorb from './papierkorb.mjs'
import posteingang from './posteingang.mjs'
import rechte from './rechte.mjs'
import nurAnsehen from './nurAnsehen.mjs'
import registrierung from './registrierung.mjs'
import statistik from './statistik.mjs'
import uploads from './uploads.mjs'
import wartung from './wartung.mjs'
import zusatzrechte from './zusatzrechte.mjs'
import zusagen from './zusagen.mjs'
import spielecke from './spielecke.mjs'
import zweifaktor from './zweifaktor.mjs'
import kuendigungen from './kuendigungen.mjs'

const TESTS = { papierkorb, anmeldung, rechte, uploads, statistik, formulare, datenschutz, posteingang, wartung, bestaetigung, zusatzrechte, registrierung, haertung, zweifaktor, nurAnsehen, zusagen, spielecke, kuendigungen }

// Einzelne Bereiche: pnpm test:sicherheit -- posteingang
const nur = process.argv.slice(2)
const d = await db()
try {
  for (const [name, t] of Object.entries(TESTS).filter(([n]) => !nur.length || nur.includes(n))) {
    console.log(`\n▶ ${name}`)
    await t(d)
  }
} finally {
  await d.ende()
}
const { fehler, geprueft } = ergebnis()
console.log(`\n${geprueft - fehler}/${geprueft} Prüfungen bestanden`)
process.exitCode = fehler ? 1 : 0
