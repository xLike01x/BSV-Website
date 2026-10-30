import React from 'react'

import { getAngebote, getMenue } from '@/bsv/data'
import { UNTERGRUPPE_LABEL } from '@/bsv/lib'

import { zuLink, zuLinks, type MenueEintrag } from './menueLinks'
import { NavClient, type NavEintrag, type NavMenu } from './NavClient'

/** Nur echte Altersangaben im Menü („3–6 Jahre“, „ab 16 Jahren“) – andere Texte im Alter-Feld bleiben dort weg, damit es einheitlich aussieht */
const IST_ALTER = /^(ab \d+ Jahren|\d+(,\d)?\s?[–-]\s?\d+ Jahre)$/

/** Hauptmenü: Teams und Kurse kommen direkt aus Payload, neue Angebote erscheinen automatisch. */
export async function Nav() {
  const [angebote, menue] = await Promise.all([getAngebote(), getMenue()])
  const link = (a: (typeof angebote)[number]) => ({
    label: a.title + (a.bereich !== 'fussball' && a.alterText && IST_ALTER.test(a.alterText) ? ` (${a.alterText})` : ''),
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
      desc: (menue as { fussballText?: string | null } | null)?.fussballText || 'Junioren, Juniorinnen, Senioren und Damen. Trainingszeiten, Trainerteams und Spielpläne.',
      groups: (['junioren', 'juniorinnen', 'senioren', 'seniorinnen'] as const)
        .map((g) => ({ title: UNTERGRUPPE_LABEL[g]!, items: fussball.filter((a) => a.untergruppe === g).map(link) }))
        .filter((g) => g.items.length > 0),
    },
    {
      id: 'breitensport',
      label: 'Breitensport',
      title: `${kids.length + erw.length} Kurse`,
      href: '/breitensport',
      desc: (menue as { breitensportText?: string | null } | null)?.breitensportText || 'Tanzen, Turnen, Fitness und Gesundheit – vom Kleinkind bis ins hohe Alter.',
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
      desc: (menue as { vereinText?: string | null } | null)?.vereinText || 'Seit 1919 in Büderich. Vorstand, Satzung, Beiträge und alles rund um die Mitgliedschaft.',
      groups: [
        {
          title: 'Über uns',
          items: zuLinks(menue?.vereinUeberUns as MenueEintrag[]),
        },
        {
          title: 'Mehr',
          items: zuLinks(menue?.vereinMehr as MenueEintrag[]),
        },
      ],
    },
  ]

  // Reihenfolge und Einträge aus „Menü & Fußzeile“ (leer = Standard, kommt schon so aus der Datenbank)
  const roh = (menue?.links ?? []) as MenueEintrag[]
  const mitAufklapp = roh.some((e) => e.ziel === 'aufklapp')
  // Ältere Einstellungen ohne Aufklappmenüs: die drei wie früher vorne einsetzen
  const liste: MenueEintrag[] = mitAufklapp
    ? roh
    : [
        { label: 'Fußball', ziel: 'aufklapp', aufklapp: 'fussball' },
        { label: 'Breitensport', ziel: 'aufklapp', aufklapp: 'breitensport' },
        { label: 'Verein', ziel: 'aufklapp', aufklapp: 'verein' },
        ...roh,
      ]
  const eintraege: NavEintrag[] = liste.flatMap((e): NavEintrag[] => {
    if (e.ziel === 'aufklapp') {
      const m = menus.find((x) => x.id === e.aufklapp)
      return m ? [{ art: 'menu', id: m.id, label: e.label || m.label }] : []
    }
    const l = zuLink(e)
    return l ? [{ art: 'link', item: l }] : []
  })

  return <NavClient menus={menus} eintraege={eintraege} />
}
