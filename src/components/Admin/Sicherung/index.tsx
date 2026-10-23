import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import path from 'path'

import { SICHERUNGS_ORDNER, sicherungenAuflisten } from '@/sicherung/kern'
import { updateStand, updateZusammenfassung } from '@/wartung/updates'
import { codeStand, nodeLaufzeit, postgresLaufzeit, schluesselwechselOffen, speicherplatz, wartungLesen } from '@/wartung/pruefen'

import SicherungClient, { type Umgebung } from './Client'
import './sicherung.scss'

/** /admin/sicherung – Datensicherung erstellen und herunterladen (nur Admins) */
export default async function Sicherung({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/login?weiter=/admin/sicherung')
  if (!hasRole(req.user as never, 'webadmin')) redirect('/admin')
  const [w, pgL, code] = await Promise.all([wartungLesen(req.payload), postgresLaufzeit(req.payload), codeStand()])
  const wartung = {
    getestetAm: w.wiederherstellungGetestetAm ?? null,
    getestetVon: w.wiederherstellungVon ?? null,
    laufzeiten: [nodeLaufzeit(), ...(pgL ? [pgL] : [])],
    speicher: speicherplatz(),
    code,
    schluesselwechsel: schluesselwechselOffen(),
    updates: (() => {
      const z = updateZusammenfassung()
      return { sicherheit: z.sicherheit.length, updates: z.updates.length, geprueftAm: updateStand().geprueftAm, unvollstaendig: updateStand().ohneDaten.length > 0 }
    })(),
  }
  // Anleitungen passend zur Umgebung: Live-Server (Linux, systemd) oder PC (Windows, BSV-Website-Update.bat)
  const umgebung: Umgebung = { live: process.env.NODE_ENV === 'production', ordner: SICHERUNGS_ORDNER, projekt: path.dirname(SICHERUNGS_ORDNER) }
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
        <SicherungClient sicherungen={sicherungenAuflisten()} wartung={wartung} umgebung={umgebung} />
      </Gutter>
    </DefaultTemplate>
  )
}
