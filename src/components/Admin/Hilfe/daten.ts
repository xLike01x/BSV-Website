import { ANLEITUNGEN, FAQ, FELDER, ROLLEN_HINWEIS, type Anleitung, type Faq, type Feld, type RolleKey } from './extras'
import { HILFE, type HilfeText } from './texte'

/** Form des Globals „Hilfe-Texte“ (nur die Teile, die wir brauchen) */
export type HilfeGlobal = {
  ansprechperson?: string | null
  bereiche?:
    | {
        bereich: string
        kurz?: string | null
        tipps?: string | null
        anleitungen?: { titel: string; schritte: string; video?: { url?: string | null } | number | null }[] | null
      }[]
    | null
  faq?: { frage: string; antwort: string; bereich?: string | null }[] | null
}

export type HilfeBereich = HilfeText & {
  schluessel: string
  anleitungen: Anleitung[]
  felder: Feld[]
  rollenHinweis?: string
  faq: Faq[]
}

const zeilen = (t?: string | null) =>
  (t ?? '')
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean)

const FALLBACK: HilfeText = {
  titel: 'Hilfe',
  kurz: 'Für diesen Bereich gibt es noch keinen eigenen Hilfetext.',
  tun: ['Bei Fragen wende dich an einen Admin des Vereins.'],
  wirkung: [],
}

/** Eingebaute Texte + Ergänzungen aus der Verwaltung zu einem Bereich zusammenführen */
export function hilfeFuer(schluessel: string, global: HilfeGlobal | null | undefined, rolle?: RolleKey): HilfeBereich {
  const basis = HILFE[schluessel] ?? FALLBACK
  const extra = global?.bereiche?.find((b) => b.bereich === schluessel)
  const eigeneAnleitungen: Anleitung[] = (extra?.anleitungen ?? []).map((a, i) => ({
    id: `eigen-${i}`,
    titel: a.titel,
    schritte: zeilen(a.schritte),
    video: typeof a.video === 'object' && a.video?.url ? a.video.url : undefined,
  }))
  return {
    ...basis,
    schluessel,
    kurz: extra?.kurz?.trim() || basis.kurz,
    tipps: [...(basis.tipps ?? []), ...zeilen(extra?.tipps)],
    anleitungen: [...(ANLEITUNGEN[schluessel] ?? []), ...eigeneAnleitungen],
    felder: FELDER[schluessel] ?? [],
    rollenHinweis: rolle ? ROLLEN_HINWEIS[schluessel]?.[rolle] : undefined,
    faq: alleFaq(global).filter((f) => f.bereich === schluessel),
  }
}

export function alleFaq(global: HilfeGlobal | null | undefined): Faq[] {
  return [...FAQ, ...(global?.faq ?? []).map((f) => ({ frage: f.frage, antwort: f.antwort, bereich: f.bereich ?? undefined }))]
}

/** Alle Bereiche (für Hilfe-Center und Suche) */
export function alleBereiche(global: HilfeGlobal | null | undefined, rolle?: RolleKey): HilfeBereich[] {
  return Object.keys(HILFE).map((k) => hilfeFuer(k, global, rolle))
}

/** Aus der Adresse ableiten, wo man gerade ist */
export type Ansicht = { schluessel: string; art: 'liste' | 'bearbeiten' | 'seite' }
export function ansichtAus(pfad: string): Ansicht {
  const teile = pfad
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean)
  if (teile[0] === 'collections' && teile[1]) return { schluessel: teile[1], art: teile[2] ? 'bearbeiten' : 'liste' }
  if (teile[0] === 'globals' && teile[1]) return { schluessel: teile[1], art: 'bearbeiten' }
  if (teile[0] === 'account') return { schluessel: 'account', art: 'bearbeiten' }
  if (teile[0] === 'rollen') return { schluessel: 'rollen', art: 'seite' }
  if (teile[0] === 'sicherung') return { schluessel: 'sicherung', art: 'seite' }
  if (teile[0] === 'hilfe') return { schluessel: 'hilfe-center', art: 'seite' }
  return { schluessel: 'dashboard', art: 'seite' }
}

/** Global einmal pro Seitenaufruf laden (Client) */
let cache: Promise<HilfeGlobal | null> | null = null
export function ladeHilfeGlobal(): Promise<HilfeGlobal | null> {
  if (!cache) {
    cache = fetch('/api/globals/hilfe?depth=1', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  }
  return cache
}
