'use client'
import React, { useMemo, useState } from 'react'

export type Zeile = {
  id: number
  title: string
  untergruppe: string | null
  aktiv: boolean
  leitung: { id: number; name: string; zuletzt: string | null; alt: boolean; ohneRolle: boolean; link: boolean }[]
  zeiten: string[]
  titelbildJahr: number | null
  titelbildFehlt: boolean
  alteFotos: number
  ergebnisdienst: boolean
  geaendert: string
}
type Stand = { saisonStart: string | null; saisonGeprueft: Record<string, string>; saisonwechselAm: string | null; saisonwechselVon: string | null }

const GRUPPEN: [string, string][] = [
  ['', 'Alle'],
  ['junioren', 'Junioren'],
  ['juniorinnen', 'Juniorinnen'],
  ['senioren', 'Senioren'],
  ['seniorinnen', 'Seniorinnen'],
]
const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

/** Hinweise je Team – was beim Saisonwechsel auffällt */
function hinweise(z: Zeile): string[] {
  const h: string[] = []
  if (!z.leitung.length) h.push('Keine Verantwortlichen')
  if (z.leitung.some((p) => p.alt)) h.push('Verantwortliche lange nicht angemeldet')
  if (z.leitung.some((p) => p.ohneRolle)) h.push('Verantwortliche ohne Trainer-Rolle')
  if (!z.zeiten.length) h.push('Keine Trainingszeiten')
  if (z.alteFotos) h.push('Alte Fotos mit Personen')
  if (z.titelbildFehlt) h.push('Kein Titelbild')
  return h
}

