import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, Field, FieldAccess, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { istWebAdmin } from '@/access/roles'

/**
 * Geschütztes Konto (Wunsch des Projektinhabers, 27.10.2026):
 * Höchstens EIN Web-Admin kann sein eigenes Konto schützen. Dann kann niemand sonst dieses Konto ändern
 * (Rollen, E-Mail, Passwort, Zwei-Faktor …) oder löschen – auch kein anderer Web-Admin.
 * Bewusst ohne sichtbare Markierung: Den Haken sieht nur die geschützte Person selbst
 * (bzw. jeder Web-Admin auf seinem eigenen Konto, solange noch niemand geschützt ist).
 * Notfall (Person ausgefallen, Zwei-Faktor und Codes verloren): nur mit Server-Zugang – siehe deploy/README.md.
 */
type Konto = { id?: number | string; roles?: string[] | null; kontoGeschuetzt?: boolean | null }

const MELDUNG = 'Dieses Konto kann nur von der Person selbst geändert werden.'

/** Gibt es schon ein geschütztes Konto (außer diesem)? */
async function andereGeschuetzt(req: PayloadRequest, ohne: number | string | undefined): Promise<boolean> {
  const r = await req.payload.count({
    collection: 'users',
    where: { and: [{ kontoGeschuetzt: { equals: true } }, ...(ohne != null ? [{ id: { not_equals: ohne } }] : [])] },
    overrideAccess: true,
    req,
  })
  return r.totalDocs > 0
}

/** Sichtbar und änderbar nur auf dem eigenen Konto eines Web-Admins – und nur, wenn kein anderes Konto geschützt ist */
const nurEigenes: FieldAccess = async ({ req, doc, id }) => {
  const ich = req.user as Konto | null
  if (!ich || !istWebAdmin(ich)) return false
  const docId = (doc as Konto | undefined)?.id ?? id
  if (docId == null || String(docId) !== String(ich.id)) return false
  if ((doc as Konto | undefined)?.kontoGeschuetzt) return true
  return !(await andereGeschuetzt(req, ich.id))
}

export const kontoGeschuetztFeld: Field = {
  name: 'kontoGeschuetzt',
  label: 'Mein Konto schützen',
  type: 'checkbox',
  defaultValue: false,
  index: true,
  access: { read: nurEigenes, update: nurEigenes, create: () => false },
  admin: {
    position: 'sidebar',
    description:
      'Nur für dich sichtbar. Mit Haken kann niemand sonst – auch kein anderer Web-Admin – dein Konto ändern, herabstufen oder löschen. Es kann nur ein Konto geschützt sein. Verlierst du Passwort, Handy und Wiederherstellungscodes, hilft nur noch jemand mit Server-Zugang.',
  },
}

export const kontoSchutz: CollectionBeforeChangeHook = async ({ req, data, originalDoc, operation }) => {
  const ich = req.user as Konto | null
  const vorher = (originalDoc ?? {}) as Konto

  if (operation === 'create') {
    data.kontoGeschuetzt = false
    return data
  }

  // Geschütztes Konto: nur die Person selbst darf etwas ändern (interne Vorgänge ohne angemeldete Person laufen weiter)
  if (vorher.kontoGeschuetzt && ich && String(ich.id) !== String(vorher.id)) throw new APIError(MELDUNG, 403)

  const neu = data.kontoGeschuetzt
  if (neu === true && !vorher.kontoGeschuetzt) {
    if (!ich || String(ich.id) !== String(vorher.id) || !istWebAdmin(ich) || (await andereGeschuetzt(req, vorher.id)))
      throw new APIError('Das ist nicht möglich.', 403)
  }

  // Solange geschützt: Web-Admin-Rolle nicht versehentlich selbst abgeben
  const bleibtGeschuetzt = neu === undefined ? Boolean(vorher.kontoGeschuetzt) : neu === true
  if (bleibtGeschuetzt && Array.isArray(data.roles) && !(data.roles as string[]).includes('webadmin'))
    throw new APIError('Dein Konto ist geschützt. Bitte zuerst den Haken „Mein Konto schützen“ entfernen.', 400)

  return data
}

export const kontoLoeschSchutz: CollectionBeforeDeleteHook = async ({ req, id }) => {
  const ziel = (await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req }).catch(() => null)) as Konto | null
  if (!ziel?.kontoGeschuetzt) return
  const ich = req.user as Konto | null
  if (ich && String(ich.id) === String(id)) throw new APIError('Dein Konto ist geschützt. Bitte zuerst den Haken „Mein Konto schützen“ entfernen.', 400)
  throw new APIError(MELDUNG, 403)
}
