/**
 * Soll es ruhig bleiben? Ja, wenn das Gerät „Bewegung reduzieren“ meldet oder die Animationen unter
 * Website-Aufbau → Animationen ausgeschaltet sind (data-anim="aus" am <body>, gesetzt im Layout).
 * Einzelne Effekte: data-anim-<name>="aus" (z. B. „countdown“).
 */
export function ruhig(effekt?: string): boolean {
  if (typeof window === 'undefined') return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  const d = document.body?.dataset ?? {}
  if (d.anim === 'aus') return true
  if (effekt) {
    const schluessel = 'anim' + effekt.charAt(0).toUpperCase() + effekt.slice(1)
    if (d[schluessel] === 'aus') return true
  }
  return false
}
