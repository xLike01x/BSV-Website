'use client'
import { useAuth, useDocumentInfo, useFormFields, useFormModified } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { isValidIBAN } from '@/utilities/iban'
import { ausfuellen, type Entscheidung, ENTSCHEIDUNG_LABEL, MITGLIEDSART_LABEL, offeneStellen, STANDARD_VORLAGEN } from './texte'
import '@/posteingang/posteingang.scss'

type Pruefdaten = {
  antraege: { id: number; name: string; status: string; am: string }[]
  mitgliedschaften: { id: number; name: string; aktiv: boolean; nummer: string | null }[]
  ausweise: number
  beitragAktuell: number | null
  mailAktiv: boolean
}
type Punkt = { art: 'ok' | 'warn' | 'info'; text: React.ReactNode }

const alterAm = (iso: string | undefined, stichtag = new Date()) => {
  if (!iso) return null
  const g = new Date(iso)
  if (Number.isNaN(g.getTime())) return null
  let a = stichtag.getFullYear() - g.getFullYear()
  const m = stichtag.getMonth() - g.getMonth()
  if (m < 0 || (m === 0 && stichtag.getDate() < g.getDate())) a--
  return a
}

const euro = (n: number) => `${n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`

const KNOPF: Record<Entscheidung, { text: string; klasse: string; folge: string }> = {
  aufgenommen: { text: '✓ Aufnehmen', klasse: 'bsv-posteingang__btn--primaer', folge: 'Der Antrag wird auf „Aufgenommen“ gesetzt. Die Mitgliedschaft für den digitalen Ausweis wird automatisch angelegt (bei Familien für alle).' },
  rueckfrage: { text: '❓ Rückfrage', klasse: '', folge: 'Der Antrag wird auf „Rückfrage“ gesetzt, bis die Antwort da ist.' },
  abgelehnt: { text: 'Ablehnen', klasse: 'bsv-posteingang__btn--warn', folge: 'Der Antrag wird auf „Abgelehnt“ gesetzt. Er wird später nach der Datenschutz-Frist automatisch aufgeräumt.' },
}

