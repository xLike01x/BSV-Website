'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

export type PflegeTeam = {
  id: number
  title: string
  slug: string
  zeit: string
  tage: string[]
  bannerText: string | null
  bannerBis: string | null
  bannerArt: string | null
  /** „Passt noch?“: wann die Angaben zuletzt bestätigt wurden */
  bestaetigtAm: string | null
  ausfaelle: { id: number; datum: string; grund: string | null }[]
}

const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const GRUENDE = ['Krankheit', 'Halle belegt', 'Ferien / Feiertag', 'Wetter', 'Sonstiges']
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const anzeige = (s: string) => new Date(s).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' })

/** Die nächsten Trainingstage (aus den Trainingszeiten) – ohne Zeiten einfach die nächsten 6 Tage */
function naechsteTage(tage: string[]) {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < 28 && out.length < 6; i++) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    if (!tage.length || tage.includes(WOCHENTAG[t.getDay()]!)) out.push(iso(t))
  }
  return out
}

const knopf = (aktiv: boolean): React.CSSProperties => ({
  font: 'inherit',
  fontSize: 15,
  padding: '8px 14px',
  borderRadius: 999,
  border: `1.5px solid ${aktiv ? 'var(--bsv-green)' : 'var(--bsv-line)'}`,
  background: aktiv ? 'var(--bsv-green)' : '#fff',
  color: aktiv ? '#fff' : 'var(--bsv-ink)',
  cursor: 'pointer',
})

