import path from 'path'
import type { CollectionConfig, Where } from 'payload'
import { fileURLToPath } from 'url'

import { hatRecht } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'
import { privateDatei } from '@/utilities/privateDatei'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Kündigungen bearbeiten: Kasse/Admin oder Zusatzrecht „Mitgliedsanträge bearbeiten“ */
export const kuendigungBearbeiter = (user: unknown) =>
  hasRole(user as never, 'admin', 'kasse') || hatRecht(user, 'antraege')

/**
 * Unterschriebene Kündigungsschreiben. Liegen NICHT im öffentlichen Ordner (Ordner kuendigungen/, wie passantraege/).
 * Anlegen nur über POST /api/kuendigungen/einreichen (prüft Dateiart, Größe und Mitgliedschaft) – nie direkt.
 * Sehen: die hochladende Person und wer Kündigungen bearbeitet.
 */
export const Kuendigungsdokumente: CollectionConfig = {
  slug: 'kuendigungsdokumente',
  labels: { singular: 'Kündigungsschreiben', plural: 'Kündigungsschreiben' },
  access: {
    read: ({ req }) => {
      const user = req.user as { id: number; _zweiFaktorOffen?: boolean } | null
      if (!user || user._zweiFaktorOffen) return false
      if (kuendigungBearbeiter(user)) return true
      return { hochgeladenVon: { equals: user.id } } as Where
    },
    create: () => false,
    update: () => false,
    delete: ({ req }) => hasRole(req.user as never, 'admin', 'kasse'),
  },
  admin: {
    group: 'Posteingang',
    hidden: true,
    useAsTitle: 'filename',
  },
  upload: {
    staticDir: path.resolve(dirname, '../../kuendigungen'),
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    // Fotos ohne Standort- und Kameradaten speichern (bleiben gut lesbar bis 3000 px)
    resizeOptions: { width: 3000, height: 3000, fit: 'inside', withoutEnlargement: true },
    modifyResponseHeaders: privateDatei,
  },
  fields: [
    {
      name: 'hochgeladenVon',
      label: 'Hochgeladen von',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
