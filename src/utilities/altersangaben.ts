import type { Payload } from 'payload'

/**
 * Einmalig (30.10.2026, Wunsch von Thomas): einheitliche Altersangaben.
 * Fußball: Alter statt Jahrgang (DFB-Altersklassen, Stichtag 1. Januar) – die Jahrgänge stammten von der alten Website,
 * waren eine Saison veraltet und hätten jede Saison geändert werden müssen.
 * Breitensport: immer „X–Y Jahre“ bzw. „ab X Jahren“ statt eines Mischmaschs aus „J.“, „18–99“ und Zusatzinfos.
 *
 * Geändert wird nur, was noch genau dem alten Starttext entspricht – selbst geänderte Angaben bleiben unberührt.
 * Die Zahlen für den Angebotsfinder nur, wenn beide noch die alten Startwerte haben.
 */
type Umstellung = {
  alt: string
  neu: string
  von?: [number, number]
  auf?: [number, number]
  /** Was bisher im Alter-Feld stand und wegfällt, wandert vorn in die Kurzbeschreibung (nur wenn sie noch der Starttext ist) */
  kurz?: [string, string]
}

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
  // Breitensport – Kinder
  { alt: '1,5–3 J.', neu: '1,5–3 Jahre' },
  { alt: '3–6 J.', neu: '3–6 Jahre' },
  { alt: '6–11 J.', neu: '6–11 Jahre' },
  { alt: '11–15 J.', neu: '11–15 Jahre' },
  { alt: '8–12 J.', neu: '8–12 Jahre' },
  { alt: '6–10 J.', neu: '6–10 Jahre' },
  { alt: '1–3 J. mit Eltern', neu: '1–3 Jahre' },
  // Breitensport – Erwachsene
  { alt: 'Frauen ab 16 Jahren', neu: 'ab 16 Jahren', kurz: ['Ausdauer und Koordination: 60 Minuten Step und 30 Minuten abwechslungsreiches Workout.', 'Für Frauen: 60 Minuten Step und 30 Minuten abwechslungsreiches Workout für Ausdauer und Koordination.'] },
  { alt: 'Frauen 18–99', neu: 'ab 18 Jahren' },
  { alt: 'drei Kurse', neu: 'ab 18 Jahren', kurz: ['Kräftigung der Körpermitte, je ca. 60 Minuten.', 'Drei Kurse zur Kräftigung der Körpermitte, je ca. 60 Minuten.'] },
  { alt: '18–99 Jahre', neu: 'ab 18 Jahren' },
  { alt: 'mit Verordnung', neu: 'ab 18 Jahren' },
  { alt: 'Qi Gong, Tai Chi', neu: 'ab 18 Jahren', kurz: ['Ruhige, fließende Bewegungen für Körper und Geist.', 'Qi Gong und Tai Chi: ruhige, fließende Bewegungen für Körper und Geist.'] },
  { alt: 'über den Rheindamm', neu: 'ab 18 Jahren', von: [30, 99], auf: [18, 99] },
]

type Angebot = { id: number; alterText?: string | null; alterVon?: number | null; alterBis?: number | null; kurzbeschreibung?: string | null }

export async function altersangabenUmstellen(payload: Payload) {
  const r = await payload.find({
    collection: 'angebote',
    where: { alterText: { in: ALTERSANGABEN.map((u) => u.alt) } },
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
    if (u.kurz && a.kurzbeschreibung === u.kurz[0]) daten.kurzbeschreibung = u.kurz[1]
    await payload
      .update({ collection: 'angebote', id: a.id, data: daten as never, overrideAccess: true, context: { disableRevalidate: true } })
      .then(() => geaendert++)
      .catch((e) => payload.logger.warn({ err: e }, `Altersangabe für Team ${a.id} nicht umgestellt`))
  }
  if (geaendert) payload.logger.info(`Teams & Kurse: ${geaendert} Altersangaben vereinheitlicht`)
}
