'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export type Eintrag = { id: number; name: string; email: string; ueber: string; am: string; foto: string | null; antrag: boolean; bestaetigt: boolean; ausweise: string[]; wuensche: number[] }
type Angebot = { id: number; title: string; bereich: string; aktiv: boolean }

const BEREICHE: [string, string][] = [
  ['fussball', 'Fußball'],
  ['kids', 'BSV Kids'],
  ['erwachsene', 'Erwachsene & Senioren'],
]

function Karte({ e, angebote, laeuft, aktion, nurAnsehen }: { e: Eintrag; angebote: Angebot[]; laeuft: boolean; aktion: (art: 'freigeben' | 'ablehnen', auswahl: number[]) => void; nurAnsehen: boolean }) {
  const [auswahl, setAuswahl] = useState<number[]>(e.wuensche)
  const [alle, setAlle] = useState(false)
  const umschalten = (id: number) => setAuswahl((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
  // Zuerst nur die Wünsche zeigen – „Alle Teams & Kurse zeigen“ klappt den Rest auf
  const sichtbar = alle || e.wuensche.length === 0 ? angebote.filter((a) => a.aktiv || auswahl.includes(a.id)) : angebote.filter((a) => e.wuensche.includes(a.id) || auswahl.includes(a.id))
  const wunschNamen = angebote.filter((a) => e.wuensche.includes(a.id)).map((a) => a.title)

  return (
    <li>
      <div className="bsv-reg__kopf">
        {e.foto ? <img src={e.foto} alt="" className="bsv-reg__foto" /> : <span className="bsv-reg__foto">{e.name.slice(0, 1).toUpperCase()}</span>}
        <div className="bsv-reg__text">
          <strong>{e.name}</strong>
          <span>{e.email}</span>
          <small>
            {new Date(e.am).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' })}
            {e.antrag && <em> · Mitgliedsantrag mit dieser E-Mail vorhanden</em>}
          </small>
          <small className="bsv-reg__ok">✓ E-Mail-Adresse bestätigt</small>
          {e.ausweise.length > 0 && <small>Bei Freigabe erscheinen die Ausweise von: {e.ausweise.join(', ')}</small>}
        </div>
      </div>
      <div className="bsv-reg__teams">
        <strong>{nurAnsehen ? 'Gewünschte Teams & Kurse' : 'Teams & Kurse zuordnen'}</strong>
        <small>{wunschNamen.length ? `Angekreuzt bei der Registrierung: ${wunschNamen.join(', ')}. Schon vorausgewählt – Haken setzen oder entfernen.` : 'Bei der Registrierung nichts angekreuzt. Passende Teams & Kurse auswählen (geht auch später unter „Benutzer“).'}</small>
        {BEREICHE.map(([wert, titel]) => {
          const liste = sichtbar.filter((a) => a.bereich === wert)
          if (!liste.length) return null
          return (
            <fieldset key={wert}>
              <legend>{titel}</legend>
              {liste.map((a) => (
                <label key={a.id} className={e.wuensche.includes(a.id) ? 'bsv-reg__wunsch' : undefined}>
                  <input type="checkbox" checked={auswahl.includes(a.id)} disabled={nurAnsehen} onChange={() => umschalten(a.id)} />
                  {a.title}
                  {e.wuensche.includes(a.id) && <span> (Wunsch)</span>}
                </label>
              ))}
            </fieldset>
          )
        })}
        {e.wuensche.length > 0 && (
          <button type="button" className="bsv-reg__mehr" onClick={() => setAlle(!alle)}>
            {alle ? 'Nur die Wünsche zeigen' : 'Alle Teams & Kurse zeigen'}
          </button>
        )}
      </div>
      {!nurAnsehen && (
        <div className="bsv-reg__knoepfe">
        <button type="button" className="bsv-reg__ja" disabled={laeuft} onClick={() => aktion('freigeben', auswahl)}>
          {auswahl.length ? `Freigeben mit ${auswahl.length} ${auswahl.length === 1 ? 'Team/Kurs' : 'Teams/Kursen'}` : 'Freigeben (ohne Team/Kurs)'}
        </button>
        <button type="button" className="bsv-reg__nein" disabled={laeuft} onClick={() => aktion('ablehnen', [])}>
          Ablehnen
        </button>
      </div>
      )}
    </li>
  )
}

export default function RegistrierungenClient({ eintraege, angebote, offen, nurAnsehen = false }: { eintraege: Eintrag[]; angebote: Angebot[]; offen: number; nurAnsehen?: boolean }) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState<number | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [meldung, setMeldung] = useState<string | null>(null)

  async function aktion(e: Eintrag, art: 'freigeben' | 'ablehnen', auswahl: number[]) {
    if (art === 'ablehnen' && !window.confirm(`Registrierung von ${e.name} ablehnen? Das Konto wird gelöscht.`)) return
    setLaeuft(e.id)
    setFehler(null)
    setMeldung(null)
    const res = await fetch('/api/users/freigabe', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id, aktion: art, angebote: auswahl }) }).catch(() => null)
    setLaeuft(null)
    if (!res?.ok) return setFehler('Das hat nicht geklappt. Bitte die Seite neu laden und erneut versuchen.')
    setMeldung(art === 'freigeben' ? `✓ ${e.name} ist freigeschaltet und bekommt eine E-Mail.` : `${e.name} wurde abgelehnt, das Konto ist gelöscht.`)
    router.refresh()
  }

  return (
    <div className="bsv-reg">
      <h1>Registrierungen</h1>
      <p className="bsv-reg__intro">
        Hier landen Personen, die sich auf der Website selbst ein Konto erstellt <strong>und ihre E-Mail-Adresse bestätigt</strong> haben. Erst nach der Freigabe sehen sie den Mitgliederbereich.
        <br />
        {nurAnsehen ? (
          'Du kannst hier nur nachsehen – freigeben oder ablehnen kann die Kasse oder ein Admin.'
        ) : (
          <>
            1. Teams & Kurse prüfen (die Wünsche der Person sind schon angehakt). 2. <strong>Freigeben</strong>, wenn die Person Mitglied ist – sie bekommt dann eine E-Mail. <strong>Ablehnen</strong> löscht das Konto.
          </>
        )}
      </p>
      {offen > 0 && (
        <p className="bsv-reg__hinweis">
          ⏳ {offen} {offen === 1 ? 'weitere Registrierung wartet' : 'weitere Registrierungen warten'} noch darauf, dass die Person den Link in der Bestätigungs-E-Mail anklickt. Sie {offen === 1 ? 'erscheint' : 'erscheinen'} erst danach hier – ohne Bestätigung werden sie nach 7 Tagen automatisch gelöscht.
        </p>
      )}
      {fehler && <p className="bsv-reg__fehler">{fehler}</p>}
      {meldung && <p className="bsv-reg__meldung">{meldung}</p>}
      {eintraege.length === 0 ? (
        <div className="bsv-reg__leer">✓ Keine offenen Registrierungen.</div>
      ) : (
        <ul className="bsv-reg__liste">
          {eintraege.map((e) => (
            <Karte key={e.id} e={e} angebote={angebote} laeuft={laeuft === e.id} aktion={(art, auswahl) => aktion(e, art, auswahl)} nurAnsehen={nurAnsehen} />
          ))}
        </ul>
      )}
      <p className="bsv-reg__tipp">Teams & Kurse lassen sich später jederzeit unter „Benutzer“ ändern. Wer einem Team zugeordnet ist, sieht im Mitgliederbereich dessen Ausfälle.</p>
    </div>
  )
}
