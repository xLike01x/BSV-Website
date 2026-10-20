/**
 * Sicherheits-Regressionstests – prüfen die Befunde aus dem Audit vom Oktober 2026.
 * Start: Entwicklungsserver starten, dann `pnpm test:sicherheit` (nur gegen localhost, nie gegen die Live-Website).
 */
import { db, ergebnis } from './lib.mjs'
import anmeldung from './anmeldung.mjs'
import formulare from './formulare.mjs'
import papierkorb from './papierkorb.mjs'
import rechte from './rechte.mjs'
import statistik from './statistik.mjs'
import uploads from './uploads.mjs'

const TESTS = { papierkorb, anmeldung, rechte, uploads, statistik, formulare }

const d = await db()
try {
  for (const [name, t] of Object.entries(TESTS)) {
    console.log(`\n▶ ${name}`)
    await t(d)
  }
} finally {
  await d.ende()
}
const { fehler, geprueft } = ergebnis()
console.log(`\n${geprueft - fehler}/${geprueft} Prüfungen bestanden`)
process.exitCode = fehler ? 1 : 0
