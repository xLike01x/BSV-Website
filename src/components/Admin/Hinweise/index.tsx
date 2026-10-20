'use client'
import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import './hinweise.scss'

/**
 * Live-Hinweise beim Bearbeiten: warnt vor typischen Fehlern und erklärt,
 * wo ein Eintrag nach dem Speichern auf der Website erscheint.
 * Die Hinweise blockieren nie das Speichern.
 */

type Hinweis = { art: 'warn' | 'info' | 'ok'; text: React.ReactNode }

function HinweisBox({ titel = 'Hinweise', hinweise }: { titel?: string; hinweise: Hinweis[] }) {
  if (!hinweise.length) return null
  return (
    <div className="bsv-hinweise" role="status" aria-live="polite">
      <p className="bsv-hinweise__titel">{titel}</p>
      <ul>
        {hinweise.map((h, i) => (
          <li key={i} className={`bsv-hinweise__${h.art}`}>
            <span aria-hidden="true">{h.art === 'warn' ? '⚠️' : h.art === 'ok' ? '✅' : 'ℹ️'}</span>
            <span>{h.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const idVon = (v: unknown): number | string | null => {
  if (v == null || v === '') return null
  if (typeof v === 'object') return ((v as { id?: number; value?: number }).id ?? (v as { value?: number }).value ?? null) as number | null
  return v as number
}

/** Titel eines Teams nachladen (für „Erscheint auf …“) */
function useAngebotTitel(id: number | string | null) {
  const [titel, setTitel] = useState<{ title?: string; slug?: string } | null>(null)
  useEffect(() => {
    if (!id) return setTitel(null)
    let ab = false
    fetch(`/api/angebote/${id}?depth=0&select[title]=true&select[slug]=true`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !ab && setTitel(d))
      .catch(() => null)
    return () => {
      ab = true
    }
  }, [id])
  return titel
}

const TEAM_ROLLEN = ['uebungsleitung', 'teamredaktion']

/* ------------------------------------------------------------------ */
/** Wörter im Text zählen (Lexical-Inhalt) */
function woerter(inhalt: unknown): number {
  let n = 0
  const gehen = (k: unknown) => {
    if (!k || typeof k !== 'object') return
    const x = k as { text?: unknown; children?: unknown[] }
    if (typeof x.text === 'string') n += x.text.split(/\s+/).filter(Boolean).length
    if (Array.isArray(x.children)) x.children.forEach(gehen)
  }
  gehen((inhalt as { root?: unknown } | null)?.root)
  return n
}

/** Angaben zum Titelbild nachladen (Personen erkennbar? Bildbeschreibung?) */
function useBildAngaben(id: number | string | null) {
  const [b, setB] = useState<{ personen?: string | null; alt?: string | null } | null>(null)
  useEffect(() => {
    if (!id) return setB(null)
    let ab = false
    fetch(`/api/media/${id}?depth=0&select[personen]=true&select[alt]=true`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !ab && setB(d))
      .catch(() => null)
    return () => {
      ab = true
    }
  }, [id])
  return b
}

export function NewsHinweise() {
  const { user } = useAuth<{ roles?: string[] }>()
  const { hasPublishedDoc, id } = useDocumentInfo()
  const titel = useFormFields(([f]) => f.title?.value as string | undefined)
  const bild = useFormFields(([f]) => f.heroImage?.value)
  const team = useFormFields(([f]) => f.team?.value)
  const startseite = useFormFields(([f]) => f.aufStartseite?.value as boolean | undefined)
  const vorschlag = useFormFields(([f]) => f.startseiteVorschlag?.value as boolean | undefined)
  const inhalt = useFormFields(([f]) => f.content?.value)
  const angebot = useAngebotTitel(idVon(team))
  const bildAngaben = useBildAngaben(idVon(bild))

  const istTeamRolle = !user?.roles?.some((r) => ['admin', 'redaktion'].includes(r)) && user?.roles?.some((r) => TEAM_ROLLEN.includes(r))
  // Team-Rollen: neue News kommen nie direkt auf die Startseite
  const aufStart = Boolean(startseite) && !(istTeamRolle && !id)

  const orte: string[] = []
  if (angebot?.title) orte.push(`Seite „${angebot.title}“`)
  if (aufStart) orte.push('Startseite', 'News-Übersicht')

  const h: Hinweis[] = []
  h.push(
    orte.length
      ? { art: 'info', text: <>Erscheint auf: <strong>{orte.join(' · ')}</strong></> }
      : {
          art: 'warn',
          text: istTeamRolle
            ? 'Wähle bei „Team / Kurs“ dein Team – sonst erscheint die News nirgends.'
            : 'Diese News erscheint nirgends: Team wählen oder „Auf Startseite“ anhaken.',
        },
  )
  if (istTeamRolle && !aufStart)
    h.push(
      vorschlag
        ? { art: 'ok', text: 'Für die Startseite vorgeschlagen – die Redaktion entscheidet und bekommt den Vorschlag angezeigt.' }
        : { art: 'info', text: 'Soll die News auch auf die Startseite? Rechts „Für die Startseite vorschlagen“ anhaken.' },
    )

  // Vollständigkeit
  const anzahl = woerter(inhalt)
  if (!titel?.trim()) h.push({ art: 'warn', text: 'Noch kein Titel.' })
  if (titel && titel.length > 70) h.push({ art: 'warn', text: `Der Titel ist recht lang (${titel.length} Zeichen). Kürzer liest sich besser – ideal unter 70.` })
  const buchstaben = (titel ?? '').replace(/[^A-Za-zÄÖÜäöüß]/g, '')
  if (buchstaben.length >= 8 && buchstaben.replace(/[^A-ZÄÖÜ]/g, '').length / buchstaben.length > 0.7) h.push({ art: 'warn', text: 'Der Titel ist fast nur in GROSSBUCHSTABEN – das wirkt wie Schreien und ist schwerer zu lesen.' })
  if (/[!?]{2,}/.test(titel ?? '')) h.push({ art: 'info', text: 'Mehrere Ausrufe- oder Fragezeichen im Titel – eins reicht.' })
  if (anzahl === 0) h.push({ art: 'warn', text: 'Noch kein Text geschrieben.' })
  else if (anzahl < 25) h.push({ art: 'info', text: `Der Text ist sehr kurz (${anzahl} Wörter). Zwei, drei Sätze mehr – wer, was, wann, wo – machen die News lesenswert.` })
  if (!bild) h.push({ art: 'warn', text: 'Kein Titelbild – in Übersichten sieht die News leer aus.' })
  else if (bildAngaben) {
    if (!bildAngaben.personen) h.push({ art: 'warn', text: 'Beim Titelbild fehlt die Angabe, ob Personen zu erkennen sind. Bitte in der Mediathek nachtragen – bei Kindern nur mit Einwilligung der Eltern.' })
    if (!bildAngaben.alt?.trim()) h.push({ art: 'info', text: 'Das Titelbild hat keine Bildbeschreibung (für Menschen, die sich Seiten vorlesen lassen). In der Mediathek ergänzen.' })
  }
  h.push({ art: 'info', text: 'Rechtschreibung: Rot unterstrichene Wörter mit der rechten Maustaste anklicken – dein Browser schlägt die richtige Schreibweise vor.' })
  if (!hasPublishedDoc) h.push({ art: 'info', text: 'Noch nicht veröffentlicht – sichtbar erst nach „Veröffentlichen“.' })
  else h.push({ art: 'ok', text: 'Ist veröffentlicht. Änderungen werden erst mit „Veröffentlichen“ übernommen.' })

  return <HinweisBox titel="Vor dem Veröffentlichen" hinweise={h} />
}

/* ------------------------------------------------------------------ */
export function AngebotHinweise() {
  const slug = useFormFields(([f]) => f.slug?.value as string | undefined)
  const aktiv = useFormFields(([f]) => f.aktiv?.value as boolean | undefined)
  const bild = useFormFields(([f]) => f.bild?.value)
  const zeiten = useFormFields(([f]) => f.zeiten?.value as number | unknown[] | undefined)
  const leitung = useFormFields(([f]) => f.leitung?.value as unknown[] | undefined)
  const bereich = useFormFields(([f]) => f.bereich?.value as string | undefined)

  const anzahlZeiten = Array.isArray(zeiten) ? zeiten.length : Number(zeiten ?? 0)
  const h: Hinweis[] = []
  if (aktiv === false) h.push({ art: 'warn', text: 'Nicht aktiv – das Angebot ist auf der Website ausgeblendet.' })
  else if (slug)
    h.push({
      art: 'info',
      text: (
        <>
          Eigene Seite:{' '}
          <a href={`/angebote/${slug}`} target="_blank" rel="noopener">
            /angebote/{slug} ↗
          </a>
          {bereich && <> · im Menü „{bereich === 'fussball' ? 'Fußball' : 'Breitensport'}“</>}
        </>
      ),
    })
  if (!bild) h.push({ art: 'warn', text: 'Kein Titelbild – die Teamseite wirkt ohne Bild leer.' })
  if (!anzahlZeiten) h.push({ art: 'warn', text: 'Keine Trainingszeiten eingetragen.' })
  if (!leitung || (Array.isArray(leitung) && leitung.length === 0))
    h.push({ art: 'info', text: 'Keine Verantwortlichen – nur Redaktion und Admins können dieses Angebot pflegen.' })
  return <HinweisBox hinweise={h} />
}

/* ------------------------------------------------------------------ */
export function TerminHinweise() {
  const beginn = useFormFields(([f]) => f.beginn?.value as string | undefined)
  const ende = useFormFields(([f]) => f.ende?.value as string | undefined)
  const nurMitglieder = useFormFields(([f]) => f.nurMitglieder?.value as boolean | undefined)
  const h: Hinweis[] = []
  if (beginn && new Date(beginn) < new Date()) h.push({ art: 'warn', text: 'Der Termin liegt in der Vergangenheit und erscheint nicht mehr auf der Website.' })
  if (beginn && ende && new Date(ende) < new Date(beginn)) h.push({ art: 'warn', text: 'Das Ende liegt vor dem Beginn – bitte prüfen.' })
  h.push({ art: 'info', text: nurMitglieder ? 'Erscheint unter „Termine“ – nur für angemeldete Mitglieder.' : 'Erscheint unter „Termine“ für alle Besucher.' })
  return <HinweisBox hinweise={h} />
}

/* ------------------------------------------------------------------ */
export function AusfallHinweise() {
  const datum = useFormFields(([f]) => f.datum?.value as string | undefined)
  const angebot = useAngebotTitel(idVon(useFormFields(([f]) => f.angebot?.value)))
  const h: Hinweis[] = []
  if (datum) {
    const d = new Date(datum)
    const heute = new Date()
    heute.setHours(0, 0, 0, 0)
    if (d < heute) h.push({ art: 'warn', text: 'Das Datum liegt in der Vergangenheit – der Hinweis wird nicht mehr angezeigt.' })
  }
  if (angebot?.title) h.push({ art: 'info', text: <>Erscheint sofort auf der Seite <strong>„{angebot.title}“</strong> und im Mitgliederbereich.</> })
  return <HinweisBox hinweise={h} />
}

/* ------------------------------------------------------------------ */
export function SeitenHinweise() {
  const { hasPublishedDoc, id } = useDocumentInfo()
  const slug = useFormFields(([f]) => f.slug?.value as string | undefined)
  const [imMenue, setImMenue] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch('/api/globals/menue?depth=0', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        const alle = [...(m?.links ?? []), ...(m?.vereinUeberUns ?? []), ...(m?.vereinMehr ?? [])] as { ziel?: string; seite?: unknown }[]
        setImMenue(alle.some((e) => e.ziel !== 'adresse' && String(idVon(e.seite)) === String(id)))
      })
      .catch(() => null)
  }, [id])

  const h: Hinweis[] = []
  if (slug)
    h.push({
      art: 'info',
      text: hasPublishedDoc ? (
        <>
          Adresse:{' '}
          <a href={`/${slug}`} target="_blank" rel="noopener">
            /{slug} ↗
          </a>
        </>
      ) : (
        <>Adresse nach dem Veröffentlichen: /{slug}</>
      ),
    })
  if (!hasPublishedDoc && imMenue) h.push({ art: 'warn', text: 'Diese Seite steht im Menü, ist aber noch nicht veröffentlicht – der Menü-Link führt ins Leere.' })
  if (hasPublishedDoc && !imMenue) h.push({ art: 'info', text: 'Steht nicht im Menü. Unter „Menü & Fußzeile“ kannst du sie hinzufügen.' })
  if (!hasPublishedDoc) h.push({ art: 'info', text: 'Noch nicht veröffentlicht – nur in der Verwaltung sichtbar.' })
  return <HinweisBox hinweise={h} />
}

/* ------------------------------------------------------------------ */
export function MedienHinweise() {
  const alt = useFormFields(([f]) => f.alt?.value as string | undefined)
  const datei = useFormFields(([f]) => f.file?.value as File | undefined)
  const groesse = useFormFields(([f]) => f.filesize?.value as number | undefined)
  const galerie = useFormFields(([f]) => f.inGalerie?.value as boolean | undefined)
  const team = useFormFields(([f]) => f.team?.value)
  const allgemein = useFormFields(([f]) => f.allgemein?.value as boolean | undefined)
  const sponsoren = useFormFields(([f]) => Boolean(f.sponsoren?.value))
  const personen = useFormFields(([f]) => f.personen?.value as string | undefined)

  const bytes = (datei && typeof datei === 'object' && 'size' in datei ? datei.size : undefined) ?? groesse
  const h: Hinweis[] = []
  if (bytes && bytes > 8 * 1024 * 1024)
    h.push({ art: 'warn', text: `Die Datei ist sehr groß (${(bytes / 1024 / 1024).toFixed(1)} MB). Lädt langsam – besser vorher verkleinern (unter 5 MB).` })
  if (!alt) h.push({ art: 'warn', text: 'Bitte eine kurze Bildbeschreibung eingeben.' })
  if (galerie && !idVon(team)) h.push({ art: 'warn', text: '„In Galerie zeigen“ wirkt nur, wenn ein Team gewählt ist.' })
  if (galerie && idVon(team)) h.push({ art: 'info', text: 'Erscheint in der Fotogalerie des gewählten Teams.' })
  if (!idVon(team) && !allgemein && !sponsoren)
    h.push({ art: 'warn', text: 'Noch kein Ordner: rechts ein Team wählen, „Verein allgemein“ oder „Sponsoren-Logo“ anhaken. Sonst können Trainer das Bild nicht benutzen. (Sponsor-Logos kommen beim Speichern des Sponsors automatisch in „Sponsoren“.)' })
  if (!idVon(team) && sponsoren) h.push({ art: 'ok', text: 'Liegt im Ordner „Sponsoren“.' })
  else if (!idVon(team) && allgemein) h.push({ art: 'ok', text: 'Liegt in „Verein allgemein“ – alle Trainer dürfen es benutzen.' })
  if (idVon(team)) h.push({ art: 'ok', text: 'Liegt im Ordner des gewählten Teams.' })
  if (!personen) h.push({ art: 'warn', text: 'Noch keine Angabe, ob Personen zu erkennen sind. Bitte oben auswählen.' })
  else if (personen === 'einwilligung') h.push({ art: 'ok', text: 'Einwilligung liegt vor – bitte die schriftliche Einwilligung aufbewahren.' })
  else h.push({ art: 'ok', text: 'Keine Personen erkennbar.' })
  return <HinweisBox hinweise={h} />
}

/** Formular: Wo ist es eingebunden – und wie bindet man es ein? */
function SeiteMitFormular({ id }: { id: number | string }) {
  const titel = useFormFields(([f]) => f?.title?.value as string | undefined)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState(false)
  const anlegen = async () => {
    setLaeuft(true)
    setFehler(false)
    try {
      const r = await fetch('/api/pages?draft=true', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titel || 'Neue Seite', _status: 'draft', hero: { type: 'none' }, layout: [{ blockType: 'formBlock', form: id, enableIntro: false }] }),
      })
      const d = await r.json()
      if (!r.ok || !d?.doc?.id) throw new Error()
      window.location.href = `/admin/collections/pages/${d.doc.id}`
    } catch {
      setFehler(true)
      setLaeuft(false)
    }
  }
  return (
    <>
      <button type="button" className="bsv-hinweise__knopf" onClick={anlegen} disabled={laeuft}>
        {laeuft ? 'Seite wird angelegt …' : '➕ Neue Seite mit diesem Formular erstellen'}
      </button>
      <span className="bsv-hinweise__klein">Legt einen Entwurf an. Du prüfst ihn und klickst dann „Veröffentlichen“.</span>
      {fehler && <span className="bsv-hinweise__klein">Hat nicht geklappt – bitte noch einmal versuchen.</span>}
    </>
  )
}

