'use client'
import { useAuth } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

const GRUENDE = ['Krankheit', 'Halle belegt', 'Ferien / Feiertag', 'Wetter', 'Sonstiges']
/** Datum in einigen Tagen als JJJJ-MM-TT – in Ortszeit (toISOString wäre UTC: nachts bis 1–2 Uhr der Vortag) */
const tag = (plus: number) => {
  const d = new Date()
  d.setDate(d.getDate() + plus)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Ausfall in drei Klicks melden: Team, Tag, Grund */
export default function AusfallSchnell() {
  const { user } = useAuth<{ id: number; roles?: string[] }>()
  const [teams, setTeams] = useState<{ id: number; title: string }[]>([])
  const [team, setTeam] = useState<number | ''>('')
  const [datum, setDatum] = useState(tag(0))
  const [grund, setGrund] = useState(GRUENDE[0]!)
  const [hinweis, setHinweis] = useState('')
  const [status, setStatus] = useState<'' | 'laeuft' | 'ok' | 'fehler'>('')
  const [meldung, setMeldung] = useState('')

  useEffect(() => {
    if (!user) return
    const alle = (user.roles ?? []).some((r) => ['admin', 'redaktion'].includes(r))
    fetch(`/api/angebote?depth=0&limit=200&sort=title&select[title]=true${alle ? '' : `&where[leitung][contains]=${user.id}`}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const liste = (d?.docs ?? []) as { id: number; title: string }[]
        setTeams(liste)
        if (liste.length === 1) setTeam(liste[0]!.id)
      })
      .catch(() => {})
  }, [user])

  const melden = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!team) {
      setStatus('fehler')
      setMeldung('Bitte ein Team auswählen.')
      return
    }
    setStatus('laeuft')
    try {
      const r = await fetch('/api/ausfaelle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ angebot: team, datum: new Date(`${datum}T12:00:00`).toISOString(), grund, hinweis: hinweis || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.errors?.[0]?.message)
      const t = teams.find((x) => x.id === team)?.title ?? 'das Team'
      setStatus('ok')
      setMeldung(`Gemeldet: ${t} am ${new Date(`${datum}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}. Der Hinweis steht jetzt auf der Teamseite.`)
      setHinweis('')
      window.setTimeout(() => window.location.reload(), 2500)
    } catch (e) {
      setStatus('fehler')
      setMeldung((e as Error)?.message || 'Das hat nicht geklappt.')
    }
  }

  return (
    <form method="post" className="bsv-ausfall" onSubmit={melden}>
      <h3>Schnell melden</h3>
      <label>
        Team / Kurs
        <select value={team} onChange={(e) => setTeam(e.target.value ? Number(e.target.value) : '')}>
          {teams.length !== 1 && <option value="">Bitte wählen …</option>}
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <div className="bsv-ausfall__tage" role="group" aria-label="Tag">
        {[
          ['Heute', tag(0)],
          ['Morgen', tag(1)],
          ['Übermorgen', tag(2)],
        ].map(([l, d]) => (
          <button key={l} type="button" className={datum === d ? 'is-aktiv' : ''} onClick={() => setDatum(d!)}>
            {l}
          </button>
        ))}
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} aria-label="Anderes Datum" />
      </div>
      <label>
        Grund
        <select value={grund} onChange={(e) => setGrund(e.target.value)}>
          {GRUENDE.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label>
        Hinweis (optional)
        <input type="text" value={hinweis} onChange={(e) => setHinweis(e.target.value)} placeholder="z. B. Nachholtermin am Freitag" />
      </label>
      <button type="submit" className="bsv-ausfall__senden" disabled={status === 'laeuft'}>
        {status === 'laeuft' ? 'Wird gemeldet …' : 'Ausfall melden'}
      </button>
      {meldung && <p className={status === 'ok' ? 'bsv-ausfall__ok' : 'bsv-einstieg__fehler'}>{meldung}</p>}
    </form>
  )
}
