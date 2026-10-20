import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'

import { Verlauf } from './Verlauf'
import { statistikLaden, ZEITRAEUME, type Liste } from './daten'
import './statistik.scss'

const z = (n: number) => n.toLocaleString('de-DE')

/** Veränderung zum Zeitraum davor, z. B. „▲ 12 %“ */
function Trend({ jetzt, vorher }: { jetzt: number; vorher: number }) {
  if (!vorher) return <small className="bsv-stat__trend">kein Vergleich</small>
  const p = Math.round(((jetzt - vorher) / vorher) * 100)
  const art = p > 0 ? 'hoch' : p < 0 ? 'runter' : 'gleich'
  return (
    <small className={`bsv-stat__trend is-${art}`}>
      {p > 0 ? '▲' : p < 0 ? '▼' : '■'} {Math.abs(p)} % <span>zum Zeitraum davor</span>
    </small>
  )
}

/** Liste mit Balken – ein Farbton, Wert immer als Zahl dabei */
function Rangliste({ titel, hinweis, liste, einheit, leer }: { titel: string; hinweis?: string; liste: Liste[]; einheit: string; leer: string }) {
  const max = Math.max(1, ...liste.map((l) => l.wert))
  return (
    <section className="bsv-stat__box">
      <h2>{titel}</h2>
      {hinweis && <p className="bsv-stat__hinweis">{hinweis}</p>}
      {liste.length === 0 ? (
        <p className="bsv-stat__leer">{leer}</p>
      ) : (
        <ol className="bsv-stat__liste">
          {liste.map((l) => (
            <li key={l.name}>
              <span className="bsv-stat__balken" style={{ width: `${Math.max(2, (l.wert / max) * 100)}%` }} aria-hidden="true" />
              <span className="bsv-stat__name">{l.href ? <a href={l.href} target="_blank" rel="noopener">{l.name}</a> : l.name}</span>
              <span className="bsv-stat__wert">
                {z(l.wert)} <small>{einheit}</small>
                {l.zusatz && <em>{l.zusatz}</em>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** /admin/statistik – Besucherstatistik ohne Cookies (nur Web-Admin) */
export default async function StatistikSeite({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const user = req.user
  if (!user) redirect('/login?weiter=/admin/statistik')
  if (!hasRole(user as never, 'webadmin')) redirect('/admin')

  const wahl = ZEITRAEUME.find((x) => x.key === String((searchParams as Record<string, unknown> | undefined)?.zeitraum ?? '')) ?? ZEITRAEUME[1]
  const d = await statistikLaden(req.payload, wahl.tage)
  const proBesuch = d.kpi.besuche ? (d.kpi.aufrufe / d.kpi.besuche).toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '–'
  const handyAnteil = d.kpi.besuche ? Math.round((d.kpi.handy / d.kpi.besuche) * 100) : 0
  const a = d.antrag
  const trichter = [
    { titel: 'Seite „Mitglied werden“ geöffnet', wert: a.geoeffnet },
    { titel: 'Zu „Deine Daten“ weiter', wert: a.schritt2 },
    { titel: 'Zu „Beitrag & SEPA“ weiter', wert: a.schritt3 },
    { titel: 'Antrag abgeschickt', wert: a.gesendet },
  ]
  const tMax = Math.max(1, ...trichter.map((t) => t.wert))
  const seit = d.ersterTag ? new Date(`${d.ersterTag}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : null

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
        <div className="bsv-stat">
          <header className="bsv-stat__kopf">
            <div>
              <h1>Besucherstatistik</h1>
              <p>
                Wie viele Menschen die Website besuchen – ohne Cookies und ohne Google. Mitarbeitende, die in der Verwaltung angemeldet sind, werden nicht mitgezählt.
                {seit && <> Gezählt wird seit dem {seit}.</>}
              </p>
            </div>
            <nav className="bsv-stat__zeitraum" aria-label="Zeitraum">
              {ZEITRAEUME.map((x) => (
                <a key={x.key} href={`/admin/statistik?zeitraum=${x.key}`} aria-current={x.key === wahl.key ? 'page' : undefined}>
                  {x.titel}
                </a>
              ))}
            </nav>
          </header>

          <div className="bsv-stat__kpis">
            <div className="bsv-stat__kpi">
              <span>Besuche</span>
              <strong>{z(d.kpi.besuche)}</strong>
              <Trend jetzt={d.kpi.besuche} vorher={d.kpi.vorherBesuche} />
            </div>
            <div className="bsv-stat__kpi">
              <span>Seitenaufrufe</span>
              <strong>{z(d.kpi.aufrufe)}</strong>
              <Trend jetzt={d.kpi.aufrufe} vorher={d.kpi.vorherAufrufe} />
            </div>
            <div className="bsv-stat__kpi">
              <span>Seiten pro Besuch</span>
              <strong>{proBesuch}</strong>
              <small className="bsv-stat__trend">im Durchschnitt</small>
            </div>
            <div className="bsv-stat__kpi">
              <span>Mit dem Handy</span>
              <strong>{handyAnteil} %</strong>
              <small className="bsv-stat__trend">aller Besuche</small>
            </div>
          </div>

          <section className="bsv-stat__box">
            <h2>Besuche pro {d.einheit}</h2>
            <p className="bsv-stat__hinweis">Mit der Maus über einen Balken fahren (am Handy antippen) zeigt die genaue Zahl.</p>
            <Verlauf daten={d.verlauf} />
          </section>

          <div className="bsv-stat__raster">
            <Rangliste titel="Beliebteste Seiten" liste={d.seiten} einheit="Aufrufe" leer="Noch keine Aufrufe in diesem Zeitraum." />
            <Rangliste titel="Woher kommen die Besucher?" hinweis="Von welcher Seite jemand auf die Website kam." liste={d.herkunft} einheit="Besuche" leer="Noch keine Daten." />
            <Rangliste titel="Meistgesehene Teams & Kurse" liste={d.teams} einheit="Besuche" leer="Noch keine Aufrufe von Team- oder Kursseiten." />
            <Rangliste titel="Geräte" liste={d.geraete} einheit="Besuche" leer="Noch keine Daten." />

            <section className="bsv-stat__box">
              <h2>Mitgliedsantrag: Wie weit kommen Interessierte?</h2>
              <p className="bsv-stat__hinweis">Bricht die Zahl an einer Stelle stark ein, lohnt ein Blick auf diesen Schritt.</p>
              <ol className="bsv-stat__trichter">
                {trichter.map((t, i) => (
                  <li key={t.titel}>
                    <span className="bsv-stat__trichter-titel">
                      <b>{i + 1}</b> {t.titel}
                    </span>
                    <span className="bsv-stat__trichter-leiste">
                      <span style={{ width: `${Math.max(2, (t.wert / tMax) * 100)}%` }} />
                    </span>
                    <span className="bsv-stat__wert">
                      {z(t.wert)}
                      {i > 0 && trichter[0]!.wert > 0 && <em>{Math.round((t.wert / trichter[0]!.wert) * 100)} %</em>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <Rangliste titel="Was wird gesucht?" hinweis="Suchbegriffe aus der Suche auf der Website." liste={d.suche} einheit="×" leer="In diesem Zeitraum wurde nichts gesucht." />
            <Rangliste
              titel="Gesucht, aber nichts gefunden"
              hinweis="Gute Ideen für neue Inhalte – oder Begriffe, die in Texten fehlen."
              liste={d.ohneTreffer}
              einheit="×"
              leer="Alles, was gesucht wurde, hat Treffer geliefert. 👍"
            />
          </div>

          <details className="bsv-stat__info">
            <summary>So wird gezählt – und warum das datenschutzfreundlich ist</summary>
            <ul>
              <li>Keine Cookies, kein Google, keine fremden Dienste – die Zahlen bleiben auf eurem Server. Deshalb braucht die Website keinen Cookie-Banner.</li>
              <li>Ein „Besuch“ ist eine Person an einem Tag. Dafür wird aus Internet-Adresse und Browser ein Kürzel gebildet, das jeden Tag neu gemischt wird. Die Internet-Adresse selbst wird nie gespeichert, niemand lässt sich wiedererkennen.</li>
              <li>Wer im Browser „Nicht verfolgen“ eingestellt hat, wird nicht gezählt. Suchmaschinen-Roboter und angemeldete Mitarbeitende ebenfalls nicht.</li>
              <li>Alte Einträge werden automatisch gelöscht – die Frist steht unter Einstellungen → Datenschutz-Fristen (Standard 14 Monate).</li>
              <li>In die Datenschutzerklärung gehört ein kurzer Absatz dazu (siehe Hilfe-Center → „Was muss in die Datenschutzerklärung?“).</li>
            </ul>
          </details>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
