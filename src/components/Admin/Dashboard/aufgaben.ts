import type { PayloadRequest } from 'payload'

import { faellige } from '@/datenschutz/aufraeumen'
import { sicherungenAuflisten } from '@/sicherung/kern'

export type Aufgabe = { key: string; art: 'warn' | 'info'; symbol: string; text: string; href: string; link: string }

/** Hinweise oben auf dem Dashboard – nur, wenn wirklich etwas zu tun ist */
export async function aufgabenFuer(req: PayloadRequest, rollen: string[]): Promise<Aufgabe[]> {
  const a: Aufgabe[] = []
  const admin = rollen.includes('admin')

  if (rollen.includes('webadmin')) {
    const letzte = sicherungenAuflisten()[0]
    const tage = letzte ? Math.floor((Date.now() - new Date(letzte.erstellt).getTime()) / 86400000) : null
    if (tage === null) a.push({ key: 'sicherung', art: 'warn', symbol: '💾', text: 'Es gibt noch keine Datensicherung.', href: '/admin/sicherung', link: 'Jetzt sichern' })
    else if (tage > 7) a.push({ key: 'sicherung', art: 'warn', symbol: '💾', text: `Die letzte Datensicherung ist ${tage} Tage alt.`, href: '/admin/sicherung', link: 'Jetzt sichern' })
  }
  if (admin) {
    const halbesJahr = new Date(Date.now() - 182 * 86400000).toISOString()
    const vorMonat = new Date(Date.now() - 30 * 86400000).toISOString()
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      overrideAccess: true,
      where: {
        and: [
          { roles: { in: ['webadmin', 'admin', 'redaktion', 'kasse', 'uebungsleitung', 'teamredaktion'] } },
          { testkonto: { not_equals: true } },
          { or: [{ letzteAnmeldung: { less_than: halbesJahr } }, { and: [{ letzteAnmeldung: { exists: false } }, { createdAt: { less_than: vorMonat } }] }] },
        ],
      },
    })
    if (totalDocs)
      a.push({ key: 'zugaenge', art: 'info', symbol: '👥', text: `${totalDocs} ${totalDocs === 1 ? 'Zugang mit Verwaltungsrechten wurde' : 'Zugänge mit Verwaltungsrechten wurden'} seit über 6 Monaten nicht genutzt. Noch nötig?`, href: '/admin/rollen', link: 'Prüfen' })
  }
  if (admin || rollen.includes('kasse')) {
    const wartend = await req.payload.count({ collection: 'users', where: { freigegeben: { equals: false } }, overrideAccess: true }).catch(() => ({ totalDocs: 0 }))
    if (wartend.totalDocs)
      a.push({ key: 'registrierungen', art: 'warn', symbol: '🙋', text: `${wartend.totalDocs} ${wartend.totalDocs === 1 ? 'neue Registrierung wartet' : 'neue Registrierungen warten'} auf Freigabe.`, href: '/admin/registrierungen', link: 'Ansehen' })
  }
  if (admin || rollen.includes('kasse')) {
    const f = await faellige(req.payload, rollen).catch(() => [])
    const summe = f.reduce((s, x) => s + x.anzahl, 0)
    if (summe)
      a.push({
        key: 'datenschutz',
        art: 'warn',
        symbol: '🧹',
        text: `${summe} alte Einträge mit persönlichen Daten sind über der Datenschutz-Frist (${f.map((x) => `${x.anzahl} ${x.label}`).join(', ')}).`,
        href: '/admin/globals/datenschutz',
        link: 'Aufräumen',
      })
  }
  return a
}
