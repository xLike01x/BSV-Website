import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { alleBereiche, alleFaq, type HilfeGlobal } from '../Hilfe/daten'
import { hauptRolle, ROLLEN_PROFIL, ROLLEN_REIHENFOLGE } from '../Hilfe/extras'
import HilfeCenterClient from './Client'
import './hilfe-center.scss'

/** Bereiche, die man ohne eigene Sammlung immer sieht */
const IMMER = ['dashboard', 'account', 'hilfe-center']

/** /admin/hilfe – alle Anleitungen, Videos und Fragen an einem Ort */
export default async function HilfeCenter({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const user = req.user
  if (!user) redirect('/login?weiter=/admin/hilfe')

  const global = (await req.payload.findGlobal({ slug: 'hilfe', depth: 1, user, overrideAccess: false }).catch(() => null)) as HilfeGlobal | null
  const rollen = ((user as { roles?: string[] }).roles ?? []) as string[]
  const rolle = hauptRolle(rollen)
  // Nur Bereiche, die die Rolle auch lesen darf (nicht nur „sichtbar“)
  const perms = permissions as unknown as { collections?: Record<string, { read?: unknown }>; globals?: Record<string, { read?: unknown }> }
  const sichtbar = new Set<string>([
    ...IMMER,
    ...visibleEntities.collections.filter((c) => perms.collections?.[c]?.read),
    ...visibleEntities.globals.filter((g) => perms.globals?.[g]?.read),
  ])
  const bereiche = alleBereiche(global, rolle).filter((b) => sichtbar.has(b.schluessel))

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
        <HilfeCenterClient
          bereiche={bereiche}
          faq={alleFaq(global)}
          rolle={rolle}
          rollenAuswahl={rolle === 'admin' || rolle === 'webadmin' ? ROLLEN_REIHENFOLGE.map((r) => ({ key: r, label: ROLLEN_PROFIL[r].label })) : []}
          profil={ROLLEN_PROFIL[rolle]}
          ansprechperson={global?.ansprechperson ?? null}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
