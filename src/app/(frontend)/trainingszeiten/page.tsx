import type { Metadata } from 'next'

import { seite } from '@/bsv/seo'
import React from 'react'

import { Wochenplan, type PlanEintrag, type OhneZeit } from '@/bsv/components/Wochenplan'
import { WebApp } from '@/bsv/components/WebApp'
import { getAngebote, getTexte } from '@/bsv/data'
import { farbe } from '@/bsv/lib'

export const revalidate = 60
export const metadata: Metadata = seite('Trainingszeiten', 'Wochenplan aller Trainings und Kurse des Büdericher Spielvereins – von Montag bis Sonntag, nach Alter und Bereich filterbar.')

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

export default async function Trainingszeiten() {
  const [angebote, tx] = await Promise.all([getAngebote(), getTexte()])
  const eintraege: PlanEintrag[] = []
  const ohne: OhneZeit[] = []
  for (const a of angebote) {
    const basis = {
      team: a.title,
      href: `/angebote/${a.slug}`,
      bereich: a.bereich ?? '',
      farbe: farbe(a.kategorie),
      kategorie: a.kategorie ?? '',
      alter: a.alterText ?? '',
      alterVon: a.alterVon ?? 0,
      alterBis: a.alterBis ?? 99,
    }
    const zeiten = (a.zeiten ?? []).filter((z) => z.tag && TAGE.includes(z.tag))
    if (!zeiten.length) ohne.push(basis)
    for (const z of zeiten) eintraege.push({ ...basis, tag: z.tag!, von: z.von ?? '', bis: z.bis ?? '', ort: z.ort ?? '', hinweis: z.hinweis ?? '' })
  }
  eintraege.sort((x, y) => TAGE.indexOf(x.tag) - TAGE.indexOf(y.tag) || x.von.localeCompare(y.von) || x.team.localeCompare(y.team, 'de'))

  return (
    <>
      <section className="wrap-narrow" style={{ paddingTop: 80, paddingBottom: 32 }}>
        <p className="kicker in1">Wochenplan</p>
        <h1 className="t-page in1" style={{ fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 1 }}>
          Wer trainiert wann?
        </h1>
        <p className="lead in2" style={{ margin: '14px 0 0', maxWidth: 760 }}>
          Alle Trainings und Kurse auf einen Blick – von Montag bis Sonntag. Ein Klick aufs Team zeigt alle Infos und das Probetraining.
        </p>
        <WebApp art="zeile" texte={tx.webApp} />
      </section>
      <section className="sec-soft" style={{ padding: '48px 0 110px' }}>
        <div className="wrap-narrow">
          <Wochenplan eintraege={eintraege} ohneZeit={ohne} />
        </div>
      </section>
    </>
  )
}
