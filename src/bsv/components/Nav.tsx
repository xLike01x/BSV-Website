import React from 'react'

import { getAngebote, getMenue } from '@/bsv/data'
import { UNTERGRUPPE_LABEL } from '@/bsv/lib'

import { NavClient, type NavItem, type NavMenu } from './NavClient'

type MenueEintrag = {
  label?: string | null
  ziel?: 'seite' | 'adresse' | null
  seite?: number | { slug?: string | null } | null
  adresse?: string | null
  neuerTab?: boolean | null
}

/** Einträge aus dem Global „Menü“ in Links umwandeln; unvollständige Einträge werden übersprungen. */
const zuLinks = (eintraege: MenueEintrag[] | null | undefined, standard: NavItem[]): NavItem[] => {
  const links = (eintraege ?? []).flatMap((e): NavItem[] => {
    if (!e.label) return []
    if (e.ziel === 'adresse') {
      const href = (e.adresse ?? '').trim()
      if (!href) return []
      const extern = /^https?:\/\//.test(href)
      return [{ label: e.label, href, external: extern || Boolean(e.neuerTab) }]
    }
    const slug = typeof e.seite === 'object' ? e.seite?.slug : null
    return slug ? [{ label: e.label, href: `/${slug}` }] : []
  })
  return links.length ? links : standard
}

/** Hauptmenü: Teams und Kurse kommen direkt aus Payload, neue Angebote erscheinen automatisch. */
export async function Nav() {
  const [angebote, menue] = await Promise.all([getAngebote(), getMenue()])
  const link = (a: (typeof angebote)[number]) => ({
    label: a.title + (a.bereich !== 'fussball' && a.alterText && a.alterText.length < 14 ? ` (${a.alterText})` : ''),
    href: `/angebote/${a.slug}`,
  })

  const fussball = angebote.filter((a) => a.bereich === 'fussball')
  const kids = angebote.filter((a) => a.bereich === 'kids')
  const erw = angebote.filter((a) => a.bereich === 'erwachsene')
  const half = Math.ceil(erw.length / 2)

  const menus: NavMenu[] = [
    {
      id: 'fussball',
      label: 'Fußball',
      title: `${fussball.length} Teams`,
      href: '/fussball',
      desc: 'Junioren, Juniorinnen, Senioren und Damen. Trainingszeiten, Trainerteams und Spielpläne.',
      groups: (['junioren', 'juniorinnen', 'senioren', 'seniorinnen'] as const)
        .map((g) => ({ title: UNTERGRUPPE_LABEL[g]!, items: fussball.filter((a) => a.untergruppe === g).map(link) }))
        .filter((g) => g.items.length > 0),
    },
    {
      id: 'breitensport',
      label: 'Breitensport',
      title: `${kids.length + erw.length} Kurse`,
      href: '/breitensport',
      desc: 'Tanzen, Turnen, Fitness und Gesundheit – vom Kleinkind bis ins hohe Alter.',
      groups: [
        { title: 'BSV Kids', items: kids.map(link) },
        { title: 'Erwachsene & Senioren', items: erw.slice(0, half).map(link) },
        { title: ' ', items: erw.slice(half).map(link) },
      ].filter((g) => g.items.length > 0),
    },
    {
      id: 'verein',
      label: 'Verein',
      title: 'Über uns',
      href: '/verein',
      desc: 'Seit 1919 in Büderich. Vorstand, Satzung, Beiträge und alles rund um die Mitgliedschaft.',
      groups: [
        {
          title: 'Über uns',
          items: zuLinks(menue?.vereinUeberUns, [
            { label: 'Vorstand', href: '/verein#vorstand' },
            { label: 'Mitgliedsbeiträge', href: '/verein#beitraege' },
            { label: 'Satzung & Downloads', href: '/verein#downloads' },
            { label: 'Mitglied werden', href: '/mitglied-werden' },
            { label: 'Informationspflichten (DSGVO)', href: '/verein#dsgvo' },
          ]),
        },
        {
          title: 'Mehr',
          items: zuLinks(menue?.vereinMehr, [
            { label: 'Termine', href: '/termine' },
            { label: 'Kunstrasen 2026', href: '/kunstrasen' },
            { label: 'Vereinskollektion (JAKO) ↗', href: 'https://team.jako.de/de/team/buederichersv/', external: true },
            { label: 'Merch-Shop (fan12) ↗', href: 'https://buedericher-spielverein.fan12.de', external: true },
          ]),
        },
      ],
    },
  ]

  const links = zuLinks(menue?.links, [
    { label: 'News', href: '/news' },
    { label: 'Termine', href: '/termine' },
    { label: 'Kunstrasen', href: '/kunstrasen' },
    { label: 'Kontakt', href: '/kontakt' },
  ])

  return <NavClient menus={menus} links={links} />
}
