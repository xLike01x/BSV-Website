import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Teams, Kurse, Ausfälle und Vereinsdaten tauchen auf vielen Seiten auf (Menü,
 * Startseite, Bereichsseiten). Nach einer Änderung wird daher die ganze Website
 * neu aufgebaut – bei einer Vereinsseite dauert das nur Sekundenbruchteile.
 */
const alles = (context: Record<string, unknown>) => {
  // Massenänderungen (Datenschutz-Aufräumen, Bilder zuordnen, Testkonten) setzen „ohneRevalidierung“ – sonst würde
  // die ganze Website für jeden einzelnen Eintrag neu aufgebaut (Seiten aktualisieren sich ohnehin spätestens nach 60 s)
  if (context.disableRevalidate || context.ohneRevalidierung) return
  try {
    revalidatePath('/', 'layout')
    // Sitemap enthält Teams & Kurse und Alben
    revalidateTag('pages-sitemap', 'max')
  } catch {
    // Außerhalb von Next.js (z. B. Import-Skript) gibt es nichts neu aufzubauen
  }
}

export const revalidateAllesNachAenderung: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  alles(context)
  return doc
}
export const revalidateAllesNachLoeschen: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  alles(context)
  return doc
}
export const revalidateAllesGlobal: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  alles(context)
  return doc
}
