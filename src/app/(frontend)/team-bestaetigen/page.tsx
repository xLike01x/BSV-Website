import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'

import { AuthSeite } from '@/bsv/components/AuthSeite'
import { TeamBestaetigenKnopf } from '@/bsv/components/TeamBestaetigenKnopf'
import { linkAufloesen } from '@/sport/bestaetigung'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Passt noch?', robots: { index: false, follow: false }, referrer: 'no-referrer' }

type Args = { searchParams: Promise<{ t?: string }> }

/** Link aus der „Passt noch?“-Mail: zeigt die Angaben des Teams – bestätigt wird erst mit dem Knopf */
export default async function TeamBestaetigenSeite({ searchParams }: Args) {
  const { t } = await searchParams
  const payload = await getPayload({ config })
  const r = await linkAufloesen(payload, t)

  if (typeof r === 'string')
    return (
      <AuthSeite titel="Passt noch?">
        <div className="form" style={{ gridTemplateColumns: '1fr' }}>
          <h2 className="t-2" style={{ fontSize: 26, margin: 0 }}>
            {r === 'abgelaufen' ? 'Der Link ist abgelaufen.' : r === 'nicht-mehr' ? 'Dieses Team betreust du laut Website nicht (mehr).' : 'Der Link gilt nicht.'}
          </h2>
          <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
            {r === 'abgelaufen'
              ? 'Links aus der Erinnerungs-Mail gelten 30 Tage. Du kannst die Angaben jederzeit im Mitgliederbereich mit „✓ Passt noch“ bestätigen.'
              : r === 'nicht-mehr'
                ? 'Falls das nicht stimmt, sag bitte der Vereinsverwaltung Bescheid.'
                : 'Bitte den Link vollständig aus der E-Mail öffnen – oder die Angaben im Mitgliederbereich mit „✓ Passt noch“ bestätigen.'}
          </p>
          <div style={{ fontSize: 15 }}>
            <Link href="/mitglieder">Zum Mitgliederbereich</Link>
          </div>
        </div>
      </AuthSeite>
    )

  const zeiten = (r.team.zeiten ?? []).filter((z) => z.tag)
  const vorname = r.konto.name?.split(' ')[0]
  return (
    <AuthSeite titel="Passt noch?" text={`${vorname ? `Hallo ${vorname}, ` : ''}stimmen die Angaben zu „${r.team.title}“ noch?`}>
      <div className="form" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
        <div>
          <p className="muted" style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>
            Trainingszeiten auf der Website
          </p>
          {zeiten.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              {zeiten.map((z, i) => (
                <li key={i}>
                  {z.tag} {z.von}
                  {z.bis ? `–${z.bis}` : ''}
                  {z.ort ? `, ${z.ort}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>Keine eingetragen – auf der Website steht „Auf Anfrage“.</p>
          )}
        </div>
        {r.team.slug && (
          <p style={{ margin: 0, fontSize: 15 }}>
            <Link href={`/angebote/${r.team.slug}`} target="_blank">
              Teamseite ansehen
            </Link>
          </p>
        )}
        <TeamBestaetigenKnopf t={String(t)} />
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Etwas stimmt nicht? <a href={`/admin/collections/angebote/${r.team.id}`}>Team in der Verwaltung öffnen</a> und Zeiten oder Infos ändern – das gilt dann automatisch als bestätigt. (Kurzer Hinweis wie „Heute in Halle 2“: im <Link href="/mitglieder">Mitgliederbereich</Link> unter „Hinweis setzen“.)
        </p>
      </div>
    </AuthSeite>
  )
}