/** Mitgliederbereich: Ausfall melden und Hinweis-Banner setzen – ohne die Verwaltung zu öffnen */
export function TeamPflege({ team, darfAusfall }: { team: PflegeTeam; darfAusfall: boolean }) {
  const router = useRouter()
  const [offen, setOffen] = useState<'' | 'ausfall' | 'banner'>('')
  const tage = useMemo(() => naechsteTage(team.tage), [team.tage])
  const [datum, setDatum] = useState(tage[0] ?? iso(new Date()))
  const [grund, setGrund] = useState('Krankheit')
  const [hinweis, setHinweis] = useState('')
  const [bannerText, setBannerText] = useState(team.bannerText ?? '')
  const [bannerBis, setBannerBis] = useState(team.bannerBis ? iso(new Date(team.bannerBis)) : '')
  const [bannerArt, setBannerArt] = useState(team.bannerArt ?? 'info')
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null)
  const [bestaetigt, setBestaetigt] = useState(team.bestaetigtAm)
  const standAlt = !bestaetigt || Date.now() - new Date(bestaetigt).getTime() > 90 * 86400000

  async function senden(url: string, method: string, body?: unknown) {
    setLaeuft(true)
    setMeldung(null)
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null)
    setLaeuft(false)
    if (!res?.ok) {
      const d = (await res?.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      setMeldung({ ok: false, text: d?.errors?.[0]?.message ?? 'Das hat nicht geklappt. Bitte erneut versuchen.' })
      return false
    }
    router.refresh()
    return true
  }

  const schonGemeldet = (t: string) => team.ausfaelle.some((a) => new Date(a.datum).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }) === t)

  async function ausfallMelden() {
    if (schonGemeldet(datum)) return setMeldung({ ok: false, text: 'Für diesen Tag ist schon ein Ausfall gemeldet.' })
    // Mittags speichern, damit der Tag in jeder Zeitzone stimmt
    if (await senden('/api/ausfaelle', 'POST', { angebot: team.id, datum: `${datum}T12:00:00.000Z`, grund, hinweis: hinweis || undefined })) {
      setMeldung({ ok: true, text: `✓ Ausfall am ${anzeige(`${datum}T12:00:00Z`)} gemeldet – steht jetzt auf der Teamseite.` })
      setOffen('')
      setHinweis('')
    }
  }

  async function passtNoch() {
    setLaeuft(true)
    setMeldung(null)
    const res = await fetch(`/api/angebote/${team.id}/bestaetigen`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => null)
    setLaeuft(false)
    const d = (await res?.json().catch(() => null)) as { am?: string; fehler?: string } | null
    if (!res?.ok || !d?.am) return setMeldung({ ok: false, text: d?.fehler ?? 'Das hat nicht geklappt. Bitte erneut versuchen.' })
    setBestaetigt(d.am)
    setMeldung({ ok: true, text: '✓ Danke! Auf der Teamseite steht jetzt der aktuelle Stand.' })
  }

  async function bannerSpeichern(loeschen = false) {
    const daten = loeschen ? { bannerText: '', bannerBis: null } : { bannerText, bannerBis: bannerBis ? `${bannerBis}T12:00:00.000Z` : null, bannerArt }
    if (await senden(`/api/angebote/${team.id}`, 'PATCH', daten)) {
      if (loeschen) setBannerText('')
      setMeldung({ ok: true, text: loeschen ? '✓ Hinweis entfernt.' : '✓ Hinweis steht jetzt oben auf der Teamseite.' })
      setOffen('')
    }
  }

  return (
    <div className="info" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong style={{ fontSize: 20 }}>{team.title}</strong>
      <span className="muted">{team.zeit}</span>
      <span style={{ fontSize: 13, color: standAlt ? '#b54708' : 'var(--bsv-muted)' }}>
        {bestaetigt ? `Angaben bestätigt: ${new Date(bestaetigt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' })}` : 'Angaben noch nie bestätigt'}
        {standAlt ? ' – stimmen Zeiten und Infos noch?' : ''}
      </span>
      {team.bannerText && <span style={{ fontSize: 14, color: '#1e3a8a' }}>ℹ️ Hinweis aktiv: „{team.bannerText}“</span>}
      {team.ausfaelle.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, display: 'grid', gap: 4, fontSize: 14 }}>
          {team.ausfaelle.map((a) => (
            <li key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>❌ {anzeige(a.datum)} · {a.grund}</span>
              <button type="button" title="Landet im Papierkorb und lässt sich 30 Tage zurückholen" disabled={laeuft} onClick={() => senden(`/api/ausfaelle/${a.id}`, 'PATCH', { deletedAt: new Date().toISOString() }).then((ok) => ok && setMeldung({ ok: true, text: '✓ Ausfall zurückgenommen.' }))} style={{ font: 'inherit', fontSize: 13, background: 'none', border: 0, padding: 0, color: 'var(--bsv-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                zurücknehmen
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {darfAusfall && (
          <button type="button" className="btn btn-primary" style={{ minHeight: 40, padding: '0 16px', fontSize: 15 }} onClick={() => setOffen(offen === 'ausfall' ? '' : 'ausfall')}>
            Ausfall melden
          </button>
        )}
        <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: '0 16px', fontSize: 15 }} onClick={() => setOffen(offen === 'banner' ? '' : 'banner')}>
          Hinweis setzen
        </button>
        <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: '0 16px', fontSize: 15 }} disabled={laeuft} onClick={passtNoch} title="Zeiten und Infos auf der Teamseite stimmen noch">
          ✓ Passt noch
        </button>
      </div>

      {offen === 'ausfall' && (
        <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Wann fällt es aus?</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tage.map((t) => (
              <button key={t} type="button" style={{ ...knopf(datum === t), ...(schonGemeldet(t) ? { opacity: 0.45, textDecoration: 'line-through' } : {}) }} disabled={schonGemeldet(t)} title={schonGemeldet(t) ? 'Schon als Ausfall gemeldet' : undefined} onClick={() => setDatum(t)}>
                {anzeige(`${t}T12:00:00Z`)}
              </button>
            ))}
            <input type="date" value={datum} min={iso(new Date())} onChange={(e) => setDatum(e.target.value)} aria-label="Anderes Datum" style={{ font: 'inherit', fontSize: 15, padding: '6px 10px', borderRadius: 999, border: '1.5px solid var(--bsv-line)' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Warum?</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {GRUENDE.map((g) => (
              <button key={g} type="button" style={knopf(grund === g)} onClick={() => setGrund(g)}>
                {g}
              </button>
            ))}
          </div>
          <input value={hinweis} onChange={(e) => setHinweis(e.target.value)} maxLength={300} placeholder="Hinweis (optional), z. B. Nachholtermin am Freitag" style={{ font: 'inherit', fontSize: 15, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--bsv-line)' }} />
          <button type="button" className="btn btn-primary" disabled={laeuft} onClick={ausfallMelden} style={{ justifySelf: 'start' }}>
            {laeuft ? 'Wird gemeldet …' : 'Ausfall jetzt melden'}
          </button>
        </div>
      )}

      {offen === 'banner' && (
        <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
          <input value={bannerText} onChange={(e) => setBannerText(e.target.value)} maxLength={160} placeholder="z. B. Training heute in Halle 2" aria-label="Hinweis" style={{ font: 'inherit', fontSize: 15, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--bsv-line)' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" style={knopf(bannerArt === 'info')} onClick={() => setBannerArt('info')}>
              ℹ️ Info
            </button>
            <button type="button" style={knopf(bannerArt === 'wichtig')} onClick={() => setBannerArt('wichtig')}>
              ⚠️ Wichtig
            </button>
            <label style={{ fontSize: 15, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              anzeigen bis
              <input type="date" value={bannerBis} min={iso(new Date())} onChange={(e) => setBannerBis(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '6px 10px', borderRadius: 999, border: '1.5px solid var(--bsv-line)' }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" disabled={laeuft || !bannerText.trim()} onClick={() => bannerSpeichern()}>
              Hinweis speichern
            </button>
            {team.bannerText && (
              <button type="button" className="btn btn-ghost" disabled={laeuft} onClick={() => bannerSpeichern(true)}>
                Hinweis entfernen
              </button>
            )}
          </div>
        </div>
      )}

      {meldung && (
        <p role="status" style={{ margin: 0, fontSize: 14, color: meldung.ok ? 'var(--bsv-green)' : '#b42318' }}>
          {meldung.text}
        </p>
      )}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6, fontSize: 14 }}>
        <a href="/admin/collections/posts/create" className="link-more">
          News schreiben ›
        </a>
        <a href={`/admin/collections/angebote/${team.id}`} className="link-more">
          Team bearbeiten ›
        </a>
        <Link href={`/angebote/${team.slug}`}>Teamseite ansehen</Link>
      </div>
    </div>
  )
}
