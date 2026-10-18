import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import type { HilfeGlobal } from '../Hilfe/daten'
import { anleitungFinden, FAQ, hauptRolle, ROLLEN_PROFIL, type RolleKey } from '../Hilfe/extras'
import Drucken from './Drucken'
import './kurzanleitung.scss'

/** /admin/hilfe/kurzanleitung?rolle=… – eine Seite zum Ausdrucken oder als PDF speichern */
export default async function Kurzanleitung({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const user = req.user
  if (!user) redirect('/login?weiter=/admin/hilfe')

  const eigene = hauptRolle((user as { roles?: string[] }).roles)
  const gewuenscht = String((searchParams as Record<string, string> | undefined)?.rolle ?? '') as RolleKey
  // Admins dürfen jede Rolle drucken (zum Verteilen), alle anderen nur die eigene
  const rolle: RolleKey = eigene === 'admin' && ROLLEN_PROFIL[gewuenscht] ? gewuenscht : eigene
  const profil = ROLLEN_PROFIL[rolle]
  const anleitungen = profil.anleitungen.map(([b, id]) => anleitungFinden(b, id)).filter(Boolean)
  const global = (await req.payload.findGlobal({ slug: 'hilfe', depth: 0, user, overrideAccess: false }).catch(() => null)) as HilfeGlobal | null
  const fragen = FAQ.filter((f) => !f.bereich || ['posts', 'media', 'ausfaelle', 'users'].includes(f.bereich)).slice(0, 5)
  const stand = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div className="bsv-ka">
          <div className="bsv-ka__steuerung">
            <a href="/admin/hilfe">‹ Zurück zum Hilfe-Center</a>
            <Drucken />
          </div>

          <article className="bsv-ka__blatt">
            <header className="bsv-ka__kopf">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bsv-logo.png" alt="" width={44} height={48} />
              <div>
                <p>BSV-Verwaltung · Kurzanleitung</p>
                <h1>{profil.label}</h1>
              </div>
            </header>

            <p className="bsv-ka__intro">{profil.kurz}</p>

            <section className="bsv-ka__spalten">
              <div>
                <h2>Anmelden</h2>
                <ol>
                  <li>Website öffnen und oben rechts auf „Anmelden“ klicken.</li>
                  <li>E-Mail und Passwort eingeben.</li>
                  <li>Den 6-stelligen Code aus der Handy-App eingeben (Zwei-Faktor).</li>
                  <li>Du landest auf der Übersicht der Verwaltung.</li>
                </ol>
              </div>
              <div>
                <h2>Das kannst du</h2>
                <ul>
                  {profil.darf.map((d) => (
                    <li key={d}>✓ {d}</li>
                  ))}
                </ul>
                {profil.darfNicht.length > 0 && (
                  <>
                    <h3>Das machen andere</h3>
                    <ul>
                      {profil.darfNicht.map((d) => (
                        <li key={d}>– {d}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>

            {anleitungen.map((a) => (
              <section key={a!.id} className="bsv-ka__anleitung">
                <h2>{a!.titel}</h2>
                <ol>
                  {a!.schritte.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </section>
            ))}

            <section className="bsv-ka__anleitung">
              <h2>Gut zu wissen</h2>
              <ul>
                <li>Oben rechts auf jeder Seite gibt es den Knopf „? Hilfe“ – mit Anleitungen für genau diesen Bereich.</li>
                <li>Entwürfe sieht niemand außer euch. Erst „Veröffentlichen“ stellt etwas online.</li>
                <li>Fotos von Kindern nur mit Einverständnis der Eltern.</li>
                {fragen.map((f) => (
                  <li key={f.frage}>
                    <strong>{f.frage}</strong> {f.antwort}
                  </li>
                ))}
              </ul>
            </section>

            <footer className="bsv-ka__fuss">
              <span>{global?.ansprechperson ? `Fragen? ${global.ansprechperson}` : 'Fragen? Wende dich an einen Admin des Vereins.'}</span>
              <span>Büdericher Spielverein 1919 e.V. · Stand {stand}</span>
            </footer>
          </article>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
