import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole, imBereich } from '@/access/roles'
import type { SaisonStand } from '@/wartung/config'

import SaisonwechselClient, { type Zeile } from './Client'
import './saisonwechsel.scss'

const HALBES_JAHR = 182 * 86400000
const ZWEI_JAHRE = 730 * 86400000

type Angebot = {
  id: number
  title: string
  bereich?: string | null
  untergruppe?: string | null
  aktiv?: boolean | null
  leitung?: (number | { id: number })[] | null
  zeiten?: { tag?: string | null; von?: string | null; bis?: string | null; ort?: string | null }[] | null
  bild?: number | { id: number; createdAt?: string } | null
  fupaWidgetId?: string | null
  fussballDeTeamId?: string | null
  updatedAt: string
}
type Person = { id: number; name?: string | null; email: string; letzteAnmeldung?: string | null; createdAt: string; roles?: string[] | null; testkonto?: boolean | null }

const idVon = (v: number | { id: number }) => (typeof v === 'object' ? v.id : v)

/** /admin/saisonwechsel – einmal im Jahr alle Fußballteams durchgehen (Admin, Redaktion, Zusatzrecht „saisonwechsel“). Breitensport hat keine Saison. */
export default async function Saisonwechsel({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/login?weiter=/admin/saisonwechsel')
  if (!imBereich(req.user, 'saisonwechsel')) redirect('/admin')

  const angebote = (
    await req.payload.find({
      collection: 'angebote',
      where: { bereich: { equals: 'fussball' } },
      sort: ['reihenfolge', 'title'],
      limit: 500,
      pagination: false,
      depth: 1,
      overrideAccess: true,
      select: { title: true, bereich: true, untergruppe: true, aktiv: true, leitung: true, zeiten: true, bild: true, fupaWidgetId: true, fussballDeTeamId: true, updatedAt: true } as never,
      populate: { users: { name: true, email: true, letzteAnmeldung: true, createdAt: true, roles: true, testkonto: true }, media: { createdAt: true } } as never,
    })
  ).docs as unknown as (Omit<Angebot, 'leitung'> & { leitung?: (number | Person)[] | null })[]

  // Fotos mit erkennbaren Personen, die älter als zwei Jahre sind – je Team-Ordner
  const grenze = new Date(Date.now() - ZWEI_JAHRE).toISOString()
  const alteFotos = new Map<number, number>()
  const medien = await req.payload.find({
    collection: 'media',
    where: { and: [{ personen: { equals: 'einwilligung' } }, { createdAt: { less_than: grenze } }, { team: { exists: true } }] },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { team: true } as never,
  })
  for (const m of medien.docs as unknown as { team?: number | { id: number } | null }[]) if (m.team) alteFotos.set(idVon(m.team), (alteFotos.get(idVon(m.team)) ?? 0) + 1)

  // Redaktion sieht von den Verantwortlichen nur Namen und „lange nicht da“ – E-Mail und Anmeldedatum nur Admins (wie bei Benutzern)
  const istAdmin = hasRole(req.user as never, 'admin')
  const zeilen: Zeile[] = angebote.map((a) => {
    const leitung = (a.leitung ?? []).filter((p): p is Person => typeof p === 'object' && p !== null)
    const bild = a.bild && typeof a.bild === 'object' ? a.bild : null
    return {
      id: a.id,
      title: a.title,
      untergruppe: a.untergruppe ?? null,
      aktiv: a.aktiv !== false,
      leitung: leitung.map((p) => {
        const zuletzt = p.letzteAnmeldung ?? null
        const alt = zuletzt ? Date.now() - new Date(zuletzt).getTime() > HALBES_JAHR : Date.now() - new Date(p.createdAt).getTime() > 30 * 86400000
        return {
          id: p.id,
          name: p.name || (istAdmin ? p.email : 'Konto ohne Namen'),
          zuletzt: istAdmin ? zuletzt : null,
          alt: alt && !p.testkonto,
          ohneRolle: !(p.roles ?? []).some((r) => ['uebungsleitung', 'teamredaktion', 'admin', 'redaktion'].includes(r)),
          link: istAdmin,
        }
      }),
      zeiten: (a.zeiten ?? []).filter((z) => z.tag).map((z) => `${(z.tag ?? '').slice(0, 2)} ${z.von ?? ''}${z.bis ? `–${z.bis}` : ''}${z.ort ? `, ${z.ort}` : ''}`.trim()),
      titelbildJahr: bild?.createdAt ? new Date(bild.createdAt).getFullYear() : null,
      titelbildFehlt: !a.bild,
      alteFotos: alteFotos.get(a.id) ?? 0,
      ergebnisdienst: Boolean(a.fupaWidgetId || a.fussballDeTeamId),
      geaendert: a.updatedAt,
    }
  })

  const stand = (await req.payload.findGlobal({ slug: 'wartung' as never, depth: 0, overrideAccess: true }).catch(() => ({}))) as SaisonStand

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
        <SaisonwechselClient
          zeilen={zeilen}
          stand={{ saisonStart: stand.saisonStart ?? null, saisonGeprueft: stand.saisonGeprueft ?? {}, saisonwechselAm: stand.saisonwechselAm ?? null, saisonwechselVon: stand.saisonwechselVon ?? null }}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
