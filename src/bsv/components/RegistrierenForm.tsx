'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { passwortFehler } from '@/auth/passwortRegeln'
import { sha256Hex } from '@/bsv/sha256'

import { PasswortHinweis } from './PasswortHinweis'

export type AngebotWahl = { id: number; title: string; bereich: string }
type Aufgabe = { salz: string; ziel: string; max: number; signatur: string }
type Loesung = Omit<Aufgabe, 'max'> & { zahl: number; erhalten: number }

const BEREICHE: [string, string][] = [
  ['fussball', 'Fußball'],
  ['kids', 'BSV Kids'],
  ['erwachsene', 'Erwachsene & Senioren'],
]
const MIN_WARTEN = 3300 // passt zur Zeitfalle auf dem Server (3 s)

/** Unsichtbarer Bot-Schutz: Rechenaufgabe im Hintergrund lösen (in kleinen Stücken, damit die Seite flüssig bleibt) */
async function loesen(a: Aufgabe, abbruch: { aus: boolean }): Promise<number | null> {
  for (let n = 0; n <= a.max; n++) {
    if (sha256Hex(a.salz + n) === a.ziel) return n
    if (n % 3000 === 2999) {
      await new Promise((r) => setTimeout(r, 0))
      if (abbruch.aus) return null
    }
  }
  return null
}

