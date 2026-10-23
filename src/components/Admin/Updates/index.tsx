import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import { updatePruefungAus, updateStand, type Art, type Eintrag } from '@/wartung/updates'

import JetztPruefen from './JetztPruefen'
import SicherheitReiter from './Reiter'
import './updates.scss'

const ART: Record<Art, { symbol: string; titel: string; klasse: string }> = {
  sicherheit: { symbol: '🚨', titel: 'Sicherheitsupdate', klasse: 'is-sicherheit' },
  auslaufend: { symbol: '⏳', titel: 'Läuft aus', klasse: 'is-warn' },
  update: { symbol: '⬆️', titel: 'Update', klasse: 'is-update' },
  hauptversion: { symbol: '🧭', titel: 'Neue Hauptversion', klasse: 'is-info' },
  aktuell: { symbol: '✓', titel: 'Aktuell', klasse: 'is-ok' },
}
const wann = (iso: string) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })

function Zeile({ e, ohneTun }: { e: Eintrag; ohneTun?: boolean }) {
  const a = ART[e.art]
  return (
    <tr className={a.klasse}>
      <td className="bsv-upd__art">
        <span aria-hidden="true">{a.symbol}</span> {a.titel}
      </td>
      <th scope="row">{e.name}</th>
      <td className="bsv-upd__version">
        {e.installiert}
        {e.verfuegbar && e.verfuegbar !== e.installiert && e.art !== 'aktuell' ? ` → ${e.verfuegbar}` : ''}
      </td>
      <td>
        {e.text}
        {e.meldungen && e.meldungen.length > 0 && (
          <ul className="bsv-upd__meldungen">
            {e.meldungen.map((m, i) => (
              <li key={`${i}-${m.url ?? ''}`}>
                <strong>{m.schwere === 'critical' ? 'Kritisch' : 'Hoch'}:</strong> {m.titel}
                {m.betroffen ? ` (betroffen: ${m.betroffen})` : ''}
                {m.url && (
                  <>
                    {' '}
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      Details ↗
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {e.tun && !ohneTun && <span className="bsv-upd__tun">So geht&apos;s: {e.tun}</span>}
      </td>
    </tr>
  )
}

function Gruppe({ titel, eintraege }: { titel: string; eintraege: Eintrag[] }) {
  if (!eintraege.length) return null
  // Bei Website-Paketen ist der Weg immer derselbe – einmal unter der Tabelle statt in jeder Zeile
  const paketTun = eintraege.find((e) => e.gruppe === 'Website-Pakete' && e.tun)?.tun
  return (
    <section className="bsv-upd__box">
      <h2>{titel}</h2>
      <table className="bsv-upd__tabelle">
        <colgroup>
          <col style={{ width: '170px' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '170px' }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Status</th>
            <th>Was</th>
            <th>Version</th>
            <th>Hinweis</th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map((e) => (
            <Zeile key={e.key} e={e} ohneTun={e.gruppe === 'Website-Pakete'} />
          ))}
        </tbody>
      </table>
      {paketTun && (
        <p className="bsv-upd__tun bsv-upd__tun--gemeinsam">
          <strong>Website-Pakete – so geht&apos;s:</strong> {paketTun}
        </p>
      )}
    </section>
  )
}

/** /admin/updates – „Sicherheit“, Reiter „Updates“: alle möglichen Updates an einem Ort (nur Web-Admins) */
export default async function UpdatesSeite({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/login?weiter=/admin/updates')
  if (!hasRole(req.user as never, 'webadmin')) redirect('/admin')
  const s = updateStand()
  const offen = s.eintraege.filter((e) => e.art !== 'aktuell')
  const pakete = s.eintraege.filter((e) => e.gruppe === 'Website-Pakete')
  const anzahl = { sicherheit: s.eintraege.filter((e) => e.art === 'sicherheit').length, offen: offen.length }
  // Ohne Daten einer Quelle keine Entwarnung („keine Sicherheitslücken“, „alles aktuell“)
  const unvollstaendig = s.ohneDaten.length > 0
  const paketeUnklar = s.ohneDaten.some((q) => q.startsWith('npm'))
  const alteAngaben = s.quellenFehler.filter((q) => !s.ohneDaten.includes(q))

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
        <div className="bsv-upd">
          <header className="bsv-upd__kopf">
            <div>
              <h1>Sicherheit</h1>
              <p>
                Updates: alles, was aktualisiert werden kann – Node.js, Datenbank, Website-Pakete und Server. Wird täglich und nach jedem Start geprüft. Sicherheitsupdates zeitnah erledigen, alles andere beim
                Update-Tag (alle 3 Monate).
              </p>
            </div>
            <JetztPruefen aus={updatePruefungAus()} />
          </header>
          <SicherheitReiter aktiv="updates" />

          <div className={`bsv-upd__stand ${anzahl.sicherheit || unvollstaendig ? 'is-sicherheit' : anzahl.offen ? 'is-update' : 'is-ok'}`}>
            <strong>
              {!s.geprueftAm
                ? 'Noch nicht geprüft – „Jetzt prüfen“ klicken oder eine Minute nach dem Start warten.'
                : anzahl.sicherheit
                  ? `🚨 ${anzahl.sicherheit === 1 ? '1 Sicherheitsupdate' : `${anzahl.sicherheit} Sicherheitsupdates`} nötig${unvollstaendig ? ' – Prüfung unvollständig' : ''}`
                  : unvollstaendig
                    ? `⚠️ Prüfung unvollständig${anzahl.offen ? ` – ${anzahl.offen === 1 ? '1 Update' : `${anzahl.offen} Updates`} gefunden` : ''}${s.ohneDaten.includes('npm-Sicherheitsdatenbank') ? ', ob Sicherheitslücken bestehen, ist unbekannt' : ''}`
                    : anzahl.offen
                      ? `⬆️ ${anzahl.offen === 1 ? '1 Update' : `${anzahl.offen} Updates`} verfügbar – keine Sicherheitslücken bekannt`
                      : '✓ Alles aktuell'}
            </strong>
            {s.geprueftAm && <span>Zuletzt geprüft: {wann(s.geprueftAm)}</span>}
            {unvollstaendig && <span className="bsv-upd__fehler">Nicht erreichbar und noch nie abgerufen: {s.ohneDaten.join(', ')} – diese Angaben fehlen. Später erneut prüfen; klappt es tagelang nicht, Internetzugang des Servers prüfen.</span>}
            {alteAngaben.length > 0 && <span className="bsv-upd__fehler">Gerade nicht erreichbar: {alteAngaben.join(', ')} – dafür gelten die Angaben vom letzten erfolgreichen Abruf.</span>}
          </div>

          <Gruppe titel="Zu erledigen" eintraege={offen} />
          <Gruppe titel="System" eintraege={s.eintraege.filter((e) => e.gruppe === 'System' && e.art === 'aktuell')} />
          {s.geprueftAm && (
            <section className="bsv-upd__box">
              <h2>Website-Pakete</h2>
              <p>
                {paketeUnklar
                  ? `Die Pakete konnten nicht vollständig geprüft werden (${s.ohneDaten.filter((q) => q.startsWith('npm')).join(', ')} nicht erreichbar).${pakete.length ? ` Gefunden: ${pakete.length} von ${s.paketeGesamt}.` : ''}`
                  : pakete.length
                    ? `${pakete.length} von ${s.paketeGesamt} direkt genutzten Paketen haben eine neuere Version oder eine Meldung (siehe oben).`
                    : `Alle ${s.paketeGesamt} direkt genutzten Pakete sind auf dem neuesten Stand, keine Sicherheitsmeldungen.`}{' '}
                Indirekt genutzte Pakete prüft zusätzlich GitHub jeden Tag und schickt bei hohen oder kritischen Lücken eine E-Mail.
              </p>
            </section>
          )}

          <section className="bsv-upd__box bsv-upd__klein">
            <h2>Gut zu wissen</h2>
            <ul>
              <li>
                <strong>Website-Pakete</strong> (Next.js, Payload …) aktualisiert man nicht einzeln von Hand: Update in Auftrag geben, alle Tests laufen lassen, dann am PC <code>BSV-Website-Update.bat</code> bzw. auf dem
                Server <code>./deploy/update.sh</code> (macht vorher eine Sicherung und fällt bei Fehlern zurück).
              </li>
              <li>
                <strong>Neue Hauptversionen</strong> sind größere Umbauten – nur geplant und mit ausführlichen Tests.
              </li>
              <li>
                <strong>Server:</strong> Sicherheitsupdates des Betriebssystems installieren die automatischen Updates nachts von selbst. Steht hier „Server-Neustart“, zu einer ruhigen Zeit neu starten.
              </li>
              <li>Für die Prüfung werden nur Paketnamen und Versionsnummern an npm, endoflife.date und nodejs.org übertragen – keine Daten des Vereins.</li>
            </ul>
          </section>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
