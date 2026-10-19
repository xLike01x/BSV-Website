import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { einzelrechteVon, einzelrechtLabel } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'

import { TESTPASSWORT, testkontenErlaubt } from '@/auth/testkonten'

import RollenClient, { type Person, type Team } from './Client'
import { rechteBerechnen } from './rechte'
import './rollen.scss'

/** /admin/rollen – wer hat welche Rolle, für welche Teams? (nur Admin/Web-Admin) */
export default async function RollenUebersicht({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const user = req.user
  if (!user) redirect('/login?weiter=/admin/rollen')
  if (!hasRole(user as never, 'admin')) redirect('/admin')
  const webadmin = hasRole(user as never, 'webadmin')

  const [nutzer, angebote] = await Promise.all([
    req.payload.find({ collection: 'users', limit: 1000, depth: 0, sort: 'name', overrideAccess: false, user, req }),
    req.payload.find({ collection: 'angebote', limit: 500, depth: 0, sort: 'title', overrideAccess: false, user, req }),
  ])

  const personen: Person[] = nutzer.docs.map((u) => {
    const d = u as unknown as { id: number; name?: string; email: string; roles?: string[]; zweiFaktorAktiv?: boolean; testkonto?: boolean; letzteAnmeldung?: string | null; createdAt?: string; angebote?: (number | { id: number })[] }
    const idv = (x: number | { id: number }) => (typeof x === 'object' ? x.id : x)
    return {
      id: d.id,
      name: d.name || d.email,
      email: d.email,
      rollen: d.roles ?? [],
      zweiFaktor: Boolean(d.zweiFaktorAktiv),
      testkonto: Boolean(d.testkonto),
      letzteAnmeldung: d.letzteAnmeldung ?? null,
      angelegt: d.createdAt ?? null,
      verantwortlich: angebote.docs.filter((a) => (a.leitung ?? []).some((l) => idv(l as never) === d.id)).map((a) => ({ id: a.id, title: a.title })),
      mitgliedIn: (d.angebote ?? []).map(idv),
      zusatzrechte: einzelrechteVon(u).map(einzelrechtLabel),
    }
  })

  const teams: Team[] = angebote.docs.map((a) => ({
    id: a.id,
    title: a.title,
    bereich: a.bereich ?? '',
    aktiv: a.aktiv !== false,
    verantwortliche: personen.filter((p) => p.verantwortlich.some((v) => v.id === a.id)).map((p) => ({ id: p.id, name: p.name, rollen: p.rollen })),
  }))

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      viewActions={req.payload.config.admin?.components?.actions}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <RollenClient personen={personen} teams={teams} test={{ erlaubt: testkontenErlaubt(req.headers), passwort: TESTPASSWORT }} rechte={webadmin ? await rechteBerechnen(req) : {}} webadmin={webadmin} />
      </Gutter>
    </DefaultTemplate>
  )
}
