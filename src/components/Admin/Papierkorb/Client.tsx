'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { PapierkorbEintrag } from '@/papierkorb/endpunkt'

type Stufe = 'alle' | 'papierkorb' | 'webadmin'

const datum = (s: string | null) => (s ? new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }) : '–')
const schluessel = (e: PapierkorbEintrag) => `${e.slug}:${e.id}`

/** Zentraler Papierkorb für Web-Admins: filtern, ansehen, wiederherstellen, endgültig löschen */
/** webAdmin = false: Zusatzrecht „papierkorb“ – nur wiederherstellen, nur der normale Papierkorb ohne persönliche Daten */
export default function PapierkorbClient({ webAdmin = true }: { webAdmin?: boolean }) {
  const [eintraege, setEintraege] = useState<PapierkorbEintrag[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [meldung, setMeldung] = useState<string | null>(null)
  const [stufe, setStufe] = useState<Stufe>('alle')
  const [bereich, setBereich] = useState('')
  const [wer, setWer] = useState('')
  const [suche, setSuche] = useState('')
  const [gewaehlt, setGewaehlt] = useState<Set<string>>(new Set())
  const [laeuft, setLaeuft] = useState(false)

  const laden = useCallback(async () => {
    const r = await fetch('/api/papierkorb/liste', { credentials: 'include', cache: 'no-store' }).catch(() => null)
    if (!r?.ok) return setFehler('Der Papierkorb konnte nicht geladen werden.')
    setEintraege((await r.json()).eintraege)
  }, [])
  useEffect(() => void laden(), [laden])

  const bereiche = useMemo(() => [...new Set((eintraege ?? []).map((e) => e.bereich))].sort((a, b) => a.localeCompare(b, 'de')), [eintraege])
  const personen = useMemo(() => [...new Set((eintraege ?? []).map((e) => e.entferntVon).filter(Boolean) as string[])].sort(), [eintraege])
  const q = suche.trim().toLocaleLowerCase('de-DE')
  const liste = (eintraege ?? []).filter(
    (e) => (stufe === 'alle' || e.stufe === stufe) && (!bereich || e.bereich === bereich) && (!wer || e.entferntVon === wer) && (!q || e.titel.toLocaleLowerCase('de-DE').includes(q)),
  )
  const anzahl = (s: Stufe) => (eintraege ?? []).filter((e) => s === 'alle' || e.stufe === s).length
  const alleGewaehlt = liste.length > 0 && liste.every((e) => gewaehlt.has(schluessel(e)))

  const umschalten = (k: string) => setGewaehlt((alt) => {
    const neu = new Set(alt)
    if (neu.has(k)) neu.delete(k)
    else neu.add(k)
    return neu
  })

  const ausfuehren = async (aktion: 'wiederherstellen' | 'loeschen', auswahl: PapierkorbEintrag[]) => {
    if (!auswahl.length) return
    if (aktion === 'loeschen' && !window.confirm(`${auswahl.length} ${auswahl.length === 1 ? 'Eintrag' : 'Einträge'} wirklich endgültig löschen? Das lässt sich nicht rückgängig machen – auch Bilder und Dateien sind dann weg.`)) return
    setLaeuft(true)
    setFehler(null)
    setMeldung(null)
    const r = await fetch('/api/papierkorb/aktion', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktion, eintraege: auswahl.map((e) => ({ slug: e.slug, id: e.id })) }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (!r?.ok) setFehler(d.fehler ?? 'Das hat nicht geklappt.')
    else {
      setMeldung(`${d.ok} ${d.ok === 1 ? 'Eintrag' : 'Einträge'} ${aktion === 'wiederherstellen' ? 'wiederhergestellt – wieder an der alten Stelle' : 'endgültig gelöscht'}.`)
      if (d.fehler?.length) setFehler(d.fehler.join(' · '))
    }
    setGewaehlt(new Set())
    await laden()
    setLaeuft(false)
  }

  const auswahl = liste.filter((e) => gewaehlt.has(schluessel(e)))

  return (
    <div className="bsv-korb">
      <header className="bsv-korb__kopf">
        <h1>Papierkorb</h1>
        {webAdmin ? (
          <p>
            Alles, was in der Verwaltung gelöscht wurde – aus allen Bereichen. <strong>Im Papierkorb</strong> liegt, was gerade gelöscht wurde (das sehen auch die anderen).{' '}
            <strong>Nur Web-Admin</strong> ist, was jemand anderes endgültig gelöscht hat oder 30 Tage im Papierkorb lag – das siehst nur du. Wiederherstellen bringt den Eintrag mit Bildern
            und Verknüpfungen an die alte Stelle zurück.
          </p>
        ) : (
          <p>
            Was in den letzten 30 Tagen gelöscht wurde und sich zurückholen lässt – ohne Bereiche mit persönlichen Daten (Anträge, Anfragen, Mitgliedschaften). Bilder und Teams erscheinen nur
            mit dem passenden Zusatzrecht. <strong>Wiederherstellen</strong> bringt den Eintrag an die alte Stelle zurück. Endgültig löschen kann nur ein Web-Admin.
          </p>
        )}
      </header>

      <div className="bsv-korb__filter">
        <div className="bsv-korb__stufen" role="tablist" aria-label="Stufe">
          {(
            [
              ['alle', 'Alle'],
              ['papierkorb', '🗑️ Im Papierkorb'],
              ['webadmin', '🔒 Nur Web-Admin'],
            ] as [Stufe, string][]
          ).filter(([k]) => webAdmin || k === 'alle').map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={stufe === k} onClick={() => setStufe(k)}>
              {l} <span>{anzahl(k)}</span>
            </button>
          ))}
        </div>
        <select value={bereich} onChange={(e) => setBereich(e.target.value)} aria-label="Bereich">
          <option value="">Alle Bereiche</option>
          {bereiche.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        {personen.length > 0 && (
          <select value={wer} onChange={(e) => setWer(e.target.value)} aria-label="Endgültig gelöscht von">
            <option value="">Endgültig gelöscht von: alle</option>
            {personen.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        )}
        <input type="search" placeholder="Titel suchen …" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Titel suchen" />
      </div>

      {meldung && <p className="bsv-korb__ok">✓ {meldung}</p>}
      {fehler && <p className="bsv-korb__fehler">{fehler}</p>}

      {auswahl.length > 0 && (
        <div className="bsv-korb__leiste">
          <strong>{auswahl.length} ausgewählt</strong>
          <button type="button" className="is-gruen" disabled={laeuft} onClick={() => ausfuehren('wiederherstellen', auswahl)}>
            ↩ Wiederherstellen
          </button>
          {webAdmin && (
            <button type="button" className="is-rot" disabled={laeuft} onClick={() => ausfuehren('loeschen', auswahl)}>
              Endgültig löschen
            </button>
          )}
          <button type="button" onClick={() => setGewaehlt(new Set())}>
            Auswahl aufheben
          </button>
        </div>
      )}

      {!eintraege ? (
        <p className="bsv-korb__leer">Lädt …</p>
      ) : liste.length === 0 ? (
        <p className="bsv-korb__leer">{eintraege.length ? 'Nichts gefunden – Filter ändern.' : 'Der Papierkorb ist leer. 🎉'}</p>
      ) : (
        <table className="bsv-korb__tabelle">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={alleGewaehlt} onChange={() => setGewaehlt(alleGewaehlt ? new Set() : new Set(liste.map(schluessel)))} aria-label="Alle auswählen" />
              </th>
              <th>Eintrag</th>
              <th>Bereich</th>
              <th>Wo</th>
              <th>Gelöscht</th>
              <th>Wird automatisch gelöscht</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((e) => (
              <tr key={schluessel(e)} className={gewaehlt.has(schluessel(e)) ? 'is-gewaehlt' : ''}>
                <td>
                  <input type="checkbox" checked={gewaehlt.has(schluessel(e))} onChange={() => umschalten(schluessel(e))} aria-label={`${e.titel} auswählen`} />
                </td>
                <td>
                  <a href={`/admin/collections/${e.slug}/trash/${e.id}`} title="Ansehen">
                    {e.titel}
                  </a>
                </td>
                <td>{e.bereich}</td>
                <td>
                  {e.stufe === 'webadmin' ? (
                    <span className="bsv-korb__pille is-webadmin" title={e.entferntVon ? `Endgültig gelöscht von ${e.entferntVon}` : undefined}>
                      🔒 Nur Web-Admin{e.entferntVon ? ` · ${e.entferntVon}` : ''}
                    </span>
                  ) : (
                    <span className="bsv-korb__pille">🗑️ Papierkorb</span>
                  )}
                </td>
                <td>
                  {datum(e.geloeschtAm)}
                  {e.entferntAm && <small>endgültig: {datum(e.entferntAm)}</small>}
                </td>
                <td>{e.stufe === 'webadmin' ? datum(e.loeschtAm) : `${datum(e.loeschtAm)} → Web-Admin`}</td>
                <td className="bsv-korb__aktionen">
                  <button type="button" disabled={laeuft} onClick={() => ausfuehren('wiederherstellen', [e])}>
                    ↩ Wiederherstellen
                  </button>
                  {webAdmin && (
                    <button type="button" className="is-rot" disabled={laeuft} onClick={() => ausfuehren('loeschen', [e])} title="Endgültig löschen">
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
