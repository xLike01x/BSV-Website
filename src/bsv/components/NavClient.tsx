'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

export type NavItem = { label: string; href: string; external?: boolean }
export type NavEintrag = { art: 'menu'; id: string; label: string } | { art: 'link'; item: NavItem }
export type NavMenu = {
  id: string
  label: string
  title: string
  href: string
  desc: string
  groups: { title: string; items: NavItem[] }[]
}

const ItemLink = ({ it, onClick, className }: { it: NavItem; onClick?: () => void; className?: string }) =>
  it.external ? (
    <a href={it.href} target="_blank" rel="noopener noreferrer" className={className}>
      {it.label}
    </a>
  ) : (
    <Link href={it.href} onClick={onClick} className={className}>
      {it.label}
    </Link>
  )

export function NavClient({ menus, eintraege }: { menus: NavMenu[]; eintraege: NavEintrag[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  const [mobil, setMobil] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [eingeloggt, setEingeloggt] = useState(false)

  // Login-Status im Browser abfragen, damit die Seiten selbst statisch bleiben können
  useEffect(() => {
    fetch('/api/users/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEingeloggt(Boolean(d?.user)))
      .catch(() => setEingeloggt(false))
  }, [pathname])

  // Beim Seitenwechsel alles schließen
  useEffect(() => {
    setOpen(null)
    setMobil(false)
  }, [pathname])

  // Escape schließt, Klick außerhalb schließt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (setOpen(null), setMobil(false))
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(null)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobil ? 'hidden' : ''
  }, [mobil])

  const aktiv = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const bereichAktiv = (m: NavMenu) =>
    aktiv(m.href) || m.groups.some((g) => g.items.some((i) => !i.external && aktiv(i.href.split('#')[0]!)))
  const offen = menus.find((m) => m.id === open)

  return (
    <div className="nav" ref={ref} onMouseLeave={() => setOpen(null)}>
      <div className="nav-bar">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" onMouseEnter={() => setOpen(null)}>
            <img src="/bsv-logo.png" alt="" width={30} height={32} style={{ objectFit: 'contain' }} />
            BSV 1919
          </Link>
          <nav aria-label="Hauptmenü" className="nav-links">
            {eintraege.map((e) => {
              if (e.art === 'menu') {
                const m = menus.find((x) => x.id === e.id)!
                return (
                  <button
                    key={'m-' + e.id}
                    type="button"
                    className="nav-link"
                    aria-expanded={open === m.id}
                    aria-current={bereichAktiv(m) ? 'page' : undefined}
                    onClick={() => setOpen(open === m.id ? null : m.id)}
                    onMouseEnter={() => setOpen(m.id)}
                  >
                    {e.label}
                  </button>
                )
              }
              const l = e.item
              return l.external ? (
                <a key={l.href + l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="nav-link" onMouseEnter={() => setOpen(null)}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.href + l.label} href={l.href} className="nav-link" aria-current={aktiv(l.href) ? 'page' : undefined} onMouseEnter={() => setOpen(null)}>
                  {l.label}
                </Link>
              )
            })}
          </nav>
          <div className="nav-actions" onMouseEnter={() => setOpen(null)}>
            <Link href={eingeloggt ? '/mitglieder' : '/login'} className="nav-login">
              {eingeloggt ? 'Mein BSV' : 'Anmelden'}
            </Link>
            <Link href="/mitglied-werden" className="nav-cta">
              Mitglied werden
            </Link>
          </div>
          <button
            type="button"
            className="nav-burger"
            aria-expanded={mobil}
            aria-controls="mobilmenue"
            aria-label={mobil ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMobil(!mobil)}
          >
            <span />
          </button>
        </div>
      </div>

      {offen && (
        <div className="nav-panel">
          <div className="nav-panel-inner">
            <div className="nav-panel-intro">
              <p className="nav-panel-label">{offen.label}</p>
              <Link href={offen.href} className="nav-panel-title">
                {offen.title}
              </Link>
              <p style={{ margin: '10px 0 0', color: 'var(--bsv-muted)', fontSize: 14, lineHeight: 1.45 }}>{offen.desc}</p>
              <Link href={offen.href} style={{ display: 'inline-block', marginTop: 14, fontSize: 14, textDecoration: 'none' }}>
                Zur Übersicht ›
              </Link>
            </div>
            {offen.groups.map((g, i) => (
              <div className="nav-panel-group" key={g.title + i}>
                <p className="nav-panel-label">{g.title}</p>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.href + it.label}>
                      <ItemLink it={it} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {mobil && (
        <div className="mnav" id="mobilmenue">
          {eintraege.map((e) => {
            if (e.art === 'link') return <ItemLink key={e.item.href + e.item.label} it={e.item} className="mnav-top" />
            const m = menus.find((x) => x.id === e.id)!
            return (
              <details key={'m-' + m.id}>
                <summary>{e.label}</summary>
                <Link href={m.href} className="mnav-sub" style={{ fontWeight: 600, color: 'var(--bsv-green)' }}>
                  Übersicht {e.label} ›
                </Link>
                {m.groups.map((g, i) => (
                  <div key={g.title + i} style={{ paddingBottom: 8 }}>
                    {g.title.trim() && <p className="mnav-grp">{g.title}</p>}
                    {g.items.map((it) => (
                      <ItemLink key={it.href + it.label} it={it} className="mnav-sub" />
                    ))}
                  </div>
                ))}
              </details>
            )
          })}
          <div className="mnav-actions">
            <Link href="/mitglied-werden" className="btn btn-primary">
              Mitglied werden
            </Link>
            <Link href={eingeloggt ? '/mitglieder' : '/login'} className="btn btn-ghost">
              {eingeloggt ? 'Mein BSV' : 'Anmelden'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
