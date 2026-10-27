'use client'
import { useAuth, useDocumentInfo, useFormFields, useFormModified } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import {
  ausfuellen,
  type KuendigungEntscheidung,
  type KuendigungStatus,
  STANDARD_VORLAGEN,
  STATUS_LABEL,
  VORLAGE_ZU,
} from './texte'
import '@/posteingang/posteingang.scss'

type Dokument = { url?: string | null; mimeType?: string | null; filename?: string | null }
type Mitglied = {
  id: number
  vorname?: string
  nachname?: string
  mitgliedsnummer?: string | null
  austritt?: string | null
  aktiv?: boolean | null
}

const tag = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Berlin',
      }).format(new Date(iso))
    : '–'
const zeit = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin',
      }).format(new Date(iso))
    : '–'
const idVon = (v: unknown) =>
  v && typeof v === 'object' ? ((v as { id?: number }).id ?? null) : ((v as number | null) ?? null)
const offeneStellen = (t: string) => t.match(/\[[A-ZÄÖÜ ]{3,}\]/g) ?? []

const KNOPF: Record<KuendigungEntscheidung, { text: string; klasse: string; folge: string }> = {
  bestaetigt: {
    text: '✓ Bestätigen',
    klasse: 'bsv-posteingang__btn--primaer',
    folge:
      '„Gültig bis“ der Mitgliedschaft(en) wird auf das Quartalsende gesetzt. Der Ausweis zeigt bis dahin „gültig bis …“, danach „nicht gültig“. Danach bitte im DFBnet austragen.',
  },
  rueckfrage: {
    text: '❓ Rückfrage',
    klasse: '',
    folge:
      'Die Kündigung wird auf „Rückfrage“ gesetzt. Das Mitglied sieht im Mitgliederbereich „Rückfrage – bitte E-Mails prüfen“.',
  },
  abgelehnt: {
    text: 'Nicht annehmen',
    klasse: 'bsv-posteingang__btn--warn',
    folge:
      'Z. B. wenn die Unterschrift fehlt oder das Schreiben nicht lesbar ist. Das Mitglied kann danach eine neue Kündigung hochladen – das Quartal richtet sich dann nach dem neuen Eingang.',
  },
  erledigt: {
    text: '✓ Im DFBnet ausgetragen',
    klasse: 'bsv-posteingang__btn--primaer',
    folge:
      'Nur zur Übersicht: Die Kündigung wandert zu „Erledigt“. Das Austrittsdatum bleibt wie bestätigt.',
  },
}

