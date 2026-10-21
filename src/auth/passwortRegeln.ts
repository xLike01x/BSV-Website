/**
 * Passwort-Regeln – dieselben im Browser (Anzeige beim Tippen) und auf dem Server (verbindliche Prüfung).
 * Keine Abhängigkeiten, damit die Datei in beiden Welten läuft.
 *
 * - 10 bis 200 Zeichen
 * - Großbuchstabe, Kleinbuchstabe, Zahl und Sonderzeichen (Leerzeichen zählt als Sonderzeichen)
 * - kein sehr häufiges Passwort: ein Allerweltswort oder Vereinsbegriff, nur mit Zahlen/Zeichen ergänzt
 *   (z. B. „Sommer2026!“, „BSV1919bsv!“, „P@ssw0rt123“)
 * - keine Reihen wie „12345“, „abcde“, „qwert“ oder „aaaaa“
 * - nicht der eigene Name oder die eigene E-Mail-Adresse
 */
export const MIN_LAENGE = 10
export const MAX_LAENGE = 200

export type Regel = { key: 'laenge' | 'gross' | 'klein' | 'zahl' | 'sonder'; text: string; ok: boolean }

export const passwortRegeln = (pw: string): Regel[] => [
  { key: 'laenge', text: `mindestens ${MIN_LAENGE} Zeichen`, ok: pw.length >= MIN_LAENGE && pw.length <= MAX_LAENGE },
  { key: 'gross', text: 'ein Großbuchstabe', ok: /\p{Lu}/u.test(pw) },
  { key: 'klein', text: 'ein Kleinbuchstabe', ok: /\p{Ll}/u.test(pw) },
  { key: 'zahl', text: 'eine Zahl', ok: /\p{Nd}/u.test(pw) },
  { key: 'sonder', text: 'ein Sonderzeichen (z. B. ! ? - _ # oder ein Leerzeichen)', ok: /[^\p{L}\p{N}]/u.test(pw) },
]

const FEHLT: Record<Regel['key'], string> = { laenge: '', gross: 'einen Großbuchstaben', klein: 'einen Kleinbuchstaben', zahl: 'eine Zahl', sonder: 'ein Sonderzeichen' }

/** Wörter, die mit ein paar Zahlen und Zeichen dahinter zu den ersten Versuchen jedes Angreifers gehören */
const WOERTER = new Set(
  (
    'passwort password passwd kennwort geheim geheimnis secret login logout admin administrator root user benutzer test tester testen demo gast guest ' +
    'hallo hello hallihallo willkommen welcome moin servus tschuess danke bitte ' +
    'sommer winter fruehling fruhling herbst januar februar maerz marz april mai juni juli august september oktober november dezember ' +
    'montag dienstag mittwoch donnerstag freitag samstag sonntag wochenende urlaub ' +
    'bsv bsvbuederich bsvbuderich buederich buderich buedericher budericher spielverein buederichspielverein verein sportverein sport ' +
    'fussball fusball football soccer tor torwart trainer training mannschaft jugend kids ' +
    'meerbusch neuss duesseldorf dusseldorf koeln koln rhein nrw deutschland germany berlin hamburg muenchen munchen ' +
    'fortuna borussia bvb schalke bayern dortmund gladbach effzeh ' +
    'liebe schatz schatzi hase hasi maus mausi engel herz sonne mond stern blume iloveyou ichliebedich loveyou ' +
    'familie mama papa mutter vater oma opa kinder baby hund katze pferd ' +
    'qwertz qwerty qwertzu qwertyu asdfgh asdf yxcvbn zxcvbn ' +
    'master dragon monkey letmein sunshine princess shadow superman batman starwars pokemon minecraft fortnite ' +
    'computer internet google samsung apple iphone android windows ' +
    'abc abcdef freiheit freund freundin start anfang neu neues neuespasswort meinpasswort'
  ).split(/\s+/),
)

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '€': 'e', '!': 'i' }
const UMLAUTE: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

