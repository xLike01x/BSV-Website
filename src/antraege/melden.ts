import type { CollectionAfterChangeHook } from 'payload'

import { rollenBenachrichtigen } from '@/sport/teamMail'
import { MITGLIEDSART_LABEL } from './texte'

/** Neuer Mitgliedsantrag → kurze Mail an die Kasse (ohne Namen und Bankdaten – die stehen nur in der Verwaltung) */
export const neuerAntragMelden: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const art = MITGLIEDSART_LABEL[String(doc.mitgliedsart ?? '')] ?? 'Mitgliedschaft'
  await rollenBenachrichtigen(req, {
    rollen: ['kasse'],
    betreff: 'Neuer Mitgliedsantrag über die Website',
    titel: 'Neuer Mitgliedsantrag',
    absaetze: [`über die Website ist ein neuer Mitgliedsantrag eingegangen (${art}).`, 'Alle Angaben findest du in der Verwaltung unter Posteingang → Mitgliedsanträge. Dort kannst du den Antrag prüfen und mit einem Klick aufnehmen, nachfragen oder ablehnen.'],
    pfad: `/admin/collections/mitgliedsantraege/${doc.id}`,
    grund: 'du die Rolle „Kasse“ hast',
  }).catch((e) => req.payload.logger.error({ err: e }, 'Benachrichtigung neuer Mitgliedsantrag fehlgeschlagen'))
  return doc
}
