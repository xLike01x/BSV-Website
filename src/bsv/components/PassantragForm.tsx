'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

type Unterlage = { feld: string; label: string; hinweis: string }
type Datei = { id: number; name: string }
export type PassantragDaten = {
  id?: number
  fuer?: string | null
  spielerVorname?: string | null
  spielerNachname?: string | null
  geburtsdatum?: string | null
  staatsangehoerigkeit?: string | null
  erziehungsberechtigte?: string | null
  team?: number | null
  art?: string | null
  bisherigerVerein?: string | null
  abmeldedatum?: string | null
  dateien?: Record<string, Datei | null>
  hinweis?: string | null
}

const alterAus = (d?: string) => {
  if (!d) return null
  const g = new Date(d)
  if (Number.isNaN(g.getTime())) return null
  const h = new Date()
  let a = h.getFullYear() - g.getFullYear()
  if (h.getMonth() < g.getMonth() || (h.getMonth() === g.getMonth() && h.getDate() < g.getDate())) a--
  return a
}
const nurDatum = (d?: string | null) => (d ? d.slice(0, 10) : '')

/** Passantrag stellen oder Unterlagen nachreichen */
export function PassantragForm({ teams, unterlagen, vorher, vorlage }: { teams: { id: number; title: string }[]; unterlagen: Unterlage[]; vorher?: PassantragDaten; vorlage?: string | null }) {
  const router = useRouter()
  const [fuer, setFuer] = useState(vorher?.fuer ?? 'selbst')
  const [geburt, setGeburt] = useState(nurDatum(vorher?.geburtsdatum))
  const [art, setArt] = useState(vorher?.art ?? 'neu')
  const [dateien, setDateien] = useState<Record<string, Datei | null>>(vorher?.dateien ?? {})
  const [laedtHoch, setLaedtHoch] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [sendet, setSendet] = useState(false)

  const alter = alterAus(geburt)
  const minderjaehrig = alter !== null && alter < 18
  const pflicht = useMemo(() => {
    const p = ['passantrag', 'ausweis', 'passfoto', 'einwilligung']
    if (art === 'wechsel') p.push('abmeldung')
    if (art === 'international' && minderjaehrig) p.push('meldebescheinigung')
    return p
  }, [art, minderjaehrig])
  const sichtbar = unterlagen.filter((u) => pflicht.includes(u.feld) || (u.feld === 'abmeldung' && art !== 'neu') || dateien[u.feld])

  async function hochladen(feld: string, datei: File) {
    setFehler(null)
    if (datei.size > 20 * 1024 * 1024) return setFehler('Die Datei ist zu groß (höchstens 20 MB).')
    setLaedtHoch(feld)
    const fd = new FormData()
    fd.append('file', datei)
    fd.append('_payload', JSON.stringify({ art: feld }))
    const res = await fetch('/api/passdokumente', { method: 'POST', body: fd, credentials: 'same-origin' }).catch(() => null)
    setLaedtHoch(null)
    const d = (await res?.json().catch(() => null)) as { doc?: { id: number; filename: string }; errors?: { message?: string }[] } | null
    if (!res?.ok || !d?.doc) return setFehler(d?.errors?.[0]?.message?.includes('type') ? 'Bitte ein Foto (JPG oder PNG) oder eine PDF-Datei wählen.' : 'Das Hochladen hat nicht geklappt. Bitte erneut versuchen.')
    setDateien((x) => ({ ...x, [feld]: { id: d.doc!.id, name: datei.name } }))
  }

  async function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    const f = new FormData(e.currentTarget)
    const fehlt = pflicht.filter((p) => !dateien[p])
    if (fehlt.length) return setFehler(`Bitte noch hochladen: ${unterlagen.filter((u) => fehlt.includes(u.feld)).map((u) => u.label).join(', ')}.`)
    setSendet(true)
    const body: Record<string, unknown> = {
      fuer,
      spielerVorname: f.get('vorname'),
      spielerNachname: f.get('nachname'),
      geburtsdatum: geburt || null,
      staatsangehoerigkeit: f.get('staat'),
      erziehungsberechtigte: minderjaehrig ? f.get('eltern') : null,
      team: Number(f.get('team')),
      art,
      bisherigerVerein: art !== 'neu' ? f.get('verein') : null,
      abmeldedatum: art !== 'neu' ? f.get('abmeldung') || null : null,
      bestaetigt: f.get('bestaetigt') === 'on',
    }
    for (const u of unterlagen) body[u.feld] = dateien[u.feld]?.id ?? null
    const res = await fetch(vorher?.id ? `/api/passantraege/${vorher.id}` : '/api/passantraege', {
      method: vorher?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { errors?: { message?: string; data?: { errors?: { message?: string }[] } }[] } | null
    if (res?.ok) {
      router.push('/mitglieder?passantrag=ok#passantraege')
      router.refresh()
      return
    }
    setSendet(false)
    const msg = d?.errors?.[0]?.data?.errors?.[0]?.message ?? d?.errors?.[0]?.message
    setFehler(msg && !/^(Forbidden|You are not allowed)/i.test(msg) ? msg : 'Das hat nicht geklappt. Bitte prüfe deine Angaben.')
  }

  return (
    <form className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={absenden}>
      {vorher?.hinweis && (
        <p className="notice" role="status" style={{ margin: 0 }}>
          <strong>Hinweis vom Verein:</strong> {vorher.hinweis}
        </p>
      )}

      <fieldset className="pa-block">
        <legend>1. Spieler/in</legend>
        <div className="pa-wahl">
          {[
            ['selbst', 'Für mich selbst'],
            ['kind', 'Für mein Kind'],
          ].map(([w, t]) => (
            <label key={w} className={`pa-chip${fuer === w ? ' ist-aktiv' : ''}`}>
              <input type="radio" name="fuer" value={w} checked={fuer === w} onChange={() => setFuer(w)} />
              {t}
            </label>
          ))}
        </div>
        <div className="pa-zeile">
          <label className="field">
            Vorname
            <input name="vorname" required maxLength={80} defaultValue={vorher?.spielerVorname ?? ''} />
          </label>
          <label className="field">
            Nachname
            <input name="nachname" required maxLength={80} defaultValue={vorher?.spielerNachname ?? ''} />
          </label>
        </div>
        <div className="pa-zeile">
          <label className="field">
            Geburtsdatum
            <input name="geburtsdatum" type="date" required value={geburt} onChange={(e) => setGeburt(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </label>
          <label className="field">
            Staatsangehörigkeit
            <input name="staat" maxLength={60} defaultValue={vorher?.staatsangehoerigkeit ?? 'deutsch'} />
          </label>
        </div>
        {minderjaehrig && (
          <label className="field">
            Erziehungsberechtigte (Vor- und Nachname)
            <input name="eltern" required maxLength={160} defaultValue={vorher?.erziehungsberechtigte ?? ''} />
          </label>
        )}
      </fieldset>

      <fieldset className="pa-block">
        <legend>2. Team &amp; Art</legend>
        <label className="field">
          Team
          <select name="team" required defaultValue={vorher?.team ?? ''}>
            <option value="" disabled>
              Bitte wählen …
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <div className="pa-wahl pa-wahl--senkrecht">
          {[
            ['neu', 'Erster Spielerpass', 'Bisher in keinem Verein gespielt.'],
            ['wechsel', 'Vereinswechsel', 'Bisher in einem anderen deutschen Verein gespielt.'],
            ['international', 'Wechsel aus dem Ausland', 'Zuletzt in einem Verein außerhalb Deutschlands – der DFB holt die Freigabe ein.'],
          ].map(([w, t, b]) => (
            <label key={w} className={`pa-chip${art === w ? ' ist-aktiv' : ''}`}>
              <input type="radio" name="art" value={w} checked={art === w} onChange={() => setArt(w)} />
              <span>
                <strong>{t}</strong>
                <small>{b}</small>
              </span>
            </label>
          ))}
        </div>
        {art !== 'neu' && (
          <div className="pa-zeile">
            <label className="field">
              Bisheriger Verein
              <input name="verein" required maxLength={120} defaultValue={vorher?.bisherigerVerein ?? ''} />
            </label>
            <label className="field">
              Abgemeldet am
              <input name="abmeldung" type="date" defaultValue={nurDatum(vorher?.abmeldedatum)} />
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="pa-block">
        <legend>3. Unterlagen</legend>
        <p className="muted" style={{ margin: '0 0 6px', fontSize: 15, lineHeight: 1.5 }}>
          Foto mit dem Handy oder Scan genügt (JPG, PNG oder PDF).
          {minderjaehrig && ' Bei Minderjährigen müssen auch die Erziehungsberechtigten unterschreiben.'}
          {vorlage && (
            <>
              {' '}
              <a href={vorlage} target="_blank" rel="noopener">
                Formular „Antrag auf Spielberechtigung“ herunterladen ›
              </a>
            </>
          )}
        </p>
        {sichtbar.map((u) => {
          const d = dateien[u.feld]
          return (
            <div key={u.feld} className={`pa-datei${d ? ' ist-da' : ''}`}>
              <div>
                <strong>
                  {u.label}
                  {pflicht.includes(u.feld) ? '' : ' (optional)'}
                </strong>
                <small>{d ? `✓ ${d.name}` : u.hinweis}</small>
              </div>
              <label className="btn" style={{ background: d ? 'var(--bsv-soft)' : 'var(--bsv-green)', color: d ? 'var(--bsv-ink)' : '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {laedtHoch === u.feld ? 'Lädt …' : d ? 'Ersetzen' : 'Hochladen'}
                <input
                  type="file"
                  className="sr-nur"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={laedtHoch !== null}
                  onChange={(e) => {
                    const datei = e.target.files?.[0]
                    if (datei) hochladen(u.feld, datei)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          )
        })}
      </fieldset>

      <label className="check">
        <input type="checkbox" name="bestaetigt" required />
        <span>
          Ich bestätige, dass die Angaben stimmen. Die Unterlagen sehen nur die Passverwaltung des Vereins und die Übungsleitung des Teams. Nach Abschluss werden Ausweis und Foto gelöscht; den unterschriebenen Antrag muss der Verein 2 Jahre aufbewahren.
        </span>
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={sendet || laedtHoch !== null} style={{ minHeight: 52 }}>
        {sendet ? 'Bitte warten …' : vorher?.id ? 'Änderungen absenden' : 'Passantrag absenden'}
      </button>
      <Link href="/mitglieder#passantraege" style={{ fontSize: 15 }}>
        Abbrechen
      </Link>
    </form>
  )
}
