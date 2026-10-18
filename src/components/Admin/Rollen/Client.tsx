'use client'
import React, { useMemo, useState } from 'react'

export type Person = {
  id: number
  name: string
  email: string
  rollen: string[]
  zweiFaktor: boolean
  verantwortlich: { id: number; title: string }[]
  mitgliedIn: number[]
}
export type Team = {
  id: number
  title: string
  bereich: string
  aktiv: boolean
  verantwortliche: { id: number; name: string; rollen: string[] }[]
}

const ROLLEN: { key: string; label: string; farbe: string; text: string }[] = [
  { key: 'webadmin', label: 'Web-Admin', farbe: '#1d1d1f', text: 'Technik und oberste Rechte' },
  { key: 'admin', label: 'Admin', farbe: '#7c3aed', text: 'Alles außer Admin-Rechte vergeben' },
  { key: 'redaktion', label: 'Redaktion', farbe: '#1d4ed8', text: 'News, Seiten, Menü, Texte, Vereinsdaten' },
  { key: 'kasse', label: 'Kasse', farbe: '#b45309', text: 'Mitgliedsanträge, Beiträge' },
  { key: 'uebungsleitung', label: 'Übungsleitung', farbe: '#157a43', text: 'Eigene Teams inkl. Probetraining' },
  { key: 'teamredaktion', label: 'Team-Redaktion', farbe: '#0e7490', text: 'News und Fotos für eigene Teams' },
  { key: 'mitglied', label: 'Mitglied', farbe: '#6e6e73', text: 'Nur Mitgliederbereich' },
]
const ROLLE = Object.fromEntries(ROLLEN.map((r) => [r.key, r]))
const BEREICH: Record<string, string> = { fussball: 'Fußball', kids: 'BSV Kids', erwachsene: 'Erwachsene & Senioren' }

/** Anzeige-Rollen: „Admin“ ausblenden, wenn Web-Admin (ist darin enthalten) */
const sichtbar = (rollen: string[]) => rollen.filter((r) => !(r === 'admin' && rollen.includes('webadmin')))

const Chip = ({ rolle }: { rolle: string }) => {
  const r = ROLLE[rolle]
  return (
    <span className="bsv-rollen__chip" style={{ color: r?.farbe ?? '#6e6e73', borderColor: (r?.farbe ?? '#6e6e73') + '40', background: (r?.farbe ?? '#6e6e73') + '10' }}>
      {r?.label ?? rolle}
    </span>
  )
}

type Tab = 'personen' | 'teams' | 'rollen'

