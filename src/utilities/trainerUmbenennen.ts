import type { Payload } from 'payload'

/** Einmalig: gespeicherte Texte nachziehen – „Übungsleitung“ → „Trainer“, fester Beitrag „5 €“ → Platzhalter {abMonat} */
const ERSETZEN: [string, string][] = [
  ['Unsere Übungsleitenden sind zum Teil lizenziert', 'Unsere Trainerinnen und Trainer sind zum Teil lizenziert'],
  ['getragen von Ehrenamtlichen, Übungsleitenden und vielen helfenden Händen.', 'getragen von Ehrenamtlichen, Trainerinnen und Trainern und vielen helfenden Händen.'],
  ['Die Übungsleitungen werden automatisch informiert.', 'Die Trainer werden automatisch informiert.'],
  // Beitrag nicht fest im Text, sondern aus den Vereinsdaten berechnet
  ['Ab 5 € im Monat, alle Kurse inklusive.', 'Ab {abMonat} € im Monat, alle Kurse inklusive.'],
  // Stimmte nie: Neue Anträge gehen an die Kasse, nicht an die Trainer (27.10.2026)
  ['Die Trainer werden automatisch informiert.', 'Wir melden uns schnellstmöglich bei dir.'],
]

const ersetzen = (wert: unknown): unknown => {
  if (typeof wert === 'string') return ERSETZEN.reduce((s, [alt, neu]) => s.split(alt).join(neu), wert)
  if (Array.isArray(wert)) return wert.map(ersetzen)
  if (wert && typeof wert === 'object') return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, ersetzen(v)]))
  return wert
}

export async function trainerUmbenennen(payload: Payload) {
  const texte = await payload.findGlobal({ slug: 'texte' as never, depth: 0, overrideAccess: true }).catch(() => null)
  if (texte) {
    const neu = ersetzen(texte)
    if (JSON.stringify(neu) !== JSON.stringify(texte)) {
      const { id: _id, createdAt: _c, updatedAt: _u, globalType: _g, ...daten } = neu as Record<string, unknown>
      void [_id, _c, _u, _g]
      await payload.updateGlobal({ slug: 'texte' as never, data: daten as never, overrideAccess: true, context: { disableRevalidate: true } })
      payload.logger.info('Texte: veraltete Formulierungen nachgezogen')
    }
  }
  // Rollen-Bezeichnung im Trainerteam der Teams/Kurse
  const r = await payload.find({ collection: 'angebote', where: { 'team.rolle': { equals: 'Übungsleitung' } }, limit: 200, depth: 0, overrideAccess: true })
  for (const a of r.docs as unknown as { id: number; team?: { rolle?: string | null }[] | null }[]) {
    const team = (a.team ?? []).map((t) => (t.rolle === 'Übungsleitung' ? { ...t, rolle: 'Trainer' } : t))
    await payload.update({ collection: 'angebote', id: a.id, data: { team } as never, overrideAccess: true, context: { disableRevalidate: true } }).catch(() => null)
  }
}
