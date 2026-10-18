import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import { sicherungenAuflisten } from '@/sicherung/kern'

import SicherungClient from './Client'
import './sicherung.scss'

/** /admin/sicherung – Datensicherung erstellen und herunterladen (nur Admins) */
export default async function Sicherung({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/login?weiter=/admin/sicherung')
  if (!hasRole(req.user as never, 'admin')) redirect('/admin')
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
        <SicherungClient sicherungen={sicherungenAuflisten()} />
      </Gutter>
    </DefaultTemplate>
  )
}
