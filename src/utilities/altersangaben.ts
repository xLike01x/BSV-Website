import type { Payload } from 'payload'

/**
 * Einmalig (30.10.2026, Wunsch von Thomas): Fußball-Teams zeigen das Alter statt der Jahrgänge.
 * Die Jahrgänge stammten von der alten Website und waren schon eine Saison veraltet; das Alter (DFB-Altersklassen,
 * Stichtag 1. Januar) muss nicht jede Saison angepasst werden.
 *
 * Geändert wird nur, was noch genau dem alten Starttext entspricht – selbst geänderte Angaben bleiben unberührt.
 * Die Zahlen für den Angebotsfinder nur, wenn beide noch die alten Startwerte haben.
 */
type Umstellung = { alt: string; neu: string; von?: [number, number]; auf?: [number, number] }

export const ALTERSANGABEN: Umstellung[] = [
  { alt: 'Jg. 2019/2020', neu: 'unter 7 Jahre (U7)', von: [5, 7], auf: [4, 6] },
  { alt: 'Jg. 2017/2018', neu: '7–8 Jahre (U8 & U9)', von: [7, 9], auf: [7, 8] },
  { alt: 'Jg. 2015/2016 · JSG', neu: '9–10 Jahre (U10 & U11) · JSG', von: [9, 11], auf: [9, 10] },
  { alt: 'Jg. 2013/2014 · JSG', neu: '11–12 Jahre (U12 & U13) · JSG', von: [11, 13], auf: [11, 12] },
  { alt: 'Jg. 2011/2012 · JSG', neu: '13–14 Jahre (U14 & U15) · JSG', von: [13, 15], auf: [13, 14] },
  { alt: 'Jg. 2009/2010 · JSG', neu: '15–16 Jahre (U16 & U17) · JSG', von: [15, 17], auf: [15, 16] },
  { alt: 'Moerser Kreispokalsieger', neu: 'bis 12 Jahre (U13)', von: [10, 13], auf: [10, 12] },
  { alt: 'Herren', neu: 'Erwachsene (Senioren)' },
  { alt: 'Hallen-Stadtmeister', neu: 'Erwachsene (Senioren)' },
  { alt: 'Herren ab 32', neu: 'ab 32 Jahren (Ü32)' },
  { alt: 'SG mit SV Menzelen', neu: 'Erwachsene · SG mit SV Menzelen' },
]

type Angebot = { id: number; alterText?: string | null; alterVon?: number | null; alterBis?: number | null }

export async function altersangabenUmstellen(payload: Payload) {
  const r = await payload.find({
    collection: 'angebote',
    where: { and: [{ bereich: { equals: 'fussball' } }, { alterText: { in: ALTERSANGABEN.map((u) => u.alt) } }] },
    limit: 200,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  let geaendert = 0
  for (const a of r.docs as unknown as Angebot[]) {
    const u = ALTERSANGABEN.find((x) => x.alt === a.alterText)
    if (!u) continue
    const daten: Record<string, unknown> = { alterText: u.neu }
    if (u.von && u.auf && a.alterVon === u.von[0] && a.alterBis === u.von[1]) {
      daten.alterVon = u.auf[0]
      daten.alterBis = u.auf[1]
    }
    await payload
      .update({ collection: 'angebote', id: a.id, data: daten as never, overrideAccess: true, context: { disableRevalidate: true } })
      .then(() => geaendert++)
      .catch((e) => payload.logger.warn({ err: e }, `Altersangabe für Team ${a.id} nicht umgestellt`))
  }
  if (geaendert) payload.logger.info(`Fußball-Teams: ${geaendert} Altersangaben von Jahrgang auf Alter umgestellt`)
}
