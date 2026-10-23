'use client'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import type { RechteMatrix, Stufe } from './rechte'
import RollenReiter from './Reiter'

type Zugang = 'mit' | 'ohne' | 'zusatz' | 'ohne2fa' | 'alt' | 'alle'

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
  /** Einzelrechte nur für diese Person (Beschriftungen) */
  zusatzrechte: string[]
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
  {
    key: 'redaktion',
    label: 'Redaktion',
    farbe: '#1d4ed8',
    text: 'News, Seiten, Menü, Texte, Vereinsdaten',
  },
  {
    key: 'kasse',
    label: 'Kasse',
    farbe: '#b45309',
    text: 'Mitgliedsanträge, Mitgliedschaften & Ausweise, Registrierungen freigeben, Beiträge',
  },
  {
    key: 'passwesen',
    label: 'Passwesen',
    farbe: '#be123c',
    text: 'Fußball-Passanträge aller Teams',
  },
  {
    key: 'uebungsleitung',
    label: 'Trainer',
    farbe: '#157a43',
    text: 'Eigene Teams: Zeiten, Ausfälle, News, Fotos, Probetraining, Passanträge und Mitgliederliste',
  },
  {
    key: 'teamredaktion',
    label: 'Team-Redaktion',
    farbe: '#0e7490',
    text: 'News und Fotos für eigene Teams',
  },
  {
    key: 'lesen',
    label: 'Nur ansehen',
    farbe: '#475569',
    text: 'Alles lesen, nichts ändern – sensible Bereiche einzeln abschaltbar (Rechte anpassen)',
  },
  {
    key: 'mitglied',
    label: 'Mitglied',
    farbe: '#6e6e73',
    text: 'Kein Zugang zur Verwaltung – nur Mitgliederbereich auf der Website',
  },
]
const ROLLE = Object.fromEntries(ROLLEN.map((r) => [r.key, r]))
const BEREICH: Record<string, string> = {
  fussball: 'Fußball',
  kids: 'BSV Kids',
  erwachsene: 'Erwachsene & Senioren',
}

/** Anzeige-Rollen: „Admin“ ausblenden, wenn Web-Admin (ist darin enthalten) */
const sichtbar = (rollen: string[]) =>
  rollen.filter((r) => !(r === 'admin' && rollen.includes('webadmin')))

const Chip = ({ rolle }: { rolle: string }) => {
  const r = ROLLE[rolle]
  return (
    <span
      className="bsv-rollen__chip"
      style={{
        color: r?.farbe ?? '#6e6e73',
        borderColor: (r?.farbe ?? '#6e6e73') + '40',
        background: (r?.farbe ?? '#6e6e73') + '10',
      }}
    >
      {r?.label ?? rolle}
    </span>
  )
}

/** Darf die Person überhaupt in die Verwaltung? (gleiche Rollen wie der Zugriffsschutz) */
const VERWALTUNG = [
  'webadmin',
  'admin',
  'redaktion',
  'kasse',
  'passwesen',
  'uebungsleitung',
  'teamredaktion',
  'lesen',
]
const hatZugang = (p: { rollen: string[]; zusatzrechte?: string[] }) => p.rollen.some((r) => VERWALTUNG.includes(r)) || (p.zusatzrechte ?? []).length > 0

const MONAT = 30 * 86400000
/** Verwaltungs-Zugang, aber seit über 6 Monaten nicht angemeldet (oder nie, obwohl das Konto älter als 1 Monat ist) */
export const istAlt = (p: Person) => {
  if (p.testkonto || !hatZugang(p)) return false
  if (p.letzteAnmeldung) return Date.now() - new Date(p.letzteAnmeldung).getTime() > 6 * MONAT
  return Boolean(p.angelegt && Date.now() - new Date(p.angelegt).getTime() > MONAT)
}
const zuletzt = (p: Person) =>
  p.letzteAnmeldung
    ? new Date(p.letzteAnmeldung).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'noch nie'

/** Welche Konten zeigt die Liste „Nach Person“? Dieselbe Regel zählt auch die Kacheln oben. */
function passt(p: Person, z: Zugang): boolean {
  switch (z) {
    case 'alle':
      return true
    case 'mit':
      return hatZugang(p)
    case 'ohne':
      return !hatZugang(p)
    case 'zusatz':
      return p.zusatzrechte.length > 0
    case 'ohne2fa':
      return !p.testkonto && hatZugang(p) && !p.zweiFaktor
    case 'alt':
      return istAlt(p)
  }
}

