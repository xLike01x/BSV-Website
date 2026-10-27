import type { CollectionSlug, Endpoint, Payload, Where } from 'payload'

import { hatRecht } from '@/access/einzelrechte'
import { leserSiehtBereich } from '@/access/nurAnsehen'
import { hasRole } from '@/access/roles'
import { rechteLaden } from '@/access/rollenRechte'

// Zusatzrecht „datenschutz“: Fristen einstellen und – wie der tägliche Lauf – Fälliges in den Papierkorb verschieben (alle Bereiche)
const mitZusatzrecht = (user: unknown) => !hasRole(user as never, 'admin') && hatRecht(user, 'datenschutz')

import { auskunftEndpunkt } from './auskunft'

type Fristen = {
  probetrainingMonate?: number | null
  kontaktMonate?: number | null
  antraegeMonate?: number | null
  eingaengeMonate?: number | null
  offeneMonate?: number | null
  austrittMonate?: number | null
  passOffenMonate?: number | null
  kontenMonate?: number | null
  kuendigungenMonate?: number | null
  automatisch?: boolean | null
}
/** hinweis = wird nur angezeigt, nie automatisch gelöscht (z. B. alte Benutzerkonten – Entscheidung der Verwaltung) */
export type Faellig = { id: string; slug: string; label: string; anzahl: number; monate: number; rollen: string[]; hinweis?: boolean; link?: string }
type Regel = { id: string; slug: string; label: string; monate: number; rollen: string[]; where: (g: string) => Where; hart?: boolean; hinweis?: boolean; link?: string }

const vor = (monate: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - monate)
  return d.toISOString()
}

