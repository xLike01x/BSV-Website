/**
 * Nur Ziele auf der eigenen Website erlauben (kein „Open Redirect“ nach dem Login).
 * Fängt auch Tricks wie „/\evil.com“, „//evil.com“ oder Steuerzeichen ab.
 */
export function sicheresZiel(w: string | null | undefined, fallback: string): string {
  if (!w || !w.startsWith('/') || w.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(w)) return fallback
  try {
    const basis = 'https://bsv.invalid'
    const u = new URL(w, basis)
    return u.origin === basis ? u.pathname + u.search + u.hash : fallback
  } catch {
    return fallback
  }
}
