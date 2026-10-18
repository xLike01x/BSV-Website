'use client'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

export type Person = {
  id: number
  name: string
  email: string
  rollen: string[]
  zweiFaktor: boolean
  testkonto?: boolean
  letzteAnmeldung?: string | null
  angelegt?: string | null
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

const MONAT = 30 * 86400000
/** Verwaltungs-Zugang, aber seit über 6 Monaten nicht angemeldet (oder nie, obwohl das Konto älter als 1 Monat ist) */
export const istAlt = (p: Person) => {
  if (p.testkonto || !p.rollen.some((r) => r !== 'mitglied')) return false
  if (p.letzteAnmeldung) return Date.now() - new Date(p.letzteAnmeldung).getTime() > 6 * MONAT
  return Boolean(p.angelegt && Date.now() - new Date(p.angelegt).getTime() > MONAT)
}
const zuletzt = (p: Person) => (p.letzteAnmeldung ? new Date(p.letzteAnmeldung).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'noch nie')

type Tab = 'personen' | 'teams' | 'rollen' | 'test'

export default function RollenClient({ personen, teams, test }: { personen: Person[]; teams: Team[]; test: { erlaubt: boolean; passwort: string } }) {
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
  const alteZugaenge = personen.filter(istAlt).length
  const ohne2fa = personen.filter((p) => !p.testkonto && p.rollen.some((r) => r !== 'mitglied') && !p.zweiFaktor).length

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
        <div className={alteZugaenge ? 'is-warn' : ''}>
          <strong>{alteZugaenge}</strong>
          <span>Zugänge seit 6 Monaten ungenutzt</span>
        </div>
      </div>

      <div className="bsv-rollen__leiste">
        <div role="tablist" aria-label="Ansicht" className="bsv-rollen__tabs">
          {(
            [
              ['personen', 'Nach Person'],
              ['teams', 'Nach Team'],
              ['rollen', 'Nach Rolle'],
              ['test', `Testkonten${personen.some((p) => p.testkonto) ? ` (${personen.filter((p) => p.testkonto).length})` : ''}`],
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
                <th>Zuletzt da</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {gefiltertePersonen.map((p) => {
                const teamRolle = p.rollen.some((r) => r === 'uebungsleitung' || r === 'teamredaktion')
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>
                        {p.name} {p.testkonto && <span className="bsv-rollen__test">Test</span>}
                      </strong>
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
                    <td>{p.testkonto ? <span className="bsv-rollen__klein">Testkonto – nicht nötig</span> : p.rollen.some((r) => r !== 'mitglied') ? (p.zweiFaktor ? '✅ eingerichtet' : <span className="bsv-rollen__warn">⏳ noch nicht</span>) : <span className="bsv-rollen__klein">nicht nötig</span>}</td>
                    <td>{istAlt(p) ? <span className="bsv-rollen__warn">⚠️ {zuletzt(p)}</span> : <span className="bsv-rollen__klein">{zuletzt(p)}</span>}</td>
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

      {tab === 'test' && <Testkonten personen={personen.filter((p) => p.testkonto)} test={test} />}

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

/** Testkonten anlegen/löschen – zum Ausprobieren der Rechte (nur lokal, ohne Zwei-Faktor) */
function Testkonten({ personen, test }: { personen: Person[]; test: { erlaubt: boolean; passwort: string } }) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState<'' | 'anlegen' | 'loeschen'>('')
  const [meldung, setMeldung] = useState<string | null>(null)

  const los = async (art: 'anlegen' | 'loeschen') => {
    if (art === 'loeschen' && !window.confirm('Alle Testkonten wirklich löschen? Echte Konten bleiben unberührt.')) return
    setLaeuft(art)
    setMeldung(null)
    try {
      const r = await fetch('/api/users/testkonten', { method: art === 'anlegen' ? 'POST' : 'DELETE', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.fehler)
      setMeldung(art === 'anlegen' ? `${d.konten.length} Testkonten sind bereit.` : `${d.geloescht} Testkonten gelöscht.`)
      router.refresh()
    } catch (e) {
      setMeldung((e as Error).message || 'Hat nicht geklappt.')
    }
    setLaeuft('')
  }

  const gruppen = personen.reduce<Record<string, Person[]>>((acc, p) => {
    const g = p.rollen.includes('admin') || p.rollen.includes('redaktion') || p.rollen.includes('kasse') || p.rollen.every((r) => r === 'mitglied') ? 'Rollen' : p.email.startsWith('abteilung-') || p.email.startsWith('pressewart-') ? 'Abteilungen' : 'Trainer je Team'
    ;(acc[g] ??= []).push(p)
    return acc
  }, {})

  return (
    <section className="bsv-rollen__box">
      <h2 className="bsv-rollen__h2">Testkonten zum Ausprobieren</h2>
      <p>
        Ein Konto je Rolle, je Abteilung (Abteilungsleitung und Pressewart) und je Team (Trainer). So kannst du prüfen, ob jede Person nur das sieht und darf, was sie soll. Die
        Testkonten melden sich <strong>ohne Zwei-Faktor</strong> an – deshalb funktionieren sie <strong>nur auf dem lokalen Server</strong>, nicht auf der Live-Website.
      </p>
      {!test.erlaubt && <p className="bsv-rollen__warn">Auf diesem Server sind Testkonten gesperrt.</p>}
      <div className="bsv-rollen__reihe">
        {test.erlaubt && (
          <button type="button" className="bsv-rollen__neu" onClick={() => los('anlegen')} disabled={Boolean(laeuft)}>
            {laeuft === 'anlegen' ? 'Wird angelegt …' : personen.length ? 'Testkonten aktualisieren' : 'Testkonten anlegen'}
          </button>
        )}
        {personen.length > 0 && (
          <button type="button" className="bsv-rollen__leise" onClick={() => los('loeschen')} disabled={Boolean(laeuft)}>
            {laeuft === 'loeschen' ? 'Wird gelöscht …' : 'Alle Testkonten löschen'}
          </button>
        )}
        {personen.length > 0 && (
          <button type="button" className="bsv-rollen__leise" onClick={() => window.print()}>
            🖨️ Liste drucken
          </button>
        )}
      </div>
      {meldung && <p className="bsv-rollen__meldung">{meldung}</p>}
      {personen.length > 0 && (
        <>
          <p className="bsv-rollen__passwort">
            Passwort für alle Testkonten: <code>{test.passwort}</code>
          </p>
          <p className="bsv-rollen__klein">Tipp: Zum Wechseln abmelden oder ein privates Browserfenster nutzen – dann kannst du zwei Konten gleichzeitig vergleichen.</p>
          {['Rollen', 'Abteilungen', 'Trainer je Team'].map((g) =>
            gruppen[g]?.length ? (
              <div key={g} className="bsv-rollen__bereich">
                <h2>{g}</h2>
                <table className="bsv-rollen__tabelle">
                  <thead>
                    <tr>
                      <th>Anmeldung (E-Mail)</th>
                      <th>Name</th>
                      <th>Rolle</th>
                      <th>Teams</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruppen[g]!.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <code>{p.email}</code>
                        </td>
                        <td>{p.name}</td>
                        <td>
                          <span className="bsv-rollen__chips">
                            {sichtbar(p.rollen).map((r) => (
                              <Chip key={r} rolle={r} />
                            ))}
                          </span>
                        </td>
                        <td>{p.verantwortlich.length ? (p.verantwortlich.length > 3 ? `${p.verantwortlich.length} Teams` : p.verantwortlich.map((v) => v.title).join(', ')) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null,
          )}
        </>
      )}
    </section>
  )
}
