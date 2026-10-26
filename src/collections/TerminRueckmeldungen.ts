import type { Access, CollectionConfig, Endpoint, PayloadRequest } from 'payload'

import { hasRole, istMitgliedOderMehr, rolleOderRecht } from '@/access/roles'
import { hatRecht } from '@/access/einzelrechte'
import { berlinTag } from '@/bsv/wiederholung'

/**
 * Zu- und Absagen von Mitgliedern zu einem Termin (Haken „Zu-/Absage im Mitgliederbereich“ am Termin).
 *
 * - Mitglieder antworten ausschließlich über POST /api/termin-rueckmeldungen/antworten: Der Endpunkt nimmt das Konto
 *   aus der Anmeldung (nie aus der Anfrage), prüft Termin, Anmeldeschluss und Begleitung und legt pro Person und Termin
 *   genau einen Eintrag an bzw. ändert ihn.
 * - Lesen: Mitglieder nur ihre eigenen Antworten; die Liste sehen Admin, Redaktion und wer das Recht „Termine“ hat
 *   („Nur ansehen“ mit Haken „Benutzerkonten“, siehe nurAnsehen.ts).
 * - Anlegen/Ändern/Löschen über die normale Schnittstelle nur für die Verwaltung.
 * - Der Name wird beim Antworten mitgespeichert, damit die Liste ohne Zugriff auf die Benutzerkonten auskommt.
 * - Automatisch gelöscht X Tage nach dem Termin (Datenschutz-Fristen, Standard 30) – siehe rueckmeldungenAufraeumen.
 */

const verwaltung = (user: unknown) => hasRole(user as never, 'admin', 'redaktion') || hatRecht(user, 'termine')

const lesen: Access = ({ req }) => {
  if (verwaltung(req.user)) return true
  if (req.user && istMitgliedOderMehr(req.user)) return { mitglied: { equals: req.user.id } }
  return false
}

export const BEMERKUNG_MAX = 300

/** Bis wann darf geantwortet werden? Anmeldeschluss (ganzer Tag, Berliner Zeit) – sonst bis zum Beginn. */
export const antwortMoeglich = (t: { beginn: string; anmeldeschluss?: string | null }, jetzt = Date.now()): boolean => {
  if (new Date(t.beginn).getTime() <= jetzt) return false
  if (!t.anmeldeschluss) return true
  return berlinTag(new Date(jetzt)) <= berlinTag(new Date(t.anmeldeschluss))
}

type Termin = { id: number; title: string; beginn: string; anmeldung?: boolean | null; anmeldeschluss?: string | null; begleitung?: boolean | null; wiederholung?: string | null }

const fehler = (text: string, status = 400) => Response.json({ fehler: text }, { status })

const antwortenEndpunkt: Endpoint = {
  path: '/antworten',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const user = req.user as (typeof req.user & { _wartetAufFreigabe?: boolean; name?: string | null }) | null
    if (!user) return fehler('Bitte anmelden.', 401)
    if (user._wartetAufFreigabe || !istMitgliedOderMehr(user)) return fehler('Zu- und Absagen sind erst nach der Freischaltung durch die Verwaltung möglich.', 403)

    const body = (await req.json?.().catch(() => null)) as { termin?: unknown; teilnahme?: unknown; personen?: unknown; bemerkung?: unknown } | null
    const terminId = Number(body?.termin)
    if (!Number.isInteger(terminId) || terminId <= 0) return fehler('Termin fehlt.')
    const teilnahme: 'ja' | 'nein' | null = body?.teilnahme === 'ja' ? 'ja' : body?.teilnahme === 'nein' ? 'nein' : null
    if (!teilnahme) return fehler('Bitte „Ich komme“ oder „Ich komme nicht“ wählen.')
    const bemerkung = typeof body?.bemerkung === 'string' ? body.bemerkung.trim() : ''
    if (bemerkung.length > BEMERKUNG_MAX) return fehler(`Die Bemerkung darf höchstens ${BEMERKUNG_MAX} Zeichen haben.`)

    // Termin mit den Rechten des Mitglieds laden – was es nicht sehen darf, gibt es für diese Anfrage nicht
    const termin = (await req.payload.findByID({ collection: 'termine', id: terminId, depth: 0, overrideAccess: false, user, req }).catch(() => null)) as Termin | null
    if (!termin || !termin.anmeldung || (termin.wiederholung && termin.wiederholung !== 'keine')) return fehler('Für diesen Termin gibt es keine Zu-/Absage.', 404)
    if (!antwortMoeglich(termin)) return fehler('Der Anmeldeschluss ist vorbei – deine Antwort lässt sich nicht mehr ändern.', 409)

    const gewuenscht = Number(body?.personen)
    const personen = teilnahme === 'nein' ? 0 : termin.begleitung && gewuenscht === 2 ? 2 : 1
    const daten = { termin: termin.id, mitglied: user.id, name: (user.name ?? '').slice(0, 120) || 'Ohne Namen', teilnahme, personen, bemerkung }

    const vorhanden = await req.payload.find({
      collection: 'termin-rueckmeldungen',
      where: { and: [{ termin: { equals: termin.id } }, { mitglied: { equals: user.id } }] },
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
    })
    try {
      const doc = vorhanden.docs[0]
        ? await req.payload.update({ collection: 'termin-rueckmeldungen', id: vorhanden.docs[0].id, data: daten, overrideAccess: true, req })
        : await req.payload.create({ collection: 'termin-rueckmeldungen', data: daten, overrideAccess: true, req })
      return Response.json({ ok: true, teilnahme: doc.teilnahme, personen: doc.personen, bemerkung: doc.bemerkung ?? '' })
    } catch {
      // z. B. zweimal gleichzeitig abgeschickt: der eindeutige Index verhindert doppelte Einträge
      return fehler('Das hat nicht geklappt – bitte noch einmal versuchen.', 409)
    }
  },
}

export const TerminRueckmeldungen: CollectionConfig = {
  slug: 'termin-rueckmeldungen',
  labels: { singular: 'Zu-/Absage', plural: 'Zu- und Absagen' },
  access: {
    read: lesen,
    create: rolleOderRecht('termine', 'admin', 'redaktion'),
    update: rolleOderRecht('termine', 'admin', 'redaktion'),
    delete: rolleOderRecht('termine', 'admin', 'redaktion'),
  },
  admin: {
    // Die Liste steht direkt im Termin – kein eigener Menüpunkt
    hidden: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'teilnahme', 'personen', 'bemerkung', 'updatedAt'],
  },
  defaultSort: 'name',
  // Pro Person und Termin genau eine Antwort
  indexes: [{ fields: ['termin', 'mitglied'], unique: true }],
  endpoints: [antwortenEndpunkt],
  fields: [
    { name: 'termin', label: 'Termin', type: 'relationship', relationTo: 'termine', index: true },
    { name: 'mitglied', label: 'Mitglied', type: 'relationship', relationTo: 'users', index: true },
    { name: 'name', label: 'Name', type: 'text', maxLength: 120 },
    {
      name: 'teilnahme',
      label: 'Antwort',
      type: 'select',
      required: true,
      options: [
        { label: 'Ich komme', value: 'ja' },
        { label: 'Ich komme nicht', value: 'nein' },
      ],
    },
    { name: 'personen', label: 'Personen', type: 'number', min: 0, max: 2, defaultValue: 1 },
    { name: 'bemerkung', label: 'Bemerkung', type: 'text', maxLength: BEMERKUNG_MAX },
  ],
}