const regeln = (f: Fristen): Regel[] => {
  const offen = f.offeneMonate ?? 12
  return [
    { id: 'probetraining', slug: 'probetraining', label: 'erledigte Probetraining-Anfragen', monate: f.probetrainingMonate ?? 6, rollen: ['admin'], where: (g): Where => ({ and: [{ status: { equals: 'erledigt' } }, { updatedAt: { less_than: g } }] }) },
    { id: 'probetraining-offen', slug: 'probetraining', label: 'nie erledigte Probetraining-Anfragen', monate: offen, rollen: ['admin'], where: (g): Where => ({ and: [{ status: { not_equals: 'erledigt' } }, { updatedAt: { less_than: g } }] }) },
    { id: 'kontaktanfragen', slug: 'kontaktanfragen', label: 'erledigte Kontaktanfragen', monate: f.kontaktMonate ?? 6, rollen: ['admin'], where: (g): Where => ({ and: [{ status: { equals: 'erledigt' } }, { updatedAt: { less_than: g } }] }) },
    { id: 'kontaktanfragen-offen', slug: 'kontaktanfragen', label: 'nie erledigte Kontaktanfragen', monate: offen, rollen: ['admin'], where: (g): Where => ({ and: [{ status: { not_equals: 'erledigt' } }, { updatedAt: { less_than: g } }] }) },
    { id: 'mitgliedsantraege', slug: 'mitgliedsantraege', label: 'bearbeitete Mitgliedsanträge', monate: f.antraegeMonate ?? 3, rollen: ['admin', 'kasse'], where: (g): Where => ({ and: [{ status: { in: ['aufgenommen', 'abgelehnt'] } }, { updatedAt: { less_than: g } }] }) },
    { id: 'mitgliedsantraege-offen', slug: 'mitgliedsantraege', label: 'nie bearbeitete Mitgliedsanträge', monate: offen, rollen: ['admin', 'kasse'], where: (g): Where => ({ and: [{ status: { in: ['neu', 'rueckfrage'] } }, { updatedAt: { less_than: g } }] }) },
    { id: 'form-submissions', slug: 'form-submissions', label: 'Formular-Eingänge', monate: f.eingaengeMonate ?? 12, rollen: ['admin'], where: (g): Where => ({ createdAt: { less_than: g } }) },
    { id: 'mitgliedschaften', slug: 'mitgliedschaften', label: 'Mitgliedschaften (digitaler Ausweis) nach Austritt', monate: f.austrittMonate ?? 12, rollen: ['admin', 'kasse'], where: (g): Where => ({ austritt: { less_than: g } }) },
    // Kündigungen: samt unterschriebenem Schreiben direkt löschen (afterDelete-Hook). Offene (neu/Rückfrage) nie automatisch.
    { id: 'kuendigungen', slug: 'kuendigungen', label: 'Kündigungen nach dem Austritt (samt Schreiben)', monate: f.kuendigungenMonate ?? 12, rollen: ['admin', 'kasse'], hart: true, where: (g): Where => ({ and: [{ status: { in: ['bestaetigt', 'erledigt'] } }, { wirksamZum: { less_than: g } }] }) },
    { id: 'kuendigungen-ohne', slug: 'kuendigungen', label: 'abgelehnte oder zurückgezogene Kündigungen (samt Schreiben)', monate: f.kuendigungenMonate ?? 12, rollen: ['admin', 'kasse'], hart: true, where: (g): Where => ({ and: [{ status: { in: ['abgelehnt', 'zurueckgezogen'] } }, { updatedAt: { less_than: g } }] }) },
    // Passanträge haben keinen Papierkorb – liegengebliebene werden samt Ausweiskopie direkt gelöscht
    { id: 'passantraege-offen', slug: 'passantraege', label: 'nie abgeschlossene Passanträge (samt Ausweiskopie)', monate: f.passOffenMonate ?? 6, rollen: ['admin'], hart: true, where: (g): Where => ({ and: [{ status: { in: ['eingereicht', 'unterlagen_fehlen'] } }, { updatedAt: { less_than: g } }] }) },
    {
      id: 'konten',
      slug: 'users',
      label: 'Mitgliedskonten ohne Anmeldung',
      monate: f.kontenMonate ?? 24,
      rollen: ['admin'],
      hinweis: true,
      link: '/admin/rollen',
      where: (g): Where => ({
        and: [
          { roles: { not_in: ['admin', 'webadmin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'lesen'] } },
          { testkonto: { not_equals: true } },
          { or: [{ letzteAnmeldung: { less_than: g } }, { and: [{ letzteAnmeldung: { exists: false } }, { createdAt: { less_than: g } }] }] },
        ],
      }),
    },
  ]
}

const fristen = (payload: Payload) => payload.findGlobal({ slug: 'datenschutz' as never, overrideAccess: true }).catch(() => ({})) as Promise<Fristen>

/** Wie viele Einträge sind über der Frist? (nur Bereiche, die die Rollen betreffen) */
export async function faellige(payload: Payload, rollen?: string[]): Promise<Faellig[]> {
  const f = await fristen(payload)
  // Alle Zählungen gleichzeitig (vorher nacheinander), Reihenfolge der Regeln bleibt erhalten
  const passend = regeln(f).filter((r) => !rollen || r.rollen.some((x) => rollen.includes(x)))
  const zahlen = await Promise.all(passend.map((r) => payload.count({ collection: r.slug as CollectionSlug, where: r.where(vor(r.monate)), overrideAccess: true }).then((x) => x.totalDocs, () => 0)))
  return passend.flatMap((r, i) => (zahlen[i] ? [{ id: r.id, slug: r.slug, label: r.label, anzahl: zahlen[i], monate: r.monate, rollen: r.rollen, hinweis: r.hinweis, link: r.link }] : []))
}

/** Fällige Einträge in den Papierkorb verschieben (Passanträge: direkt löschen; Hinweise: nie automatisch) */
export async function aufraeumen(payload: Payload, nur?: string[], ohneHart = false) {
  const f = await fristen(payload)
  let gesamt = 0
  for (const r of regeln(f)) {
    if (r.hinweis || (nur && !nur.includes(r.slug))) continue
    if (r.hart && ohneHart) continue
    if (r.hart) {
      const weg = await payload.delete({ collection: r.slug as CollectionSlug, where: r.where(vor(r.monate)), overrideAccess: true })
      gesamt += weg.docs.length
      continue
    }
    const res = await payload.update({
      collection: r.slug as CollectionSlug,
      where: r.where(vor(r.monate)),
      data: { deletedAt: new Date().toISOString() } as never,
      overrideAccess: true,
      context: { ohneRevalidierung: true },
    })
    gesamt += res.docs.length
  }
  return gesamt
}

export async function datenschutzAutomatisch(payload: Payload) {
  const f = await fristen(payload)
  if (!f.automatisch) return 0
  const n = await aufraeumen(payload)
  if (n) payload.logger.info(`Datenschutz: ${n} Einträge über der Frist in den Papierkorb verschoben`)
  return n
}

export const datenschutzEndpunkte: Endpoint[] = [
  auskunftEndpunkt,
  {
    path: '/datenschutz/faellig',
    method: 'get',
    handler: async (req) => {
      const rollen = ((req.user as { roles?: string[] } | null)?.roles ?? []) as string[]
      // „Nur ansehen“ sieht, was fällig ist (aufräumen kann die Rolle nicht – siehe /datenschutz/aufraeumen)
      const leser = hasRole(req.user as never, 'lesen')
      if (!hasRole(req.user as never, 'admin', 'kasse') && !mitZusatzrecht(req.user) && !leser) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
      const liste = await faellige(req.payload, mitZusatzrecht(req.user) || leser ? undefined : rollen)
      // „Nur ansehen“ ohne weitere Berechtigung: nur Bereiche, deren Haken gesetzt ist
      const nurLesend = leser && !hasRole(req.user as never, 'admin', 'kasse') && !mitZusatzrecht(req.user)
      return Response.json({ faellig: nurLesend ? (await rechteLaden(req.payload), liste.filter((f) => leserSiehtBereich(req.user, f.slug))) : liste })
    },
  },
  {
    path: '/datenschutz/aufraeumen',
    method: 'post',
    handler: async (req) => {
      const rollen = ((req.user as { roles?: string[] } | null)?.roles ?? []) as string[]
      if (!hasRole(req.user as never, 'admin', 'kasse') && !mitZusatzrecht(req.user)) return Response.json({ fehler: 'Keine Berechtigung.' }, { status: 403 })
      // Kasse räumt nur Mitgliedsanträge und Kündigungen auf
      const nur = rollen.includes('admin') || mitZusatzrecht(req.user) ? undefined : ['mitgliedsantraege', 'kuendigungen']
      // Zusatzrecht: nur in den Papierkorb (zurückholbar), nie direkt löschen
      return Response.json({ verschoben: await aufraeumen(req.payload, nur, mitZusatzrecht(req.user)) })
    },
  },
]
