import type { CollectionConfig, PayloadRequest } from 'payload'

import { anyone } from '../access/anyone'
import { hasRole } from '../access/roles'
import { darf, rechteLaden } from '../access/rollenRechte'
import { spamSchutz } from '../hooks/spamSchutz'
import { mailHtml } from '@/auth/mail'
import { statusPille, statusReiter } from '@/components/Admin/StatusReiter/konfig'
import { getServerSideURL } from '@/utilities/getURL'
import { adressen, anliegenListe } from '@/Verein/anliegen'

const verein = async (req: PayloadRequest) => (await req.payload.findGlobal({ slug: 'verein', depth: 0, overrideAccess: true, req }).catch(() => null)) as never

/** Nachrichten aus dem Kontaktformular. Telefonnummern und E-Mail-Adressen des Vorstands bleiben so geschützt. */
export const Kontaktanfragen: CollectionConfig = {
  slug: 'kontaktanfragen',
  labels: { singular: 'Kontaktanfrage', plural: 'Kontaktanfragen' },
  access: {
    create: anyone,
    // Redaktion immer; Kasse, wenn der Web-Admin es unter „Rollen-Rechte“ eingeschaltet hat
    read: async ({ req }) => (await rechteLaden(req.payload), hasRole(req.user as never, 'admin', 'redaktion') || darf(req.user, 'kasse', 'kontaktanfragen')),
    update: async ({ req }) => (await rechteLaden(req.payload), hasRole(req.user as never, 'admin', 'redaktion') || darf(req.user, 'kasse', 'kontaktanfragen')),
    delete: async ({ req }) => (await rechteLaden(req.payload), hasRole(req.user as never, 'admin') || darf(req.user, 'redaktion', 'kontaktLoeschen')),
  },
  admin: {
    components: {
      beforeList: [
        '@/components/Admin/Einstieg',
        statusReiter('kontaktanfragen', [
          { key: 'neu', titel: 'Neu', symbol: '🆕', status: ['neu'], hervorheben: true },
          { key: 'arbeit', titel: 'In Bearbeitung', symbol: '⏳', status: ['bearbeitung'] },
          { key: 'erledigt', titel: 'Erledigt', symbol: '✓', status: ['erledigt'] },
          { key: 'alle', titel: 'Alle', symbol: '🗂️', status: null },
        ]),
      ],
    },
    description: 'Nachrichten aus dem Kontaktformular. Nach dem Beantworten auf „Erledigt“ setzen.',
    group: 'Verwaltung',
    useAsTitle: 'betreff',
    defaultColumns: ['betreff', 'name', 'an', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeValidate: [
      spamSchutz('kontakt'),
      // Nur Anliegen aus der Liste (sonst „Allgemeine Frage“ bzw. das erste Anliegen)
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data
        const v = (await verein(req)) as unknown as { vorstand?: { id?: string; rolle?: string; konto?: number | { id: number } | null }[] } | null
        // Direkt an ein Vorstandsmitglied mit verknüpftem Konto
        const an = String(data.an ?? '')
        if (an.startsWith('vorstand-')) {
          const z = (v?.vorstand ?? []).find((x) => `vorstand-${x.id}` === an)
          const konto = z?.konto && typeof z.konto === 'object' ? z.konto.id : z?.konto
          if (z && konto) {
            req.context.kontaktAnKonto = konto
            data.an = `An: ${z.rolle}`
            return data
          }
        }
        const liste = anliegenListe(v as never).map((a) => a.titel as string)
        if (!liste.includes(an)) data.an = liste.find((a) => a === 'Allgemeine Frage') ?? liste[0]
        return data
      },
    ],
    // Neue Nachricht → per E-Mail an die Empfänger des Anliegens (Antworten gehen direkt an den Absender)
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const liste = anliegenListe(await verein(req))
        const treffer = liste.find((a) => a.titel === doc.an)
        const allgemein = liste.find((a) => a.titel === 'Allgemeine Frage') ?? liste[0]
        // Direkt an ein Vorstandsmitglied: E-Mail aus dem verknüpften Konto (bleibt für Besucher unsichtbar)
        const kontoId = req.context.kontaktAnKonto as number | undefined
        const person = kontoId ? ((await req.payload.findByID({ collection: 'users', id: kontoId, depth: 0, overrideAccess: true }).catch(() => null)) as { email?: string } | null) : null
        const an = person?.email ? [person.email] : adressen(treffer?.empfaenger).length ? adressen(treffer?.empfaenger) : adressen(allgemein?.empfaenger)
        if (!an.length) return doc
        const einzeilig = (x: unknown) => String(x ?? '').replace(/[\r\n]+/g, ' ').slice(0, 200)
        const link = `${getServerSideURL()}/admin/collections/kontaktanfragen/${doc.id}`
        const absaetze = [`Anliegen: ${einzeilig(doc.an)}`, `Von: ${einzeilig(doc.name)} <${einzeilig(doc.email)}>`, `Betreff: ${einzeilig(doc.betreff)}`, String(doc.nachricht ?? '')]
        const fuss = 'Einfach auf diese E-Mail antworten – die Antwort geht direkt an den Absender. Danach in der Verwaltung auf „Erledigt“ setzen.'
        try {
          await req.payload.sendEmail({
            to: an,
            replyTo: einzeilig(doc.email),
            subject: `Kontaktformular: ${einzeilig(doc.betreff)} (${einzeilig(doc.an)})`,
            text: `${absaetze.join('\n\n')}\n\nIn der Verwaltung: ${link}\n\n${fuss}`,
            html: mailHtml({ titel: 'Neue Nachricht über die Website', absaetze, knopf: 'In der Verwaltung öffnen', link, fuss }),
          })
        } catch (e) {
          req.payload.logger.error({ err: e }, 'Kontakt-Benachrichtigung fehlgeschlagen')
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'neu',
      options: [
        { label: 'Neu', value: 'neu' },
        { label: 'In Bearbeitung', value: 'bearbeitung' },
        { label: 'Erledigt', value: 'erledigt' },
      ],
      admin: {
        position: 'sidebar',
        components: statusPille({ neu: { text: '🆕 Neu', klasse: 'neu' }, bearbeitung: { text: '⏳ In Bearbeitung', klasse: 'warten' }, erledigt: { text: '✓ Erledigt', klasse: 'ok' } }),
      },
      access: { create: () => false },
    },
    { name: 'an', label: 'Anliegen', type: 'text', admin: { description: 'Was im Formular bei „Worum geht es?“ gewählt wurde. Die Auswahl pflegst du unter Vereinsdaten → „Kontaktformular: Worum geht es?“.' } },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120 },
        { name: 'email', label: 'E-Mail', type: 'email', required: true },
      ],
    },
    { name: 'betreff', label: 'Betreff', type: 'text', required: true, maxLength: 200 },
    { name: 'nachricht', label: 'Nachricht', type: 'textarea', required: true, maxLength: 5000 },
    { name: 'datenschutz', label: 'Datenschutzhinweise gelesen', type: 'checkbox', required: true },
  ],
  timestamps: true,
}