export default function SaisonwechselClient({ zeilen, stand: start }: { zeilen: Zeile[]; stand: Stand }) {
  const [stand, setStand] = useState(start)
  const [gruppe, setGruppe] = useState('')
  const [nurOffen, setNurOffen] = useState(false)
  const [laeuft, setLaeuft] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  const geprueft = (id: number) => {
    const am = stand.saisonGeprueft[String(id)]
    return Boolean(am && (!stand.saisonStart || am >= stand.saisonStart))
  }
  const aktive = zeilen.filter((z) => z.aktiv)
  const inaktive = zeilen.filter((z) => !z.aktiv)
  const erledigt = aktive.filter((z) => geprueft(z.id)).length
  const sichtbar = useMemo(() => aktive.filter((z) => (!gruppe || z.untergruppe === gruppe) && (!nurOffen || !geprueft(z.id))), [aktive, gruppe, nurOffen, stand]) // eslint-disable-line react-hooks/exhaustive-deps

  const senden = async (body: object, schluessel: string) => {
    setLaeuft(schluessel)
    setFehler(null)
    try {
      const r = await fetch('/api/globals/wartung/saison', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) setFehler(d.fehler ?? 'Das hat nicht geklappt.')
      else setStand({ saisonStart: d.saisonStart, saisonGeprueft: d.saisonGeprueft ?? {}, saisonwechselAm: d.saisonwechselAm, saisonwechselVon: d.saisonwechselVon })
    } catch {
      setFehler('Keine Verbindung. Bitte noch einmal versuchen.')
    }
    setLaeuft(null)
  }

  const neueSaison = () => {
    if (window.confirm('Neue Saison beginnen? Alle Häkchen „geprüft“ werden zurückgesetzt. Teams und Inhalte bleiben unverändert.')) void senden({ aktion: 'start' }, 'start')
  }
  const abschliessen = () => {
    const offen = aktive.length - erledigt
    if (offen && !window.confirm(`${offen} ${offen === 1 ? 'Team ist' : 'Teams sind'} noch nicht abgehakt. Trotzdem abschließen?`)) return
    void senden({ aktion: 'abschliessen' }, 'abschliessen')
  }

  const Tabelle = ({ liste }: { liste: Zeile[] }) => (
    <ul className="bsv-saison__liste">
      {liste.map((z) => {
        const ok = geprueft(z.id)
        const h = hinweise(z)
        return (
          <li key={z.id} className={ok ? 'is-ok' : h.length ? 'hat-hinweise' : undefined}>
            <label className="bsv-saison__haken">
              <input type="checkbox" checked={ok} disabled={laeuft === `z${z.id}` || !z.aktiv} onChange={(e) => void senden({ aktion: 'pruefen', id: z.id, geprueft: e.target.checked }, `z${z.id}`)} />
              <span className="sr-only">{z.title} geprüft</span>
            </label>
            <div className="bsv-saison__name">
              <a href={`/admin/collections/angebote/${z.id}`}>{z.title}</a>
              <span>{GRUPPEN.find(([k]) => k && k === z.untergruppe)?.[1] ?? 'ohne Gruppe'}</span>
              {h.length > 0 && !ok && <span className="bsv-saison__hinweise">⚠️ {h.join(' · ')}</span>}
            </div>
            <div className="bsv-saison__spalte">
              <small>Verantwortliche</small>
              {z.leitung.length ? (
                z.leitung.map((p) => {
                  const inhalt = (
                    <>
                      {p.alt || p.ohneRolle ? '⚠️ ' : ''}
                      {p.name}
                      {p.alt ? <em> – {p.zuletzt ? `zuletzt ${datum(p.zuletzt)}` : p.link ? 'nie angemeldet' : 'lange nicht angemeldet'}</em> : p.ohneRolle ? <em> – keine Trainer-Rolle</em> : null}
                    </>
                  )
                  const klasse = p.alt || p.ohneRolle ? 'is-warn' : undefined
                  return p.link ? (
                    <a key={p.id} href={`/admin/collections/users/${p.id}`} className={klasse}>
                      {inhalt}
                    </a>
                  ) : (
                    <span key={p.id} className={klasse}>
                      {inhalt}
                    </span>
                  )
                })
              ) : (
                <span className="is-warn">⚠️ niemand</span>
              )}
            </div>
            <div className="bsv-saison__spalte">
              <small>Trainingszeiten</small>
              {z.zeiten.length ? z.zeiten.map((t, i) => <span key={i}>{t}</span>) : <span className="is-warn">⚠️ keine</span>}
            </div>
            <div className="bsv-saison__spalte">
              <small>Bilder</small>
              <span className={z.titelbildFehlt ? 'is-warn' : undefined}>{z.titelbildFehlt ? '⚠️ kein Titelbild' : `Titelbild von ${z.titelbildJahr ?? '?'}`}</span>
              {z.alteFotos > 0 && (
                <a className="is-warn" href={`/admin/collections/media?where[team][equals]=${z.id}`}>
                  ⚠️ {z.alteFotos} {z.alteFotos === 1 ? 'Foto' : 'Fotos'} mit Personen, älter als 2 Jahre
                </a>
              )}
              <span>{z.ergebnisdienst ? 'Spielplan verknüpft' : 'ohne Spielplan (FuPa / FUSSBALL.DE)'}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="bsv-saison">
      <header className="bsv-saison__kopf">
        <div>
          <h1>Saisonwechsel</h1>
          <p>Vor jeder neuen Fußball-Saison alle Teams durchgehen: Wer trainiert sie jetzt? Stimmen Namen, Alter, Zeiten und Fotos noch? Jedes Team abhaken, wenn es passt. (Breitensport-Kurse haben keine Saison und stehen hier nicht.)</p>
        </div>
        <div className="bsv-saison__stand">
          <strong>
            {erledigt} von {aktive.length} geprüft
          </strong>
          <div className="bsv-saison__balken" role="progressbar" aria-valuemin={0} aria-valuemax={aktive.length} aria-valuenow={erledigt}>
            <span style={{ width: `${aktive.length ? Math.round((erledigt / aktive.length) * 100) : 0}%` }} />
          </div>
          <small>{stand.saisonwechselAm ? `Zuletzt abgeschlossen: ${datum(stand.saisonwechselAm)}${stand.saisonwechselVon ? ` (${stand.saisonwechselVon})` : ''}` : 'Noch nie abgeschlossen.'}</small>
        </div>
      </header>

      <details className="bsv-saison__box" open={!stand.saisonwechselAm}>
        <summary>So geht&apos;s – in dieser Reihenfolge</summary>
        <ol>
          <li>
            <strong>Neue Saison beginnen</strong> (Knopf unten) – setzt die Häkchen vom letzten Jahr zurück.
          </li>
          <li>
            <strong>Namen anpassen:</strong> Aus der D-Jugend wird die C-Jugend? Im Team den Namen, das Alter und die Reihenfolge ändern. News und Bilder bleiben am Team.
          </li>
          <li>
            <strong>Verantwortliche prüfen:</strong> Wer aufhört, wird beim Team unter „Verantwortliche“ ausgetragen – und braucht er gar keinen Zugang mehr, beim Benutzer die Rolle auf „Mitglied“ ändern. Neue Trainer bekommen ein Konto (Rollen &amp; Rechte → „+ Konto anlegen“).
          </li>
          <li>
            <strong>Trainingszeiten</strong> für die neue Saison eintragen – oder die Trainer bitten, das selbst zu tun.
          </li>
          <li>
            <strong>Fotos:</strong> Alte Mannschaftsfotos mit Personen ersetzen oder löschen – besonders bei Kindern, die nicht mehr im Team sind. Neues Titelbild nur mit Einwilligung.
          </li>
          <li>
            <strong>Spielplan:</strong> Verknüpfung zu FuPa / FUSSBALL.DE für die neue Saison prüfen (die Team-IDs ändern sich oft).
          </li>
          <li>
            Teams, die es nicht mehr gibt: im Team den Haken <strong>„Aktiv“</strong> entfernen (verschwindet von der Website, nichts geht verloren).
          </li>
          <li>
            Zum Schluss <strong>„Saisonwechsel abschließen“</strong>.
          </li>
        </ol>
      </details>

      <div className="bsv-saison__werkzeuge">
        <div className="bsv-saison__filter" role="radiogroup" aria-label="Gruppe">
          {GRUPPEN.filter(([k]) => !k || aktive.some((z) => z.untergruppe === k)).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={gruppe === k} className={gruppe === k ? 'is-aktiv' : undefined} onClick={() => setGruppe(k)}>
              {l}
            </button>
          ))}
        </div>
        <label className="bsv-saison__nur-offen">
          <input type="checkbox" checked={nurOffen} onChange={(e) => setNurOffen(e.target.checked)} /> Nur noch nicht geprüfte
        </label>
      </div>

      {fehler && (
        <p className="bsv-saison__fehler" role="alert">
          {fehler}
        </p>
      )}

      {sichtbar.length ? <Tabelle liste={sichtbar} /> : <p className="bsv-saison__leer">{nurOffen ? '🎉 Alles geprüft.' : 'Keine Teams in dieser Gruppe.'}</p>}

      {inaktive.length > 0 && (
        <details className="bsv-saison__box">
          <summary>
            Nicht aktive Teams ({inaktive.length}) – auf der Website ausgeblendet
          </summary>
          <ul className="bsv-saison__inaktiv">
            {inaktive.map((z) => (
              <li key={z.id}>
                <a href={`/admin/collections/angebote/${z.id}`}>{z.title}</a>
                {z.leitung.length > 0 && <span> · noch {z.leitung.length} Verantwortliche eingetragen</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="bsv-saison__aktionen">
        <button type="button" onClick={neueSaison} disabled={laeuft !== null}>
          {laeuft === 'start' ? 'Wird gestartet …' : '🔄 Neue Saison beginnen'}
        </button>
        <button type="button" className="is-primaer" onClick={abschliessen} disabled={laeuft !== null}>
          {laeuft === 'abschliessen' ? 'Wird gespeichert …' : '✓ Saisonwechsel abschließen'}
        </button>
      </div>
    </div>
  )
}
