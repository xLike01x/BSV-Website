'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'

export type Vorschlag = { name: string; href: string; von: number; bis: number; img?: string; bg: string }

/** „Wie alt bist du?“ – Schieberegler, der passende Angebote vorschlägt */
export function AgeFinder({
  angebote,
  frage = 'Wie alt bist du?',
  keinTreffer = 'Schreib uns – wir finden etwas Passendes.',
}: {
  angebote: Vorschlag[]
  frage?: string
  keinTreffer?: string
}) {
  const [alter, setAlter] = useState(5)

  const treffer = useMemo(() => {
    const hits = angebote.filter((a) => alter >= a.von && alter <= a.bis)
    if (alter >= 18) {
      // Bei Erwachsenen die Angebote zuerst, deren Altersmitte nah am gewählten Alter liegt
      const mitte = (a: Vorschlag) => (a.von + Math.min(a.bis, 80)) / 2
      hits.sort((a, b) => Math.abs(mitte(a) - alter) - Math.abs(mitte(b) - alter))
    }
    return hits.slice(0, 4)
  }, [alter, angebote])

  return (
    <div className="agebox in4">
      <label htmlFor="alter">
        <span>{frage}</span>
        <output htmlFor="alter" aria-live="polite">
          {alter} {alter === 1 ? 'Jahr' : 'Jahre'}
        </output>
      </label>
      <input id="alter" type="range" min={1} max={99} value={alter} onChange={(e) => setAlter(Number(e.target.value))} />
      <div className="chips" aria-live="polite">
        {treffer.length === 0 && <span className="muted">{keinTreffer}</span>}
        {treffer.map((t) => (
          <Link key={t.href + alter} href={t.href} className="sug" style={{ background: t.bg }}>
            {t.img ? <img src={t.img} alt="" /> : <span className="sug-dot" />}
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
