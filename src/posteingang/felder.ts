import type { CollectionAfterOperationHook, CollectionBeforeChangeHook, Field, FieldAccess } from 'payload'

import { hasRole } from '@/access/roles'

/** Bereiche im Posteingang mit „Wer kümmert sich?“, Notizen-Verlauf und „Antworten“ */
export const POSTEINGANG = ['mitgliedsantraege', 'kontaktanfragen', 'probetraining'] as const
export type PosteingangSlug = (typeof POSTEINGANG)[number]

/**
 * Nur über die eigenen Endpunkte änderbar (setzen req.context.bsvPosteingang) – nie über das öffentliche Formular
 * oder ein normales Speichern. So kann niemand Notizen anderer umschreiben oder sich als jemand anderes eintragen.
 */
export const nurUeberEndpunkt: FieldAccess = ({ req }) => req.context?.bsvPosteingang === true

/** Zuständige Person: Admins wählen frei, alle anderen über „Ich kümmere mich“ (Endpunkt) */
const zustaendigAendern: FieldAccess = ({ req }) => req.context?.bsvPosteingang === true || hasRole(req.user as never, 'admin')

export function posteingangFelder(): Field[] {
  return [
    {
      name: 'posteingang',
      type: 'ui',
      admin: { components: { Field: '@/posteingang/Kopf' } },
    },
    {
      name: 'zustaendig',
      label: 'Zuständig',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { create: () => false, update: zustaendigAendern },
      admin: {
        position: 'sidebar',
        // Nicht-Admins sehen den Namen oben im Kasten „Wer kümmert sich?“ – die Auswahl ist nur für Admins
        condition: (_d, _s, { user }) => hasRole(user as never, 'admin'),
        description: 'Wer sich um diesen Eintrag kümmert. Jede/r kann sich oben mit „Ich kümmere mich“ selbst eintragen.',
        components: { Cell: '@/posteingang/ZustaendigZelle' },
      },
      // Nur Konten mit Verwaltungsrechten – auch Mitglieder mit passendem Zusatzrecht
      filterOptions: {
        or: [
          { roles: { in: ['admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion'] } },
          { 'zusatzrechte.kontaktanfragen': { equals: true } },
          { 'zusatzrechte.probetraining': { equals: true } },
        ],
      },
    },
    {
      // Name zum Zeitpunkt der Zuweisung – so sieht ihn auch, wer andere Konten nicht öffnen darf (z. B. Kasse)
      name: 'zustaendigName',
      type: 'text',
      access: { create: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'verlauf',
      label: 'Notizen',
      type: 'array',
      access: { create: () => false, update: nurUeberEndpunkt },
      admin: { hidden: true },
      fields: [
        { name: 'text', type: 'textarea', required: true, maxLength: 2000 },
        { name: 'von', type: 'relationship', relationTo: 'users' },
        { name: 'vonName', type: 'text' },
        { name: 'am', type: 'date', required: true },
        // „notiz“ = von Hand geschrieben, „status“ = automatisch (Status geändert, exportiert …)
        { name: 'art', type: 'select', defaultValue: 'notiz', options: ['notiz', 'status'].map((v) => ({ label: v, value: v })) },
      ],
    },
  ]
}

/** Name der zuständigen Person mitschreiben, wenn sich die Zuständigkeit ändert */
export const zustaendigNameSetzen: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data || !('zustaendig' in data)) return data
  const id = data.zustaendig && typeof data.zustaendig === 'object' ? (data.zustaendig as { id: number }).id : data.zustaendig
  const vorher = originalDoc?.zustaendig && typeof originalDoc.zustaendig === 'object' ? originalDoc.zustaendig.id : originalDoc?.zustaendig
  if (id === vorher && originalDoc?.zustaendigName) return data
  if (!id) data.zustaendigName = null
  else {
    const u = (await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req, select: { name: true, email: true } }).catch(() => null)) as { name?: string; email?: string } | null
    data.zustaendigName = u ? u.name || u.email?.split('@')[0] || null : null
  }
  // Über das normale Speichern (nur Admins) geändert → im Verlauf festhalten; über „Ich kümmere mich“ schreibt der Endpunkt selbst
  if (originalDoc && id !== vorher && !req.context?.bsvPosteingang) {
    data.verlauf = [...verlaufBasis(data, originalDoc), eintragVon(req, `Zuständig: ${data.zustaendigName ?? 'niemand'} (von Hand gesetzt)`)].slice(-200)
  }
  return data
}

const verlaufBasis = (data: Record<string, unknown>, originalDoc: Record<string, unknown>) =>
  (Array.isArray(data.verlauf) ? data.verlauf : Array.isArray(originalDoc.verlauf) ? originalDoc.verlauf : []) as unknown[]

const eintragVon = (req: { user?: unknown }, text: string) => {
  const u = req.user as { id?: number; name?: string | null; email?: string } | null
  return { text, von: u?.id ?? null, vonName: u ? u.name || u.email?.split('@')[0] || 'Unbekannt' : 'Automatisch', am: new Date().toISOString(), art: 'status' }
}

/** Geänderte E-Mail-Adresse festhalten (Antwort-Mails gehen an diese Adresse) */
export const emailImVerlauf: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !data || !originalDoc || typeof data.email !== 'string' || !originalDoc.email) return data
  if (data.email.trim().toLowerCase() === String(originalDoc.email).trim().toLowerCase()) return data
  data.verlauf = [...verlaufBasis(data, originalDoc), eintragVon(req, `E-Mail-Adresse geändert: ${originalDoc.email} → ${data.email}`)].slice(-200)
  return data
}

/** Statuswechsel automatisch im Verlauf festhalten (wer, wann, von → nach) */
export const statusImVerlauf =
  (labels: Record<string, string>): CollectionBeforeChangeHook =>
  ({ data, originalDoc, operation, req }) => {
    if (operation !== 'update' || !data || !originalDoc || !data.status || data.status === originalDoc.status) return data
    data.verlauf = [...verlaufBasis(data, originalDoc), eintragVon(req, `Status: ${labels[originalDoc.status] ?? originalDoc.status ?? '–'} → ${labels[data.status] ?? data.status}`)].slice(-200)
    return data
  }

/**
 * Öffentliches Formular (ohne Anmeldung): Antwort nur mit der ID – die Daten (z. B. die IBAN) gehen nicht zurück
 * in den Browser und landen so nicht in Browser- oder Proxy-Protokollen.
 */
export const oeffentlichKnapp: CollectionAfterOperationHook = ({ operation, result, req }) => {
  if (operation === 'create' && !req.user && result && typeof result === 'object' && 'id' in result) return { id: (result as { id: number }).id } as never
  return result
}
