import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hatRecht } from '@/access/einzelrechte'
import { hasRole } from '@/access/roles'

import PapierkorbClient from './Client'
import './papierkorb.scss'

/** /admin/papierkorb – zentraler Papierkorb für Web-Admins (beide Stufen, alle Bereiche); Zusatzrecht „papierkorb“: nur wiederherstellen */
export default async function PapierkorbSeite({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const user = req.user
  if (!user) redirect('/login?weiter=/admin/papierkorb')
  const webAdmin = hasRole(user as never, 'webadmin')
  if (!webAdmin && !hatRecht(user, 'papierkorb')) redirect('/admin')
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
        <PapierkorbClient webAdmin={webAdmin} />
      </Gutter>
    </DefaultTemplate>
  )
}
