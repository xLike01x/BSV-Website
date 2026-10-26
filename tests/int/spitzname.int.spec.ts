import { describe, expect, it } from 'vitest'

import { spitznamePruefen } from '@/spielecke/spitzname'

/** Spitznamen für die Rangliste der Spielecke: harmlose Namen durchlassen, Beleidigungen, Links, Telefonnummern sperren */
describe('Spitzname (Rangliste Spielecke)', () => {
  it.each(['Flinker Fuchs', 'Max15', 'Torjäger_9', 'Siegfried', 'Totoro', 'Lena-Löwe', 'Ali', 'Hecht-Fan'])('erlaubt „%s“', (n) => {
    expect(spitznamePruefen(n).ok).toBe(true)
  })
  it.each([
    ['', 'zu kurz'],
    ['a', 'zu kurz'],
    ['Superlangerspitzname123', 'zu lang'],
    ['<script>', 'Sonderzeichen'],
    ['max@mail', 'Sonderzeichen'],
    ['0171234567', 'Telefonnummer'],
    ['Max2015', 'Geburtsjahr'],
    ['www-bsv', 'Adresse'],
    ['Arschloch', 'Schimpfwort'],
    ['4rsch', 'Leetspeak'],
    ['F i c k', 'mit Leerzeichen'],
    ['du bist tot', 'Drohung (ganzes Wort)'],
    ['Admin', 'irreführend'],
    ['h1tler', 'Leetspeak'],
  ])('sperrt „%s“ (%s)', (n) => {
    expect(spitznamePruefen(n).ok).toBe(false)
  })
  it('fasst Leerzeichen zusammen', () => {
    expect(spitznamePruefen('  Flinker    Fuchs ')).toEqual({ ok: true, name: 'Flinker Fuchs' })
  })
})