/** Prüfhilfe oben in der Kündigung: Schreiben ansehen, dann bestätigen, nachfragen oder nicht annehmen */
export default function KuendigungPruefung() {
  const { id, docPermissions } = useDocumentInfo()
  const darf = Boolean((docPermissions as { update?: unknown } | undefined)?.update)
  const { user } = useAuth<{ name?: string }>()
  const geaendert = useFormModified()
  const f = useFormFields(([x]) => ({
    status: (String(x.status?.value ?? 'neu') as KuendigungStatus) || 'neu',
    namen: String(x.namen?.value ?? ''),
    vorname: String(x.vorname?.value ?? ''),
    email: String(x.email?.value ?? ''),
    eingangAm: (x.eingangAm?.value as string | undefined) ?? undefined,
    wirksamZum: (x.wirksamZum?.value as string | undefined) ?? undefined,
    dokument: idVon(x.dokument?.value),
    mitglieder: (Array.isArray(x.mitgliedschaften?.value)
      ? (x.mitgliedschaften?.value as unknown[])
      : []
    )
      .map(idVon)
      .filter((n): n is number => typeof n === 'number'),
    wirksamGeworden: Boolean(x.wirksamGeworden?.value),
  }))
  const [dok, setDok] = useState<Dokument | null>(null)
  const [mitglieder, setMitglieder] = useState<Mitglied[]>([])
  const [offen, setOffen] = useState<KuendigungEntscheidung | null>(null)
  const [mailSenden, setMailSenden] = useState(true)
  const [betreff, setBetreff] = useState('')
  const [text, setText] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ text: string; mailto?: string } | null>(null)
  const mitgliederSchluessel = f.mitglieder.join(',')

  useEffect(() => {
    if (!f.dokument) return
    let ab = false
    fetch(`/api/kuendigungsdokumente/${f.dokument}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !ab && d && setDok(d))
      .catch(() => null)
    return () => {
      ab = true
    }
  }, [f.dokument])

  useEffect(() => {
    if (!mitgliederSchluessel) return
    let ab = false
    const q = mitgliederSchluessel
      .split(',')
      .map((m, i) => `where[id][in][${i}]=${m}`)
      .join('&')
    fetch(`/api/mitgliedschaften?${q}&depth=0&limit=30`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !ab && d?.docs && setMitglieder(d.docs))
      .catch(() => null)
    return () => {
      ab = true
    }
  }, [mitgliederSchluessel])

  if (!id) return null

  const istBild = Boolean(dok?.mimeType?.startsWith('image/'))
  const oeffnen = async (e: KuendigungEntscheidung) => {
    setMeldung(null)
    setOffen(e)
    if (e === 'erledigt') return setMailSenden(false)
    const schluessel = VORLAGE_ZU[e]
    let v = STANDARD_VORLAGEN[schluessel]
    const r = await fetch('/api/globals/mailVorlagen?depth=0', { credentials: 'include' }).catch(
      () => null,
    )
    if (r?.ok) {
      const g = await r.json()
      if (g?.[schluessel]?.betreff && g?.[schluessel]?.text)
        v = { betreff: g[schluessel].betreff, text: g[schluessel].text }
    }
    const w = {
      vorname: f.vorname || 'zusammen',
      namen: f.namen.replace(/\s*\(Nr\.[^)]*\)/g, ''),
      wirksamZum: tag(f.wirksamZum),
      meinName: user?.name || '',
    }
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
      const r = await fetch(`/api/kuendigungen/${id}/entscheidung`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: offen, mail: mailSenden ? { betreff, text } : null }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setMeldung({ text: d.fehler ?? 'Das hat nicht geklappt.' })
      if (mailSenden && d.versand !== 'gesendet') {
        setMeldung({
          text: `„${STATUS_LABEL[offen]}“ ist gespeichert. Die E-Mail konnte nicht automatisch verschickt werden${d.versand === 'nicht-eingerichtet' ? ' (E-Mail-Versand noch nicht eingerichtet)' : ''}. Öffne sie mit dem Knopf in deinem E-Mail-Programm.`,
          mailto: `mailto:${encodeURIComponent(f.email)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`,
        })
        setOffen(null)
        return
      }
      window.location.reload()
    } catch {
      setMeldung({ text: 'Keine Verbindung. Bitte noch einmal versuchen.' })
    } finally {
      setLaeuft(false)
    }
  }

  const moeglich: KuendigungEntscheidung[] = !darf
    ? []
    : f.status === 'neu' || f.status === 'rueckfrage'
      ? (['bestaetigt', 'rueckfrage', 'abgelehnt'] as KuendigungEntscheidung[]).filter(
          (e) => e !== f.status || e === 'rueckfrage',
        )
      : f.status === 'bestaetigt'
        ? ['erledigt']
        : []

  return (
    <section className="bsv-pruefung" aria-label="Kündigung prüfen">
      <span className="bsv-posteingang__label">Kündigung prüfen</span>
      <ul>
        <li className="is-info">
          <span aria-hidden="true">📄</span>
          <span>
            <strong>{f.namen || '–'}</strong> · eingegangen am {zeit(f.eingangAm)} ·{' '}
            <strong>wirksam zum {tag(f.wirksamZum)}</strong> (Ende des Quartals, in dem sie
            eingegangen ist)
          </span>
        </li>
        {mitglieder.map((m) => (
          <li
            key={m.id}
            className={
              m.austritt && f.status !== 'bestaetigt' && f.status !== 'erledigt'
                ? 'is-warn'
                : 'is-ok'
            }
          >
            <span aria-hidden="true">
              {m.austritt && f.status !== 'bestaetigt' && f.status !== 'erledigt' ? '⚠️' : '✅'}
            </span>
            <span>
              Mitgliedschaft{' '}
              <a href={`/admin/collections/mitgliedschaften/${m.id}`}>
                {`${m.vorname ?? ''} ${m.nachname ?? ''}`.trim()}
              </a>
              {m.mitgliedsnummer && ` (Nr. ${m.mitgliedsnummer})`}
              {m.austritt
                ? ` – Gültig bis ${tag(m.austritt)}${m.aktiv === false ? ', beendet' : ''}`
                : ' – noch ohne Austrittsdatum'}
            </span>
          </li>
        ))}
        {f.wirksamGeworden && (
          <li className="is-ok">
            <span aria-hidden="true">✅</span>
            <span>
              Das Quartalsende ist vorbei – die Mitgliedschaft ist beendet, der Ausweis zeigt „nicht
              gültig“.
            </span>
          </li>
        )}
      </ul>

      {dok?.url ? (
        <div className="bsv-kuendigung__schreiben">
          {istBild ? (
            <a
              href={dok.url}
              target="_blank"
              rel="noopener noreferrer"
              title="In voller Größe öffnen"
            >
              <img src={dok.url} alt="Hochgeladenes Kündigungsschreiben" />
            </a>
          ) : null}
          <a
            className="bsv-posteingang__btn"
            href={dok.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            📄 Unterschriebenes Schreiben öffnen{istBild ? '' : ' (PDF)'}
          </a>
          <span className="bsv-posteingang__klein">
            Prüfen: Ist es unterschrieben? Passt der Name? Bei Kindern: Unterschrift der Eltern.
          </span>
        </div>
      ) : (
        f.dokument && <p className="bsv-posteingang__klein">Schreiben wird geladen …</p>
      )}

      <div className="bsv-pruefung__knoepfe">
        {moeglich.map((e) => (
          <button
            key={e}
            type="button"
            className={`bsv-posteingang__btn ${KNOPF[e].klasse}`}
            disabled={laeuft || geaendert}
            onClick={() => oeffnen(e)}
            aria-expanded={offen === e}
          >
            {KNOPF[e].text}
          </button>
        ))}
      </div>
      {f.status === 'bestaetigt' && (
        <p className="bsv-posteingang__klein">
          Bestätigt – jetzt bitte im DFBnet austragen und dann „Im DFBnet ausgetragen“ klicken.
        </p>
      )}
      {f.status === 'zurueckgezogen' && (
        <p className="bsv-posteingang__klein">
          Das Mitglied hat die Kündigung selbst zurückgezogen – nichts zu tun.
        </p>
      )}

      {offen && (
        <div
          className="bsv-pruefung__dialog"
          role="group"
          aria-label={`Kündigung: ${STATUS_LABEL[offen]}`}
        >
          <strong>{STATUS_LABEL[offen]}</strong>
          <span>{KNOPF[offen].folge}</span>
          {offen !== 'erledigt' && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={mailSenden}
                  disabled={!f.email}
                  onChange={(e) => setMailSenden(e.target.checked)}
                />
                E-Mail an {f.email || '(keine Adresse)'} senden
              </label>
              {mailSenden && (
                <>
                  <input
                    type="text"
                    aria-label="Betreff"
                    value={betreff}
                    maxLength={200}
                    onChange={(e) => setBetreff(e.target.value)}
                  />
                  <textarea
                    aria-label="Text der E-Mail"
                    value={text}
                    maxLength={5000}
                    onChange={(e) => setText(e.target.value)}
                  />
                  {offenText.length > 0 && (
                    <span className="is-warn">⚠️ Bitte noch ausfüllen: {offenText.join(', ')}</span>
                  )}
                  <span className="bsv-posteingang__klein">
                    Antworten des Mitglieds gehen an deine E-Mail-Adresse. Die Texte für alle
                    Kündigungen änderst du unter Einstellungen → „E-Mail-Vorlagen“ → Reiter
                    „Kündigungen“.
                  </span>
                </>
              )}
            </>
          )}
          <div className="bsv-pruefung__knoepfe">
            <button
              type="button"
              className={`bsv-posteingang__btn ${KNOPF[offen].klasse || 'bsv-posteingang__btn--primaer'}`}
              disabled={
                laeuft ||
                (mailSenden &&
                  offen !== 'erledigt' &&
                  (offenText.length > 0 || !betreff.trim() || !text.trim()))
              }
              onClick={bestaetigen}
            >
              {laeuft
                ? 'Speichert …'
                : mailSenden && offen !== 'erledigt'
                  ? `${STATUS_LABEL[offen]} und E-Mail senden`
                  : offen === 'erledigt'
                    ? 'Ja, ausgetragen'
                    : `${STATUS_LABEL[offen]} – ohne E-Mail`}
            </button>
            <button
              type="button"
              className="bsv-posteingang__btn"
              disabled={laeuft}
              onClick={() => setOffen(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {meldung && (
        <div className="bsv-pruefung__dialog" role="alert">
          <span className="is-warn">{meldung.text}</span>
          {meldung.mailto && (
            <div className="bsv-pruefung__knoepfe">
              <a
                className="bsv-posteingang__btn bsv-posteingang__btn--primaer"
                href={meldung.mailto}
              >
                ✉️ Im E-Mail-Programm öffnen
              </a>
              <button
                type="button"
                className="bsv-posteingang__btn"
                onClick={() => window.location.reload()}
              >
                Seite neu laden
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
