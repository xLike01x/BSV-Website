/** Anteil des Feldes von oben, in dem kein Kontakt zählt */
export const OBEN_GESPERRT = 0.4

/**
 * Regel für einen gültigen Kontakt beim Ball hochhalten – wie in echt:
 * Der Ball darf nur angetippt werden, wenn er herunterfällt und seine Mitte unterhalb der oberen 40 % des Feldes ist
 * (großzügig genug für Kinder, oben in den Ecken aber nicht erreichbar).
 * Verhindert, dass der Ball durch schnelles Klicken oben (z. B. in einer Ecke) „festgehalten“ wird.
 */
export function darfKicken({ y, vy, groesse, feldHoehe }: { y: number; vy: number; groesse: number; feldHoehe: number }): boolean {
  return vy > 0 && y + groesse / 2 >= feldHoehe * OBEN_GESPERRT
}

/** Höhe des Rasenstreifens unten im Feld (px) – dort liegt der Ball auf */
export const RASEN = 18

/**
 * Ist der Ball heruntergefallen (Runde vorbei)?
 * Nur ein FALLENDER Ball kann landen: Beim Anstoß liegt der Ball genau auf dem Rasen und fliegt erst nach oben.
 * Fällt der erste Bild-Schritt auf dieselbe Zeit wie der Start (Zeitdifferenz 0), hat er sich noch nicht bewegt –
 * ohne diese Bedingung war die Runde dann sofort mit 1 Kontakt vorbei (Fehler vom 31.10.2026).
 */
export function amBoden({ y, vy, groesse, feldHoehe }: { y: number; vy: number; groesse: number; feldHoehe: number }): boolean {
  return vy > 0 && y >= feldHoehe - groesse - RASEN
}
