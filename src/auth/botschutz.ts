import crypto from 'crypto'

import { schluessel } from '@/utilities/schluessel'

/**
 * Unsichtbarer Bot-Schutz für die Registrierung – ohne „Ich bin kein Roboter“, ohne Fremddienst, ohne Cookies.
 *
 * 1. Rechenaufgabe (Proof of Work): Der Browser bekommt eine Aufgabe und rechnet sie im Hintergrund
 *    (meist unter 2 Sekunden). Für einen Menschen unsichtbar, für Massen-Bots teuer.
 * 2. Zeitfalle: Wer das Formular schneller als in 3 Sekunden abschickt, ist kein Mensch.
 * 3. Jede Aufgabe gilt nur einmal und höchstens 30 Minuten.
 * Dazu kommen Honeypot-Feld, Begrenzung pro Adresse und die Bestätigungs-E-Mail.
 */
const MAX = 150_000 // Suchraum: im Schnitt ~75.000 Versuche (am PC ca. 0,3 s, am Handy ca. 1–2 s)
const GUELTIG_MS = 30 * 60 * 1000
const MIN_MS = 3000
const benutzt = new Map<string, number>()

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
const sig = (s: string) => crypto.createHmac('sha256', schluessel('botschutz')).update(s).digest('hex')

export type Aufgabe = { salz: string; ziel: string; max: number; signatur: string }

export function neueAufgabe(): Aufgabe {
  const salz = `${Date.now()}.${crypto.randomBytes(12).toString('hex')}.`
  const zahl = crypto.randomInt(0, MAX)
  const ziel = sha(salz + zahl)
  return { salz, ziel, max: MAX, signatur: sig(salz + ziel) }
}

/** Gibt null zurück, wenn alles passt – sonst eine Fehlermeldung */
export function loesungPruefen(l: { salz?: string; ziel?: string; signatur?: string; zahl?: number } | undefined): string | null {
  if (!l?.salz || !l.ziel || !l.signatur || typeof l.zahl !== 'number') return 'Sicherheitsprüfung fehlt. Bitte die Seite neu laden.'
  const erwartet = sig(l.salz + l.ziel)
  if (l.signatur.length !== erwartet.length || !crypto.timingSafeEqual(Buffer.from(l.signatur), Buffer.from(erwartet))) return 'Sicherheitsprüfung ungültig. Bitte die Seite neu laden.'
  const seit = Date.now() - Number(l.salz.split('.')[0])
  if (!(seit >= 0) || seit > GUELTIG_MS) return 'Die Seite war zu lange offen. Bitte neu laden und erneut absenden.'
  if (seit < MIN_MS) return 'Das ging zu schnell. Bitte noch einmal versuchen.'
  if (sha(l.salz + l.zahl) !== l.ziel) return 'Sicherheitsprüfung ungültig. Bitte die Seite neu laden.'
  if (benutzt.has(l.ziel)) return 'Bitte die Seite neu laden und erneut absenden.'
  benutzt.set(l.ziel, Date.now())
  if (benutzt.size > 10000) for (const [k, t] of benutzt) if (Date.now() - t > GUELTIG_MS) benutzt.delete(k)
  return null
}
