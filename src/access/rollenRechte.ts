import type { Payload } from 'payload'

import { hasRole } from './roles'

/**
 * Zusatzrechte, die der Web-Admin pro Rolle ein- und ausschalten kann (Einstellungen → Rollen-Rechte).
 * Bewusst nur ausgewählte Schalter – Admin-Rechte bleiben fest; Benutzer und Bankdaten nur als Lese-Schalter für „Nur ansehen“.
 */
export const SCHALTER = {
  redaktion: [
    { key: 'kontaktLoeschen', label: 'Kontaktanfragen löschen', standard: false },
    { key: 'probetrainingLoeschen', label: 'Probetraining-Anfragen löschen', standard: false },
  ],
  kasse: [
    { key: 'kontaktanfragen', label: 'Kontaktanfragen sehen und bearbeiten', standard: false },
    { key: 'datenschutz', label: 'Datenschutz-Fristen ändern', standard: false },
  ],
  passwesen: [{ key: 'mitgliedschaften', label: 'Mitgliedschaften (Ausweisdaten) ansehen – nur lesen', standard: false }],
  uebungsleitung: [
    { key: 'probetraining', label: 'Probetraining-Anfragen der eigenen Teams sehen', standard: true },
    { key: 'passantraege', label: 'Passanträge der eigenen Teams sehen und bearbeiten', standard: true },
    { key: 'mitgliederfotos', label: 'Profilfotos der Mitglieder in den eigenen Teams sehen', standard: true },
  ],
  teamredaktion: [{ key: 'ausfaelle', label: 'Trainingsausfälle der eigenen Teams melden', standard: true }],
  // „Nur ansehen“: Inhalte, Website-Aufbau, Teams und Einstellungen sieht die Rolle immer – diese Bereiche lassen sich abschalten
  lesen: [
    { key: 'posteingang', label: 'Kontaktanfragen, Probetraining-Anfragen und Formular-Eingänge ansehen', standard: true },
    { key: 'passantraege', label: 'Passanträge ansehen (ohne Pass-Unterlagen)', standard: true },
    { key: 'mitgliedsantraege', label: 'Mitgliedsanträge ansehen', standard: true },
    { key: 'bankdaten', label: 'Bankdaten in Mitgliedsanträgen ansehen (IBAN, Kontoinhaber, SEPA)', standard: true },
    { key: 'mitgliedschaften', label: 'Mitgliedschaften ansehen', standard: true },
    { key: 'benutzer', label: 'Benutzerkonten, Registrierungen und Profilfotos ansehen', standard: true },
    { key: 'statistik', label: 'Besucherstatistik ansehen', standard: true },
  ],
} as const

export type SchalterRolle = keyof typeof SCHALTER
type Stand = Record<string, Record<string, boolean>>

const standard = (): Stand =>
  Object.fromEntries(Object.entries(SCHALTER).map(([r, liste]) => [r, Object.fromEntries(liste.map((s) => [s.key, s.standard]))]))

const g = globalThis as unknown as { __bsvRechte?: { stand: Stand; geladen: number; laeuft?: Promise<void>; gespeichert?: number } }
const speicher = () => (g.__bsvRechte ??= { stand: standard(), geladen: 0 })

const ausDokument = (doc: unknown): Stand => {
  const d = doc as Record<string, Record<string, boolean | null> | undefined> | null | undefined
  const neu = standard()
  for (const [r, liste] of Object.entries(SCHALTER)) for (const sch of liste) {
    const v = d?.[r]?.[sch.key]
    if (typeof v === 'boolean') neu[r]![sch.key] = v
  }
  return neu
}

/** Gespeicherten Stand neu lesen (beim Start, nach dem Speichern und spätestens alle 30 Sekunden) */
export async function rechteLaden(payload: Payload, erzwingen = false) {
  const s = speicher()
  if (!erzwingen && Date.now() - s.geladen < 30_000) return
  if (s.laeuft) return s.laeuft
  s.laeuft = (async () => {
    try {
      const start = Date.now()
      const doc = await payload.findGlobal({ slug: 'rollenRechte' as never, depth: 0, overrideAccess: true })
      // Während des Lesens gespeichert? Dann ist der übernommene Stand aktueller als das Gelesene
      if ((s.gespeichert ?? 0) < start) {
        s.stand = ausDokument(doc)
        s.geladen = Date.now()
      }
    } catch {
      // Tabelle evtl. noch nicht angelegt – Standardwerte gelten
    } finally {
      s.laeuft = undefined
    }
  })()
  return s.laeuft
}

/**
 * Stand aus einem gelesenen bzw. gerade gespeicherten Dokument übernehmen.
 * Beim Speichern direkt aus dem Hook aufrufen: Ein erneutes Lesen liefe außerhalb der noch offenen Transaktion
 * und sähe die alten Werte (dann gälten die Änderungen erst nach 30 Sekunden).
 */
export function rechteUebernehmen(doc: unknown) {
  const s = speicher()
  s.stand = ausDokument(doc)
  s.geladen = s.gespeichert = Date.now()
}

/** Ist der Schalter für diese Rolle an? (synchron – nutzt den zuletzt geladenen Stand) */
export const schalter = <R extends SchalterRolle>(rolle: R, key: (typeof SCHALTER)[R][number]['key']) => speicher().stand[rolle]?.[key] ?? false

/** Hat die Person die Rolle UND ist der Schalter an? */
export const darf = <R extends SchalterRolle>(user: unknown, rolle: R, key: (typeof SCHALTER)[R][number]['key']) => hasRole(user as never, rolle) && schalter(rolle, key)
