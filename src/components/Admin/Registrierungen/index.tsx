import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'

import RegistrierungenClient, { type Eintrag } from './Client'
import './registrierungen.scss'

/** /admin/registrierungen – selbst registrierte Konten freigeben oder ablehnen (Admin & Kasse) */
export default async function Registrierungen({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/login?weiter=/admin/registrierungen')
  // Echte Rollen zählen erst nach bestätigtem zweiten Faktor (die Sitzung ist sonst auf Mitglied herabgestuft)
  if (!hasRole(req.user as never, 'admin', 'kasse')) redirect('/admin')
  const r = await req.payload.find({ collection: 'users', where: { freigegeben: { equals: false } }, sort: '-createdAt', limit: 200, depth: 1, overrideAccess: true })
  const emails = r.docs.map((u) => u.email)
  const antraege = emails.length
    ? (await req.payload.find({ collection: 'mitgliedsantraege', where: { or: emails.map((e) => ({ email: { like: e } })) }, limit: 500, depth: 0, overrideAccess: true, select: { email: true, status: true } as never })).docs
    : []
  const mitglieder = emails.length
    ? (await req.payload.find({ collection: 'mitgliedschaften', where: { and: [{ email: { in: emails } }, { konto: { exists: false } }] }, limit: 500, depth: 0, overrideAccess: true })).docs
    : []
  const eintraege: Eintrag[] = r.docs.map((u) => {
    const foto = u.profilbild && typeof u.profilbild === 'object' ? (u.profilbild.sizes?.klein?.url ?? u.profilbild.url ?? null) : null
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      ueber: (u as { registriertUeber?: string | null }).registriertUeber ?? 'email',
      am: u.createdAt,
      foto,
      antrag: antraege.some((a) => (a as { email?: string }).email?.toLowerCase() === u.email.toLowerCase()),
      bestaetigt: Boolean((u as { emailBestaetigt?: boolean | null }).emailBestaetigt),
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
        <RegistrierungenClient eintraege={eintraege} />
      </Gutter>
    </DefaultTemplate>
  )
}
