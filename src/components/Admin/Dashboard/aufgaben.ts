import { darfRegistrierungen, WARTEND } from '@/auth/registrierung'
import type { PayloadRequest } from 'payload'

import { hatRecht } from '@/access/einzelrechte'
import { faellige } from '@/datenschutz/aufraeumen'
import { sicherungenAuflisten } from '@/sicherung/kern'
import { wartungLesen, wartungsHinweise } from '@/wartung/pruefen'

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
    // Wartung: Speicherplatz, Schlüsselwechsel, auslaufende Versionen, Update-Tag, Wiederherstellungs-Test
    const ziel: Record<string, [string, string]> = { speicher: ['/admin/collections/media', 'Mediathek'], wiederherstellung: ['/admin/sicherung#wartung', 'Anleitung'] }
    for (const w of await wartungsHinweise(req.payload).catch(() => [])) {
      const [href, link] = ziel[w.key] ?? ['/admin/sicherung#wartung', 'Details']
      a.push({ ...w, key: `wartung-${w.key}`, href, link })
    }
  }
  if (admin) {
    const halbesJahr = new Date(Date.now() - 182 * 86400000).toISOString()
    const vorMonat = new Date(Date.now() - 30 * 86400000).toISOString()
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      overrideAccess: true,
      where: {
        and: [
          { roles: { in: ['webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'lesen'] } },
          { testkonto: { not_equals: true } },
          { or: [{ letzteAnmeldung: { less_than: halbesJahr } }, { and: [{ letzteAnmeldung: { exists: false } }, { createdAt: { less_than: vorMonat } }] }] },
        ],
      },
    })
    if (totalDocs)
      a.push({ key: 'zugaenge', art: 'info', symbol: '👥', text: `${totalDocs} ${totalDocs === 1 ? 'Zugang mit Verwaltungsrechten wurde' : 'Zugänge mit Verwaltungsrechten wurden'} seit über 6 Monaten nicht genutzt. Noch nötig?`, href: '/admin/rollen', link: 'Prüfen' })
  }
  if (admin || rollen.includes('passwesen') || rollen.includes('uebungsleitung')) {
    // Nur die Anträge, die diese Person auch sehen darf (Übungsleitung: eigene Teams)
    const neu = await req.payload.count({ collection: 'passantraege', where: { status: { equals: 'eingereicht' } }, user: req.user, overrideAccess: false, req }).catch(() => ({ totalDocs: 0 }))
    if (neu.totalDocs)
      a.push({ key: 'passantraege', art: 'warn', symbol: '⚽', text: `${neu.totalDocs} ${neu.totalDocs === 1 ? 'neuer Passantrag wartet' : 'neue Passanträge warten'} auf Prüfung.`, href: '/admin/collections/passantraege?where[status][equals]=eingereicht', link: 'Prüfen' })
  }
  if (admin || rollen.includes('kasse') || hatRecht(req.user, 'antraege')) {
    // Mitgliedsanträge: neue und aufgenommene, aber noch nicht für die Kasse exportierte
    const zaehle = (where: object) => req.payload.count({ collection: 'mitgliedsantraege', where: where as never, user: req.user, overrideAccess: false, req }).catch(() => ({ totalDocs: 0 }))
    const [neu, offenExport] = await Promise.all([zaehle({ status: { equals: 'neu' } }), zaehle({ and: [{ status: { equals: 'aufgenommen' } }, { exportiertAm: { exists: false } }] })])
    if (neu.totalDocs)
      a.push({ key: 'antraege', art: 'warn', symbol: '📝', text: `${neu.totalDocs} ${neu.totalDocs === 1 ? 'neuer Mitgliedsantrag wartet' : 'neue Mitgliedsanträge warten'} auf Prüfung.`, href: '/admin/collections/mitgliedsantraege?where[status][equals]=neu', link: 'Prüfen' })
    if (offenExport.totalDocs && (admin || rollen.includes('kasse')))
      a.push({ key: 'export', art: 'info', symbol: '📥', text: `${offenExport.totalDocs} aufgenommene${offenExport.totalDocs === 1 ? 'r Antrag ist' : ' Anträge sind'} noch nicht für die Kasse exportiert.`, href: '/admin/collections/mitgliedsantraege', link: 'Exportieren' })
  }
  // Saisonwechsel: im Sommer (15. Juni bis 30. September) erinnern, wenn er in diesem Jahr noch nicht abgeschlossen ist
  if (admin || rollen.includes('redaktion') || hatRecht(req.user, 'saisonwechsel')) {
    const heute = new Date()
    const tag = (heute.getMonth() + 1) * 100 + heute.getDate()
    if (tag >= 615 && tag <= 930) {
      const w = await wartungLesen(req.payload).catch(() => ({}) as Awaited<ReturnType<typeof wartungLesen>>)
      const zuletzt = w.saisonwechselAm ? new Date(w.saisonwechselAm) : null
      if (!zuletzt || zuletzt.getFullYear() < heute.getFullYear() || (zuletzt.getMonth() + 1) * 100 + zuletzt.getDate() < 515)
        a.push({ key: 'saisonwechsel', art: 'info', symbol: '🔄', text: 'Neue Fußball-Saison: Teams, Trainer, Trainingszeiten und Fotos einmal durchgehen.', href: '/admin/saisonwechsel', link: 'Saisonwechsel' })
    }
  }
  if (darfRegistrierungen(req.user)) {
    const wartend = await req.payload.count({ collection: 'users', where: WARTEND, overrideAccess: true }).catch(() => ({ totalDocs: 0 }))
    if (wartend.totalDocs)
      a.push({ key: 'registrierungen', art: 'warn', symbol: '🙋', text: `${wartend.totalDocs} ${wartend.totalDocs === 1 ? 'neue Registrierung wartet' : 'neue Registrierungen warten'} auf Freigabe.`, href: '/admin/registrierungen', link: 'Ansehen' })
  }
  if (admin || rollen.includes('kasse') || hatRecht(req.user, 'datenschutz')) {
    const f = await faellige(req.payload, !admin && hatRecht(req.user, 'datenschutz') ? undefined : rollen).catch(() => [])
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
  // Entwürfe & Erinnerungen
  const user = req.user as { id: number } | null
  const redaktion = admin || rollen.includes('redaktion')
  const teamRolle = rollen.includes('uebungsleitung') || rollen.includes('teamredaktion')
  if (user && (redaktion || teamRolle)) {
    const eigeneTeams = teamRolle && !redaktion
      ? (await req.payload.find({ collection: 'angebote', where: { leitung: { contains: user.id } }, limit: 100, depth: 0, overrideAccess: true, select: { title: true, zeiten: true, updatedAt: true, aktiv: true } as never })).docs
      : []
    // Unveröffentlichte News: Redaktion alle, Team-Rollen die eigenen bzw. die ihrer Teams
    const entwuerfe = await req.payload
      .count({
        collection: 'posts',
        where: {
          and: [
            { _status: { equals: 'draft' } },
            ...(redaktion ? [] : [{ or: [{ authors: { contains: user.id } }, ...(eigeneTeams.length ? [{ team: { in: (eigeneTeams as unknown as { id: number }[]).map((t) => t.id) } }] : [])] }]),
          ],
        },
        overrideAccess: true,
      })
      .catch(() => ({ totalDocs: 0 }))
    if (entwuerfe.totalDocs)
      a.push({
        key: 'entwuerfe',
        art: 'info',
        symbol: '📝',
        text: `${entwuerfe.totalDocs} ${entwuerfe.totalDocs === 1 ? 'News ist noch ein Entwurf' : 'News sind noch Entwürfe'} – noch nicht auf der Website.`,
        href: '/admin/collections/posts?where[_status][equals]=draft',
        link: 'Ansehen',
      })

    // Teams ohne Trainingszeiten bzw. seit einem Jahr nicht mehr angefasst
    const teams = redaktion
      ? (await req.payload.find({ collection: 'angebote', where: { aktiv: { not_equals: false } }, limit: 300, depth: 0, overrideAccess: true, select: { title: true, zeiten: true, updatedAt: true, aktiv: true } as never })).docs
      : eigeneTeams.filter((t) => (t as { aktiv?: boolean }).aktiv !== false)
    const liste = teams as unknown as { id: number; title: string; zeiten?: unknown[] | null; updatedAt: string }[]
    const ohneZeiten = liste.filter((t) => !t.zeiten?.length)
    const alt = liste.filter((t) => t.zeiten?.length && Date.now() - new Date(t.updatedAt).getTime() > 365 * 86400000)
    const namen = (l: { title: string }[]) => l.slice(0, 3).map((t) => t.title).join(', ') + (l.length > 3 ? ` und ${l.length - 3} weitere` : '')
    if (ohneZeiten.length)
      a.push({
        key: 'ohne-zeiten',
        art: 'info',
        symbol: '🕒',
        text: `Keine Trainingszeiten eingetragen: ${namen(ohneZeiten)}. Auf der Website steht dann „auf Anfrage“.`,
        href: ohneZeiten.length === 1 ? `/admin/collections/angebote/${ohneZeiten[0]!.id}` : '/admin/collections/angebote',
        link: 'Eintragen',
      })
    if (alt.length)
      a.push({
        key: 'alte-zeiten',
        art: 'info',
        symbol: '🔄',
        text: `Seit über einem Jahr nicht aktualisiert: ${namen(alt)}. Stimmen Trainingszeiten und Ansprechpersonen noch?`,
        href: alt.length === 1 ? `/admin/collections/angebote/${alt[0]!.id}` : '/admin/collections/angebote?sort=updatedAt',
        link: 'Prüfen',
      })
  }
  if (redaktion) {
    // Termine der nächsten 14 Tage ohne Beschreibung
    const jetzt = new Date()
    const bald = new Date(Date.now() + 14 * 86400000)
    const termine = await req.payload
      .count({ collection: 'termine', where: { and: [{ beginn: { greater_than_equal: jetzt.toISOString() } }, { beginn: { less_than: bald.toISOString() } }, { or: [{ beschreibung: { exists: false } }, { beschreibung: { equals: '' } }] }] }, overrideAccess: true })
      .catch(() => ({ totalDocs: 0 }))
    if (termine.totalDocs)
      a.push({
        key: 'termine-text',
        art: 'info',
        symbol: '📅',
        text: `${termine.totalDocs} ${termine.totalDocs === 1 ? 'Termin' : 'Termine'} in den nächsten 2 Wochen ohne Beschreibung – ein Satz zu Ablauf oder Treffpunkt hilft Besuchern.`,
        href: '/admin/collections/termine',
        link: 'Ergänzen',
      })
  }
  return a
}
