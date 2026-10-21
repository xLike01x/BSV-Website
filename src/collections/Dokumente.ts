import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { hasRole, imBereich, istMitgliedOderMehr } from '@/access/roles'

import { privateDatei } from '@/utilities/privateDatei'

import { dokumenteUmziehen } from './dokumenteUmziehen'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const pflegen = ({ req }: { req: { user?: unknown } }) => hasRole(req.user as never, 'admin', 'redaktion', 'kasse') || imBereich(req.user, 'medien')

/**
 * Geschützte Dateien „Nur für Mitglieder“ (z. B. Protokolle).
 * Liegen NICHT im öffentlichen Ordner, sondern in „dokumente/“ und werden nur an angemeldete Personen ausgeliefert.
 */
export const Dokumente: CollectionConfig = {
  slug: 'dokumente',
  labels: { singular: 'Mitglieder-Dokument', plural: 'Mitglieder-Dokumente' },
  trash: true,
  endpoints: [dokumenteUmziehen],
  access: {
    // Nur freigegebene Mitglieder (und Verwaltung) – nicht wartende Registrierungen
    read: ({ req }) => istMitgliedOderMehr(req.user),
    create: pflegen,
    update: pflegen,
    delete: pflegen,
  },
  admin: {
    group: 'Mitglieder',
    hidden: ({ user }) => !pflegen({ req: { user } }),
    useAsTitle: 'titel',
    defaultColumns: ['titel', 'filename', 'updatedAt'],
    description: 'Dateien nur für angemeldete Mitglieder, z. B. Protokolle. Sie sind nicht öffentlich erreichbar – auch nicht mit dem Link. Eingebunden werden sie unter „Vereinsdaten“ → „Satzung & Downloads“.',
  },
  fields: [{ name: 'titel', label: 'Titel', type: 'text', admin: { description: 'Nur intern, z. B. „Protokoll JHV 2026“.' } }],
  upload: {
    staticDir: path.resolve(dirname, '../../dokumente'),
    modifyResponseHeaders: privateDatei,
    // Bildtypen ausdrücklich (kein SVG – könnte Skripte enthalten)
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'application/vnd.ms-excel', 'text/plain'],
    // Fotos ohne Standort- und Kameradaten speichern
    resizeOptions: { width: 3000, height: 3000, fit: 'inside', withoutEnlargement: true },
  },
}