export default function RollenClient({ personen, teams }: { personen: Person[]; teams: Team[] }) {
  const [tab, setTab] = useState<Tab>('personen')
  const [suche, setSuche] = useState('')
  const [nurPersonal, setNurPersonal] = useState(true)
  const q = suche.trim().toLocaleLowerCase('de-DE')

  const gefiltertePersonen = useMemo(
    () =>
      personen
        .filter((p) => !nurPersonal || p.rollen.some((r) => r !== 'mitglied'))
        .filter((p) => !q || [p.name, p.email, ...p.verantwortlich.map((v) => v.title), ...p.rollen.map((r) => ROLLE[r]?.label ?? r)].some((t) => t.toLocaleLowerCase('de-DE').includes(q))),
    [personen, q, nurPersonal],
  )
  const gefilterteTeams = useMemo(
    () => teams.filter((t) => !q || [t.title, ...t.verantwortliche.map((v) => v.name)].some((x) => x.toLocaleLowerCase('de-DE').includes(q))),
    [teams, q],
  )
  const ohneVerantwortliche = teams.filter((t) => t.aktiv && t.verantwortliche.length === 0).length
  const ohne2fa = personen.filter((p) => p.rollen.some((r) => r !== 'mitglied') && !p.zweiFaktor).length

  return (
    <div className="bsv-rollen">
      <header className="bsv-rollen__kopf">
        <div>
          <h1>Rollen-Übersicht</h1>
          <p>Wer darf was – und für welche Teams? Ändern kannst du Rollen beim Benutzer, Team-Zuordnungen beim Team unter „Verantwortliche“.</p>
        </div>
        <a className="bsv-rollen__neu" href="/admin/collections/users/create">
          + Konto anlegen
        </a>
      </header>

      <div className="bsv-rollen__zahlen">
        <div>
          <strong>{personen.filter((p) => p.rollen.some((r) => r !== 'mitglied')).length}</strong>
          <span>Konten mit Verwaltungs-Zugang</span>
        </div>
        <div className={ohneVerantwortliche ? 'is-warn' : ''}>
          <strong>{ohneVerantwortliche}</strong>
          <span>aktive Teams ohne Verantwortliche</span>
        </div>
        <div className={ohne2fa ? 'is-warn' : ''}>
          <strong>{ohne2fa}</strong>
          <span>Zugänge noch ohne Zwei-Faktor</span>
        </div>
      </div>

      <div className="bsv-rollen__leiste">
        <div role="tablist" aria-label="Ansicht" className="bsv-rollen__tabs">
          {(
            [
              ['personen', 'Nach Person'],
              ['teams', 'Nach Team'],
              ['rollen', 'Nach Rolle'],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-aktiv' : ''} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>
        <input type="search" className="bsv-rollen__suche" placeholder="Suchen: Name, Team oder Rolle" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Suchen" />
      </div>

      {tab === 'personen' && (
        <section className="bsv-rollen__box">
          <label className="bsv-rollen__filter">
            <input type="checkbox" checked={nurPersonal} onChange={(e) => setNurPersonal(e.target.checked)} /> Nur Konten mit Verwaltungs-Zugang (ohne reine Mitglieder)
          </label>
          <table className="bsv-rollen__tabelle">
            <thead>
              <tr>
                <th>Person</th>
                <th>Rollen</th>
                <th>Verantwortlich für</th>
                <th>Zwei-Faktor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {gefiltertePersonen.map((p) => {
                const teamRolle = p.rollen.some((r) => r === 'uebungsleitung' || r === 'teamredaktion')
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <span className="bsv-rollen__klein">{p.email}</span>
                    </td>
                    <td>
                      <span className="bsv-rollen__chips">
                        {sichtbar(p.rollen).map((r) => (
                          <Chip key={r} rolle={r} />
                        ))}
                      </span>
                    </td>
                    <td>
                      {p.verantwortlich.length ? (
                        <span className="bsv-rollen__teams">
                          {p.verantwortlich.map((v) => (
                            <a key={v.id} href={`/admin/collections/angebote/${v.id}`}>
                              {v.title}
                            </a>
                          ))}
                        </span>
                      ) : teamRolle ? (
                        <span className="bsv-rollen__warn">⚠️ Noch keinem Team zugeordnet</span>
                      ) : (
                        <span className="bsv-rollen__klein">–</span>
                      )}
                    </td>
                    <td>{p.rollen.some((r) => r !== 'mitglied') ? (p.zweiFaktor ? '✅ eingerichtet' : <span className="bsv-rollen__warn">⏳ noch nicht</span>) : <span className="bsv-rollen__klein">nicht nötig</span>}</td>
                    <td>
                      <a href={`/admin/collections/users/${p.id}`}>Bearbeiten ›</a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {gefiltertePersonen.length === 0 && <p className="bsv-rollen__klein">Keine Treffer.</p>}
        </section>
      )}

      {tab === 'teams' && (
        <section className="bsv-rollen__box">
          {Object.entries(BEREICH).map(([bk, bl]) => {
            const liste = gefilterteTeams.filter((t) => t.bereich === bk)
            if (!liste.length) return null
            return (
              <div key={bk} className="bsv-rollen__bereich">
                <h2>{bl}</h2>
                <table className="bsv-rollen__tabelle">
                  <thead>
                    <tr>
                      <th>Team / Kurs</th>
                      <th>Verantwortliche (dürfen pflegen)</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {liste.map((t) => (
                      <tr key={t.id} className={t.aktiv ? '' : 'is-inaktiv'}>
                        <td>
                          <strong>{t.title}</strong>
                          {!t.aktiv && <span className="bsv-rollen__klein">ausgeblendet</span>}
                        </td>
                        <td>
                          {t.verantwortliche.length ? (
                            <span className="bsv-rollen__personen">
                              {t.verantwortliche.map((v) => (
                                <a key={v.id} href={`/admin/collections/users/${v.id}`}>
                                  {v.name}{' '}
                                  {sichtbar(v.rollen)
                                    .filter((r) => r !== 'mitglied')
                                    .map((r) => (
                                      <Chip key={r} rolle={r} />
                                    ))}
                                </a>
                              ))}
                            </span>
                          ) : (
                            <span className="bsv-rollen__warn">⚠️ Niemand – nur Redaktion/Admin können pflegen</span>
                          )}
                        </td>
                        <td>
                          <a href={`/admin/collections/angebote/${t.id}`}>Zuordnen ›</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </section>
      )}

      {tab === 'rollen' && (
        <section className="bsv-rollen__raster">
          {ROLLEN.map((r) => {
            const wer = personen.filter((p) => sichtbar(p.rollen).includes(r.key)).filter((p) => !q || p.name.toLocaleLowerCase('de-DE').includes(q))
            return (
              <div key={r.key} className="bsv-rollen__karte">
                <div className="bsv-rollen__karte-kopf">
                  <Chip rolle={r.key} />
                  <strong>{wer.length}</strong>
                </div>
                <p className="bsv-rollen__klein">{r.text}</p>
                <ul>
                  {wer.slice(0, r.key === 'mitglied' ? 8 : 100).map((p) => (
                    <li key={p.id}>
                      <a href={`/admin/collections/users/${p.id}`}>{p.name}</a>
                      {p.verantwortlich.length > 0 && (r.key === 'uebungsleitung' || r.key === 'teamredaktion') && (
                        <span className="bsv-rollen__klein"> · {p.verantwortlich.map((v) => v.title).join(', ')}</span>
                      )}
                    </li>
                  ))}
                  {r.key === 'mitglied' && wer.length > 8 && <li className="bsv-rollen__klein">… und {wer.length - 8} weitere</li>}
                  {wer.length === 0 && <li className="bsv-rollen__klein">Niemand</li>}
                </ul>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
