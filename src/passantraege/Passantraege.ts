import type { Access, CollectionConfig, Field, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { ausblendenAusser, istMitgliedOderMehr } from '@/access/roles'

import { istBearbeiter, istPassVerwaltung, passLesen, passTeams } from './zugriff'
import { teamBenachrichtigen } from '@/sport/teamMail'

/** Unterlagen-Felder im Antrag: Feldname = Art der Unterlage */
export const UNTERLAGEN = [
  { feld: 'passantrag', label: 'Passantrag (unterschrieben)', hinweis: 'Ausgefüllt und unterschrieben – bei Minderjährigen zusätzlich von den Erziehungsberechtigten. Foto oder Scan genügt.' },
  { feld: 'ausweis', label: 'Ausweis, Reisepass oder Geburtsurkunde', hinweis: 'Kopie zum Nachweis von Identität und Geburtsdatum.' },
  { feld: 'passfoto', label: 'Passfoto', hinweis: 'Aktuelles Foto für das Spielerprofil im DFBnet (Gesicht gut erkennbar, heller Hintergrund).' },
  { feld: 'einwilligung', label: 'Einverständniserklärungen', hinweis: 'Unterschriebene Datenschutz- und Foto-Erklärung (z. B. für FUSSBALL.DE).' },
  { feld: 'abmeldung', label: 'Abmeldung beim bisherigen Verein', hinweis: 'Nachweis der fristgerechten Abmeldung – nur bei Vereinswechsel.' },
  { feld: 'meldebescheinigung', label: 'Meldebescheinigung der Familie', hinweis: 'Nur bei internationalem Wechsel von Jugendlichen.' },
] as const
export type UnterlageFeld = (typeof UNTERLAGEN)[number]['feld']

export const STATUS = [
  { label: 'Eingereicht – wartet auf Prüfung', value: 'eingereicht' },
  { label: 'In Prüfung', value: 'pruefung' },
  { label: 'Unterlagen fehlen', value: 'unterlagen_fehlen' },
  { label: 'Beim Verband (DFBnet)', value: 'verband' },
  { label: 'Spielerlaubnis erteilt', value: 'erteilt' },
  { label: 'Abgelehnt / zurückgezogen', value: 'abgelehnt' },
]
/** Solange darf die antragstellende Person selbst noch ändern bzw. nachreichen */
export const BEARBEITBAR = ['eingereicht', 'unterlagen_fehlen']
const ABGESCHLOSSEN = ['erteilt', 'abgelehnt']

const alter = (geburtsdatum?: string | null) => {
  if (!geburtsdatum) return 99
  const g = new Date(geburtsdatum)
  const h = new Date()
  let a = h.getFullYear() - g.getFullYear()
  if (h.getMonth() < g.getMonth() || (h.getMonth() === g.getMonth() && h.getDate() < g.getDate())) a--
  return a
}

/** Welche Unterlagen sind für diesen Antrag Pflicht? */
export const pflichtUnterlagen = (art?: string | null, geburtsdatum?: string | null): UnterlageFeld[] => {
  const p: UnterlageFeld[] = ['passantrag', 'ausweis', 'passfoto', 'einwilligung']
  if (art === 'wechsel') p.push('abmeldung')
  if (art === 'international' && alter(geburtsdatum) < 18) p.push('meldebescheinigung')
  return p
}

const id = (v: unknown): number | null => (v && typeof v === 'object' ? ((v as { id?: number }).id ?? null) : typeof v === 'number' ? v : v ? Number(v) : null)

const bearbeiten: Access = async ({ req }) => {
  const user = req.user as { id: number } | null
  if (!user || !istMitgliedOderMehr(user)) return false
  if (istPassVerwaltung(user)) return true
  const eigene: Where = { and: [{ antragsteller: { equals: user.id } }, { status: { in: BEARBEITBAR } }] }
  const teams = await passTeams(req)
  return teams.length ? ({ or: [eigene, { team: { in: teams } }] } as Where) : eigene
}

const nurBearbeiterLesen = async ({ req, doc }: { req: PayloadRequest; doc?: Record<string, unknown> }) => istBearbeiter(req, id(doc?.team))

const unterlagenFelder: Field[] = UNTERLAGEN.map((u) => ({
  name: u.feld,
  label: u.label,
  type: 'upload',
  relationTo: 'passdokumente',
  admin: { description: u.hinweis },
}))

export const Passantraege: CollectionConfig = {
  slug: 'passantraege',
  labels: { singular: 'Passantrag', plural: 'Passanträge' },
  access: {
    read: passLesen('team', 'antragsteller'),
    create: ({ req }) => istMitgliedOderMehr(req.user),
    update: bearbeiten,
    delete: async ({ req }) => {
      const user = req.user as { id: number } | null
      if (!user) return false
      if (istPassVerwaltung(user)) return true
      // Eigenen Antrag zurückziehen, solange er noch nicht geprüft wird
      return { and: [{ antragsteller: { equals: user.id } }, { status: { equals: 'eingereicht' } }] } as Where
    },
  },
  admin: {
    group: 'Sport',
    hidden: ausblendenAusser('admin', 'passwesen', 'uebungsleitung'),
    useAsTitle: 'spielerName',
    defaultColumns: ['spielerName', 'team', 'art', 'status', 'createdAt'],
    components: { beforeList: ['@/components/Admin/Einstieg'] },
    description: 'Anträge auf Spielerlaubnis (Spielerpass) aus dem Mitgliederbereich. Unterlagen prüfen, fehlende nachfordern, im DFBnet einreichen und den Status setzen.',
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data) data.spielerName = [data.spielerVorname, data.spielerNachname].filter(Boolean).join(' ').trim()
        return data
      },
    ],
    beforeChange: [
      async ({ req, data, operation, originalDoc }) => {
        const user = req.user as { id: number } | null
        const teamId = id(data.team ?? originalDoc?.team)
        const bearbeiter = user ? await istBearbeiter(req, teamId) : true

        // Nur Fußball-Teams
        if (teamId) {
          const team = await req.payload.findByID({ collection: 'angebote', id: teamId, depth: 0, overrideAccess: true, req }).catch(() => null)
          if (!team || team.bereich !== 'fussball') throw new APIError('Bitte ein Fußball-Team auswählen.', 400)
        }

        if (operation === 'create') {
          if (user) data.antragsteller = user.id
          if (!bearbeiter || !data.status) data.status = 'eingereicht'
        } else if (originalDoc) {
          // Wer den Antrag gestellt hat, ändert sich nie
          data.antragsteller = id(originalDoc.antragsteller)
        }
        // Verlaufs-Felder setzt nur die Website selbst
        data.nachgereichtAm = originalDoc?.nachgereichtAm ?? null
        data.unterlagenGeloeschtAm = originalDoc?.unterlagenGeloeschtAm ?? null
        const antragsteller = id(data.antragsteller)

        // Jede angehängte Datei muss frei sein (oder schon zu diesem Antrag gehören)
        // und von der antragstellenden oder der bearbeitenden Person hochgeladen worden sein
        if (user) {
          for (const u of UNTERLAGEN) {
            const dok = id(data[u.feld])
            if (!dok || dok === id(originalDoc?.[u.feld])) continue
            const d = await req.payload.findByID({ collection: 'passdokumente', id: dok, depth: 0, overrideAccess: true, req }).catch(() => null)
            const frei = d && (!d.antrag || id(d.antrag) === id(originalDoc?.id))
            const vonWem = d && [antragsteller, user.id].includes(id(d.hochgeladenVon))
            if (!frei || !vonWem) throw new APIError('Eine der Unterlagen gehört nicht zu diesem Antrag. Bitte neu hochladen.', 400)
          }
        }

        if (!bearbeiter && user) {
          // Antragsteller: Status, Hinweise und Notizen bestimmt die Verwaltung
          if (operation === 'update' && originalDoc) {
            data.status = originalDoc.status === 'unterlagen_fehlen' ? 'eingereicht' : originalDoc.status
            data.hinweis = originalDoc.hinweis
            data.notiz = originalDoc.notiz
            if (originalDoc.status === 'unterlagen_fehlen') data.nachgereichtAm = new Date().toISOString()
          } else {
            data.hinweis = null
            data.notiz = null
          }
          // Pflicht-Unterlagen vorhanden und wirklich eigene?
          const fehlen = pflichtUnterlagen(data.art, data.geburtsdatum).filter((f) => !id(data[f]))
          if (fehlen.length) {
            const namen = UNTERLAGEN.filter((u) => fehlen.includes(u.feld)).map((u) => u.label)
            throw new APIError(`Bitte noch hochladen: ${namen.join(', ')}.`, 400)
          }
          if (!data.bestaetigt) throw new APIError('Bitte bestätige, dass die Angaben stimmen.', 400)
        }

        // Abschluss merken (für die automatische Löschung der Unterlagen)
        const status = data.status ?? originalDoc?.status
        if (ABGESCHLOSSEN.includes(status) && !ABGESCHLOSSEN.includes(originalDoc?.status)) data.abgeschlossenAm = new Date().toISOString()
        if (!ABGESCHLOSSEN.includes(status)) {
          data.abgeschlossenAm = null
          data.unterlagenGeloeschtAm = null // wieder geöffnet → Fristen laufen neu
        }
        return data
      },
    ],
    afterChange: [
      // Neuer Antrag → Mail an die Trainer des Teams und an „Passwesen“ (ohne Unterlagen, nur Hinweis)
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        const team = id(doc.team)
        if (!team) return doc
        const t = (await req.payload.findByID({ collection: 'angebote', id: team, depth: 0, overrideAccess: true, req }).catch(() => null)) as { title?: string } | null
        await teamBenachrichtigen(req, {
          angebotId: team,
          schalterKey: 'passantraege',
          zusatzRollen: ['passwesen'],
          betreff: `Neuer Passantrag: ${t?.title ?? 'Team'}`,
          titel: 'Neuer Passantrag',
          absaetze: [`für „${t?.title ?? 'ein Team'}“ wurde ein neuer Passantrag eingereicht.`, 'Die Unterlagen findest du in der Verwaltung unter „Passanträge“. Bitte prüfen und den Status setzen.'],
          pfad: `/admin/collections/passantraege/${doc.id}`,
        }).catch((e) => req.payload.logger.error({ err: e }, 'Passantrag-Benachrichtigung fehlgeschlagen'))
        return doc
      },
      // Unterlagen diesem Antrag und Team zuordnen; ersetzte Dateien löschen
      async ({ doc, previousDoc, req }) => {
        const team = id(doc.team)
        const jetzt: number[] = []
        for (const u of UNTERLAGEN) {
          const dok = id(doc[u.feld])
          if (!dok) continue
          jetzt.push(dok)
          // Art kommt vom Feld (nicht vom Hochladenden) – wichtig für die Aufbewahrungsfristen
          await req.payload.update({
            collection: 'passdokumente',
            where: { and: [{ id: { equals: dok } }, { or: [{ antrag: { exists: false } }, { antrag: { equals: doc.id } }] }] },
            data: { antrag: doc.id, team, art: u.feld } as never,
            overrideAccess: true,
            req,
          })
        }
        const vorher = UNTERLAGEN.map((u) => id(previousDoc?.[u.feld])).filter((x): x is number => Boolean(x) && !jetzt.includes(x as number))
        if (vorher.length)
          await req.payload.delete({ collection: 'passdokumente', where: { and: [{ id: { in: vorher } }, { antrag: { equals: doc.id } }] }, overrideAccess: true, req })
        return doc
      },
    ],
    beforeDelete: [
      async ({ id: antragId, req }) => {
        await req.payload.delete({ collection: 'passdokumente', where: { antrag: { equals: antragId } }, overrideAccess: true, req }).catch(() => {})
      },
    ],
  },
  fields: [
    { name: 'spielerName', label: 'Spieler/in', type: 'text', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'status', label: 'Status', type: 'select', options: STATUS, defaultValue: 'eingereicht', required: true, index: true, admin: { width: '50%' } },
        {
          name: 'team',
          label: 'Team',
          type: 'relationship',
          relationTo: 'angebote',
          required: true,
          index: true,
          filterOptions: { bereich: { equals: 'fussball' } },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'hinweis',
      label: 'Hinweis an die antragstellende Person',
      type: 'textarea',
      admin: { description: 'Sieht die Person im Mitgliederbereich – z. B. „Bitte die Geburtsurkunde nachreichen“. Bei fehlenden Unterlagen den Status auf „Unterlagen fehlen“ setzen.' },
    },
    { name: 'notiz', label: 'Interne Notiz', type: 'textarea', access: { read: nurBearbeiterLesen as never }, admin: { description: 'Nur für die Verwaltung sichtbar, z. B. DFBnet-Vorgangsnummer.' } },
    {
      type: 'collapsible',
      label: 'Spieler/in',
      fields: [
        {
          name: 'fuer',
          label: 'Antrag für',
          type: 'radio',
          defaultValue: 'selbst',
          options: [
            { label: 'Mich selbst', value: 'selbst' },
            { label: 'Mein Kind', value: 'kind' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'spielerVorname', label: 'Vorname', type: 'text', required: true, maxLength: 80 },
            { name: 'spielerNachname', label: 'Nachname', type: 'text', required: true, maxLength: 80 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
            { name: 'staatsangehoerigkeit', label: 'Staatsangehörigkeit', type: 'text', maxLength: 60, defaultValue: 'deutsch' },
          ],
        },
        { name: 'erziehungsberechtigte', label: 'Erziehungsberechtigte (bei Minderjährigen)', type: 'text', maxLength: 160 },
      ],
    },
    {
      type: 'collapsible',
      label: 'Art des Antrags',
      fields: [
        {
          name: 'art',
          label: 'Art',
          type: 'radio',
          required: true,
          defaultValue: 'neu',
          options: [
            { label: 'Erster Spielerpass (bisher in keinem Verein gespielt)', value: 'neu' },
            { label: 'Vereinswechsel (innerhalb Deutschlands)', value: 'wechsel' },
            { label: 'Wechsel aus dem Ausland / internationale Freigabe', value: 'international' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'bisherigerVerein', label: 'Bisheriger Verein', type: 'text', maxLength: 120, admin: { condition: (d) => d?.art !== 'neu' } },
            { name: 'abmeldedatum', label: 'Abgemeldet am', type: 'date', admin: { condition: (d) => d?.art !== 'neu', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
          ],
        },
      ],
    },
    { type: 'collapsible', label: 'Unterlagen', fields: unterlagenFelder },
    { name: 'bestaetigt', label: 'Angaben sind richtig und vollständig', type: 'checkbox' },
    {
      type: 'collapsible',
      label: 'Verlauf',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'antragsteller', label: 'Gestellt von', type: 'relationship', relationTo: 'users', index: true, admin: { readOnly: true } },
        { name: 'nachgereichtAm', label: 'Unterlagen nachgereicht am', type: 'date', admin: { readOnly: true, date: { displayFormat: 'dd.MM.yyyy HH:mm' } } },
        { name: 'abgeschlossenAm', label: 'Abgeschlossen am', type: 'date', index: true, admin: { readOnly: true, date: { displayFormat: 'dd.MM.yyyy' } } },
        {
          name: 'unterlagenGeloeschtAm',
          label: 'Unterlagen gelöscht am',
          type: 'date',
          admin: { readOnly: true, date: { displayFormat: 'dd.MM.yyyy' }, description: 'Ausweis, Foto usw. werden nach Abschluss automatisch gelöscht; der unterschriebene Passantrag bleibt 2 Jahre (Fristen unter „Datenschutz-Fristen“).' },
        },
      ],
    },
  ],
  timestamps: true,
}
