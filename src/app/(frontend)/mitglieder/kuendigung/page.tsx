import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { aktuellerBenutzer, getVerein, payload } from '@/bsv/data'
import { DruckenKnopf } from '@/bsv/components/DruckenKnopf'
import { kuendbare } from '@/kuendigungen/endpunkte'
import { quartalsende } from '@/kuendigungen/quartal'
import { berlinDatum, deutschesDatum } from '@/utilities/berlinDatum'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Kündigungsschreiben', robots: { index: false } }

const alter = (iso?: string | null) => {
  if (!iso) return null
  const g = berlinDatum(iso)
  const h = berlinDatum(new Date())
  let a = Number(h.slice(0, 4)) - Number(g.slice(0, 4))
  if (h.slice(5) < g.slice(5)) a--
  return a
}

/**
 * Fertig ausgefülltes Kündigungsschreiben zum Drucken bzw. „Als PDF speichern“.
 * Nur für Mitgliedschaften, die mit dem angemeldeten Konto verknüpft und noch kündbar sind.
 */
export default async function Kuendigungsschreiben({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>
}) {
  const user = await aktuellerBenutzer()
  if (!user) redirect('/login?weiter=/mitglieder')
  if ((user as { _zweiFaktorOffen?: boolean })._zweiFaktorOffen)
    redirect('/login/zwei-faktor?weiter=/mitglieder')
  const { m } = await searchParams
  const ids = String(m ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 20)
  const p = await payload()
  const [{ kuendbar }, verein] = await Promise.all([kuendbare(p, user.id), getVerein()])
  const personen = kuendbar.filter((k) => ids.includes(k.id))
  if (!personen.length) redirect('/mitglieder#kuendigen')

  const heute = berlinDatum(new Date())
  const wirksam = quartalsende(new Date())
  const minderjaehrig = personen.some(
    (x) =>
      x.art === 'jugend' ||
      (alter((x as { geburtsdatum?: string | null }).geburtsdatum) ?? 99) < 18,
  )
  const anschrift = (verein.postanschrift ?? 'Am Weißen Stein 2f\n46487 Wesel').split('\n')

  return (
    <div className="schreiben-seite">
      <div className="schreiben-knoepfe">
        <DruckenKnopf />
        <Link href="/mitglieder#kuendigen" className="btn btn-ghost">
          Zurück zu Mein BSV
        </Link>
        <span className="muted" style={{ fontSize: 14 }}>
          Am Handy: „Drucken“ → „Als PDF sichern“ bzw. „Teilen“. Danach unterschreiben und im
          Mitgliederbereich hochladen.
        </span>
      </div>

      <article className="schreiben">
        <div className="schreiben-absender">
          <span className="schreiben-zeile">{user.name}</span>
          <span className="schreiben-zeile">
            <small>Straße, Hausnummer</small>
          </span>
          <span className="schreiben-zeile">
            <small>PLZ, Ort</small>
          </span>
          <span>{user.email}</span>
        </div>

        <address className="schreiben-an" style={{ fontStyle: 'normal' }}>
          {verein.name ?? 'Büdericher Spielverein 1919 e.V.'}
          <br />– Kasse / Mitgliederverwaltung –
          {anschrift.map((z) => (
            <React.Fragment key={z}>
              <br />
              {z}
            </React.Fragment>
          ))}
        </address>

        <p style={{ textAlign: 'right', margin: '0 0 8mm' }}>
          <span className="schreiben-zeile" style={{ display: 'inline-block', minWidth: '45mm' }}>
            <small>Ort</small>
          </span>
          , {deutschesDatum(heute)}
        </p>

        <h1>Kündigung der Mitgliedschaft</h1>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>
          hiermit kündige ich die Mitgliedschaft im{' '}
          {verein.name ?? 'Büdericher Spielverein 1919 e.V.'} für{' '}
          {personen.length === 1 ? 'folgende Person' : 'folgende Personen'}:
        </p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mitgliedsnummer</th>
              <th>Geburtsdatum</th>
            </tr>
          </thead>
          <tbody>
            {personen.map((x) => (
              <tr key={x.id}>
                <td>{`${x.vorname} ${x.nachname}`.trim()}</td>
                <td>{x.mitgliedsnummer || '–'}</td>
                <td>
                  {(x as { geburtsdatum?: string | null }).geburtsdatum
                    ? deutschesDatum(
                        berlinDatum(String((x as { geburtsdatum?: string }).geburtsdatum)),
                      )
                    : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Laut Satzung wirkt die Kündigung zum Ende des Quartals, in dem sie beim Verein eingeht.
          Bei Eingang bis einschließlich {deutschesDatum(wirksam)} also zum{' '}
          <strong>{deutschesDatum(wirksam)}</strong>.
        </p>
        <p>
          Bitte bestätigen Sie mir die Kündigung und das Austrittsdatum. Nach dem Austritt bitte
          keine Beiträge mehr einziehen.
        </p>
        <p>Mit freundlichen Grüßen</p>

        <div className="schreiben-unterschriften">
          <span className="schreiben-zeile">
            <small>Unterschrift{personen.length > 1 ? ' (Kontoinhaber/in)' : ''}</small>
          </span>
          {minderjaehrig && (
            <span className="schreiben-zeile">
              <small>Unterschrift der/des Erziehungsberechtigten (bei Minderjährigen)</small>
            </span>
          )}
        </div>

        <p className="schreiben-hinweis">
          Erstellt im Mitgliederbereich der Website am {deutschesDatum(heute)}. Bitte unterschreiben
          und unter „Mein BSV → Mitgliedschaft kündigen“ als Foto oder PDF hochladen. Maßgeblich ist
          der Zeitpunkt des Hochladens.
        </p>
      </article>
    </div>
  )
}
