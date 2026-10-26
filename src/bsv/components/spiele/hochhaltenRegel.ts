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
