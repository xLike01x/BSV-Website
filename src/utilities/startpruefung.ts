import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

/**
 * Prüfung beim Start (Audit F-17, F-28, F-16): Auf der Live-Website (NODE_ENV=production) startet die
 * Website nicht, wenn ein gefährlicher Schalter gesetzt ist oder ein Pflicht-Schlüssel fehlt.
 * Warnungen landen im Server-Protokoll. Dieselbe Prüfung gibt es vorab als `pnpm live:pruefen`.
 */
export type Ergebnis = { fehler: string[]; warnungen: string[] }

const PLATZHALTER = /bitte|ersetzen|change|your_secret|example|beispiel|xxx/i

export function konfigurationPruefen(env: NodeJS.ProcessEnv = process.env, live = env.NODE_ENV === 'production'): Ergebnis {
  const fehler: string[] = []
  const warnungen: string[] = []
  const geheim = (name: string, min = 32) => {
    const v = env[name]
    if (!v) fehler.push(`${name} fehlt in der .env`)
    else if (v.length < min) fehler.push(`${name} ist zu kurz (mindestens ${min} Zeichen)`)
    else if (PLATZHALTER.test(v)) fehler.push(`${name} enthält noch den Platzhalter aus .env.example`)
  }
  geheim('PAYLOAD_SECRET')
  geheim('ENCRYPTION_KEY')
  if (env.PAYLOAD_SECRET && env.PAYLOAD_SECRET === env.ENCRYPTION_KEY) fehler.push('PAYLOAD_SECRET und ENCRYPTION_KEY müssen verschieden sein')
  if (!env.DATABASE_URL) fehler.push('DATABASE_URL fehlt in der .env')
  if (!live) return { fehler, warnungen }

  if (env.ZWEI_FAKTOR === 'aus') fehler.push('ZWEI_FAKTOR=aus ist auf der Live-Website verboten – Zeile aus der .env löschen')
  if (env.BSV_TESTKONTEN === 'an') fehler.push('BSV_TESTKONTEN=an ist auf der Live-Website verboten – Zeile aus der .env löschen')
  geheim('PREVIEW_SECRET', 24)
  const url = env.NEXT_PUBLIC_SERVER_URL ?? ''
  if (!/^https:\/\/[^/]+$/.test(url)) fehler.push('NEXT_PUBLIC_SERVER_URL muss die Live-Adresse mit https:// sein, ohne / am Ende (z. B. https://www.buedericher-spielverein.de)')
  if (/localhost|127\.0\.0\.1/.test(url)) fehler.push('NEXT_PUBLIC_SERVER_URL zeigt noch auf localhost')
  if (/bsv:bsv@/.test(env.DATABASE_URL ?? '')) fehler.push('DATABASE_URL nutzt noch das Entwicklungs-Passwort „bsv“')
  if (!env.SMTP_HOST) warnungen.push('SMTP_HOST fehlt: Registrierung und „Passwort vergessen“ funktionieren nicht')
  else for (const n of ['SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']) if (!env[n]) warnungen.push(`${n} fehlt – E-Mail-Versand wird scheitern`)
  if (env.NEXT_TELEMETRY_DISABLED !== '1') warnungen.push('NEXT_TELEMETRY_DISABLED=1 empfohlen')
  return { fehler, warnungen }
}

export async function startpruefung(payload: Payload) {
  const { fehler, warnungen } = konfigurationPruefen()
  for (const w of warnungen) payload.logger.warn(`Startprüfung: ${w}`)
  if (fehler.length) {
    const text = `Die Website startet nicht – bitte in der .env korrigieren:\n- ${fehler.join('\n- ')}`
    payload.logger.error(text)
    if (process.env.NODE_ENV === 'production') throw new Error(text)
  }
  if (process.env.NODE_ENV === 'production') {
    // Ordner mit persönlichen Dateien nur für den Server-Nutzer lesbar
    for (const o of ['medien', 'profilbilder', 'passantraege', 'dokumente', 'backups']) {
      const p = path.join(process.cwd(), o)
      try {
        if (fs.existsSync(p)) fs.chmodSync(p, 0o700)
      } catch {}
    }
    const test = await payload.count({ collection: 'users', where: { testkonto: { equals: true } }, overrideAccess: true }).catch(() => null)
    if (test?.totalDocs) payload.logger.warn(`Startprüfung: ${test.totalDocs} Testkonten in der Live-Datenbank – bitte löschen (Rollen & Rechte → „Alle Testkonten löschen“). Anmelden können sie sich hier nicht.`)
  }
}
