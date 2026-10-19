/**
 * Nur Ziele auf der eigenen Website erlauben (kein „Open Redirect“ nach dem Login).
 * Fängt auch Tricks wie „/\evil.com“, „//evil.com“ oder Steuerzeichen ab.
 */
export function sicheresZiel(w: string | null | undefined, fallback: string): string {
  if (!w || !w.startsWith('/') || w.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(w)) return fallback
  try {
    const basis = 'https://bsv.invalid'
    const u = new URL(w, basis)
    if (u.origin !== basis) return fallback
    // Nach dem Auflösen von „/./“, „/../“, %2e … nochmals prüfen (z. B. „/.//evil.com“ → „//evil.com“)
    const ziel = (u.pathname + u.search + u.hash).replace(/^\/+/, '/')
    return ziel.startsWith('/') && !ziel.startsWith('//') && !ziel.startsWith('/\\') ? ziel : fallback
  } catch {
    return fallback
  }
}
