'use client'
import { useSearchParams } from 'next/navigation'
import React from 'react'

export type Reiter = { key: string; titel: string; symbol: string; anzahl: number; query: string; hervorheben: boolean }

/** Welche Status stehen gerade im Filter der Adresse? */
const statusAusAdresse = (sp: URLSearchParams) =>
  [...sp.entries()]
    .filter(([k]) => /^where\[status\]\[(in|equals)\]/.test(k))
    .map(([, v]) => v)
    .sort()
    .join(',')

export default function StatusReiterClient({ sammlung, reiter }: { sammlung: string; reiter: Reiter[] }) {
  const sp = useSearchParams()
  const aktuell = statusAusAdresse(new URLSearchParams(sp?.toString() ?? ''))
  return (
    <nav className="bsv-status" aria-label="Nach Status filtern">
      {reiter.map((r) => {
        const eigen = statusAusAdresse(new URLSearchParams(r.query))
        const aktiv = eigen === aktuell
        const neu = r.hervorheben && r.anzahl > 0
        return (
          <a key={r.key} href={`/admin/collections/${sammlung}${r.query ? `?${r.query}` : ''}`} className={`bsv-status__reiter${aktiv ? ' is-aktiv' : ''}${neu ? ' is-neu' : ''}`} aria-current={aktiv ? 'page' : undefined}>
            <span aria-hidden="true">{r.symbol}</span> {r.titel}
            <span className="bsv-status__zahl">{r.anzahl}</span>
          </a>
        )
      })}
    </nav>
  )
}
