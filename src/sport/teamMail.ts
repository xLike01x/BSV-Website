import type { PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'
import { rechteLaden, schalter } from '@/access/rollenRechte'
import { mailHtml, mailSenden } from '@/auth/mail'
import { getServerSideURL } from '@/utilities/getURL'

type Konto = { id: number; name?: string | null; email: string; roles?: string[] | null; mailBenachrichtigung?: boolean | null; freigegeben?: boolean | null }

/**
 * Kurze E-Mail an die Trainer eines Teams (und optional an weitere Rollen, z. B. Passwesen).
 * Jede Person bekommt eine eigene Mail – niemand sieht die Adressen der anderen.
 * Wer unter „Mein Konto“ den Haken „E-Mail-Benachrichtigungen“ entfernt, bekommt nichts.
 */
export async function teamBenachrichtigen(
  req: PayloadRequest,
  opt: { angebotId: number; schalterKey: 'probetraining' | 'passantraege'; zusatzRollen?: string[]; betreff: string; titel: string; absaetze: string[]; pfad: string },
) {
  await rechteLaden(req.payload)
  const angebot = (await req.payload.findByID({ collection: 'angebote', id: opt.angebotId, depth: 0, overrideAccess: true, req }).catch(() => null)) as { title?: string; leitung?: (number | { id: number })[] | null } | null
  const leitung = (angebot?.leitung ?? []).map((l) => (typeof l === 'object' ? l.id : l))
  const trainerAn = schalter('uebungsleitung', opt.schalterKey)
  const wo = [
    ...(trainerAn && leitung.length ? [{ and: [{ id: { in: leitung } }, { roles: { contains: 'uebungsleitung' } }] }] : []),
    ...(opt.zusatzRollen ?? []).map((r) => ({ roles: { contains: r } })),
  ]
  if (!wo.length) return 0
  const r = await req.payload.find({ collection: 'users', where: { or: wo } as never, limit: 50, depth: 0, overrideAccess: true, req })
  const empfaenger = (r.docs as unknown as Konto[]).filter((u) => u.mailBenachrichtigung !== false && u.freigegeben !== false && hasRole(u as never, 'uebungsleitung', ...(opt.zusatzRollen ?? []) as never[]))
  const link = `${getServerSideURL()}${opt.pfad}`
  for (const u of empfaenger) {
    const absaetze = [u.name ? `Hallo ${u.name.split(' ')[0]},` : 'Hallo,', ...opt.absaetze]
    const fuss = 'Du bekommst diese E-Mail, weil du für dieses Team eingetragen bist. Abbestellen: in der Verwaltung oben rechts → „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“ entfernen.'
    await mailSenden(req.payload, {
      an: u.email,
      betreff: opt.betreff,
      text: `${absaetze.join('\n\n')}\n\n${link}\n\n${fuss}`,
      html: mailHtml({ titel: opt.titel, absaetze, knopf: 'In der Verwaltung öffnen', link, fuss }),
    }).catch((e) => req.payload.logger.error({ err: e }, 'Team-Benachrichtigung fehlgeschlagen'))
  }
  return empfaenger.length
}

/**
 * Kurze E-Mail an alle Konten mit einer der Rollen (z. B. Kasse bei einem neuen Mitgliedsantrag).
 * Ohne persönliche Daten im Text – nur ein Link in die Verwaltung. Abbestellbar unter „Mein Konto“.
 * Gibt es niemanden mit diesen Rollen, geht die Mail an die Admins.
 */
export async function rollenBenachrichtigen(req: PayloadRequest, opt: { rollen: string[]; betreff: string; titel: string; absaetze: string[]; pfad: string; grund: string }) {
  const suchen = async (rollen: string[]) =>
    (
      (await req.payload.find({ collection: 'users', where: { roles: { in: rollen } }, limit: 50, depth: 0, overrideAccess: true, req })).docs as unknown as Konto[]
    ).filter((u) => u.freigegeben !== false)
  let empfaenger = await suchen(opt.rollen)
  const ersatz = !empfaenger.length
  if (ersatz) empfaenger = await suchen(['admin'])
  empfaenger = empfaenger.filter((u) => u.mailBenachrichtigung !== false)
  const link = `${getServerSideURL()}${opt.pfad}`
  const grund = ersatz ? 'du Admin bist und es noch niemanden mit der zuständigen Rolle gibt' : opt.grund
  const fuss = `Du bekommst diese E-Mail, weil ${grund}. Abbestellen: in der Verwaltung oben rechts → „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“ entfernen.`
  for (const u of empfaenger) {
    const absaetze = [u.name ? `Hallo ${u.name.split(' ')[0]},` : 'Hallo,', ...opt.absaetze]
    await mailSenden(req.payload, {
      an: u.email,
      betreff: opt.betreff,
      text: `${absaetze.join('\n\n')}\n\n${link}\n\n${fuss}`,
      html: mailHtml({ titel: opt.titel, absaetze, knopf: 'In der Verwaltung öffnen', link, fuss }),
    }).catch((e) => req.payload.logger.error({ err: e }, 'Benachrichtigung fehlgeschlagen'))
  }
  return empfaenger.length
}
