import fs from 'fs'
import path from 'path'
import * as tar from 'tar'

import { decryptMit, encryptMit, isEncrypted } from '@/utilities/crypto'

import { entschluesselnMit, SICHERUNGS_ORDNER, verschluesseln } from './kern'

/**
 * Bausteine für den Schlüsselwechsel (pnpm schluessel:wechseln):
 * verschlüsselte Feldwerte („enc:v1:…“) und Sicherungsdateien vom alten auf den neuen Schlüssel umstellen.
 */

export type Feldschluessel = { alt: Buffer; neu: Buffer }
/**
 * unlesbar = in einer Spalte, die verschlüsselte Werte enthalten MUSS (IBAN, Zwei-Faktor) und mit keinem Schlüssel lesbar → Abbruch.
 * fremd = sieht nur so aus („enc:v1:…“ in einem beliebigen Textfeld, z. B. von Besuchern eingegeben) → bleibt unverändert.
 */
export type Zaehler = { umgeschluesselt: number; schonNeu: number; unlesbar: number; fremd: number }
export const neueZaehler = (): Zaehler => ({ umgeschluesselt: 0, schonNeu: 0, unlesbar: 0, fremd: 0 })

/** Spalten, die die Website verschlüsselt speichert (IBAN im Mitgliedsantrag, Zwei-Faktor-Geheimnis; auch in Versions-Tabellen) */
export const istVerschluesselteSpalte = (spalte: string) => /(^|_)iban$|(^|_)zwei_faktor_geheimnis$/.test(spalte)

const passt = (wert: string, key: Buffer) => {
  try {
    decryptMit(wert, key)
    return true
  } catch {
    return false
  }
}

/** Ein einzelner Wert: unverschlüsselt → unverändert; mit altem Schlüssel → neu verschlüsselt */
export function wertUmschluesseln(wert: string, k: Feldschluessel, z: Zaehler, pflicht = false): string {
  if (!isEncrypted(wert)) return wert
  if (passt(wert, k.neu)) {
    z.schonNeu++
    return wert
  }
  let klar: string
  try {
    klar = decryptMit(wert, k.alt)
  } catch {
    if (pflicht) z.unlesbar++
    else z.fremd++
    return wert
  }
  z.umgeschluesselt++
  return encryptMit(klar, k.neu)
}

/** Eine Tabellenzeile einer Sicherung: Pflicht-Spalten streng, alles andere (auch JSON) nur, wenn lesbar */
export function zeileUmschluesseln(zeile: unknown, k: Feldschluessel, z: Zaehler): unknown {
  if (!zeile || typeof zeile !== 'object' || Array.isArray(zeile)) return jsonUmschluesseln(zeile, k, z)
  return Object.fromEntries(Object.entries(zeile).map(([spalte, w]) => [spalte, typeof w === 'string' ? wertUmschluesseln(w, k, z, istVerschluesselteSpalte(spalte)) : jsonUmschluesseln(w, k, z)]))
}

/** JSON-Werte (z. B. jsonb-Spalten) rekursiv durchgehen – unlesbare Werte gelten als „fremd“ */
export function jsonUmschluesseln(wert: unknown, k: Feldschluessel, z: Zaehler): unknown {
  if (typeof wert === 'string') return wertUmschluesseln(wert, k, z)
  if (Array.isArray(wert)) return wert.map((x) => jsonUmschluesseln(x, k, z))
  if (wert && typeof wert === 'object') return Object.fromEntries(Object.entries(wert).map(([a, b]) => [a, jsonUmschluesseln(b, k, z)]))
  return wert
}

/** Reste eines abgebrochenen Laufs entfernen (können entschlüsselte Daten enthalten) */
export function restAufraeumen() {
  if (!fs.existsSync(SICHERUNGS_ORDNER)) return
  for (const f of fs.readdirSync(SICHERUNGS_ORDNER)) if (f.startsWith('.umschluesseln-')) fs.rmSync(path.join(SICHERUNGS_ORDNER, f), { recursive: true, force: true })
}

export type SicherungErgebnis = 'umgeschluesselt' | 'schon-neu' | 'unlesbar'

