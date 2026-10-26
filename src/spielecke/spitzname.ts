/**
 * Spitznamen für die Rangliste der Spielecke prüfen.
 *
 * Kinder tippen hier selbst etwas ein – deshalb streng: kurz, nur Buchstaben/Ziffern/Leerzeichen/-/_, keine Links,
 * keine E-Mail-Adressen, keine langen Ziffernfolgen (Telefonnummern) und keine Schimpfwörter oder Beleidigungen
 * (auch in Schreibweisen wie „4rsch“ oder mit Leerzeichen dazwischen). Ein Filter fängt nie alles ab –
 * deshalb gibt es zusätzlich Löschen und optional „erst nach Freigabe anzeigen“ in der Verwaltung.
 */
export const SPITZNAME_MAX = 16
export const SPITZNAME_MIN = 2

/** Wortstämme (klein, ohne Umlaute/Sonderzeichen) – Treffer irgendwo im normalisierten Namen */
const GESPERRT = [
  // Beleidigungen und Vulgäres (deutsch)
  'arsch', 'fick', 'fotze', 'hure', 'nutte', 'wichs', 'schlampe', 'spast', 'spasti', 'mongo', 'behindert', 'missgeburt', 'hurensohn', 'bastard',
  'penner', 'idiot', 'depp', 'trottel', 'vollpfosten', 'kacke', 'scheis', 'scheiss', 'pimmel', 'penis', 'vagina', 'titte', 'muschi', 'schwuchtel',
  'schwul', 'lesbe', 'opfer', 'loser', 'dumm', 'doof', 'blod', 'bloed', 'hass', 'tot', 'sterb', 'kill', 'mord', 'nazi', 'hitler', 'heil', 'sieg', 'kz', 'ss88', 'hh88',
  // Englisch
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigg', 'nigga', 'fag', 'retard', 'porn', 'sex', 'nude', 'naked', 'rape',
  // Irreführend / Verwaltung
  'admin', 'moderator', 'vorstand', 'trainer', 'bsvoffiziell',
]
/** Kurze Stämme nur als ganzes Wort (sonst sperren sie harmlose Namen wie „Totoro“ oder „Siegfried“) */
const GANZES_WORT = new Set(['tot', 'sieg', 'heil', 'kz', 'dumm', 'doof', 'hass', 'mord', 'kill', 'sex', 'dick', 'opfer', 'depp'])

const normalisieren = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[0@4]/g, (z) => ({ '0': 'o', '@': 'a', '4': 'a' })[z]!)
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')

export type Pruefung = { ok: true; name: string } | { ok: false; fehler: string }

export function spitznamePruefen(roh: unknown): Pruefung {
  if (typeof roh !== 'string') return { ok: false, fehler: 'Bitte einen Spitznamen eingeben.' }
  // Mehrfache Leerzeichen zusammenfassen, Steuerzeichen raus
  const name = roh.normalize('NFC').replace(/\s+/g, ' ').trim()
  if (name.length < SPITZNAME_MIN) return { ok: false, fehler: `Der Spitzname braucht mindestens ${SPITZNAME_MIN} Zeichen.` }
  if (name.length > SPITZNAME_MAX) return { ok: false, fehler: `Der Spitzname darf höchstens ${SPITZNAME_MAX} Zeichen haben.` }
  if (!/^[A-Za-zÄÖÜäöüß0-9 _-]+$/.test(name)) return { ok: false, fehler: 'Bitte nur Buchstaben, Zahlen, Leerzeichen, - und _ verwenden.' }
  if (/\d{4,}/.test(name)) return { ok: false, fehler: 'Bitte keine langen Zahlen (z. B. Geburtsjahr oder Telefonnummer).' }
  if (/(www|http|\.de|\.com)/i.test(name)) return { ok: false, fehler: 'Bitte keine Internetadressen.' }
  const woerter = normalisieren(name).split(/[\s_-]+/).filter(Boolean)
  const zusammen = woerter.join('')
  const gesperrt = GESPERRT.some((w) => (GANZES_WORT.has(w) ? woerter.includes(w) || zusammen === w : zusammen.includes(w)))
  if (gesperrt) return { ok: false, fehler: 'Dieser Spitzname geht leider nicht. Denk dir bitte einen anderen aus.' }
  return { ok: true, name }
}
