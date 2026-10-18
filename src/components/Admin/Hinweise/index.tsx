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
export function NewsHinweise() {
  const { user } = useAuth<{ roles?: string[] }>()
  const { hasPublishedDoc, id } = useDocumentInfo()
  const titel = useFormFields(([f]) => f.title?.value as string | undefined)
  const bild = useFormFields(([f]) => f.heroImage?.value)
  const team = useFormFields(([f]) => f.team?.value)
  const startseite = useFormFields(([f]) => f.aufStartseite?.value as boolean | undefined)
  const angebot = useAngebotTitel(idVon(team))

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
  if (istTeamRolle && !id) h.push({ art: 'info', text: 'Ob die News zusätzlich auf die Startseite kommt, entscheidet die Redaktion.' })
  if (!bild) h.push({ art: 'warn', text: 'Kein Titelbild – in Übersichten sieht die News leer aus.' })
  if (titel && titel.length > 70) h.push({ art: 'warn', text: `Der Titel ist recht lang (${titel.length} Zeichen). Kürzer liest sich besser – ideal unter 70.` })
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

  const bytes = (datei && typeof datei === 'object' && 'size' in datei ? datei.size : undefined) ?? groesse
  const h: Hinweis[] = []
  if (bytes && bytes > 8 * 1024 * 1024)
    h.push({ art: 'warn', text: `Die Datei ist sehr groß (${(bytes / 1024 / 1024).toFixed(1)} MB). Lädt langsam – besser vorher verkleinern (unter 5 MB).` })
  if (!alt) h.push({ art: 'warn', text: 'Bitte eine kurze Bildbeschreibung eingeben.' })
  if (galerie && !idVon(team)) h.push({ art: 'warn', text: '„In Galerie zeigen“ wirkt nur, wenn ein Team gewählt ist.' })
  if (galerie && idVon(team)) h.push({ art: 'info', text: 'Erscheint in der Fotogalerie des gewählten Teams.' })
  h.push({ art: 'info', text: 'Fotos von Kindern nur mit Einverständnis der Eltern.' })
  return <HinweisBox hinweise={h} />
}
