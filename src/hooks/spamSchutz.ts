import type { CollectionBeforeValidateHook, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { clientIp } from '@/utilities/clientIp'

/**
 * Schutz für öffentliche Formulare (Mitgliedsantrag, Probetraining, Kontakt):
 *
 * 1. Honeypot: Das Formular enthält ein unsichtbares Feld „website“.
 *    Menschen lassen es leer, Bots füllen es meist aus.
 * 2. Ratenbegrenzung pro IP-Adresse und zusätzlich für alle zusammen (im Arbeitsspeicher, reicht für einen Server).
 *    Die Obergrenze für alle fängt Angriffe mit vielen verschiedenen Adressen ab.
 *
 * Angemeldete Mitarbeitende (Verwaltung) sind ausgenommen.
 */
const FENSTER_MS = 10 * 60 * 1000
const MAX_PRO_FENSTER = 8
const zaehler = new Map<string, number[]>()

/** Übergroße Eingaben abweisen (Texte über 5.000 Zeichen, Listen über 20 Einträge) */
const zuGross = (v: unknown, tiefe = 0): boolean => {
  if (tiefe > 5) return true
  if (typeof v === 'string') return v.length > 5000
  if (Array.isArray(v)) return v.length > 20 || v.some((x) => zuGross(x, tiefe + 1))
  if (v && typeof v === 'object') return Object.values(v).some((x) => zuGross(x, tiefe + 1))
  return false
}

/** Zählt eine Anfrage für den Schlüssel; false = Grenze erreicht (dann wird nicht gezählt) */
function zaehlen(key: string, max: number): boolean {
  const jetzt = Date.now()
  const liste = (zaehler.get(key) ?? []).filter((t) => jetzt - t < FENSTER_MS)
  if (liste.length >= max) return false
  liste.push(jetzt)
  zaehler.set(key, liste)
  // Speicher klein halten
  if (zaehler.size > 5000) for (const [k, v] of zaehler) if (v.every((t) => jetzt - t >= FENSTER_MS)) zaehler.delete(k)
  return true
}

/**
 * Für eigene Endpunkte (z. B. Registrierung, Login): wirft 429, wenn von dieser Adresse – oder von allen
 * zusammen – zu viele Anfragen kommen. Grenze für alle: standardmäßig das 10-Fache der Grenze pro Adresse.
 */
export function ratenGrenze(req: Pick<PayloadRequest, 'headers'>, schluessel: string, max = MAX_PRO_FENSTER, maxAlle = max * 10) {
  const ip = clientIp(req.headers)
  // Ohne bekannte Adresse (nur lokal) gilt nur die Grenze für alle
  const proIp = ip === 'unbekannt' || zaehlen(`${schluessel}:${ip}`, max)
  if (!proIp || !zaehlen(`${schluessel}:*`, maxAlle)) throw new APIError('Zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.', 429)
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

    ratenGrenze(req, schluessel, MAX_PRO_FENSTER, 60)
    return data
  }
