/**
 * Vor dem Go-Live bzw. vor jedem Update auf dem Server: `pnpm live:pruefen`
 * Prüft die .env so, als liefe die Website live (gefährliche Schalter, Schlüssel, Adresse, Mailserver).
 */
import { konfigurationPruefen } from '../src/utilities/startpruefung'

const { fehler, warnungen } = konfigurationPruefen(process.env, true)
for (const f of fehler) console.log(`✗ ${f}`)
for (const w of warnungen) console.log(`! ${w}`)
if (!fehler.length && !warnungen.length) console.log('✓ Konfiguration für den Live-Betrieb in Ordnung')
else if (!fehler.length) console.log('✓ Keine Fehler – Warnungen bitte prüfen')
process.exitCode = fehler.length ? 1 : 0
