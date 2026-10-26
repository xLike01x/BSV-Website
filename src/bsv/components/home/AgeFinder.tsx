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
          {/* key: bei jeder Änderung neu – die Zahl hüpft kurz (Website-Aufbau → Animationen) */}
          <span key={alter} className="regler-zahl">
            {alter} {alter === 1 ? 'Jahr' : 'Jahre'}
          </span>
        </output>
      </label>
      <div className="regler" style={{ '--p': (alter - 1) / 98, '--dreh': `${(alter - 1) * 24}deg` } as React.CSSProperties}>
        {/* Strich-Fußball rollt mit dem Regler (rein dekorativ) */}
        <svg className="regler-ball" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="10.5" />
          <path d="M12 7.6l3.6 2.6-1.4 4.2H9.8L8.4 10.2z" className="regler-ball-fleck" />
          <path d="M12 7.6V1.6M15.6 10.2l5.6-1.8M14.2 14.4l3.4 4.8M9.8 14.4l-3.4 4.8M8.4 10.2L2.8 8.4" />
        </svg>
        <input id="alter" type="range" min={1} max={99} value={alter} onChange={(e) => setAlter(Number(e.target.value))} />
      </div>
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