/**
 * Nur die Buchstaben, klein, Umlaute ausgeschrieben – optional mit Leetspeak (P@ssw0rt → passwort).
 * Für Leetspeak zählen nur Zeichen zwischen Buchstaben (Zahlen am Ende wie bei „P@ssw0rt123“ bleiben außen vor).
 */
const kern = (pw: string, leet: boolean) =>
  [...(leet ? pw.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '') : pw).toLowerCase()]
    .map((c) => (leet && LEET[c]) || UMLAUTE[c] || c)
    .join('')
    .replace(/[^a-z]/g, '')

const istAllerweltswort = (k: string) => {
  if (!k) return true
  if (WOERTER.has(k)) return true
  // Wort doppelt („bsvbsv“) oder zwei Allerweltswörter hintereinander („hallobsv“)
  for (let i = 3; i <= k.length - 3; i++) if (WOERTER.has(k.slice(0, i)) && WOERTER.has(k.slice(i))) return true
  return false
}

const REIHEN = ['abcdefghijklmnopqrstuvwxyz', '01234567890', 'qwertzuiopue', 'asdfghjkloeae', 'yxcvbnm', 'qwertyuiop', 'zxcvbnm']

/** Reihen ab 5 Zeichen (vorwärts oder rückwärts) und 5 gleiche Zeichen hintereinander */
const hatReihe = (pw: string) => {
  const p = pw.toLowerCase()
  if (/(.)\1{4}/u.test(p)) return true
  for (const r of REIHEN) {
    const rueck = [...r].reverse().join('')
    for (let i = 0; i + 5 <= r.length; i++) if (p.includes(r.slice(i, i + 5)) || p.includes(rueck.slice(i, i + 5))) return true
  }
  return false
}

/** Teile von Name und E-Mail ab 4 Zeichen (z. B. „thomas“, „wilms“, „twilms“) */
const persoenlicheTeile = (name?: string | null, email?: string | null) => {
  const lokal = String(email ?? '').toLowerCase().split('@')[0] ?? ''
  return [...String(name ?? '').toLowerCase().split(/[\s.,_+-]+/), lokal, ...lokal.split(/[._+-]+/)].map((t) => t.trim()).filter((t) => t.length >= 4)
}

export type Kontext = { name?: string | null; email?: string | null }

/** Erster Verstoß als verständlicher Satz – oder null, wenn das Passwort passt */
export function passwortFehler(pw: string, kontext: Kontext = {}): string | null {
  if (pw.length < MIN_LAENGE) return `Das Passwort braucht mindestens ${MIN_LAENGE} Zeichen.`
  if (pw.length > MAX_LAENGE) return `Das Passwort darf höchstens ${MAX_LAENGE} Zeichen haben.`
  const fehlt = passwortRegeln(pw).filter((r) => !r.ok && r.key !== 'laenge').map((r) => FEHLT[r.key])
  if (fehlt.length) return `Das Passwort braucht noch ${fehlt.length > 1 ? `${fehlt.slice(0, -1).join(', ')} und ${fehlt.at(-1)}` : fehlt[0]}.`
  if (istAllerweltswort(kern(pw, false)) || istAllerweltswort(kern(pw, true)))
    return 'Dieses Passwort ist zu leicht zu erraten (ein häufiges Wort oder Vereinsbegriff mit Zahlen). Tipp: ein kurzer Satz, z. B. „Mein Hund frisst 3 Äpfel!“'
  if (hatReihe(pw)) return 'Bitte keine Reihen wie „12345“, „abcde“, „qwert“ oder „aaaaa“ verwenden.'
  const klein = pw.toLowerCase()
  if (persoenlicheTeile(kontext.name, kontext.email).some((t) => klein.includes(t))) return 'Das Passwort darf deinen Namen oder deine E-Mail-Adresse nicht enthalten.'
  return null
}

/** Grobe Stärke für die Anzeige: 0 = erfüllt die Regeln nicht, 1 = ok, 2 = gut, 3 = stark */
export function passwortStaerke(pw: string, kontext: Kontext = {}): 0 | 1 | 2 | 3 {
  if (passwortFehler(pw, kontext)) return 0
  if (pw.length >= 16) return 3
  if (pw.length >= 13) return 2
  return 1
}