/** Konto erstellen → Bestätigungs-E-Mail → Freigabe durch die Verwaltung */
export function RegistrierenForm({ angebote }: { angebote: AngebotWahl[] }) {
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(false)
  const [gesendet, setGesendet] = useState<string | null>(null)
  const [loesung, setLoesung] = useState<Loesung | null>(null)
  const [schutzFehler, setSchutzFehler] = useState(false)
  const [eingabe, setEingabe] = useState({ name: '', email: '', passwort: '' })
  const lauf = useRef({ aus: false })

  const neueAufgabe = useCallback(async () => {
    lauf.current.aus = true
    const abbruch = { aus: false }
    lauf.current = abbruch
    setLoesung(null)
    setSchutzFehler(false)
    try {
      const a = (await fetch('/api/users/registrieren/aufgabe', { cache: 'no-store' }).then((r) => r.json())) as Aufgabe
      const erhalten = Date.now()
      const zahl = await loesen(a, abbruch)
      if (abbruch.aus) return
      if (zahl === null) return setSchutzFehler(true)
      setLoesung({ salz: a.salz, ziel: a.ziel, signatur: a.signatur, zahl, erhalten })
    } catch {
      if (!abbruch.aus) setSchutzFehler(true)
    }
  }, [])

  useEffect(() => {
    neueAufgabe()
    const l = lauf
    return () => {
      l.current.aus = true
    }
  }, [neueAufgabe])

  async function absenden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFehler(null)
    const f = new FormData(e.currentTarget)
    const pwFehler = passwortFehler(String(f.get('passwort') ?? ''), { name: String(f.get('name') ?? ''), email: String(f.get('email') ?? '') })
    if (pwFehler) return setFehler(pwFehler)
    if (f.get('passwort') !== f.get('passwort2')) return setFehler('Die beiden Passwörter sind nicht gleich.')
    if (!loesung) return setFehler('Einen kleinen Moment noch – die Sicherheitsprüfung läuft. Dann einfach noch einmal auf „Konto erstellen“ tippen.')
    setLaedt(true)
    // Zeitfalle: nie schneller als 3 Sekunden nach dem Laden absenden (für Menschen unmerklich)
    const rest = loesung.erhalten + MIN_WARTEN - Date.now()
    if (rest > 0) await new Promise((r) => setTimeout(r, rest))
    const { erhalten: _e, ...botschutz } = loesung
    void _e
    try {
      const res = await fetch('/api/users/registrieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: f.get('name'),
          email: f.get('email'),
          passwort: f.get('passwort'),
          datenschutz: f.get('datenschutz') === 'on',
          website: f.get('website'),
          angebote: f.getAll('angebote').map(Number),
          botschutz,
        }),
      })
      const d = (await res.json().catch(() => ({}))) as { fehler?: string }
      if (res.ok) {
        setGesendet(String(f.get('email') ?? ''))
        return
      }
      setFehler(d.fehler ?? 'Das hat nicht geklappt. Bitte versuche es erneut.')
    } catch {
      setFehler('Keine Verbindung. Bitte versuche es erneut.')
    }
    // Jede Sicherheitsaufgabe gilt nur einmal → für den nächsten Versuch eine neue holen
    neueAufgabe()
    setLaedt(false)
  }

  if (gesendet)
    return (
      <div className="success" style={{ padding: 40 }} role="status">
        <div aria-hidden="true" style={{ fontSize: 44 }}>✉️</div>
        <h2 className="t-2" style={{ fontSize: 28 }}>
          Fast geschafft – schau in dein Postfach.
        </h2>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 400, lineHeight: 1.5 }}>
          Wir haben dir eine E-Mail an <strong>{gesendet}</strong> geschickt. Klicke dort auf <strong>„E-Mail-Adresse bestätigen“</strong>. Danach prüft die Verwaltung kurz, ob du Mitglied bist, und schaltet dich frei.
        </p>
        <p className="muted" style={{ margin: '12px auto 0', maxWidth: 400, fontSize: 14, lineHeight: 1.5 }}>
          Keine E-Mail da? Bitte auch im Spam-Ordner nachsehen. Hast du schon ein Konto mit dieser Adresse, bekommst du stattdessen einen Hinweis per E-Mail.
        </p>
      </div>
    )

  const gruppen = BEREICHE.map(([wert, titel]) => ({ titel, liste: angebote.filter((a) => a.bereich === wert) })).filter((g) => g.liste.length)

  return (
    <form className="form" style={{ gridTemplateColumns: '1fr' }} onSubmit={absenden}>
      <label className="field">
        Vor- und Nachname
        <input name="name" required autoComplete="name" maxLength={120} onChange={(e) => setEingabe((x) => ({ ...x, name: e.target.value }))} />
      </label>
      <label className="field">
        E-Mail
        <input name="email" type="email" required autoComplete="email" maxLength={200} onChange={(e) => setEingabe((x) => ({ ...x, email: e.target.value }))} />
      </label>
      <label className="field">
        Passwort
        <input name="passwort" type="password" required minLength={10} maxLength={200} autoComplete="new-password" aria-describedby="passwort-hinweis" onChange={(e) => setEingabe((x) => ({ ...x, passwort: e.target.value }))} />
      </label>
      <PasswortHinweis id="passwort-hinweis" passwort={eingabe.passwort} kontext={{ name: eingabe.name, email: eingabe.email }} />
      <label className="field">
        Passwort wiederholen
        <input name="passwort2" type="password" required minLength={10} maxLength={200} autoComplete="new-password" />
      </label>

      {gruppen.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          <legend style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Zu welchen Teams oder Kursen gehörst du – oder wo möchtest du hin?</legend>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Freiwillig, mehrere Kreuze möglich. Eltern kreuzen die Teams ihrer Kinder an. Das hilft uns bei der Freischaltung.
          </p>
          {gruppen.map((g) => (
            <details key={g.titel} style={{ background: '#fff', borderRadius: 14, padding: '10px 14px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 15, padding: '4px 0' }}>{g.titel}</summary>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 16px', marginTop: 8 }}>
                {g.liste.map((a) => (
                  <label key={a.id} className="check">
                    <input type="checkbox" name="angebote" value={a.id} />
                    <span>{a.title}</span>
                  </label>
                ))}
              </div>
            </details>
          ))}
        </fieldset>
      )}

      {/* Für Bots: unsichtbares Feld */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      <label className="check">
        <input type="checkbox" name="datenschutz" required />
        <span>
          Ich habe die <Link href="/datenschutz">Datenschutzhinweise</Link> gelesen.
        </span>
      </label>
      {fehler && (
        <p className="form-error" role="alert">
          {fehler}
        </p>
      )}
      {schutzFehler && (
        <p className="form-error" role="alert">
          Die Sicherheitsprüfung hat nicht geklappt.{' '}
          <button type="button" onClick={neueAufgabe} style={{ font: 'inherit', background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
            Noch einmal versuchen
          </button>
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={laedt} style={{ minHeight: 52 }}>
        {laedt ? 'Bitte warten …' : 'Konto erstellen'}
      </button>
      <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, textAlign: 'center' }} aria-live="polite">
        {loesung ? '🛡️ Sicherheitsprüfung erledigt' : schutzFehler ? '' : '🛡️ Sicherheitsprüfung läuft automatisch …'}
      </p>
      <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
        So geht’s weiter: 1. Du bestätigst deine E-Mail-Adresse. 2. Die Verwaltung prüft kurz, ob du Mitglied bist, und schaltet dich frei. Noch kein Mitglied?{' '}
        <Link href="/mitglied-werden">Hier geht’s zum Antrag.</Link>
      </p>
      <div style={{ fontSize: 15 }}>
        <Link href="/login">Schon ein Konto? Anmelden</Link>
      </div>
    </form>
  )
}
