'use client'
import { useAuth, usePreferences } from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { Ablauf } from '../Hilfe/Zusammenhang'
import { Zusammenhang } from '../Hilfe/Zusammenhang'
import AusfallSchnell from './AusfallSchnell'
import { EINSTIEGE, type Vorlage } from './einstiege'
import '../Hilfe/hilfe.scss'
import './einstieg.scss'

type Nutzer = { id: number; roles?: string[] }
const TEAM_ROLLEN = ['uebungsleitung', 'teamredaktion']
export const VORLAGE_SPEICHER = 'bsv-vorlage'

/** Kasten über einer Liste: Wozu ist der Bereich da, Ablauf als Grafik, Vorlagen. Inhalt aus einstiege.ts */
export default function Einstieg() {
  const pfad = usePathname() ?? ''
  const slug = pfad.match(/\/collections\/([^/]+)/)?.[1] ?? ''
  const e = EINSTIEGE[slug]
  const router = useRouter()
  const { user, permissions } = useAuth<Nutzer>()
  const { getPreference, setPreference } = usePreferences()
  const pref = `bsv-einstieg-${slug}`
  const [zu, setZu] = useState<boolean | null>(null)
  const [laeuft, setLaeuft] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [teams, setTeams] = useState<{ id: number; title: string }[]>([])
  const [team, setTeam] = useState<number | ''>('')

  const rollen = user?.roles ?? []
  const istTeamRolle = rollen.some((r) => TEAM_ROLLEN.includes(r)) && !rollen.some((r) => ['admin', 'redaktion'].includes(r))
  const darfAnlegen = Boolean((permissions as { collections?: Record<string, { create?: boolean }> } | undefined)?.collections?.[slug]?.create)

  useEffect(() => {
    getPreference<{ zu?: boolean }>(pref)
      .then((p) => setZu(Boolean(p?.zu)))
      .catch(() => setZu(false))
  }, [getPreference, pref])

  // Team-Rollen mit mehreren Teams wählen das Team für die Vorlage vorher aus
  useEffect(() => {
    if (!e?.teamFeld || !istTeamRolle || !user?.id) return
    fetch(`/api/angebote?depth=0&limit=50&sort=title&select[title]=true&where[leitung][contains]=${user.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const liste = (d?.docs ?? []) as { id: number; title: string }[]
        setTeams(liste)
        if (liste.length === 1) setTeam(liste[0]!.id)
      })
      .catch(() => {})
  }, [e?.teamFeld, istTeamRolle, user?.id])

  if (pfad.endsWith('/trash'))
    return (
      <section className="bsv-einstieg">
        <div className="bsv-einstieg__kopf">
          <div>
            <h2>🗑️ Papierkorb</h2>
            <p>
              Hier liegt, was in den letzten 30 Tagen gelöscht wurde. <strong>Zurückholen:</strong> Eintrag öffnen → „Wiederherstellen“. Nach 30 Tagen kann es nur noch ein
              Web-Admin zurückholen.
            </p>
          </div>
        </div>
      </section>
    )
  if (!e || zu === null) return null

  const umschalten = () => {
    setZu(!zu)
    void setPreference(pref, { zu: !zu })
  }

  const starten = async (v: Vorlage) => {
    setFehler(null)
    const daten = v.daten()
    if (e.teamFeld && team) daten[e.teamFeld] = team
    if (e.teamFeld && istTeamRolle && teams.length > 1 && !team) {
      setFehler('Bitte zuerst oben dein Team auswählen.')
      return
    }
    if (v.art === 'vorfuellen') {
      try {
        sessionStorage.setItem(VORLAGE_SPEICHER, JSON.stringify({ slug, daten }))
      } catch {
        /* ohne Speicher öffnet sich ein leeres Formular */
      }
      router.push(`/admin/collections/${slug}/create`)
      return
    }
    setLaeuft(v.key)
    try {
      const entwurf = slug === 'posts' || slug === 'pages'
      const r = await fetch(`/api/${slug}${entwurf ? '?draft=true' : ''}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entwurf ? { ...daten, _status: 'draft' } : daten),
      })
      const d = await r.json()
      if (!r.ok || !d?.doc?.id) throw new Error(d?.errors?.[0]?.message)
      router.push(`/admin/collections/${slug}/${d.doc.id}`)
    } catch (err) {
      setFehler((err as Error)?.message || 'Das hat nicht geklappt. Bitte noch einmal versuchen oder „Neu erstellen“ nutzen.')
      setLaeuft(null)
    }
  }

  const vorlagen = darfAnlegen ? (e.vorlagen ?? []) : []
  const grafik = e.ablauf ? <Ablauf schritte={e.ablauf} aktiv={e.aktiv} titel={e.ablaufTitel} /> : e.aktiv ? <Zusammenhang aktiv={e.aktiv} /> : null
  const links = vorlagen.length > 0 || (e.extra === 'ausfall-schnell' && darfAnlegen)

  return (
    <section className="bsv-einstieg">
      <div className="bsv-einstieg__kopf">
        <div>
          <h2>{e.titel}</h2>
          {!zu && (
            <p>
              {e.text}
              {istTeamRolle && e.textTeam ? ` ${e.textTeam}` : ''}
            </p>
          )}
        </div>
        <button type="button" className="bsv-einstieg__zu" onClick={umschalten} aria-expanded={!zu}>
          {zu ? 'Erklärung zeigen' : 'Ausblenden'}
        </button>
      </div>

      {!zu && (
        <div className={`bsv-einstieg__inhalt${links && grafik ? '' : ' is-einspaltig'}`}>
          {links && (
            <div>
              {e.extra === 'ausfall-schnell' && darfAnlegen && <AusfallSchnell />}
              {vorlagen.length > 0 && (
                <>
                  <h3>{e.vorlagenTitel ?? 'Mit einer Vorlage starten'}</h3>
                  <p className="bsv-einstieg__klein">Ein Klick genügt. Danach kannst du alles anpassen.</p>
                  {e.teamFeld && istTeamRolle && teams.length > 1 && (
                    <label className="bsv-einstieg__team">
                      Für welches Team?
                      <select value={team} onChange={(ev) => setTeam(ev.target.value ? Number(ev.target.value) : '')}>
                        <option value="">Bitte wählen …</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <ul className="bsv-einstieg__vorlagen">
                    {vorlagen.map((v) => (
                      <li key={v.key}>
                        <button type="button" onClick={() => starten(v)} disabled={Boolean(laeuft)}>
                          <span aria-hidden="true">{v.symbol}</span>
                          <span>
                            <strong>{laeuft === v.key ? 'Wird angelegt …' : v.titel}</strong>
                            <small>{v.text}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {fehler && <p className="bsv-einstieg__fehler">{fehler}</p>}
                </>
              )}
            </div>
          )}
          {grafik}
        </div>
      )}
    </section>
  )
}
