'use client'
import { useAuth, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import './posteingang.scss'

type Eintrag = { id?: string; text: string; vonName?: string | null; am: string; art?: string | null }
type Stand = { zustaendig: number | null; zustaendigName: string | null; verlauf: Eintrag[] }

const BETREFF: Record<string, (f: Record<string, string>) => string> = {
  mitgliedsantraege: () => 'Dein Mitgliedsantrag beim BSV 1919',
  kontaktanfragen: (f) => (f.betreff ? `Re: ${f.betreff}` : 'Deine Nachricht an den BSV 1919'),
  probetraining: () => 'Dein Probetraining beim BSV 1919',
}

const datum = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date(iso))

const idVon = (v: unknown) => (v && typeof v === 'object' ? ((v as { id?: number }).id ?? null) : ((v as number | null) ?? null))

/**
 * Kasten oben in Mitgliedsanträgen, Kontakt- und Probetraining-Anfragen:
 * Wer kümmert sich? · Antworten per E-Mail/Telefon · Notizen mit Name und Datum.
 */
export default function PosteingangKopf() {
  const { id, collectionSlug, docPermissions } = useDocumentInfo()
  // Ohne Recht zum Bearbeiten (z. B. „Nur ansehen“): nur anzeigen – keine Knöpfe zum Übernehmen und keine Notizen
  const darfBearbeiten = Boolean((docPermissions as { update?: unknown } | undefined)?.update)
  const { user } = useAuth<{ id: number; roles?: string[] }>()
  const zustaendigFeld = useField<number | null>({ path: 'zustaendig' })
  const f = useFormFields(([x]) => ({
    email: String(x.email?.value ?? ''),
    telefon: String(x.telefon?.value ?? ''),
    vorname: String(x.vorname?.value ?? ''),
    name: String(x.name?.value ?? ''),
    betreff: String(x.betreff?.value ?? ''),
  }))
  const [stand, setStand] = useState<Stand | null>(null)
  const [text, setText] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const laden = useCallback(async () => {
    if (!id || !collectionSlug) return
    const r = await fetch(`/api/${collectionSlug}/${id}?depth=0&select[verlauf]=true&select[zustaendig]=true&select[zustaendigName]=true`, { credentials: 'include' }).catch(() => null)
    if (!r?.ok) return
    const d = await r.json()
    setStand({ zustaendig: idVon(d.zustaendig), zustaendigName: d.zustaendigName ?? null, verlauf: d.verlauf ?? [] })
  }, [id, collectionSlug])

  useEffect(() => {
    void laden()
  }, [laden])

  if (!id || !collectionSlug) {
    return <p className="bsv-posteingang__hinweis">Nach dem Speichern kannst du hier festhalten, wer sich kümmert, und Notizen schreiben.</p>
  }

  const senden = async (pfad: string, body: unknown) => {
    setLaeuft(true)
    setFehler(null)
    try {
      const r = await fetch(`/api/${collectionSlug}/${id}/${pfad}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setFehler(d.fehler ?? 'Das hat nicht geklappt.')
        return null
      }
      return d
    } catch {
      setFehler('Keine Verbindung. Bitte noch einmal versuchen.')
      return null
    } finally {
      setLaeuft(false)
    }
  }

  const zustaendigSetzen = async (uebernehmen: boolean) => {
    const d = await senden('zustaendig', { uebernehmen })
    if (!d) return
    // Formular (nur Admins sehen die Auswahl) auf den neuen Stand bringen, ohne „ungespeichert“ zu melden
    zustaendigFeld.setValue(d.zustaendig ?? null, true)
    await laden()
  }

  const notizSpeichern = async () => {
    const t = text.trim()
    if (!t) return
    const d = await senden('notiz', { text: t })
    if (!d) return
    setText('')
    await laden()
  }

  const ich = stand?.zustaendig != null && stand.zustaendig === user?.id
  const anrede = f.vorname || f.name.split(' ')[0]
  const mailto = f.email
    ? `mailto:${encodeURIComponent(f.email)}?subject=${encodeURIComponent((BETREFF[collectionSlug] ?? (() => ''))(f))}&body=${encodeURIComponent(anrede ? `Hallo ${anrede},\n\n` : 'Hallo,\n\n')}`
    : null
  const tel = f.telefon.replace(/[^\d+]/g, '')
  const verlauf = [...(stand?.verlauf ?? [])].reverse()

  return (
    <section className="bsv-posteingang" aria-label="Bearbeitung">
      <div className="bsv-posteingang__zeile">
        <div className="bsv-posteingang__wer">
          <span className="bsv-posteingang__label">Wer kümmert sich?</span>
          <strong>{stand === null ? '…' : ich ? 'Du' : (stand.zustaendigName ?? 'Noch niemand')}</strong>
        </div>
        <div className="bsv-posteingang__knoepfe">
          {darfBearbeiten && stand && !ich && (
            <button type="button" className="bsv-posteingang__btn bsv-posteingang__btn--primaer" disabled={laeuft} onClick={() => zustaendigSetzen(true)}>
              🙋 Ich kümmere mich
            </button>
          )}
          {darfBearbeiten && ich && (
            <button type="button" className="bsv-posteingang__btn" disabled={laeuft} onClick={() => zustaendigSetzen(false)}>
              Abgeben
            </button>
          )}
          {darfBearbeiten && mailto && (
            <a className="bsv-posteingang__btn" href={mailto}>
              ✉️ Antworten
            </a>
          )}
          {darfBearbeiten && tel.length >= 5 && (
            <a className="bsv-posteingang__btn" href={`tel:${tel}`}>
              📞 Anrufen
            </a>
          )}
        </div>
      </div>
      {darfBearbeiten && mailto && <p className="bsv-posteingang__klein">„Antworten“ öffnet dein E-Mail-Programm mit Adresse und Betreff. Danach hier kurz notieren, was du geschrieben hast.</p>}

      <div className="bsv-posteingang__notizen">
        <label className="bsv-posteingang__label" htmlFor={darfBearbeiten ? 'bsv-notiz' : undefined}>
          Notizen (nur intern)
        </label>
        {darfBearbeiten && (
          <div className="bsv-posteingang__eingabe">
            <textarea
              id="bsv-notiz"
              rows={2}
              maxLength={2000}
              value={text}
              placeholder="z. B. „Angerufen, meldet sich am Freitag“"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void notizSpeichern()
              }}
            />
            <button type="button" className="bsv-posteingang__btn bsv-posteingang__btn--primaer" disabled={laeuft || !text.trim()} onClick={notizSpeichern}>
              Notiz speichern
            </button>
          </div>
        )}
        {fehler && (
          <p className="bsv-posteingang__fehler" role="alert">
            {fehler}
          </p>
        )}
        {verlauf.length > 0 ? (
          <ul className="bsv-posteingang__verlauf">
            {verlauf.map((e, i) => (
              <li key={e.id ?? i} className={e.art === 'status' ? 'is-status' : undefined}>
                <span className="bsv-posteingang__meta">
                  {datum(e.am)} · {e.vonName ?? 'Unbekannt'}
                </span>
                <span className="bsv-posteingang__text">{e.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          stand && <p className="bsv-posteingang__klein">{darfBearbeiten ? 'Noch keine Notizen. Notizen werden sofort gespeichert – mit deinem Namen und der Uhrzeit.' : 'Noch keine Notizen.'}</p>
        )}
      </div>
    </section>
  )
}
