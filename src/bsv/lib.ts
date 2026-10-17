import type { Angebote, Media } from '@/payload-types'

/** Farben je Kategorie: [Textfarbe, Hintergrund-Tönung] */
export const KATEGORIE_FARBE: Record<string, [string, string]> = {
  Fußball: ['#157A43', '#E8F6EE'],
  Tanzen: ['#C2410C', '#FFEDE7'],
  Turnen: ['#C2410C', '#FFEDE7'],
  Zirkus: ['#C2410C', '#FFF4D6'],
  Fitness: ['#1D4ED8', '#EAF1FF'],
  Gesundheit: ['#7C3AED', '#F3EEFF'],
  Ausdauer: ['#157A43', '#E8F6EE'],
  Kampfkunst: ['#1D1D1F', '#F5F5F7'],
}
export const farbe = (kat?: string | null): [string, string] => KATEGORIE_FARBE[kat ?? ''] ?? ['#157A43', '#E8F6EE']

export const BEREICH_LABEL: Record<string, string> = {
  fussball: 'Fußball',
  kids: 'BSV Kids',
  erwachsene: 'Erwachsene & Senioren',
}
export const UNTERGRUPPE_LABEL: Record<string, string> = {
  junioren: 'Junioren',
  juniorinnen: 'Juniorinnen',
  senioren: 'Senioren',
  seniorinnen: 'Seniorinnen',
}

/** Altersgruppen für den Angebotsfinder */
export const ALTERSGRUPPEN = [
  { id: 'alle', label: 'Alle', von: 0, bis: 99 },
  { id: 'kinder', label: 'Kinder', von: 0, bis: 11 },
  { id: 'jugend', label: 'Jugend', von: 12, bis: 17 },
  { id: 'erwachsene', label: 'Erwachsene', von: 18, bis: 59 },
  { id: 'senioren', label: '60+', von: 60, bis: 99 },
] as const

export const passtZuAlter = (a: Pick<Angebote, 'alterVon' | 'alterBis'>, von: number, bis: number) => {
  const aVon = a.alterVon ?? 0
  const aBis = a.alterBis ?? 99
  return aVon <= bis && aBis >= von
}

export const istMedia = (m: unknown): m is Media => typeof m === 'object' && m !== null && 'url' in m

type Size = 'thumbnail' | 'square' | 'small' | 'medium' | 'large' | 'xlarge' | 'og'

/** URL einer Bildgröße mit Fallback auf das Original */
export const bildUrl = (m: unknown, size?: Size): string | undefined => {
  if (!istMedia(m)) return undefined
  const s = size ? m.sizes?.[size]?.url : undefined
  return s || m.url || undefined
}

/** srcset aus den generierten Größen (nur breitenbasierte) */
export const bildSrcSet = (m: unknown): string | undefined => {
  if (!istMedia(m) || !m.sizes) return undefined
  const teile = (['small', 'medium', 'large', 'xlarge'] as const)
    .map((k) => m.sizes?.[k])
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.url && s?.width))
    .map((s) => `${s.url} ${s.width}w`)
  if (m.url && m.width) teile.push(`${m.url} ${m.width}w`)
  return teile.length ? teile.join(', ') : undefined
}

/** Objekt-Position aus dem Fokuspunkt, den die Redaktion in Payload setzt */
export const fokus = (m: unknown): string | undefined => {
  if (!istMedia(m)) return undefined
  const x = m.focalX ?? 50
  const y = m.focalY ?? 50
  return `${x}% ${y}%`
}

export const datum = (iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', ...opts }).format(new Date(iso)) : ''

export const uhrzeit = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : ''

export const zahl = (n?: number | null) => (n ?? 0).toLocaleString('de-DE')

export const initialen = (name: string) => {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1]![0] : '')).toUpperCase()
}

/** „Freitags“ aus „Freitag“; mehrere Tage zusammengefasst */
export const trainingsTage = (zeiten?: Angebote['zeiten']) => {
  const tage = Array.from(new Set((zeiten ?? []).map((z) => z.tag).filter(Boolean)))
  return tage.map((t) => `${t}s`).join(' & ')
}

export const zeitText = (z: NonNullable<Angebote['zeiten']>[number]) =>
  [z.von, z.bis].filter(Boolean).join(' – ') + (z.von ? ' Uhr' : '')

export const lesezeit = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 200))

/** Reinen Text aus Lexical-JSON ziehen (für Lesezeit und Auszüge) */
export const lexicalText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[]; root?: unknown }
  if (n.root) return lexicalText(n.root)
  return (n.text ?? '') + (n.children ?? []).map(lexicalText).join(' ')
}

export const euro = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

/** Kurzinfo für Karten: „Freitags · 15:00 – 16:00 Uhr“ */
export const kurzZeit = (a: Pick<Angebote, 'zeiten'>) => {
  const z = a.zeiten?.[0]
  if (!z) return 'Trainingszeiten auf Anfrage'
  const teile = [z.tag ? `${z.tag}s` : '', z.von ? zeitText(z) : ''].filter(Boolean)
  return teile.length ? teile.join(' · ') : z.hinweis || 'Trainingszeiten auf Anfrage'
}
