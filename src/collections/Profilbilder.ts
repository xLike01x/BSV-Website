import path from 'path'
import type { Access, CollectionConfig, Where } from 'payload'
import { fileURLToPath } from 'url'

import { ausblendenAusser, eigeneAngebotIds, hasRole } from '@/access/roles'
import { darf, rechteLaden } from '@/access/rollenRechte'
import { privateDatei } from '@/utilities/privateDatei'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type U = { id: number; roles?: string[] | null } | null

/**
 * Wer ein Profilfoto sehen darf:
 * - das Mitglied selbst
 * - Admin und Kasse
 * - die Übungsleitung / Team-Redaktion der Kurse, in denen das Mitglied eingetragen ist
 * Niemals öffentlich.
 */
const fotoLesen: Access = async ({ req }) => {
  const user = req.user as U
  if (!user) return false
  if (hasRole(user as never, 'admin', 'kasse')) return true
  const eigenes: Where = { besitzer: { equals: user.id } }
  // Nur Übungsleitung – Team-Redaktion (z. B. Pressewarte) sieht keine Mitgliederfotos
  await rechteLaden(req.payload)
  if (darf(user, 'uebungsleitung', 'mitgliederfotos')) {
    const ids = await eigeneAngebotIds(req)
    if (ids.length) return { or: [eigenes, { 'besitzer.angebote': { in: ids } }] } as Where
  }
  return eigenes
}

const eigenesOderAdmin: Access = ({ req }) => {
  const user = req.user as U
  if (!user) return false
  if (hasRole(user as never, 'admin')) return true
  return { besitzer: { equals: user.id } }
}

/** Profilfotos der Mitglieder – liegen NICHT im öffentlichen Ordner */
export const Profilbilder: CollectionConfig = {
  slug: 'profilbilder',
  labels: { singular: 'Profilfoto', plural: 'Profilfotos' },
  access: {
    read: fotoLesen,
    // Angemeldet – bei Verwaltungskonten erst nach bestätigtem Code
    create: ({ req }) => Boolean(req.user) && !(req.user as { _zweiFaktorOffen?: boolean })._zweiFaktorOffen,
    update: eigenesOderAdmin,
    delete: eigenesOderAdmin,
  },
  admin: {
    group: 'Mitglieder',
    hidden: ausblendenAusser('admin'),
    useAsTitle: 'filename',
    description: 'Fotos, die Mitglieder im Mitgliederbereich von sich hochladen. Sichtbar nur für das Mitglied, Admin/Kasse und die Trainer seiner Kurse.',
  },
  upload: {
    staticDir: path.resolve(dirname, '../../profilbilder'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    modifyResponseHeaders: privateDatei,
    // Original gleich verkleinern (quadratisch) – entfernt auch Standort- und Kameradaten aus dem Foto
    resizeOptions: { width: 800, height: 800, fit: 'cover', position: 'attention' },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [{ name: 'klein', width: 160, height: 160, fit: 'cover', position: 'attention', formatOptions: { format: 'webp', options: { quality: 80 } } }],
    adminThumbnail: 'klein',
  },
  hooks: {
    beforeChange: [
      // Gehört immer der Person, die es hochlädt (Admins dürfen es für andere setzen)
      ({ req, data, operation }) => {
        const user = req.user as U
        if (operation === 'create' && user && (!data.besitzer || !hasRole(user as never, 'admin'))) data.besitzer = user.id
        return data
      },
    ],
    afterChange: [
      // Neues Foto: altes löschen und am Benutzerkonto eintragen
      async ({ doc, req, operation }) => {
        if (operation !== 'create') return doc
        const besitzer = typeof doc.besitzer === 'object' ? doc.besitzer?.id : doc.besitzer
        if (!besitzer) return doc
        await req.payload.delete({ collection: 'profilbilder', where: { and: [{ besitzer: { equals: besitzer } }, { id: { not_equals: doc.id } }] }, overrideAccess: true, req })
        await req.payload.update({ collection: 'users', id: besitzer, data: { profilbild: doc.id } as never, overrideAccess: true, context: { zweiFaktorIntern: true }, req })
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const besitzer = typeof doc.besitzer === 'object' ? doc.besitzer?.id : doc.besitzer
        if (!besitzer) return
        const u = await req.payload.findByID({ collection: 'users', id: besitzer, depth: 0, overrideAccess: true, req }).catch(() => null)
        const aktuell = u && (typeof u.profilbild === 'object' ? u.profilbild?.id : u.profilbild)
        if (aktuell === doc.id) await req.payload.update({ collection: 'users', id: besitzer, data: { profilbild: null } as never, overrideAccess: true, context: { zweiFaktorIntern: true }, req }).catch(() => {})
      },
    ],
  },
  fields: [
    {
      name: 'besitzer',
      label: 'Mitglied',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { update: ({ req }) => hasRole(req.user as never, 'admin') },
      admin: { readOnly: true },
    },
  ],
}
