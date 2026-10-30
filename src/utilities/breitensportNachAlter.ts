import type { Payload } from 'payload'
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from 'payload'

import { nachAlter } from './altersSortierung'

/**
 * Einmalig (30.10.2026, Wunsch von Thomas): Breitensport-Kurse im Menü, auf den Übersichtsseiten und im Mitgliedsantrag
 * nach Alter sortieren (jüngste zuerst).
 *
 * Umgestellt wird eine Spalte nur, solange sie noch genau in der Reihenfolge der Startdaten steht – wer schon selbst
 * umsortiert oder Kurse ergänzt hat, behält seine Reihenfolge (dafür gibt es im Menü-Editor „Nach Alter sortieren“).
 * Danach passt die Prüfung nicht mehr, der Schritt läuft also nur einmal.
 */
const ALTE_REIHENFOLGE = {
  kids: ['Nappy Dancers®', 'Tanzmäuse', 'Diamond Kids', 'Kindergardetanz', 'Zumba® Kids', 'Eltern-Kind-Turnen', 'Turnen für Kindergartenkinder', 'Turnen für Grundschulkinder', 'Mitmachzirkus'],
  erwachsene: [
    'Step & Burn',
    'Zumba® Fitness',
    'Spinning',
    'Bodyfit',
    'Frauenfitness',
    'Pilates für Damen',
    'Pilates für Herren',
    'Yoga',
    'Rehasport',
    'Seniorenturnen',
    'Asiatische Bewegungsformen',
    'Nordic Walking',
    'Walking',
  ],
} as const

type Kurs = { id: number; title: string; alterText?: string | null; alterVon?: number | null; alterBis?: number | null; reihenfolge?: number | null }

export async function breitensportNachAlter(payload: Payload) {
  for (const bereich of ['kids', 'erwachsene'] as const) {
    const r = await payload.find({
      collection: 'angebote',
      where: { bereich: { equals: bereich } },
      sort: ['reihenfolge', 'title'],
      depth: 0,
      limit: 200,
      pagination: false,
      overrideAccess: true,
    })
    const kurse = r.docs as unknown as Kurs[]
    if (kurse.map((k) => k.title).join('\n') !== ALTE_REIHENFOLGE[bereich].join('\n')) continue
    const sortiert = [...kurse].sort(nachAlter)
    if (sortiert.every((k, i) => k.id === kurse[i]!.id)) continue

    // Die bisherigen Zahlen wiederverwenden, damit Kids weiter vor den Erwachsenen stehen; nur bei doppelten Zahlen neu durchzählen
    const zahlen = kurse.map((k) => k.reihenfolge ?? 100)
    const eindeutig = zahlen.every((z, i) => i === 0 || z > zahlen[i - 1]!)
    const neu = (i: number) => (eindeutig ? zahlen[i]! : zahlen[0]! + i * 10)

    // Ganz oder gar nicht – keine halb sortierte Spalte
    const req = await createLocalReq({}, payload)
    const eigene = await initTransaction(req)
    try {
      for (const [i, k] of sortiert.entries()) {
        if (k.reihenfolge === neu(i)) continue
        await payload.update({ collection: 'angebote', id: k.id, data: { reihenfolge: neu(i) } as never, overrideAccess: true, req, context: { disableRevalidate: true } })
      }
      if (eigene) await commitTransaction(req)
      payload.logger.info(`Breitensport: ${bereich === 'kids' ? 'BSV Kids' : 'Erwachsene & Senioren'} nach Alter sortiert`)
    } catch (e) {
      if (eigene) await killTransaction(req)
      throw e
    }
  }
}
