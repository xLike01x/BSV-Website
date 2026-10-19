'use client'
import { useAuth } from '@payloadcms/ui'
import { einzelrechteVon } from '@/access/einzelrechte'
import React, { useEffect, useRef, useState } from 'react'

import './konto.scss'

const ROLLEN: Record<string, string> = {
  webadmin: 'Web-Admin',
  admin: 'Admin',
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  passwesen: 'Passwesen',
  uebungsleitung: 'Trainer',
  teamredaktion: 'Team-Redaktion',
  mitglied: 'Mitglied',
}

type Nutzer = { id: number; name?: string; email: string; roles?: string[] }

/** Klick auf das Personen-Symbol oben rechts: Konto, Mitgliederbereich, Website, Hilfe, Abmelden */
export default function KontoMenue() {
  const { user } = useAuth<Nutzer>()
  const [offen, setOffen] = useState(false)
  const [foto, setFoto] = useState<string | null>(null)
  const [abmelden, setAbmelden] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  // Profilfoto einmal nachladen (liegt geschützt unter „Profilbilder“)
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/profilbilder?where[besitzer][equals]=${user.id}&limit=1&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const b = d?.docs?.[0]
        if (b) setFoto(b.sizes?.klein?.url ?? b.url ?? null)
      })
      .catch(() => {})
  }, [user?.id])

  // Schließen bei Klick daneben oder Esc
  useEffect(() => {
    if (!offen) return
    const klick = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOffen(false)
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false)
    document.addEventListener('mousedown', klick)
    document.addEventListener('keydown', taste)
    return () => {
      document.removeEventListener('mousedown', klick)
      document.removeEventListener('keydown', taste)
    }
  }, [offen])

  if (!user) return null
  const name = user.name || user.email
  const kuerzel = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((t) => t[0]?.toUpperCase())
    .join('')
  const rollen = user.roles ?? []
  const rolle = rollen
    .filter((r) => !(r === 'admin' && rollen.includes('webadmin')))
    .map((r) => ROLLEN[r] ?? r)
    .concat(einzelrechteVon(user).length ? [`+${einzelrechteVon(user).length} Zusatzrecht${einzelrechteVon(user).length === 1 ? '' : 'e'}`] : [])
    .join(' · ')

  async function raus() {
    setAbmelden(true)
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => null)
    window.location.href = '/login?abgemeldet=1'
  }

  const bild = foto ? <img src={foto} alt="" /> : <span>{kuerzel}</span>

  return (
    <div className="bsv-konto" ref={box}>
      <button type="button" className="bsv-konto__knopf" aria-haspopup="menu" aria-expanded={offen} aria-label={`Konto-Menü von ${name}`} onClick={() => setOffen(!offen)}>
        {bild}
      </button>
      {offen && (
        <div className="bsv-konto__menue" role="menu">
          <div className="bsv-konto__kopf">
            <span className="bsv-konto__gross">{bild}</span>
            <span>
              <strong>{name}</strong>
              <small>{user.email}</small>
              {rolle && <small>Rolle: {rolle}</small>}
            </span>
          </div>
          <a role="menuitem" href="/admin/account">
            <span aria-hidden="true">👤</span> Mein Konto <small>Name, Passwort, Foto</small>
          </a>
          <a role="menuitem" href="/mitglieder">
            <span aria-hidden="true">🏠</span> Zum Mitgliederbereich <small>Ausfälle, Ausweis, Downloads</small>
          </a>
          <a role="menuitem" href="/" target="_blank" rel="noopener">
            <span aria-hidden="true">🌐</span> Website ansehen <small>öffnet in neuem Tab</small>
          </a>
          <a role="menuitem" href="/admin/hilfe">
            <span aria-hidden="true">📖</span> Hilfe-Center
          </a>
          <button type="button" role="menuitem" className="bsv-konto__raus" onClick={raus} disabled={abmelden}>
            <span aria-hidden="true">🚪</span> {abmelden ? 'Wird abgemeldet …' : 'Abmelden'}
          </button>
        </div>
      )}
    </div>
  )
}
