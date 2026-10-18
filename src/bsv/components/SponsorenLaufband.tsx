import Link from 'next/link'
import React from 'react'

import { getSponsoren } from '@/bsv/data'
import { bildUrl } from '@/bsv/lib'

/** Laufendes Logo-Band (nur Sponsoren mit Logo und Haken „Im Laufband“) – steht bei wenig Bewegung still */
export async function SponsorenLaufband() {
  const sponsoren = (await getSponsoren()).filter((s) => s.imLaufband !== false && s.logo && typeof s.logo === 'object')
  if (sponsoren.length < 3) return null
  const logos = sponsoren.map((s) => ({ id: s.id, name: s.name, url: s.url, src: bildUrl(s.logo, 'small') }))
  return (
    <section className="laufband-sec" aria-label="Unsere Sponsoren">
      <div className="wrap-narrow laufband-kopf">
        <p className="muted">Mit Unterstützung von</p>
        <Link href="/sponsoren">Alle Partner ›</Link>
      </div>
      <div className="laufband">
        <div className="laufband-spur">
          {[...logos, ...logos].map((l, i) => (
            <a key={`${l.id}-${i}`} href={l.url || '/sponsoren'} target={l.url ? '_blank' : undefined} rel="noopener noreferrer" aria-hidden={i >= logos.length} tabIndex={i >= logos.length ? -1 : undefined}>
              <img src={l.src} alt={l.name} />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
