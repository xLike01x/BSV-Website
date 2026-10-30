/**
 * Sortierung von Kursen nach Alter (jüngste zuerst) – für „Nach Alter sortieren“ im Menü-Editor,
 * die einmalige Umstellung und die Startdaten. Ohne Abhängigkeiten, läuft im Browser und auf dem Server.
 *
 * Maßgeblich ist, was auf der Website steht („1,5–3 Jahre“, „ab 16 Jahren“); nur wenn das Feld keine
 * solche Angabe enthält, zählen „Alter von/bis“ aus dem Angebotsfinder. Ohne jede Angabe: ans Ende.
 */
type MitAlter = { alterText?: string | null; alterVon?: number | null; alterBis?: number | null }

const zahl = (s: string) => Number(s.replace(',', '.'))

export function altersSchluessel(a: MitAlter): [number, number] {
  const t = (a.alterText ?? '').trim()
  const ab = t.match(/^ab (\d+(?:,\d)?) Jahren?\b/)
  if (ab) return [zahl(ab[1]!), 99]
  const spanne = t.match(/^(\d+(?:,\d)?)\s?[–-]\s?(\d+(?:,\d)?) Jahre\b/)
  if (spanne) return [zahl(spanne[1]!), zahl(spanne[2]!)]
  return [a.alterVon ?? 999, a.alterBis ?? 999]
}

/** Vergleich für Array.sort: erst „ab“-Alter, dann „bis“-Alter. Gleiches Alter bleibt in der bisherigen Reihenfolge (sort ist stabil). */
export function nachAlter(x: MitAlter, y: MitAlter): number {
  const [xv, xb] = altersSchluessel(x)
  const [yv, yb] = altersSchluessel(y)
  return xv - yv || xb - yb
}