export function FormularHinweise() {
  const { id } = useDocumentInfo()
  const [seiten, setSeiten] = useState<{ id: number; title: string; slug?: string; status?: string }[] | null>(null)
  const [eingaenge, setEingaenge] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    let aktiv = true
    fetch('/api/pages?depth=0&limit=300&draft=true&select[title]=true&select[slug]=true&select[layout]=true&select[_status]=true', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs: { id: number; title: string; slug?: string; _status?: string; layout?: { blockType?: string; form?: unknown }[] }[] }) => {
        if (!aktiv) return
        setSeiten(
          d.docs
            .filter((s) => (s.layout ?? []).some((b) => b.blockType === 'formBlock' && String(idVon(b.form)) === String(id)))
            .map((s) => ({ id: s.id, title: s.title, slug: s.slug, status: s._status })),
        )
      })
      .catch(() => aktiv && setSeiten([]))
    fetch(`/api/form-submissions?depth=0&limit=0&where[form][equals]=${id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => aktiv && setEingaenge(d?.totalDocs ?? null))
      .catch(() => {})
    return () => {
      aktiv = false
    }
  }, [id])

  const hinweise: Hinweis[] = []
  if (!id) {
    hinweise.push({ art: 'info', text: 'Zuerst speichern. Danach kannst du das Formular auf einer Seite einbauen.' })
  } else if (seiten === null) {
    hinweise.push({ art: 'info', text: 'Prüfe, wo das Formular eingebunden ist …' })
  } else if (seiten.length === 0) {
    hinweise.push({
      art: 'warn',
      text: (
        <>
          Noch auf <strong>keiner Seite</strong> eingebaut – Besucher sehen es noch nicht. Am einfachsten:
          <SeiteMitFormular id={id} />
          Oder selbst: <strong>Seiten</strong> öffnen → Reiter „Inhalt (Bausteine)“ → „Baustein hinzufügen“ → <strong>Formular</strong> → dieses Formular auswählen → Veröffentlichen.
        </>
      ),
    })
  } else {
    for (const s of seiten)
      hinweise.push({
        art: s.status === 'published' ? 'ok' : 'warn',
        text: (
          <>
            Eingebaut auf <a href={`/admin/collections/pages/${s.id}`}>{s.title}</a>
            {s.status === 'published' && s.slug ? (
              <>
                {' '}
                ·{' '}
                <a href={s.slug === 'home' ? '/' : `/${s.slug}`} target="_blank" rel="noopener">
                  auf der Website ansehen ↗
                </a>
              </>
            ) : (
              ' – die Seite ist noch nicht veröffentlicht.'
            )}
          </>
        ),
      })
    hinweise.push({ art: 'info', text: 'Im Menü verlinken: unter „Menü & Fußzeile“ einen Eintrag mit „Seite aus ‚Seiten‘ öffnen“ anlegen und diese Seite wählen.' })
  }
  if (id && eingaenge !== null)
    hinweise.push({
      art: 'info',
      text: (
        <>
          Bisher {eingaenge === 1 ? '1 Eingang' : `${eingaenge} Eingänge`} –{' '}
          <a href={`/admin/collections/form-submissions?where[form][equals]=${id}`}>ansehen ›</a>
        </>
      ),
    })
  return <HinweisBox titel="Wo erscheint dieses Formular?" hinweise={hinweise} />
}
