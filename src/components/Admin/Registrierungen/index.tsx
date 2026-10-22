import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { leserHaken } from '@/access/nurAnsehen'
import { darfRegistrierungen, unbestaetigt, WARTEND } from '@/auth/registrierung'

import RegistrierungenClient, { type Eintrag } from './Client'
import './registrierungen.scss'

/** /admin/registrierungen – selbst registrierte Konten freigeben oder ablehnen (Admin & Kasse) */
export default async function Registrierungen({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/login?weiter=/admin/registrierungen')
  // Echte Rollen zählen erst nach bestätigtem zweiten Faktor (die Sitzung ist sonst auf Mitglied herabgestuft)
  // „Nur ansehen“ (Haken „Benutzerkonten“): Liste ohne Freigeben/Ablehnen
  const nurAnsehen = !darfRegistrierungen(req.user)
  if (nurAnsehen && !(await leserHaken(req, 'benutzer'))) redirect('/admin')
  const r = await req.payload.find({ collection: 'users', where: WARTEND, sort: '-createdAt', limit: 200, depth: 1, overrideAccess: true })
  // Noch nicht bestätigt: erscheinen erst nach Klick auf den Link in der E-Mail
  const offen = (await req.payload.find({ collection: 'users', where: { and: [{ freigegeben: { equals: false } }, { registriertUeber: { equals: 'email' } }, { emailBestaetigt: { not_equals: true } }] }, limit: 0, depth: 0, overrideAccess: true })).totalDocs
  const alleAngebote = (await req.payload.find({ collection: 'angebote', sort: ['reihenfolge', 'title'], limit: 300, depth: 0, pagination: false, overrideAccess: true, select: { title: true, bereich: true, aktiv: true } as never })).docs.map((d) => {
    const a = d as unknown as { id: number; title: string; bereich?: string; aktiv?: boolean | null }
    return {
    id: a.id,
    title: (a as { title: string }).title,
    bereich: (a as { bereich?: string }).bereich ?? '',
    aktiv: (a as { aktiv?: boolean | null }).aktiv !== false,
  }})
  const emails = r.docs.map((u) => u.email)
  // „Nur ansehen“: Hinweise auf Anträge bzw. Ausweise nur, wenn diese Bereiche für die Rolle freigegeben sind
  const zeigeAntraege = !nurAnsehen || (await leserHaken(req, 'mitgliedsantraege'))
  const zeigeAusweise = !nurAnsehen || (await leserHaken(req, 'mitgliedschaften'))
  const antraege = zeigeAntraege && emails.length
    ? (await req.payload.find({ collection: 'mitgliedsantraege', where: { or: emails.map((e) => ({ email: { like: e } })) }, limit: 500, depth: 0, overrideAccess: true, select: { email: true, status: true } as never })).docs
    : []
  const mitglieder = zeigeAusweise && emails.length
    ? (await req.payload.find({ collection: 'mitgliedschaften', where: { and: [{ email: { in: emails } }, { konto: { exists: false } }] }, limit: 500, depth: 0, overrideAccess: true })).docs
    : []
  const eintraege: Eintrag[] = r.docs.map((u) => {
    const foto = u.profilbild && typeof u.profilbild === 'object' ? (u.profilbild.sizes?.klein?.url ?? u.profilbild.url ?? null) : null
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      ueber: (u as { registriertUeber?: string | null }).registriertUeber ?? 'verwaltung',
      am: u.createdAt,
      foto,
      antrag: antraege.some((a) => (a as { email?: string }).email?.toLowerCase() === u.email.toLowerCase()),
      bestaetigt: !unbestaetigt(u as never),
      wuensche: (((u as { wunschAngebote?: unknown[] | null }).wunschAngebote ?? []) as (number | { id: number })[]).map((w) => (typeof w === 'object' ? w.id : w)),
      ausweise: mitglieder.filter((m) => m.email === u.email.toLowerCase()).map((m) => `${m.vorname} ${m.nachname}`),
    }
  })
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      viewActions={req.payload.config.admin?.components?.actions}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <RegistrierungenClient eintraege={eintraege} angebote={alleAngebote} offen={offen} nurAnsehen={nurAnsehen} />
      </Gutter>
    </DefaultTemplate>
  )
}
