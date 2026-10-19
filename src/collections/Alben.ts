import { mitEindeutigemSlug } from '@/hooks/slugEindeutig'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { APIError, slugField } from 'payload'

import { anyone } from '@/access/anyone'
import { ausblendenAusser, canUpload, eigeneAngebotIds, hasRole, medienAuswahl, redaktionOderEigeneTeams } from '@/access/roles'
import { revalidateAllesNachAenderung, revalidateAllesNachLoeschen } from '@/hooks/revalidateAlles'
import { medienPruefen } from '@/hooks/medienPruefen'
import { slugify } from '@/hooks/slugFromTitle'
import type { CollectionBeforeValidateHook } from 'payload'

/** Adresse aus dem Titel – bei gleichem Titel mit Zähler (sommerfest-2) */
const slugAusTitel: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data || data.slug || typeof data.titel !== 'string') return data
  const basis = slugify(data.titel) || 'album'
  let slug = basis
  for (let i = 2; i < 50; i++) {
    const { totalDocs } = await req.payload.count({ collection: 'alben', where: { and: [{ slug: { equals: slug } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] }, overrideAccess: true, req })
    if (!totalDocs) break
    slug = `${basis}-${i}`
  }
  data.slug = slug
  return data
}

/** Team-Rollen legen Alben nur für eigene Teams an */
const teamAlbumPruefen: CollectionBeforeChangeHook = async ({ req, data }) => {
  const user = req.user
  if (!user || hasRole(user as never, 'admin', 'redaktion')) return data
  const ids = await eigeneAngebotIds(req)
  if (!data.team && ids.length === 1) data.team = ids[0]
  const ziel = Number(typeof data.team === 'object' && data.team ? data.team.id : data.team)
  if (!ids.includes(ziel)) throw new APIError('Bitte wähle eines deiner Teams aus.', 403)
  return data
}

/** Fotoalben für die Galerie – Bilder kommen aus der Mediathek */
export const Alben: CollectionConfig = {
  slug: 'alben',
  labels: { singular: 'Fotoalbum', plural: 'Fotoalben' },
  access: { read: anyone, create: canUpload, update: redaktionOderEigeneTeams('team'), delete: redaktionOderEigeneTeams('team') },
  admin: {
    group: 'Inhalte',
    useAsTitle: 'titel',
    defaultColumns: ['titel', 'datum', 'team', 'aktiv'],
    hidden: ausblendenAusser('admin', 'redaktion', 'uebungsleitung', 'teamredaktion'),
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Fotoalben für die Galerie auf der Website, z. B. „Sommerfest 2026“.',
  },
  defaultSort: '-datum',
  hooks: { beforeValidate: [slugAusTitel], beforeChange: [teamAlbumPruefen, medienPruefen], afterChange: [revalidateAllesNachAenderung], afterDelete: [revalidateAllesNachLoeschen] },
  fields: [
    { name: 'titel', label: 'Titel', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'datum', label: 'Datum', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { date: { displayFormat: 'dd.MM.yyyy' }, width: '50%' } },
        {
          name: 'team',
          label: 'Team / Kurs (optional)',
          type: 'relationship',
          relationTo: 'angebote',
          filterOptions: ({ user }) => (!user || hasRole(user as never, 'admin', 'redaktion') ? true : { leitung: { contains: user.id } }),
          admin: { width: '50%', description: 'Dann erscheint das Album auch auf der Teamseite.' },
        },
      ],
    },
    { name: 'beschreibung', label: 'Beschreibung (optional)', type: 'textarea' },
    {
      name: 'bilder',
      label: 'Bilder',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      filterOptions: medienAuswahl,
      admin: { description: 'Mehrere Bilder auswählen oder neu hochladen. Das erste Bild ist das Titelbild. Nur Fotos mit Einwilligung der abgebildeten Personen.' },
    },
    { name: 'aktiv', label: 'Auf der Website zeigen', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    mitEindeutigemSlug(slugField({ position: 'sidebar', useAsSlug: 'titel' }), 'alben', 'titel'),
  ],
}
