import type { CollectionBeforeValidateHook, PayloadRequest } from 'payload'
import { APIError } from 'payload'

/**
 * Schutz für öffentliche Formulare (Mitgliedsantrag, Probetraining, Kontakt):
 *
 * 1. Honeypot: Das Formular enthält ein unsichtbares Feld „website“.
 *    Menschen lassen es leer, Bots füllen es meist aus.
 * 2. Ratenbegrenzung pro IP-Adresse (im Arbeitsspeicher, reicht für einen Server).
 *
 * Angemeldete Mitarbeitende (Verwaltung) sind ausgenommen.
 */
const FENSTER_MS = 10 * 60 * 1000
const MAX_PRO_FENSTER = 8
const zaehler = new Map<string, number[]>()

/**
 * IP-Adresse des Besuchers. Der vorderste Eintrag in X-Forwarded-For kann vom Besucher selbst
 * erfunden werden – verlässlich ist nur, was der eigene Proxy (Webserver davor) einträgt:
 * X-Real-IP bzw. der LETZTE Eintrag in X-Forwarded-For.
 */
const clientIp = (req: PayloadRequest): string => {
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',').pop()!.trim()
  return 'unbekannt'
}

/** Übergroße Eingaben abweisen (Texte über 5.000 Zeichen, Listen über 20 Einträge) */
const zuGross = (v: unknown, tiefe = 0): boolean => {
  if (tiefe > 5) return true
  if (typeof v === 'string') return v.length > 5000
  if (Array.isArray(v)) return v.length > 20 || v.some((x) => zuGross(x, tiefe + 1))
  if (v && typeof v === 'object') return Object.values(v).some((x) => zuGross(x, tiefe + 1))
  return false
}

/** Für eigene Endpunkte (z. B. Registrierung): wirft 429, wenn von dieser Adresse zu viele Anfragen kommen */
export function ratenGrenze(req: PayloadRequest, schluessel: string, max = MAX_PRO_FENSTER) {
  const key = `${schluessel}:${clientIp(req)}`
  const jetzt = Date.now()
  const liste = (zaehler.get(key) ?? []).filter((t) => jetzt - t < FENSTER_MS)
  if (liste.length >= max) throw new APIError('Zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.', 429)
  liste.push(jetzt)
  zaehler.set(key, liste)
}

export const spamSchutz =
  (schluessel: string): CollectionBeforeValidateHook =>
  ({ req, operation, data }) => {
    if (operation !== 'create' || req.user) return data
    // Lokale API-Aufrufe (Seed, Import) haben keinen HTTP-Request
    if (!req.headers || req.payloadAPI === 'local') return data

    const roh = (req.data ?? {}) as Record<string, unknown>
    if (typeof roh.website === 'string' && roh.website.trim() !== '') {
      throw new APIError('Die Anfrage konnte nicht verarbeitet werden.', 400)
    }
    if (zuGross(data) || zuGross(roh)) throw new APIError('Die Eingabe ist zu lang. Bitte kürzen.', 400)

    const key = `${schluessel}:${clientIp(req)}`
    const jetzt = Date.now()
    const liste = (zaehler.get(key) ?? []).filter((t) => jetzt - t < FENSTER_MS)
    if (liste.length >= MAX_PRO_FENSTER) {
      throw new APIError('Zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.', 429)
    }
    liste.push(jetzt)
    zaehler.set(key, liste)

    // Speicher klein halten
    if (zaehler.size > 5000) {
      for (const [k, v] of zaehler) if (v.every((t) => jetzt - t >= FENSTER_MS)) zaehler.delete(k)
    }
    return data
  }
