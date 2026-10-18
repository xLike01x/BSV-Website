'use client'
import { usePreferences } from '@payloadcms/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

export type Ordner = { key: string; titel: string; anzahl: number; query: string; symbol?: string; warn?: boolean; gedimmt?: boolean }
type Vorschlag = { id: number; datei: string; art: 'team' | 'allgemein'; team?: string; grund: string }

const PREF = 'bsv-medien-ordner'
const BASIS = '/admin/collections/media'

/** Vergleichbare Form der aktuellen Filter-Adresse */
const filterAus = (q: string) =>
  q
    .split('&')
    .map((t) => decodeURIComponent(t))
    .filter((t) => t.startsWith('where'))
    .sort()
    .join('&')

export default function MedienOrdnerClient({ oben, gruppen, redaktion }: { oben: Ordner[]; gruppen: { label: string; ordner: Ordner[] }[]; redaktion: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const { getPreference, setPreference } = usePreferences()
  const [zu, setZu] = useState<boolean | null>(null)
  const [vorschau, setVorschau] = useState<{ vorschlaege: Vorschlag[]; offen: { id: number; datei: string }[] } | null>(null)
  const [laeuft, setLaeuft] = useState<'' | 'pruefen' | 'uebernehmen'>('')
  const [meldung, setMeldung] = useState<string | null>(null)

  useEffect(() => {
    getPreference<{ zu?: boolean }>(PREF)
      .then((p) => setZu(Boolean(p?.zu)))
      .catch(() => setZu(false))
  }, [getPreference])

  const aktuell = useMemo(() => filterAus(params?.toString() ?? ''), [params])
  const aktiv = (o: Ordner) => filterAus(o.query) === aktuell

  const oeffnen = (o: Ordner) => router.push(o.query ? `${BASIS}?${o.query}` : BASIS)
  const umschalten = () => {
    setZu(!zu)
    void setPreference(PREF, { zu: !zu })
  }

  const auto = async (ausfuehren: boolean) => {
    setLaeuft(ausfuehren ? 'uebernehmen' : 'pruefen')
    setMeldung(null)
    try {
      const r = await fetch(`/api/media/auto-zuordnen${ausfuehren ? '?ausfuehren=1' : ''}`, { method: 'POST', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.fehler)
      if (ausfuehren) {
        setVorschau(null)
        setMeldung(`${d.geaendert} Bilder zugeordnet. Prüfe stichprobenartig – falsch Zugeordnetes änderst du im Bild rechts bei „Ordner (Team / Kurs)“.`)
        router.refresh()
      } else setVorschau(d)
    } catch {
      setMeldung('Das hat nicht geklappt. Bitte noch einmal versuchen.')
    }
    setLaeuft('')
  }

  if (zu === null) return null

  const Kachel = ({ o }: { o: Ordner }) => (
    <li>
      <button type="button" className={`bsv-ordner__kachel${aktiv(o) ? ' is-aktiv' : ''}${o.warn ? ' is-warn' : ''}${o.gedimmt ? ' is-gedimmt' : ''}`} onClick={() => oeffnen(o)} aria-pressed={aktiv(o)} title={o.titel}>
        <span className="bsv-ordner__symbol" aria-hidden="true">
          {o.symbol ?? '📁'}
        </span>
        <span className="bsv-ordner__name">{o.titel}</span>
        <span className="bsv-ordner__zahl">{o.anzahl}</span>
      </button>
    </li>
  )

  return (
    <section className="bsv-ordner">
      <div className="bsv-ordner__kopf">
        <div>
          <h2>Ordner</h2>
          {!zu && (
            <p>
              Jedes Bild liegt im Ordner seines Teams. {redaktion ? 'Trainer sehen nur die Ordner ihrer Teams und „Verein allgemein“.' : 'Du siehst die Ordner deiner Teams und „Verein allgemein“ (nur zum Benutzen).'}{' '}
              Ordner ändern: Bild öffnen → rechts „Ordner (Team / Kurs)“. Mehrere auf einmal: Bilder anhaken → „Bearbeiten“.
            </p>
          )}
        </div>
        <div className="bsv-ordner__aktionen">
          {redaktion && !zu && (
            <button type="button" className="bsv-ordner__btn" onClick={() => auto(false)} disabled={Boolean(laeuft)}>
              {laeuft === 'pruefen' ? 'Prüfe …' : '✨ Automatisch zuordnen'}
            </button>
          )}
          <button type="button" className="bsv-ordner__btn bsv-ordner__btn--leise" onClick={umschalten} aria-expanded={!zu}>
            {zu ? 'Ordner zeigen' : 'Ausblenden'}
          </button>
        </div>
      </div>

      {meldung && <p className="bsv-ordner__meldung">{meldung}</p>}

      {vorschau && (
        <div className="bsv-ordner__vorschau" role="dialog" aria-label="Vorschau automatische Zuordnung">
          <h3>Vorschlag: {vorschau.vorschlaege.length} Bilder zuordnen</h3>
          {vorschau.vorschlaege.length === 0 ? (
            <p>Für keine Bilder gibt es einen sicheren Vorschlag.</p>
          ) : (
            <>
              <p>Nur Bilder ohne Ordner werden geändert. Bitte kurz durchsehen:</p>
              <div className="bsv-ordner__tabelle-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Datei</th>
                      <th>Kommt in</th>
                      <th>Warum?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vorschau.vorschlaege.map((v) => (
                      <tr key={v.id}>
                        <td>{v.datei}</td>
                        <td>
                          <strong>{v.art === 'team' ? v.team : 'Verein allgemein'}</strong>
                        </td>
                        <td>{v.grund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {vorschau.offen.length > 0 && (
            <p className="bsv-ordner__klein">{vorschau.offen.length} Bilder bleiben in „Noch nicht zugeordnet“ – dafür gibt es keinen Hinweis. Die ordnest du am besten selbst zu.</p>
          )}
          <div className="bsv-ordner__aktionen">
            {vorschau.vorschlaege.length > 0 && (
              <button type="button" className="bsv-ordner__btn bsv-ordner__btn--primaer" onClick={() => auto(true)} disabled={Boolean(laeuft)}>
                {laeuft === 'uebernehmen' ? 'Wird übernommen …' : 'Übernehmen'}
              </button>
            )}
            <button type="button" className="bsv-ordner__btn bsv-ordner__btn--leise" onClick={() => setVorschau(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {!zu && (
        <>
          <ul className="bsv-ordner__raster">
            {oben.map((o) => (
              <Kachel key={o.key} o={o} />
            ))}
          </ul>
          {gruppen.map((g) => (
            <div key={g.label} className="bsv-ordner__gruppe">
              <h3>{g.label}</h3>
              <ul className="bsv-ordner__raster">
                {g.ordner.map((o) => (
                  <Kachel key={o.key} o={o} />
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  )
}
