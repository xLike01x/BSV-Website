'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export type Eintrag = { id: number; name: string; email: string; ueber: string; am: string; foto: string | null; antrag: boolean; bestaetigt: boolean; ausweise: string[] }

export default function RegistrierungenClient({ eintraege }: { eintraege: Eintrag[] }) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState<number | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  async function aktion(id: number, art: 'freigeben' | 'ablehnen') {
    if (art === 'ablehnen' && !window.confirm('Registrierung ablehnen? Das Konto wird gelöscht.')) return
    setLaeuft(id)
    setFehler(null)
    const res = await fetch('/api/users/freigabe', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, aktion: art }) }).catch(() => null)
    setLaeuft(null)
    if (!res?.ok) return setFehler('Das hat nicht geklappt. Bitte die Seite neu laden und erneut versuchen.')
    router.refresh()
  }

  return (
    <div className="bsv-reg">
      <h1>Registrierungen</h1>
      <p className="bsv-reg__intro">
        Hier landen Personen, die sich auf der Website selbst ein Konto erstellt haben (mit E-Mail oder Google). Erst nach deiner Freigabe sehen sie den Mitgliederbereich.
        <br />
        <strong>Freigeben</strong>, wenn die Person Mitglied ist. <strong>Ablehnen</strong> löscht das Konto.
        <br />
        Wichtig: Bei Registrierung per E-Mail ist nicht geprüft, ob die Adresse wirklich der Person gehört. Wenn dabei Ausweise verknüpft werden, im Zweifel kurz nachfragen (z. B. anrufen), bevor du freigibst.
      </p>
      {fehler && <p className="bsv-reg__fehler">{fehler}</p>}
      {eintraege.length === 0 ? (
        <div className="bsv-reg__leer">✓ Keine offenen Registrierungen.</div>
      ) : (
        <ul className="bsv-reg__liste">
          {eintraege.map((e) => (
            <li key={e.id}>
              {e.foto ? <img src={e.foto} alt="" className="bsv-reg__foto" /> : <span className="bsv-reg__foto">{e.name.slice(0, 1).toUpperCase()}</span>}
              <div className="bsv-reg__text">
                <strong>{e.name}</strong>
                <span>{e.email}</span>
                <small>
                  {new Date(e.am).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · {e.ueber === 'google' ? 'mit Google' : 'mit E-Mail'}
                  {e.antrag && <em> · Mitgliedsantrag mit dieser E-Mail vorhanden</em>}
                </small>
                <small className={e.bestaetigt ? 'bsv-reg__ok' : 'bsv-reg__warn'}>{e.bestaetigt ? '✓ E-Mail durch Google bestätigt' : '⚠ E-Mail nicht bestätigt'}</small>
                {e.ausweise.length > 0 && <small>Bei Freigabe erscheinen die Ausweise von: {e.ausweise.join(', ')}</small>}
              </div>
              <div className="bsv-reg__knoepfe">
                <button type="button" className="bsv-reg__ja" disabled={laeuft === e.id} onClick={() => aktion(e.id, 'freigeben')}>
                  Freigeben
                </button>
                <button type="button" className="bsv-reg__nein" disabled={laeuft === e.id} onClick={() => aktion(e.id, 'ablehnen')}>
                  Ablehnen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="bsv-reg__tipp">
        Nach der Freigabe kannst du unter „Benutzer“ noch die Teams & Kurse des Mitglieds eintragen – dann sieht es dort seine Ausfälle.
      </p>
    </div>
  )
}
