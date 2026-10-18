'use client'
import { usePreferences, useSelection } from '@payloadcms/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type Ziel = { art: 'team'; id: number } | { art: 'allgemein' } | { art: 'offen' }
export type Ordner = { key: string; titel: string; anzahl: number; query: string; symbol?: string; warn?: boolean; gedimmt?: boolean; ziel?: Ziel }
type Vorher = { id: number; team: number | null; allgemein: boolean }
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
  const [ziehen, setZiehen] = useState<number[] | null>(null)
  const [ueber, setUeber] = useState<string | null>(null)
  const [rueckgaengig, setRueckgaengig] = useState<Vorher[] | null>(null)
  const auswahl = useSelection() as { selectedIDs?: (number | string)[] } | undefined
  const auswahlRef = useRef<number[]>([])
  auswahlRef.current = (auswahl?.selectedIDs ?? []).map(Number)

  // Zeilen der Bilder-Liste ziehbar machen (auch nach Blättern/Filtern)
  useEffect(() => {
    const markieren = () => {
      document.querySelectorAll<HTMLTableRowElement>('.collection-list--media table tbody tr').forEach((tr) => {
        if (tr.dataset.bsvId) return
        const link = tr.querySelector<HTMLAnchorElement>('a[href*="/collections/media/"]')
        const id = link?.getAttribute('href')?.match(/\/collections\/media\/(\d+)/)?.[1]
        if (!id) return
        tr.dataset.bsvId = id
        tr.draggable = true
        tr.classList.add('bsv-ziehbar')
        tr.title = 'Auf einen Ordner oben ziehen, um das Bild zu verschieben'
      })
    }
    markieren()
    const beob = new MutationObserver(markieren)
    beob.observe(document.body, { childList: true, subtree: true })

    const start = (e: DragEvent) => {
      const tr = (e.target as HTMLElement)?.closest?.('tr[data-bsv-id]') as HTMLTableRowElement | null
      if (!tr) return
      const id = Number(tr.dataset.bsvId)
      const gewaehlt = auswahlRef.current
      const ids = gewaehlt.includes(id) && gewaehlt.length > 1 ? gewaehlt : [id]
      e.dataTransfer?.setData('text/plain', ids.join(','))
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      // Kleines Etikett statt der ganzen Tabellenzeile
      const etikett = document.createElement('div')
      etikett.className = 'bsv-zieh-etikett'
      etikett.textContent = ids.length === 1 ? '🖼️ 1 Bild' : `🖼️ ${ids.length} Bilder`
      document.body.appendChild(etikett)
      e.dataTransfer?.setDragImage(etikett, 20, 20)
      setTimeout(() => etikett.remove(), 0)
      setZiehen(ids)
    }
    const ende = () => {
      setZiehen(null)
      setUeber(null)
    }
    document.addEventListener('dragstart', start)
    document.addEventListener('dragend', ende)
    return () => {
      beob.disconnect()
      document.removeEventListener('dragstart', start)
      document.removeEventListener('dragend', ende)
    }
  }, [])

  const verschieben = useCallback(
    async (ids: number[], o: Ordner) => {
      if (!o.ziel || !ids.length) return
      const z = o.ziel
      const daten = z.art === 'team' ? { team: z.id, allgemein: false } : z.art === 'allgemein' ? { team: null, allgemein: true } : { team: null, allgemein: false }
      const filter = ids.map((id, i) => `where[id][in][${i}]=${id}`).join('&')
      setMeldung('Wird verschoben …')
      setRueckgaengig(null)
      try {
        // Vorherigen Stand merken – für „Rückgängig“
        const alt = await fetch(`/api/media?${filter}&depth=0&limit=${ids.length}&select[team]=true&select[allgemein]=true`, { credentials: 'include' }).then((r) => r.json())
        const vorher: Vorher[] = (alt?.docs ?? []).map((d: { id: number; team?: number | { id: number } | null; allgemein?: boolean | null }) => ({
          id: d.id,
          team: d.team == null ? null : typeof d.team === 'object' ? d.team.id : d.team,
          allgemein: Boolean(d.allgemein),
        }))
        const r = await fetch(`/api/media?${filter}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) })
        const d = await r.json()
        const ok = (d?.docs ?? []).length
        const fehler = (d?.errors ?? []).length
        if (!r.ok && !ok) throw new Error(d?.errors?.[0]?.message)
        setMeldung(`${ok === 1 ? '1 Bild' : `${ok} Bilder`} nach „${o.titel}“ verschoben.${fehler ? ` ${fehler} durften nicht verschoben werden.` : ''}`)
        setRueckgaengig(vorher.filter((v) => (d?.docs ?? []).some((x: { id: number }) => x.id === v.id)))
        router.refresh()
      } catch (e) {
        setMeldung((e as Error)?.message || 'Verschieben hat nicht geklappt. Bitte noch einmal versuchen.')
      }
    },
    [router],
  )

  useEffect(() => {
    if (!meldung || meldung.endsWith('…')) return
    const t = setTimeout(() => setMeldung(null), rueckgaengig ? 15000 : 8000)
    return () => clearTimeout(t)
  }, [meldung, rueckgaengig])

  const zuruecknehmen = async () => {
    if (!rueckgaengig) return
    setMeldung('Wird zurückgenommen …')
    for (const v of rueckgaengig)
      await fetch(`/api/media/${v.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team: v.team, allgemein: v.allgemein }) })
    setRueckgaengig(null)
    setMeldung('Zurückgenommen.')
    router.refresh()
  }

  const ablegeZiel = (o: Ordner) =>
    o.ziel
      ? {
          onDragOver: (e: React.DragEvent) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          },
          onDragEnter: () => setUeber(o.key),
          onDragLeave: (e: React.DragEvent) => {
            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setUeber((u) => (u === o.key ? null : u))
          },
          onDrop: (e: React.DragEvent) => {
            e.preventDefault()
            const ids = (e.dataTransfer.getData('text/plain') || '').split(',').map(Number).filter(Boolean)
            setZiehen(null)
            setUeber(null)
            void verschieben(ids, o)
          },
        }
      : {}

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
      <button
        type="button"
        className={`bsv-ordner__kachel${aktiv(o) ? ' is-aktiv' : ''}${o.warn ? ' is-warn' : ''}${o.gedimmt ? ' is-gedimmt' : ''}${ziehen ? (o.ziel ? ' is-ziel' : ' is-kein-ziel') : ''}${ueber === o.key ? ' is-ueber' : ''}`}
        onClick={() => oeffnen(o)}
        aria-pressed={aktiv(o)}
        title={o.titel}
        {...ablegeZiel(o)}
      >
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
              <strong>Verschieben: Bild unten in der Liste mit der Maus auf einen Ordner ziehen</strong> – angehakte Bilder wandern zusammen. Oder Bild öffnen → rechts „Ordner (Team / Kurs)“.
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

      {meldung && (
        <p className="bsv-ordner__meldung" role="status">
          {meldung}{' '}
          {rueckgaengig && rueckgaengig.length > 0 && (
            <button type="button" className="bsv-ordner__link" onClick={zuruecknehmen}>
              Rückgängig
            </button>
          )}
          <button type="button" className="bsv-ordner__zu-x" onClick={() => setMeldung(null)} aria-label="Meldung schließen">
            ×
          </button>
        </p>
      )}

      {ziehen && (
        <div className="bsv-ordner__dock" aria-live="polite">
          <p>
            <strong>{ziehen.length === 1 ? '1 Bild' : `${ziehen.length} Bilder`}</strong> – über einem Ordner loslassen:
          </p>
          <ul>
            {[...oben, ...gruppen.flatMap((g) => g.ordner)]
              .filter((o) => o.ziel)
              .map((o) => (
                <li key={o.key}>
                  <span className={`bsv-ordner__chip${ueber === `dock-${o.key}` ? ' is-ueber' : ''}`} {...ablegeZiel({ ...o, key: `dock-${o.key}` })}>
                    {o.symbol ?? '📁'} {o.titel}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

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
