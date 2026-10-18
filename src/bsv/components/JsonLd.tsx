import React from 'react'

/** Strukturierte Daten für Google (schema.org) – unsichtbar auf der Seite */
export function JsonLd({ daten }: { daten: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(daten).replace(/</g, '\\u003c') }} />
}