/** Prüfhilfe oben im Mitgliedsantrag – mit den drei Entscheidungs-Knöpfen */
export default function AntragPruefung() {
  const { id, docPermissions } = useDocumentInfo()
  // Ohne Recht zum Bearbeiten (z. B. „Nur ansehen“): Prüfhinweise ja, Entscheidungs-Knöpfe nein
  const darf = Boolean((docPermissions as { update?: unknown } | undefined)?.update)
  const { user } = useAuth<{ name?: string; email?: string }>()
  const geaendert = useFormModified()
  const f = useFormFields(([x]) => ({
    status: String(x.status?.value ?? ''),
    vorname: String(x.vorname?.value ?? ''),
    nachname: String(x.nachname?.value ?? ''),
    email: String(x.email?.value ?? ''),
    geburtsdatum: (x.geburtsdatum?.value as string | undefined) ?? undefined,
    mitgliedsart: String(x.mitgliedsart?.value ?? ''),
    beitrag: x.beitragQuartal?.value as number | null | undefined,
    iban: String(x.iban?.value ?? ''),
    sepa: Boolean(x.sepaMandat?.value),
    satzung: Boolean(x.satzungAkzeptiert?.value),
    foto: Boolean(x.fotoEinwilligung?.value),
    familie: Number(x.familienmitglieder?.value ?? 0),
    teams: Array.isArray(x.angebote?.value) ? (x.angebote?.value as unknown[]).length : 0,
  }))
  const [daten, setDaten] = useState<Pruefdaten | null>(null)
  const [offen, setOffen] = useState<Entscheidung | null>(null)
  const [mailSenden, setMailSenden] = useState(true)
  const [betreff, setBetreff] = useState('')
  const [text, setText] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'warn'; text: string; mailto?: string } | null>(null)

  useEffect(() => {
    if (!id) return
    let ab = false
    fetch(`/api/mitgliedsantraege/${id}/pruefung`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !ab && d && setDaten(d))
      .catch(() => null)
    return () => {
      ab = true
    }
  }, [id])

  if (!id) return null

  // --- Prüfpunkte -----------------------------------------------------------
  const p: Punkt[] = []
  const alter = alterAm(f.geburtsdatum)
  const art = MITGLIEDSART_LABEL[f.mitgliedsart] ?? f.mitgliedsart
  if (alter !== null) {
    let warn = ''
    if (f.mitgliedsart === 'jugend' && alter >= 18) warn = ' – ist schon volljährig, passt der Jugendtarif?'
    if ((f.mitgliedsart === 'aktiv' || f.mitgliedsart === 'passiv') && alter < 18) warn = ' – ist noch minderjährig, passt der Jugendtarif besser? Unterschrift der Eltern nötig.'
    p.push({ art: warn ? 'warn' : 'ok', text: <>Alter: <strong>{alter} Jahre</strong> · {art}{warn}</> })
  }
  if (f.mitgliedsart === 'familie') p.push(f.familie > 0 ? { art: 'ok', text: `Familie mit ${f.familie} weiteren Person${f.familie === 1 ? '' : 'en'}` } : { art: 'warn', text: 'Familie, aber keine weiteren Personen eingetragen.' })
  if (f.beitrag != null) {
    const anders = daten?.beitragAktuell != null && Number(daten.beitragAktuell) !== Number(f.beitrag)
    p.push({ art: anders ? 'info' : 'ok', text: <>Beitrag laut Antrag: <strong>{euro(Number(f.beitrag))} pro Quartal</strong>{anders && <> – aktuell gültig: {euro(Number(daten!.beitragAktuell))}</>}</> })
  }
  if (f.iban) {
    const gueltig = isValidIBAN(f.iban)
    const kurz = f.iban.replace(/\s+/g, '')
    p.push({ art: gueltig ? 'ok' : 'warn', text: gueltig ? `IBAN gültig (${kurz.slice(0, 4)} … ${kurz.slice(-4)}), SEPA-Mandat ${f.sepa ? 'erteilt' : 'FEHLT'}` : 'IBAN fehlt oder ist nicht lesbar.' })
  }
  if (!f.satzung) p.push({ art: 'warn', text: 'Satzung/Datenschutz nicht bestätigt.' })
  p.push({ art: 'info', text: `Foto-Einwilligung: ${f.foto ? 'ja' : 'nein'} · ${f.teams ? `${f.teams} Team${f.teams === 1 ? '' : 's'}/Kurs${f.teams === 1 ? '' : 'e'} gewünscht` : 'keine Teams gewählt'}` })
  if (daten) {
    for (const a of daten.antraege)
      p.push({ art: 'warn', text: <>Weiterer Antrag mit gleicher E-Mail oder Person: <a href={`/admin/collections/mitgliedsantraege/${a.id}`}>{a.name}</a> ({ENTSCHEIDUNG_LABEL[a.status as Entscheidung] ?? 'Neu'}, {new Date(a.am).toLocaleDateString('de-DE')})</> })
    for (const m of daten.mitgliedschaften)
      p.push({ art: 'warn', text: <>Ist vielleicht schon Mitglied: <a href={`/admin/collections/mitgliedschaften/${m.id}`}>{m.name}</a>{m.nummer && ` (Nr. ${m.nummer})`}{!m.aktiv && ' – ausgetreten'}</> })
    if (!daten.antraege.length && !daten.mitgliedschaften.length) p.push({ art: 'ok', text: 'Kein doppelter Antrag, keine bestehende Mitgliedschaft gefunden.' })
    if (daten.ausweise) p.push({ art: 'ok', text: `Mitgliedschaft${daten.ausweise === 1 ? '' : 'en'} für den Ausweis angelegt: ${daten.ausweise}` })
  }

  // --- Entscheidung ---------------------------------------------------------
  const oeffnen = async (e: Entscheidung) => {
    setMeldung(null)
    setOffen(e)
    let v = STANDARD_VORLAGEN[e]
    const r = await fetch('/api/globals/mailVorlagen?depth=0', { credentials: 'include' }).catch(() => null)
    if (r?.ok) {
      const g = await r.json()
      if (g?.[e]?.betreff && g?.[e]?.text) v = { betreff: g[e].betreff, text: g[e].text }
    }
    const w = { vorname: f.vorname, nachname: f.nachname, mitgliedsart: art, meinName: user?.name || '' }
    setBetreff(ausfuellen(v.betreff, w))
    setText(ausfuellen(v.text, w))
    setMailSenden(Boolean(f.email))
  }

  const offenText = offeneStellen(text)
  const bestaetigen = async () => {
    if (!offen) return
    setLaeuft(true)
    setMeldung(null)
    try {
      const r = await fetch(`/api/mitgliedsantraege/${id}/entscheidung`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: offen, mail: mailSenden ? { betreff, text } : null }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setMeldung({ art: 'warn', text: d.fehler ?? 'Das hat nicht geklappt.' })
        return
      }
      if (mailSenden && d.versand !== 'gesendet') {
        // Status ist gesetzt – Mail bitte selbst schicken
        setMeldung({
          art: 'warn',
          text: `Status „${ENTSCHEIDUNG_LABEL[offen]}“ ist gespeichert. Die E-Mail konnte nicht automatisch verschickt werden${d.versand === 'nicht-eingerichtet' ? ' (E-Mail-Versand noch nicht eingerichtet)' : ''}. Öffne sie mit dem Knopf in deinem E-Mail-Programm.`,
          mailto: `mailto:${encodeURIComponent(f.email)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`,
        })
        setOffen(null)
        return
      }
      window.location.reload()
    } catch {
      setMeldung({ art: 'warn', text: 'Keine Verbindung. Bitte noch einmal versuchen.' })
    } finally {
      setLaeuft(false)
    }
  }

  // Aufgenommen ist endgültig (Ausweis existiert) – danach keine Knöpfe mehr
  const moeglich = !darf || f.status === 'aufgenommen' ? [] : (['aufgenommen', 'rueckfrage', 'abgelehnt'] as Entscheidung[]).filter((e) => e !== f.status)

  return (
    <section className="bsv-pruefung" aria-label="Antrag prüfen">
      <span className="bsv-posteingang__label">Antrag prüfen</span>
      <ul>
        {p.map((x, i) => (
          <li key={i} className={`is-${x.art}`}>
            <span aria-hidden="true">{x.art === 'warn' ? '⚠️' : x.art === 'ok' ? '✅' : 'ℹ️'}</span>
            <span>{x.text}</span>
          </li>
        ))}
      </ul>

      <div className="bsv-pruefung__knoepfe">
        {moeglich.map((e) => (
          <button key={e} type="button" className={`bsv-posteingang__btn ${KNOPF[e].klasse}`} disabled={laeuft || geaendert} onClick={() => oeffnen(e)} aria-expanded={offen === e}>
            {KNOPF[e].text}
          </button>
        ))}
      </div>
      {f.status === 'aufgenommen' && <p className="bsv-posteingang__klein">Aufgenommen – die Mitgliedschaft ist angelegt. Ein Austritt wird unter „Mitgliedschaften“ mit „Gültig bis“ eingetragen.</p>}
      {geaendert && <p className="bsv-posteingang__klein">Du hast etwas geändert – bitte erst oben rechts speichern, dann entscheiden.</p>}

      {offen && (
        <div className="bsv-pruefung__dialog" role="group" aria-label={`Antrag: ${ENTSCHEIDUNG_LABEL[offen]}`}>
          <strong>{ENTSCHEIDUNG_LABEL[offen]}</strong>
          <span>{KNOPF[offen].folge}</span>
          <label>
            <input type="checkbox" checked={mailSenden} disabled={!f.email} onChange={(e) => setMailSenden(e.target.checked)} />
            E-Mail an {f.email || '(keine Adresse)'} senden
          </label>
          {mailSenden && (
            <>
              <input type="text" aria-label="Betreff" value={betreff} maxLength={200} onChange={(e) => setBetreff(e.target.value)} />
              <textarea aria-label="Text der E-Mail" value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} />
              {offenText.length > 0 && <span className="is-warn">⚠️ Bitte noch ausfüllen: {offenText.join(', ')}</span>}
              {daten && !daten.mailAktiv && <span className="is-warn">ℹ️ Der E-Mail-Versand ist noch nicht eingerichtet – du kannst die Mail danach in deinem E-Mail-Programm öffnen.</span>}
              <span className="bsv-posteingang__klein">Antworten der Person gehen an deine E-Mail-Adresse. Den Text für alle Anträge änderst du unter Einstellungen → „E-Mail-Vorlagen“.</span>
            </>
          )}
          <div className="bsv-pruefung__knoepfe">
            <button type="button" className={`bsv-posteingang__btn ${KNOPF[offen].klasse || 'bsv-posteingang__btn--primaer'}`} disabled={laeuft || (mailSenden && (offenText.length > 0 || !betreff.trim() || !text.trim()))} onClick={bestaetigen}>
              {laeuft ? 'Speichert …' : mailSenden ? `${ENTSCHEIDUNG_LABEL[offen]} und E-Mail senden` : `${ENTSCHEIDUNG_LABEL[offen]} – ohne E-Mail`}
            </button>
            <button type="button" className="bsv-posteingang__btn" disabled={laeuft} onClick={() => setOffen(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {meldung && (
        <div className="bsv-pruefung__dialog" role="alert">
          <span className={meldung.art === 'warn' ? 'is-warn' : 'is-ok'}>{meldung.text}</span>
          <div className="bsv-pruefung__knoepfe">
            {meldung.mailto && (
              <a className="bsv-posteingang__btn bsv-posteingang__btn--primaer" href={meldung.mailto}>
                ✉️ Im E-Mail-Programm öffnen
              </a>
            )}
            {meldung.mailto && (
              <button type="button" className="bsv-posteingang__btn" onClick={() => window.location.reload()}>
                Seite neu laden
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
