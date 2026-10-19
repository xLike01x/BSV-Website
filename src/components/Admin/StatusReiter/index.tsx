import type { Payload, TypedUser, Where } from 'payload'
import React from 'react'

import StatusReiterClient, { type Reiter } from './Client'
import './status.scss'

type Definition = { key: string; titel: string; symbol: string; status: string[] | null; hervorheben?: boolean }

/**
 * Reiter über einer Liste, z. B. „🆕 Neu (2) · ⏳ Rückfrage · ✓ Erledigt · Alle“ – mit Anzahl.
 * Neue Einträge springen sofort ins Auge; ein Klick filtert die Liste.
 */
export default async function StatusReiter({ payload, user, sammlung, reiter }: { payload: Payload; user: TypedUser | null; sammlung: string; reiter: Definition[] }) {
  if (!user) return null
  const mitAnzahl: Reiter[] = await Promise.all(
    reiter.map(async (r) => {
      const where: Where | undefined = r.status ? { status: { in: r.status } } : undefined
      // Zählt mit den Rechten der Person (sieht also nur, was sie auch öffnen darf)
      const { totalDocs } = await payload.count({ collection: sammlung as never, where, user, overrideAccess: false }).catch(() => ({ totalDocs: 0 }))
      const query = r.status ? r.status.map((s, i) => `where[status][in][${i}]=${encodeURIComponent(s)}`).join('&') : ''
      return { key: r.key, titel: r.titel, symbol: r.symbol, anzahl: totalDocs, query, hervorheben: Boolean(r.hervorheben) }
    }),
  )
  return <StatusReiterClient sammlung={sammlung} reiter={mitAnzahl} />
}
