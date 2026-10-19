/**
 * Beitragsrechnung an einer Stelle – Website, Antrag und Platzhalter rechnen gleich.
 * Grundlage: „€ pro Quartal“ aus Vereinsdaten → Mitgliedsbeiträge.
 */
type Beitrag = { key?: string | null; quartal?: number | string | null }

/** Monatsbetrag (Quartal ÷ 3) */
export const proMonat = (quartal: number | string | null | undefined) => (Number(quartal) || 0) / 3

/** Kurz und genau: „5 €“, „6,67 €“ – ganze Beträge ohne Nachkommastellen */
export const euroKurz = (n: number) => {
  const gerundet = Math.round(n * 100) / 100
  return (Number.isInteger(gerundet) ? gerundet.toLocaleString('de-DE') : gerundet.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + ' €'
}

/** Günstigster Monatsbetrag für aktive Mitglieder (passive Mitgliedschaft zählt nicht – „alle Kurse inklusive“) */
export const abMonat = (beitraege: Beitrag[]) => {
  const aktiv = beitraege.filter((b) => b.key !== 'passiv' && Number(b.quartal) > 0)
  const liste = aktiv.length ? aktiv : beitraege.filter((b) => Number(b.quartal) > 0)
  return liste.length ? Math.min(...liste.map((b) => proMonat(b.quartal))) : null
}