type Tab = 'personen' | 'teams' | 'rollen' | 'rechte' | 'test'

export default function RollenClient({
  personen,
  teams,
  test,
  rechte,
  webadmin,
  nurAnsehen = false,
}: {
  personen: Person[]
  teams: Team[]
  test: { erlaubt: boolean; passwort: string }
  rechte: RechteMatrix
  /** Web-Admins sehen alles (Matrix, Testkonten, Zusatzrechte); Admins eine schlanke Ansicht */
  webadmin: boolean
  /** Rolle „Nur ansehen“: keine Links zum Anlegen, „Ansehen“ statt „Bearbeiten“ */
  nurAnsehen?: boolean
}) {
  const [tab, setTab] = useState<Tab>('personen')
  const [suche, setSuche] = useState('')
  const [zugang, setZugang] = useState<Zugang>('mit')
  // Kennzahl anklicken: Liste „Nach Person“ passend filtern und hinscrollen
  const zeige = (z: Zugang) => {
    setTab('personen')
    setZugang(z)
    setSuche('')
    requestAnimationFrame(() => document.querySelector('.bsv-rollen__filter')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const q = suche.trim().toLocaleLowerCase('de-DE')

  const gefiltertePersonen = useMemo(
    () =>
      personen
        .filter((p) => passt(p, zugang))
        .filter(
          (p) =>
            !q ||
            [
              p.name,
              p.email,
              ...p.verantwortlich.map((v) => v.title),
              ...p.rollen.map((r) => ROLLE[r]?.label ?? r),
            ].some((t) => t.toLocaleLowerCase('de-DE').includes(q)),
        ),
    [personen, q, zugang],
  )
  const gefilterteTeams = useMemo(
    () =>
      teams.filter(
        (t) =>
          !q ||
          [t.title, ...t.verantwortliche.map((v) => v.name)].some((x) =>
            x.toLocaleLowerCase('de-DE').includes(q),
          ),
      ),
    [teams, q],
  )
  const ohneVerantwortliche = teams.filter((t) => t.aktiv && t.verantwortliche.length === 0).length
  const alteZugaenge = personen.filter((p) => passt(p, 'alt')).length
  const ohne2fa = personen.filter((p) => passt(p, 'ohne2fa')).length

  return (
    <div className="bsv-rollen">
      {webadmin && <RollenReiter aktiv="uebersicht" />}
      <header className="bsv-rollen__kopf">
        <div>
          <h1>Rollen & Rechte</h1>
          <p>
            {nurAnsehen
              ? 'Wer darf was – und für welche Teams? Du kannst hier nur nachsehen; ändern kann ein Admin.'
              : 'Wer darf was – und für welche Teams? Ändern kannst du Rollen beim Benutzer, Team-Zuordnungen beim Team unter „Verantwortliche“.'}
          </p>
        </div>
        {!nurAnsehen && (
          <a className="bsv-rollen__neu" href="/admin/collections/users/create">
            + Konto anlegen
          </a>
        )}
      </header>

      {(webadmin || ohneVerantwortliche > 0 || ohne2fa > 0 || alteZugaenge > 0) && (
        <div className="bsv-rollen__zahlen">
          {webadmin && (
            <>
              <button type="button" onClick={() => zeige('mit')} title="Liste anzeigen">
                <strong>{personen.filter((p) => hatZugang(p)).length}</strong>
                <span>Konten mit Verwaltungs-Zugang</span>
                <em>Anzeigen ›</em>
              </button>
              <button type="button" onClick={() => zeige('ohne')} title="Liste anzeigen">
                <strong>{personen.filter((p) => !hatZugang(p)).length}</strong>
                <span>Konten ohne Verwaltungs-Zugang (nur Mitgliederbereich)</span>
                <em>Anzeigen ›</em>
              </button>
              <button type="button" onClick={() => zeige('zusatz')} title="Liste anzeigen">
                <strong>{personen.filter((p) => p.zusatzrechte.length > 0).length}</strong>
                <span>Personen mit Zusatzrechten (einzeln vergeben)</span>
                <em>Anzeigen ›</em>
              </button>
            </>
          )}
          {/* Hinweise nur, wenn es etwas zu tun gibt */}
          {ohneVerantwortliche > 0 && (
            <button type="button" className="is-warn" onClick={() => setTab('teams')} title="Teams anzeigen">
              <strong>{ohneVerantwortliche}</strong>
              <span>aktive Teams ohne Verantwortliche</span>
              <em>Anzeigen ›</em>
            </button>
          )}
          {ohne2fa > 0 && (
            <button type="button" className="is-warn" onClick={() => zeige('ohne2fa')} title="Liste anzeigen">
              <strong>{ohne2fa}</strong>
              <span>Zugänge noch ohne Zwei-Faktor</span>
              <em>Anzeigen ›</em>
            </button>
          )}
          {alteZugaenge > 0 && (
            <button type="button" className="is-warn" onClick={() => zeige('alt')} title="Liste anzeigen">
              <strong>{alteZugaenge}</strong>
              <span>Zugänge seit 6 Monaten ungenutzt</span>
              <em>Anzeigen ›</em>
            </button>
          )}
        </div>
      )}

      <div className="bsv-rollen__leiste">
        <div role="tablist" aria-label="Ansicht" className="bsv-rollen__tabs">
          {(
            [
              ['personen', 'Nach Person'],
              ['teams', 'Nach Team'],
              // Für Web-Admins: Auswertung nach Rolle, Rechte-Matrix und Testkonten
              ...(webadmin
                ? ([
                    ['rollen', 'Nach Rolle'],
                    ['rechte', 'Rechte je Rolle'],
                    ['test', `Testkonten${personen.some((p) => p.testkonto) ? ` (${personen.filter((p) => p.testkonto).length})` : ''}`],
                  ] as [Tab, string][])
                : []),
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={tab === k ? 'is-aktiv' : ''}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="bsv-rollen__suche"
          placeholder="Suchen: Name, Team oder Rolle"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          aria-label="Suchen"
        />
      </div>

      {tab === 'personen' && (
        <section className="bsv-rollen__box">
          <div className="bsv-rollen__filter" role="radiogroup" aria-label="Welche Konten?">
            {(
              [
                ['mit', `Mit Verwaltungs-Zugang (${personen.filter(hatZugang).length})`],
                [
                  'ohne',
                  `Ohne Verwaltungs-Zugang – nur Mitgliederbereich (${personen.filter((p) => !hatZugang(p)).length})`,
                ],
                ...(webadmin ? ([['zusatz', `Mit Zusatzrechten (${personen.filter((p) => p.zusatzrechte.length > 0).length})`]] as [Zugang, string][]) : []),
                ...(ohne2fa > 0 || zugang === 'ohne2fa' ? ([['ohne2fa', `⚠️ Ohne Zwei-Faktor (${ohne2fa})`]] as [Zugang, string][]) : []),
                ...(alteZugaenge > 0 || zugang === 'alt' ? ([['alt', `⚠️ Seit 6 Monaten ungenutzt (${alteZugaenge})`]] as [Zugang, string][]) : []),
                ['alle', `Alle (${personen.length})`],
              ] as [Zugang, string][]
            ).map(([k, l]) => (
              <label key={k}>
                <input
                  type="radio"
                  name="zugang"
                  checked={zugang === k}
                  onChange={() => setZugang(k)}
                />{' '}
                {l}
              </label>
            ))}
          </div>
          <table className="bsv-rollen__tabelle">
            <thead>
              <tr>
                <th>Person</th>
                <th>Rollen</th>
                <th>Verwaltung</th>
                <th>Verantwortlich für</th>
                <th>Zwei-Faktor</th>
                <th>Zuletzt da</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {gefiltertePersonen.map((p) => {
                const teamRolle = p.rollen.some(
                  (r) => r === 'uebungsleitung' || r === 'teamredaktion',
                )
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
                      {webadmin && p.zusatzrechte.length > 0 && (
                        <span className="bsv-rollen__zusatz" title="Zusatzrechte nur für diese Person – ändern beim Benutzer">
                          {p.zusatzrechte.map((z) => (
                            <span key={z}>+ {z}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td>
                      {hatZugang(p) ? (
                        <span className="bsv-rollen__ok">✅ Zugang</span>
                      ) : (
                        <span className="bsv-rollen__klein">🚫 kein Zugang</span>
                      )}
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
                    <td>
                      {p.testkonto ? (
                        <span className="bsv-rollen__klein">Testkonto – nicht nötig</span>
                      ) : hatZugang(p) ? (
                        p.zweiFaktor ? (
                          '✅ eingerichtet'
                        ) : (
                          <span className="bsv-rollen__warn">⏳ noch nicht</span>
                        )
                      ) : (
                        <span className="bsv-rollen__klein">nicht nötig</span>
                      )}
                    </td>
                    <td>
                      {istAlt(p) ? (
                        <span className="bsv-rollen__warn">⚠️ {zuletzt(p)}</span>
                      ) : (
                        <span className="bsv-rollen__klein">{zuletzt(p)}</span>
                      )}
                    </td>
                    <td>
                      <a href={`/admin/collections/users/${p.id}`}>{nurAnsehen ? 'Ansehen ›' : 'Bearbeiten ›'}</a>
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
                {/* Feste Spaltenbreiten: alle Bereiche (Fußball, Kids, Erwachsene) stehen sauber untereinander */}
                <table className="bsv-rollen__tabelle bsv-rollen__tabelle--fest">
                  <colgroup>
                    <col style={{ width: '32%' }} />
                    <col />
                    <col style={{ width: '120px' }} />
                  </colgroup>
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
                            <span className="bsv-rollen__warn">
                              ⚠️ Niemand – nur Redaktion/Admin können pflegen
                            </span>
                          )}
                        </td>
                        <td>
                          <a href={`/admin/collections/angebote/${t.id}`}>{nurAnsehen ? 'Ansehen ›' : 'Zuordnen ›'}</a>
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

      {webadmin && tab === 'rechte' && <RechteJeRolle rechte={rechte} q={q} />}

      {webadmin && tab === 'test' && <Testkonten personen={personen.filter((p) => p.testkonto)} test={test} />}

      {webadmin && tab === 'rollen' && (
        <section className="bsv-rollen__raster">
          {ROLLEN.map((r) => {
            const wer = personen
              .filter((p) => sichtbar(p.rollen).includes(r.key))
              .filter((p) => !q || p.name.toLocaleLowerCase('de-DE').includes(q))
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
                      {p.verantwortlich.length > 0 &&
                        (r.key === 'uebungsleitung' || r.key === 'teamredaktion') && (
                          <span className="bsv-rollen__klein">
                            {' '}
                            · {p.verantwortlich.map((v) => v.title).join(', ')}
                          </span>
                        )}
                    </li>
                  ))}
                  {r.key === 'mitglied' && wer.length > 8 && (
                    <li className="bsv-rollen__klein">… und {wer.length - 8} weitere</li>
                  )}
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
function Testkonten({
  personen,
  test,
}: {
  personen: Person[]
  test: { erlaubt: boolean; passwort: string }
}) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState<'' | 'anlegen' | 'loeschen'>('')
  const [meldung, setMeldung] = useState<string | null>(null)

  const los = async (art: 'anlegen' | 'loeschen') => {
    if (
      art === 'loeschen' &&
      !window.confirm('Alle Testkonten wirklich löschen? Echte Konten bleiben unberührt.')
    )
      return
    setLaeuft(art)
    setMeldung(null)
    try {
      const r = await fetch('/api/users/testkonten', {
        method: art === 'anlegen' ? 'POST' : 'DELETE',
        credentials: 'include',
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.fehler)
      setMeldung(
        art === 'anlegen'
          ? `${d.konten.length} Testkonten sind bereit.`
          : `${d.geloescht} Testkonten gelöscht.`,
      )
      router.refresh()
    } catch (e) {
      setMeldung((e as Error).message || 'Hat nicht geklappt.')
    }
    setLaeuft('')
  }

  const gruppen = personen.reduce<Record<string, Person[]>>((acc, p) => {
    const g =
      p.rollen.includes('admin') ||
      p.rollen.includes('redaktion') ||
      p.rollen.includes('kasse') ||
      p.rollen.includes('passwesen') ||
      p.rollen.every((r) => r === 'mitglied')
        ? 'Rollen'
        : p.email.startsWith('abteilung-') || p.email.startsWith('pressewart-')
          ? 'Abteilungen'
          : 'Trainer je Team'
    ;(acc[g] ??= []).push(p)
    return acc
  }, {})

  return (
    <section className="bsv-rollen__box">
      <h2 className="bsv-rollen__h2">Testkonten zum Ausprobieren</h2>
      <p>
        Ein Konto je Rolle, je Abteilung (Abteilungsleitung und Pressewart) und je Team (Trainer).
        So kannst du prüfen, ob jede Person nur das sieht und darf, was sie soll. Die Testkonten
        melden sich <strong>ohne Zwei-Faktor</strong> an – deshalb funktionieren sie{' '}
        <strong>nur auf dem lokalen Server</strong>, nicht auf der Live-Website.
      </p>
      {!test.erlaubt && (
        <p className="bsv-rollen__warn">Auf diesem Server sind Testkonten gesperrt.</p>
      )}
      <div className="bsv-rollen__reihe">
        {test.erlaubt && (
          <button
            type="button"
            className="bsv-rollen__neu"
            onClick={() => los('anlegen')}
            disabled={Boolean(laeuft)}
          >
            {laeuft === 'anlegen'
              ? 'Wird angelegt …'
              : personen.length
                ? 'Testkonten aktualisieren'
                : 'Testkonten anlegen'}
          </button>
        )}
        {personen.length > 0 && (
          <button
            type="button"
            className="bsv-rollen__leise"
            onClick={() => los('loeschen')}
            disabled={Boolean(laeuft)}
          >
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
          <p className="bsv-rollen__klein">
            Tipp: Zum Wechseln abmelden oder ein privates Browserfenster nutzen – dann kannst du
            zwei Konten gleichzeitig vergleichen.
          </p>
          {['Rollen', 'Abteilungen', 'Trainer je Team'].map((g) =>
            gruppen[g]?.length ? (
              <div key={g} className="bsv-rollen__bereich">
                <h2>{g}</h2>
                <table className="bsv-rollen__tabelle bsv-rollen__tabelle--fest">
                  <colgroup>
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '18%' }} />
                    <col />
                  </colgroup>
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
                        <td>
                          {p.verantwortlich.length
                            ? p.verantwortlich.length > 3
                              ? `${p.verantwortlich.length} Teams`
                              : p.verantwortlich.map((v) => v.title).join(', ')
                            : '–'}
                        </td>
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

const STUFE: Record<Stufe, { text: string; klasse: string }> = {
  ja: { text: '✓ ja', klasse: 'is-ja' },
  eigene: { text: '◐ nur eigene Teams', klasse: 'is-eigene' },
  nein: { text: '–', klasse: 'is-nein' },
  website: { text: 'über die Website', klasse: 'is-website' },
}

/** Wer kommt NICHT in die Verwaltung – auf einen Blick */
function KeinZugang() {
  return (
    <div className="bsv-rollen__keinzugang">
      <h3>🚫 Kein Zugang zur Verwaltung haben</h3>
      <ul>
        <li>
          <strong>Mitglieder</strong> (nur Rolle „Mitglied“) – sie sehen nur den Mitgliederbereich
          auf der Website: Ausfälle ihrer Teams, Termine, Downloads, Ausweis, Passantrag,
          Profilfoto.
        </li>
        <li>
          <strong>Selbst registrierte Konten vor der Freigabe</strong> – nicht einmal den
          Mitgliederbereich, bis Admin oder Kasse sie unter „Registrierungen“ freigibt.
        </li>
        <li>
          <strong>Personal, solange der Zwei-Faktor-Code fehlt</strong> – nach dem Passwort zählt
          das Konto nur als Mitglied, bis der Code aus der Handy-App bestätigt ist.
        </li>
        <li>
          <strong>Gesperrte Anmeldung</strong> – nach 5 falschen Passwörtern für 10 Minuten, aber nur von
          dem Anschluss, von dem geraten wurde; nach 100 Fehlversuchen von überall das ganze Konto (ein Admin
          kann sofort entsperren).
        </li>
        <li>
          <strong>Testkonten</strong> – sie funktionieren nie auf der Live-Website.
        </li>
        <li>
          <strong>Besucher ohne Konto</strong> – sie können nur Formulare abschicken (Kontakt,
          Probetraining, Mitgliedsantrag).
        </li>
      </ul>
    </div>
  )
}

/** „Rechte je Rolle“ – wie eine Regel-Übersicht, aber nur zum Ansehen (berechnet aus den echten Regeln) */
function RechteJeRolle({ rechte, q }: { rechte: RechteMatrix; q: string }) {
  const [rolle, setRolle] = useState<string>('uebungsleitung')
  const zeilen = (rechte[rolle] ?? []).filter(
    (z) => !q || z.titel.toLocaleLowerCase('de-DE').includes(q),
  )
  const gruppen = [...new Set(zeilen.map((z) => z.gruppe))]
  const anzahl = (r: string) => (rechte[r] ?? []).filter((z) => z.ansehen !== 'nein').length
  return (
    <section className="bsv-rollen__box">
      <h2 className="bsv-rollen__h2">Was darf welche Rolle?</h2>
      <p className="bsv-rollen__klein" style={{ marginBottom: 12 }}>
        Rolle wählen. Die Übersicht wird direkt aus den echten Zugriffsregeln berechnet – sie stimmt
        also immer. Wer welche Rolle hat, legst du beim Benutzer fest. Einzelne Zusatzrechte pro Rolle schaltet ein Web-Admin oben im Reiter <a href="/admin/globals/rollenRechte">„Rechte anpassen“</a> ein oder aus.
      </p>
      <div className="bsv-rechte__rollen" role="tablist" aria-label="Rolle">
        {ROLLEN.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={rolle === r.key}
            className={rolle === r.key ? 'is-aktiv' : ''}
            onClick={() => setRolle(r.key)}
          >
            <Chip rolle={r.key} /> <small>{anzahl(r.key)} Bereiche</small>
          </button>
        ))}
      </div>
      <p className="bsv-rechte__beschreibung">{ROLLE[rolle]?.text}</p>
      {rolle === 'mitglied' && <KeinZugang />}
      {rolle !== 'mitglied' &&
        gruppen.map((g) => (
          <div key={g} className="bsv-rollen__bereich">
            <h2>{g}</h2>
            <table className="bsv-rollen__tabelle bsv-rechte__tabelle">
              <thead>
                <tr>
                  <th>Bereich</th>
                  <th>Sehen</th>
                  <th>Anlegen</th>
                  <th>Bearbeiten</th>
                  <th>Löschen</th>
                </tr>
              </thead>
              <tbody>
                {zeilen
                  .filter((z) => z.gruppe === g)
                  .map((z) => (
                    <tr key={z.slug} className={z.ansehen === 'nein' ? 'is-gesperrt' : ''}>
                      <td>
                        <strong>{z.titel}</strong>
                        {z.art === 'einstellung' && (
                          <span className="bsv-rollen__klein">Einstellungsseite</span>
                        )}
                        {z.art === 'seite' && (
                          <span className="bsv-rollen__klein">eigene Seite der Verwaltung</span>
                        )}
                      </td>
                      {(['ansehen', 'anlegen', 'bearbeiten', 'loeschen'] as const).map((op) =>
                        z.art !== 'bereich' && (op === 'anlegen' || op === 'loeschen') ? (
                          <td key={op} className="is-leer" />
                        ) : (
                          <td key={op}>
                            <span className={`bsv-rechte__stufe ${STUFE[z[op]].klasse}`}>
                              {STUFE[z[op]].text}
                            </span>
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      <ul className="bsv-rechte__legende">
        <li>
          <span className="bsv-rechte__stufe is-ja">✓ ja</span> darf das überall
        </li>
        <li>
          <span className="bsv-rechte__stufe is-eigene">◐ nur eigene Teams</span> nur bei Teams, bei
          denen die Person unter „Verantwortliche“ steht
        </li>
        <li>
          <span className="bsv-rechte__stufe is-nein">–</span> darf das nicht
        </li>
        <li>
          <span className="bsv-rechte__stufe is-website">über die Website</span> Einträge entstehen
          auf der Website (Formulare für Besucher oder der Mitgliederbereich, z. B. Passanträge),
          nicht in der Verwaltung
        </li>
      </ul>
      {rolle !== 'mitglied' && <KeinZugang />}
      <p className="bsv-rollen__klein">
        Zusätzlich gilt: Admin- und Web-Admin-Rechte vergibt nur ein Web-Admin. Bankdaten sind
        verschlüsselt. „Nur eigene Teams“ bei der Mediathek heißt: Ordner der eigenen Teams plus
        „Verein allgemein“ (nur benutzen).
      </p>
    </section>
  )
}
