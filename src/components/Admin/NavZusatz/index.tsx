'use client'
import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { EINTRAEGE, type Eintrag } from './eintraege'
import './nav-zusatz.scss'

/** Bereiche mit Zähler „neu“ (Schlüssel = Sammlung) */
const ZAEHLER = ['mitgliedsantraege', 'kontaktanfragen', 'probetraining', 'passantraege']

const gruppenInhalt = (label: string) => document.getElementById(`nav-group-${label}`)?.closest('.nav-group')?.querySelector('.nav-group__content') ?? null

/** Kleine Zahl an einen Link oder eine Gruppen-Überschrift hängen (oder entfernen) */
function zahlSetzen(ziel: Element | null, anzahl: number, titel: string) {
  if (!ziel) return
  let el = ziel.querySelector(':scope > .bsv-nav-zahl') as HTMLElement | null
  if (!anzahl) return void el?.remove()
  if (!el) {
    el = document.createElement('span')
    el.className = 'bsv-nav-zahl'
    ziel.appendChild(el)
  }
  const text = anzahl > 99 ? '99+' : String(anzahl)
  if (el.textContent !== text) el.textContent = text
  el.title = titel
  el.setAttribute('aria-label', titel)
}

/**
 * Ergänzt die Seitenleiste:
 * - Sonderseiten (Registrierungen, Rollen & Rechte, Datensicherung) erscheinen in ihrer Gruppe
 * - Zähler für neue Einträge im Posteingang (auch an der Gruppe, wenn sie zugeklappt ist)
 * Fehlt eine Gruppe (Rolle sieht sie nicht), landet der Link unten in der Seitenleiste.
 */
export default function NavZusatz() {
  const { user } = useAuth<{ roles?: string[] }>()
  const pfad = usePathname()
  const rollen = user?.roles ?? []
  const sichtbar = EINTRAEGE.filter((e) => e.rollen.some((r) => rollen.includes(r)))
  const [ziele, setZiele] = useState<Record<string, Element | null>>({})
  const [zahlen, setZahlen] = useState<Record<string, number>>({})

  // Container in den Gruppen anlegen – erneut prüfen, falls die Seitenleiste neu gezeichnet wird
  useEffect(() => {
    if (!user) return
    const finden = () => {
      const neu: Record<string, Element | null> = {}
      for (const g of [...new Set(sichtbar.map((e) => e.gruppe))]) {
        const inhalt = gruppenInhalt(g)
        if (!inhalt) {
          neu[g] = null
          continue
        }
        let box = inhalt.querySelector(':scope > .bsv-nav-zusatz')
        if (!box) {
          box = document.createElement('div')
          box.className = 'bsv-nav-zusatz'
          inhalt.appendChild(box)
        }
        neu[g] = box
      }
      setZiele((alt) => (Object.keys(neu).every((k) => alt[k] === neu[k]) && Object.keys(alt).length === Object.keys(neu).length ? alt : neu))
    }
    finden()
    const nav = document.querySelector('.nav__wrap') ?? document.body
    const beobachter = new MutationObserver(finden)
    beobachter.observe(nav, { childList: true, subtree: true })
    return () => beobachter.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, rollen.join(',')])

  // Zähler laden: beim Seitenwechsel und jede Minute
  const laden = useCallback(async () => {
    const r = await fetch('/api/posteingang', { credentials: 'include', cache: 'no-store' }).catch(() => null)
    if (r?.ok) setZahlen(await r.json())
  }, [])
  useEffect(() => {
    if (!user) return
    void laden()
    const t = setInterval(laden, 60_000)
    return () => clearInterval(t)
  }, [user, pfad, laden])

  // Zähler an die Links der Payload-Seitenleiste hängen
  useEffect(() => {
    const setzen = () => {
      for (const s of ZAEHLER) zahlSetzen(document.getElementById(`nav-${s}`), zahlen[s] ?? 0, `${zahlen[s] ?? 0} neu`)
      // Nur zählen, was in der Seitenleiste auch zu sehen ist
      const summe = Object.entries(zahlen).reduce((n, [k, v]) => (document.getElementById(`nav-${k}`) ? n + v : n), 0)
      zahlSetzen(document.querySelector('#nav-group-Posteingang .nav-group__label'), summe, `${summe} neue Einträge im Posteingang`)
    }
    setzen()
    const nav = document.querySelector('.nav__wrap') ?? document.body
    const beobachter = new MutationObserver(() => {
      beobachter.disconnect()
      setzen()
      beobachter.observe(nav, { childList: true, subtree: true })
    })
    beobachter.observe(nav, { childList: true, subtree: true })
    return () => beobachter.disconnect()
  }, [zahlen])

  if (!user) return null

  const link = (e: Eintrag) => {
    const aktiv = [e.href, ...(e.auch ?? [])].some((h) => pfad === h || pfad?.startsWith(h + '/'))
    const anzahl = e.zaehler ? (zahlen[e.zaehler] ?? 0) : 0
    return (
      <a key={e.key} id={`nav-${e.key}`} className="nav__link" href={e.href} aria-current={aktiv ? 'page' : undefined}>
        {aktiv && <div className="nav__link-indicator" />}
        <span className="nav__link-label">{e.label}</span>
        {anzahl > 0 && (
          <span className="bsv-nav-zahl" title={`${anzahl} neu`}>
            {anzahl > 99 ? '99+' : anzahl}
          </span>
        )}
      </a>
    )
  }

  const ohneGruppe = sichtbar.filter((e) => ziele[e.gruppe] === null)
  return (
    <>
      {sichtbar.filter((e) => ziele[e.gruppe]).length > 0 &&
        [...new Set(sichtbar.map((e) => e.gruppe))].map((g) => (ziele[g] ? <React.Fragment key={g}>{createPortal(sichtbar.filter((e) => e.gruppe === g).map(link), ziele[g]!)}</React.Fragment> : null))}
      {ohneGruppe.length > 0 && <div className="bsv-nav-zusatz bsv-nav-zusatz--lose">{ohneGruppe.map(link)}</div>}
    </>
  )
}