/**
 * Eine Sicherung umschlüsseln: äußere Verschlüsselung UND die verschlüsselten Werte darin (IBAN, Zwei-Faktor),
 * damit die Sicherung später auch ohne den alten Schlüssel vollständig eingespielt werden kann.
 * Das Original wird erst ersetzt, wenn die neue Datei fertig geschrieben und mit dem neuen Schlüssel geprüft ist.
 * Gearbeitet wird in einem Unterordner des Sicherungsordners (nur der Server-Nutzer darf hinein).
 */
export async function sicherungUmschluesseln(datei: string, sicherung: Feldschluessel, feld: Feldschluessel, z: Zaehler): Promise<SicherungErgebnis> {
  const pfad = path.join(SICHERUNGS_ORDNER, datei)
  const tmp = fs.mkdtempSync(path.join(SICHERUNGS_ORDNER, '.umschluesseln-'))
  try {
    fs.chmodSync(tmp, 0o700)
    const klar = path.join(tmp, 'klar.tar.gz')
    // Außen alt oder schon neu? (Eine Sicherung, die nach dem Ändern der .env, aber vor dem Umschlüsseln entstand,
    // ist außen neu, enthält aber noch alte Feldwerte – deshalb wird der Inhalt immer geprüft.)
    const aussenAlt = await entschluesselnMit(pfad, klar, sicherung.alt)
    if (!aussenAlt && !(await entschluesselnMit(pfad, klar, sicherung.neu))) return 'unlesbar'
    // Entpacken – nur normale Dateien und Ordner (wie beim Einspielen)
    const inhalt = path.join(tmp, 'inhalt')
    fs.mkdirSync(inhalt, { mode: 0o700 })
    await tar.x({
      file: klar,
      cwd: inhalt,
      strict: true,
      preservePaths: false,
      filter: (_p, e) => ['File', 'OldFile', 'Directory'].includes((e as { type?: string }).type ?? ''),
    })
    fs.rmSync(klar, { force: true })
    const dbOrdner = path.join(inhalt, 'datenbank')
    const lokal = neueZaehler()
    if (fs.existsSync(dbOrdner)) {
      for (const f of fs.readdirSync(dbOrdner).filter((x) => x.endsWith('.json'))) {
        const dateiPfad = path.join(dbOrdner, f)
        const vorher = lokal.umgeschluesselt
        const roh = JSON.parse(fs.readFileSync(dateiPfad, 'utf8')) as unknown
        const zeilen = Array.isArray(roh) ? roh.map((r) => zeileUmschluesseln(r, feld, lokal)) : roh
        if (lokal.unlesbar) return 'unlesbar'
        if (lokal.umgeschluesselt > vorher) fs.writeFileSync(dateiPfad, JSON.stringify(zeilen), { mode: 0o600 })
      }
    }
    z.umgeschluesselt += lokal.umgeschluesselt
    z.schonNeu += lokal.schonNeu
    z.fremd += lokal.fremd
    if (!aussenAlt && !lokal.umgeschluesselt) return 'schon-neu'
    const neuTar = path.join(tmp, 'neu.tar.gz')
    await tar.c({ gzip: true, file: neuTar, cwd: inhalt, portable: true }, fs.readdirSync(inhalt))
    fs.rmSync(inhalt, { recursive: true, force: true })
    const neuDatei = path.join(tmp, 'neu.enc')
    await verschluesseln(neuTar, neuDatei, sicherung.neu)
    fs.rmSync(neuTar, { force: true })
    const probe = path.join(tmp, 'probe')
    if (!(await entschluesselnMit(neuDatei, probe, sicherung.neu))) throw new Error(`Prüfung der neuen Datei fehlgeschlagen: ${datei}`)
    fs.rmSync(probe, { force: true })
    const zeit = fs.statSync(pfad).mtime
    fs.utimesSync(neuDatei, zeit, zeit)
    // Erst auf die Platte schreiben, dann austauschen – ein Stromausfall hinterlässt so keine halbe Datei
    const fd = fs.openSync(neuDatei, 'r')
    fs.fsyncSync(fd)
    fs.closeSync(fd)
    fs.renameSync(neuDatei, pfad)
    try {
      const ordner = fs.openSync(SICHERUNGS_ORDNER, 'r')
      try {
        fs.fsyncSync(ordner)
      } finally {
        fs.closeSync(ordner)
      }
    } catch {
      // nicht jedes Dateisystem kann Ordner synchronisieren (z. B. Windows) – die Datei selbst ist schon geschrieben
    }
    return 'umgeschluesselt'
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}
