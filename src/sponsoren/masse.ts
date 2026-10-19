/** Reine Rechnung (ohne Server-Bibliotheken) – auch für Komponenten nutzbar */
type Bild = { url?: string | null; width?: number | null; height?: number | null; alt?: string | null; sizes?: { logo?: { url?: string | null; width?: number | null; height?: number | null } | null } | null }

/**
 * Einheitliche Wirkung: Jedes Logo bekommt (ohne leeren Rand) ungefähr dieselbe Fläche –
 * breite Schriftzüge werden breiter und flacher, quadratische Logos höher.
 * So wirkt kein Logo winzig oder riesig, egal wie es geschnitten ist.
 */
export function logoMasse(bild: unknown, { flaeche, maxBreite, maxHoehe }: { flaeche: number; maxBreite: number; maxHoehe: number }) {
  const b = bild as Bild | null
  if (!b || typeof b !== 'object') return null
  const l = b.sizes?.logo?.url && b.sizes.logo.width && b.sizes.logo.height ? b.sizes.logo : null
  const w = l?.width ?? b.width ?? 0
  const h = l?.height ?? b.height ?? 0
  const src = l?.url ?? b.url
  if (!src || !w || !h) return null
  const verhaeltnis = w / h
  let breite = Math.sqrt(flaeche * verhaeltnis)
  let hoehe = breite / verhaeltnis
  if (breite > maxBreite) ((breite = maxBreite), (hoehe = breite / verhaeltnis))
  if (hoehe > maxHoehe) ((hoehe = maxHoehe), (breite = hoehe * verhaeltnis))
  return { src, breite: Math.round(breite), hoehe: Math.round(hoehe), alt: b.alt ?? '' }
}
