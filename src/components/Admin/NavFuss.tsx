'use client'
import { useAuth } from '@payloadcms/ui'
import React from 'react'

const ROLLEN: Record<string, string> = {
  webadmin: 'Web-Admin',
  admin: 'Admin',
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  passwesen: 'Passwesen',
  uebungsleitung: 'Übungsleitung',
  teamredaktion: 'Team-Redaktion',
  mitglied: 'Mitglied',
}

/** Fuß der Seitenleiste: angemeldete Person + Link zur Website */
export default function NavFuss() {
  const { user } = useAuth<{ name?: string; email: string; roles?: string[] }>()
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
    .join(' · ')
  return (
    <div className="bsv-nav-fuss">
      <a className="bsv-nav-hilfe" href="/admin/hilfe">
        <span aria-hidden="true">📖</span> Hilfe-Center
      </a>
      {rollen.includes('admin') && (
        <a className="bsv-nav-hilfe" href="/admin/rollen">
          <span aria-hidden="true">👥</span> Rollen-Übersicht
        </a>
      )}
      {(rollen.includes('admin') || rollen.includes('kasse')) && (
        <a className="bsv-nav-hilfe" href="/admin/registrierungen">
          <span aria-hidden="true">🙋</span> Registrierungen
        </a>
      )}
      {rollen.includes('webadmin') && (
        <a className="bsv-nav-hilfe" href="/admin/sicherung">
          <span aria-hidden="true">💾</span> Datensicherung
        </a>
      )}
      <a className="bsv-nav-person" href="/admin/account">
        <span className="bsv-nav-kuerzel" aria-hidden="true">
          {kuerzel}
        </span>
        <span>
          <strong>{name}</strong>
          {rolle && <small>Rolle: {rolle}</small>}
        </span>
      </a>
      <a className="bsv-nav-website" href="/" target="_blank" rel="noopener">
        Zur Website ›
      </a>
      <small className="bsv-nav-copyright">© {new Date().getFullYear()} Thomas Wilms · Konzept, Design und Umsetzung</small>
    </div>
  )
}
