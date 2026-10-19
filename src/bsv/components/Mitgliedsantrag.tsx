'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { sendeFormular } from './sendeFormular'

export type AntragAngebot = { id: number; slug: string; name: string; gruppe: string }
export type AntragBeitrag = { key: string; label: string; zielgruppe: string; quartal: number }

type Person = { vorname: string; nachname: string; geburtsdatum: string }
const leer: Person = { vorname: '', nachname: '', geburtsdatum: '' }

const euro = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €'

/** Grobe Formatprüfung im Browser; die verbindliche Prüfsumme rechnet der Server. */
const ibanOk = (iban: string) => {
  const s = iban.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false
  const num = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  let rest = 0
  for (let i = 0; i < num.length; i += 7) rest = Number(String(rest) + num.slice(i, i + 7)) % 97
  return rest === 1
}

const alterAm = (geb: string) => {
  const d = new Date(geb)
  if (Number.isNaN(d.getTime())) return null
  const h = new Date()
  let a = h.getFullYear() - d.getFullYear()
  if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--
  return a
}

export function Mitgliedsantrag({ angebote, beitraege, glaeubigerId }: { angebote: AntragAngebot[]; beitraege: AntragBeitrag[]; glaeubigerId?: string | null }) {
  const sp = useSearchParams()
  const [schritt, setSchritt] = useState(1)
  const [auswahl, setAuswahl] = useState<number[]>([])
  const [art, setArt] = useState(beitraege[0]?.key ?? 'jugend')
  const [p, setP] = useState({ ...leer, email: '', telefon: '', strasse: '', plz: '', ort: '' })
  const [familie, setFamilie] = useState<Person[]>([])
  const [sepa, setSepa] = useState({ kontoinhaber: '', iban: '', mandat: false, satzung: false, fotos: false })
  const [fehler, setFehler] = useState<string | null>(null)
  const [sendet, setSendet] = useState(false)
  const [hp, setHp] = useState('')
  const kopf = useRef<HTMLDivElement>(null)

  // Vorauswahl aus dem Link „Für dieses Team anmelden“
  useEffect(() => {
    const slug = sp.get('angebot')
    const a = angebote.find((x) => x.slug === slug)
    if (a) setAuswahl((s) => (s.includes(a.id) ? s : [...s, a.id]))
  }, [sp, angebote])

  // Mitgliedsart aus dem Geburtsdatum vorschlagen
  useEffect(() => {
    const a = alterAm(p.geburtsdatum)
    if (a === null || art === 'familie' || art === 'passiv') return
    setArt(a < 18 ? 'jugend' : 'aktiv')
  }, [p.geburtsdatum]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    kopf.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [schritt])

  const gruppen = useMemo(() => {
    const m = new Map<string, AntragAngebot[]>()
    angebote.forEach((a) => m.set(a.gruppe, [...(m.get(a.gruppe) ?? []), a]))
    return Array.from(m.entries())
  }, [angebote])
  const gewaehlt = angebote.filter((a) => auswahl.includes(a.id))
  const beitrag = beitraege.find((b) => b.key === art) ?? beitraege[0]
  const istMinderjaehrig = (alterAm(p.geburtsdatum) ?? 99) < 18

  const pruefe = (): string | null => {
    if (schritt === 1 && auswahl.length === 0 && art !== 'passiv') return 'Bitte wähle mindestens ein Team oder einen Kurs aus – oder werde passives Mitglied.'
    if (schritt === 2) {
      if (!p.vorname.trim() || !p.nachname.trim()) return 'Bitte gib Vor- und Nachnamen an.'
      if (!p.geburtsdatum || alterAm(p.geburtsdatum) === null) return 'Bitte gib das Geburtsdatum an.'
      if (!/^\S+@\S+\.\S+$/.test(p.email)) return 'Bitte gib eine gültige E-Mail-Adresse an.'
      if (!p.strasse.trim() || !/^\d{5}$/.test(p.plz.trim()) || !p.ort.trim()) return 'Bitte gib eine vollständige Anschrift mit fünfstelliger PLZ an.'
      if (art === 'familie' && familie.some((f) => !f.vorname.trim())) return 'Bitte gib für alle Familienmitglieder einen Vornamen an oder entferne leere Zeilen.'
    }
    if (schritt === 3) {
      if (!sepa.kontoinhaber.trim()) return 'Bitte gib den Namen des Kontoinhabers an.'
      if (!ibanOk(sepa.iban)) return 'Die IBAN ist ungültig. Bitte prüfe deine Eingabe.'
      if (!sepa.mandat || !sepa.satzung) return 'Bitte bestätige das SEPA-Mandat und die Satzung.'
    }
    return null
  }

  async function weiter() {
    const f = pruefe()
    setFehler(f)
    if (f) return
    if (schritt < 3) return setSchritt(schritt + 1)

    setSendet(true)
    const res = await sendeFormular('/api/mitgliedsantraege', {
      vorname: p.vorname.trim(),
      nachname: p.nachname.trim(),
      geburtsdatum: p.geburtsdatum,
      email: p.email.trim(),
      telefon: p.telefon.trim() || undefined,
      strasse: p.strasse.trim(),
      plz: p.plz.trim(),
      ort: p.ort.trim(),
      mitgliedsart: art,
      familienmitglieder: art === 'familie' ? familie.filter((x) => x.vorname.trim()).map((x) => ({ ...x, geburtsdatum: x.geburtsdatum || undefined })) : [],
      angebote: auswahl,
      kontoinhaber: sepa.kontoinhaber.trim(),
      iban: sepa.iban.replace(/\s+/g, '').toUpperCase(),
      sepaMandat: sepa.mandat,
      satzungAkzeptiert: sepa.satzung,
      fotoEinwilligung: sepa.fotos,
      website: hp,
    })
    setSendet(false)
    if (res.ok) setSchritt(4)
    else setFehler(res.fehler)
  }

  const feld = (k: keyof typeof p, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, voll = false) => (
    <label className={`field${voll ? ' field-full' : ''}`}>
      {label}
      <input value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} {...props} />
    </label>
  )

  const schritte = ['Angebote', 'Deine Daten', 'Beitrag & SEPA']
  const prozent = schritt >= 4 ? 100 : ((schritt - 0.5) / 3) * 100

  return (
    <section className="wrap-narrow" style={{ paddingTop: 16, paddingBottom: 100 }} ref={kopf}>
      {schritt < 4 && (
        <>
          <ol aria-label="Fortschritt" style={{ listStyle: 'none', margin: '0 auto 12px', padding: 0, maxWidth: 760, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', fontSize: 14 }}>
            {schritte.map((l, i) => {
              const n = i + 1
              return (
                <li key={l} aria-current={n === schritt ? 'step' : undefined} style={{ textAlign: 'center', padding: 4, fontWeight: n === schritt ? 700 : 500, color: n <= schritt ? 'var(--bsv-ink)' : '#86868B' }}>
                  {n < schritt ? '✓' : n} {l}
                </li>
              )
            })}
          </ol>
          <div aria-hidden="true" style={{ maxWidth: 760, height: 6, margin: '0 auto 40px', background: 'var(--bsv-line-2)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${prozent}%`, background: 'var(--bsv-green)', borderRadius: 999, transition: 'width .6s var(--bsv-ease)' }} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '999 1 560px', minWidth: 0, background: '#fff', borderRadius: 30, padding: 'clamp(24px, 4vw, 44px)' }}>
          <div className="hp" aria-hidden="true">
            <label>
              Website <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {schritt === 1 && (
            <div className="card-anim">
              <h2 className="t-3">Wofür möchtest du dich anmelden?</h2>
              <p className="muted" style={{ margin: '6px 0 28px' }}>
                Mehrfachauswahl möglich – auch für mehrere Familienmitglieder.
              </p>
              {gruppen.map(([titel, liste]) => (
                <fieldset key={titel} style={{ border: 0, padding: 0, margin: '0 0 28px' }}>
                  <legend style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: 'var(--bsv-muted)' }}>{titel}</legend>
                  <div className="chips">
                    {liste.map((a) => {
                      const an = auswahl.includes(a.id)
                      return (
                        <button key={a.id} type="button" className="chip" aria-pressed={an} onClick={() => setAuswahl(an ? auswahl.filter((x) => x !== a.id) : [...auswahl, a.id])}>
                          {an ? '✓ ' : ''}
                          {a.name}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
              <label className="check" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={art === 'passiv'} onChange={(e) => setArt(e.target.checked ? 'passiv' : beitraege[0]?.key ?? 'jugend')} />
                <span>Ich möchte den Verein als passives Mitglied unterstützen, ohne an Training teilzunehmen.</span>
              </label>
            </div>
          )}

          {schritt === 2 && (
            <div className="card-anim">
              <h2 className="t-3">Wer meldet sich an?</h2>
              <p className="muted" style={{ margin: '6px 0 24px' }}>
                Beiträge laut aktueller Beitragsordnung, vierteljährlich per Lastschrift.
              </p>
              <div role="radiogroup" aria-label="Mitgliedsart" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 32 }}>
                {beitraege.map((b) => {
                  const an = b.key === art
                  return (
                    <button
                      key={b.key}
                      type="button"
                      role="radio"
                      aria-checked={an}
                      onClick={() => setArt(b.key)}
                      style={{ font: 'inherit', textAlign: 'left', color: 'var(--bsv-ink)', padding: 18, borderRadius: 18, cursor: 'pointer', background: an ? 'var(--bsv-green-tint)' : '#fff', border: `2px solid ${an ? 'var(--bsv-green)' : 'var(--bsv-line-2)'}` }}
                    >
                      <span style={{ display: 'block', fontWeight: 600 }}>{b.label}</span>
                      <span className="muted" style={{ display: 'block', fontSize: 14, marginTop: 2 }}>
                        {b.zielgruppe}
                      </span>
                      <span style={{ display: 'block', fontSize: 22, fontWeight: 800, marginTop: 10, letterSpacing: '-0.02em' }}>{euro(b.quartal)}</span>
                      <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                        pro Quartal
                      </span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
                {feld('vorname', 'Vorname', { autoComplete: 'given-name', required: true, maxLength: 80 })}
                {feld('nachname', 'Nachname', { autoComplete: 'family-name', required: true, maxLength: 80 })}
                {feld('geburtsdatum', 'Geburtsdatum', { type: 'date', required: true, max: new Date().toISOString().slice(0, 10) })}
                {feld('email', 'E-Mail', { type: 'email', autoComplete: 'email', required: true })}
                {feld('strasse', 'Straße und Hausnummer', { autoComplete: 'street-address', required: true, maxLength: 120 }, true)}
                {feld('plz', 'PLZ', { inputMode: 'numeric', autoComplete: 'postal-code', required: true, maxLength: 5 })}
                {feld('ort', 'Ort', { autoComplete: 'address-level2', required: true, maxLength: 80 })}
                {feld('telefon', 'Telefon (optional)', { type: 'tel', autoComplete: 'tel', maxLength: 40 }, true)}
              </div>
              {istMinderjaehrig && (
                <p className="notice" style={{ marginTop: 20, background: 'var(--bsv-blue-tint)', color: 'var(--bsv-blue)' }}>
                  Für Minderjährige meldet ein Erziehungsberechtigter an. Bitte gib im nächsten Schritt dessen Bankverbindung an.
                </p>
              )}
              {art === 'familie' && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>Weitere Familienmitglieder</h3>
                  {familie.map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr)) auto', gap: 12, alignItems: 'end', marginBottom: 12 }}>
                      <label className="field">
                        Vorname
                        <input value={f.vorname} onChange={(e) => setFamilie(familie.map((x, j) => (j === i ? { ...x, vorname: e.target.value } : x)))} maxLength={80} />
                      </label>
                      <label className="field">
                        Nachname
                        <input value={f.nachname} placeholder={p.nachname} onChange={(e) => setFamilie(familie.map((x, j) => (j === i ? { ...x, nachname: e.target.value } : x)))} maxLength={80} />
                      </label>
                      <label className="field">
                        Geburtsdatum
                        <input type="date" value={f.geburtsdatum} onChange={(e) => setFamilie(familie.map((x, j) => (j === i ? { ...x, geburtsdatum: e.target.value } : x)))} />
                      </label>
                      <button type="button" className="btn btn-ghost" aria-label={`Familienmitglied ${i + 1} entfernen`} onClick={() => setFamilie(familie.filter((_, j) => j !== i))} style={{ padding: '12px 16px' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setFamilie([...familie, { ...leer, nachname: p.nachname }])} style={{ font: 'inherit', fontWeight: 600, color: 'var(--bsv-green)', background: 'var(--bsv-soft)', border: '1px dashed #A1A1A6', borderRadius: 14, padding: '14px 18px', width: '100%', cursor: 'pointer' }}>
                    + Weiteres Familienmitglied hinzufügen
                  </button>
                </div>
              )}
            </div>
          )}

          {schritt === 3 && (
            <div className="card-anim">
              <h2 className="t-3">Beitrag und SEPA-Mandat</h2>
              <p className="muted" style={{ margin: '6px 0 24px' }}>
                {beitrag?.label}: {euro(beitrag?.quartal ?? 0)} pro Quartal per Lastschrift. Abbuchung jeweils zum 1. eines Quartals.
              </p>
              <div style={{ display: 'grid', gap: 16 }}>
                <label className="field">
                  Kontoinhaber/in
                  <input value={sepa.kontoinhaber} onChange={(e) => setSepa({ ...sepa, kontoinhaber: e.target.value })} autoComplete="name" maxLength={120} placeholder={istMinderjaehrig ? 'Name des Erziehungsberechtigten' : `${p.vorname} ${p.nachname}`} />
                </label>
                <label className="field">
                  IBAN
                  <input
                    value={sepa.iban}
                    onChange={(e) => setSepa({ ...sepa, iban: e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '') })}
                    placeholder="DE00 0000 0000 0000 0000 00"
                    autoComplete="off"
                    inputMode="text"
                    spellCheck={false}
                    maxLength={42}
                    style={{ letterSpacing: '0.04em' }}
                    aria-invalid={sepa.iban.length > 15 && !ibanOk(sepa.iban)}
                  />
                  {sepa.iban.replace(/\s/g, '').length >= 22 && !ibanOk(sepa.iban) && <span className="field-error">Diese IBAN stimmt nicht – bitte prüfen.</span>}
                  <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                    🔒 Wird verschlüsselt gespeichert und nur von der Kasse gelesen.
                  </span>
                </label>
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="check">
                  <input type="checkbox" checked={sepa.mandat} onChange={(e) => setSepa({ ...sepa, mandat: e.target.checked })} />
                  <span>
                    Ich ermächtige den Büdericher Spielverein 1919 e.V., Zahlungen von meinem Konto mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die Lastschriften einzulösen.
                    {glaeubigerId ? ` Gläubiger-ID: ${glaeubigerId}.` : ''} Die Mandatsreferenz wird separat mitgeteilt. Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung verlangen.
                  </span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={sepa.satzung} onChange={(e) => setSepa({ ...sepa, satzung: e.target.checked })} />
                  <span>
                    Ich erkenne die <Link href="/verein#downloads">Satzung</Link> an und habe die <Link href="/verein#dsgvo">Informationen nach DSGVO</Link> gelesen.
                  </span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={sepa.fotos} onChange={(e) => setSepa({ ...sepa, fotos: e.target.checked })} />
                  <span>Fotos von mir bzw. meinem Kind dürfen auf der Website erscheinen (freiwillig, jederzeit widerrufbar).</span>
                </label>
              </div>
            </div>
          )}

          {schritt === 4 && (
            <div className="center card-anim" role="status" style={{ padding: '40px 0' }}>
              <div className="success-icon" aria-hidden="true" style={{ width: 96, height: 96 }}>
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path d="M5 12.5l4.5 4.5L19 7.5" style={{ fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
                </svg>
              </div>
              <h2 className="t-2" style={{ fontSize: 44 }}>
                Willkommen im BSV, {p.vorname}!
              </h2>
              <p className="muted" style={{ margin: '12px auto 0', maxWidth: 460 }}>
                Wir haben deine Anmeldung erhalten. {gewaehlt.length > 0 ? `Die Trainer deiner ${gewaehlt.length === 1 ? 'Gruppe' : `${gewaehlt.length} Angebote`} melden sich bei dir.` : 'Der Vorstand meldet sich bei dir.'} Sobald die Kasse deinen Antrag bearbeitet hat, bekommst du deinen Zugang zum Mitgliederbereich.
              </p>
              <Link href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
                Zur Startseite
              </Link>
            </div>
          )}

          {fehler && (
            <p className="form-error" role="alert" style={{ marginTop: 24 }}>
              {fehler}
            </p>
          )}

          {schritt < 4 && (
            <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--bsv-line-2)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={() => (setFehler(null), setSchritt(schritt - 1))} style={{ color: 'var(--bsv-green)', background: 'transparent', visibility: schritt === 1 ? 'hidden' : 'visible' }}>
                Zurück
              </button>
              <button type="button" className="btn btn-primary" onClick={weiter} disabled={sendet} style={{ minHeight: 52, fontSize: 17 }}>
                {sendet ? 'Wird gesendet …' : schritt === 3 ? 'Verbindlich anmelden' : 'Weiter'}
              </button>
            </div>
          )}
        </div>

        {schritt < 4 && (
          <aside aria-label="Deine Auswahl" style={{ flex: '1 1 300px', minWidth: 0, background: '#fff', borderRadius: 30, padding: 32, position: 'sticky', top: 76 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 21, fontWeight: 700 }}>Deine Auswahl</h2>
            <p className="muted" style={{ margin: '0 0 18px', fontSize: 15 }}>
              {gewaehlt.length === 0 ? (art === 'passiv' ? 'Passive Mitgliedschaft' : 'Noch nichts ausgewählt') : `${gewaehlt.length} ${gewaehlt.length === 1 ? 'Angebot' : 'Angebote'}`}
            </p>
            <ul style={{ listStyle: 'none', margin: '0 0 20px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gewaehlt.map((a) => (
                <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 15, padding: '10px 14px', background: 'var(--bsv-soft)', borderRadius: 12 }}>
                  <span>{a.name}</span>
                  <span className="muted">{a.gruppe.replace(' & Senioren', '')}</span>
                </li>
              ))}
            </ul>
            <div style={{ borderTop: '1px solid var(--bsv-line-2)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="muted" style={{ fontSize: 15 }}>
                {beitrag?.label}
              </span>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{euro(beitrag?.quartal ?? 0)}</span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', textAlign: 'right', fontSize: 13 }}>
              pro Quartal{art !== 'passiv' ? ` · entspricht ${euro((beitrag?.quartal ?? 0) / 3)} im Monat` : ''}
            </p>
          </aside>
        )}
      </div>
    </section>
  )
}
