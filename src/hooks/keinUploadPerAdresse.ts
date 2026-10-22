import type { CollectionBeforeOperationHook, Plugin } from 'payload'
import { APIError } from 'payload'

/**
 * Payload kann statt einer hochgeladenen Datei auch eine Internet-Adresse annehmen ({ filename, url }) und die Datei
 * dann selbst vom Server aus herunterladen – ohne Größengrenze. Das brauchen wir nicht, und es ließe sich missbrauchen
 * (der Server ruft beliebige Adressen ab, sehr große Antworten füllen den Speicher). Über die Schnittstelle gilt deshalb:
 * Neue Einträge in Upload-Bereichen nur MIT hochgeladener Datei. Interne Abläufe (Local API) sind nicht betroffen.
 */
const nurMitDatei: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  const a = args as { overrideAccess?: boolean; duplicateFromID?: unknown }
  if (operation !== 'create' || a.overrideAccess || req.file) return args
  // Duplizieren nutzt die gespeicherte Datei des Originals – aber nur ohne mitgeschickte Adresse. Payload hat die
  // Adresse vor diesem Hook schon aus den Daten entfernt (und sich gemerkt), deshalb hier die rohe Anfrage prüfen.
  const roh = req.data as { url?: unknown } | undefined
  if (a.duplicateFromID != null && typeof roh?.url !== 'string') return args
  throw new APIError('Bitte eine Datei hochladen.', 400)
  return args
}

export const keineUploadsPerAdresse: Plugin = (config) => ({
  ...config,
  collections: (config.collections ?? []).map((c) =>
    c.upload ? { ...c, hooks: { ...c.hooks, beforeOperation: [nurMitDatei, ...(c.hooks?.beforeOperation ?? [])] } } : c,
  ),
})
