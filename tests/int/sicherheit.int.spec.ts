import { describe, expect, it } from 'vitest'

import { passwortFehler } from '@/auth/passwortRegeln'
import { anschluss } from '@/hooks/spamSchutz'

describe('Ratenbegrenzung: Anschluss-Schlüssel', () => {
  it.each([
    ['198.51.100.7', '198.51.100.7'],
    ['2001:db8:1:2:3:4:5:6', '2001:0db8:0001:0000::/56'],
    ['2001:db8:1:2ab::9', '2001:0db8:0001:0200::/56'],
    ['2001:db8::1', '2001:0db8:0000:0000::/56'],
    ['2001:0DB8:0001:ff02:ffff::1', '2001:0db8:0001:ff00::/56'],
    ['::ffff:203.0.113.5', '203.0.113.5'],
  ])('%s → %s', (ein, soll) => expect(anschluss(ein)).toBe(soll))

  it('Adressen aus demselben /56-Netz teilen sich einen Zähler', () => {
    expect(anschluss('2001:db8:aa:bb::1')).toBe(anschluss('2001:db8:aa:ff:ffff:ffff:ffff:fffe'))
    expect(anschluss('2001:db8:aa:bb::1')).not.toBe(anschluss('2001:db8:aa:1bb::1'))
  })
})

describe('Passwort-Regeln', () => {
  it('lehnt häufige Muster ab und nimmt Sätze an', () => {
    expect(passwortFehler('Sommer2026!')).not.toBeNull()
    expect(passwortFehler('P@ssw0rt123!')).not.toBeNull()
    expect(passwortFehler('Mein Hund frisst 3 Äpfel!')).toBeNull()
    expect(passwortFehler('Thomas-Wilms-2026!', { name: 'Thomas Wilms' })).not.toBeNull()
  })
})

describe('Formular-Baukasten: Antwort-an aus der Eingabe', () => {
  const req = (emails: unknown[]) => ({ payload: { findByID: async () => ({ emails }) } }) as never
  it('prüft „Antwort an“ auch, wenn das Plugin den Absender-Platzhalter einsetzt', async () => {
    const { mailsPruefen } = await import('@/hooks/formularBaukasten')
    const raus = await mailsPruefen([{ to: 'verein@bsv.test', replyTo: 'a@x.de, b@y.de' }], { data: { form: 1 }, req: req([{ emailTo: 'verein@bsv.test', emailFrom: '{{email}}', replyTo: '' }]) })
    expect(raus[0]?.replyTo).toBeUndefined()
    const ok = await mailsPruefen([{ to: 'verein@bsv.test', replyTo: 'gast@example.org' }], { data: { form: 1 }, req: req([{ emailTo: 'verein@bsv.test', emailFrom: '{{email}}', replyTo: '' }]) })
    expect(ok[0]?.replyTo).toBe('gast@example.org')
  })
})

describe('Eingaben, die Links enthalten', () => {
  it('Name bei der Registrierung', async () => {
    const { namensLink } = await import('@/auth/registrierung')
    for (const n of ['Eve evil.de', 'Gewinn auf www.x.de', 'Max <b>', 'https://x', 'a@b.de']) expect(namensLink(n)).toBe(true)
    for (const n of ['Thomas Wilms', 'Anna-Lena Müller', 'Dr. Jürgen Schäfer', 'J. R. Tolkien']) expect(namensLink(n)).toBe(false)
  })
  it('sichereAdresse', async () => {
    const { sichereAdresse } = await import('@/fields/sichereAdresse')
    for (const a of ['/kunstrasen', 'https://www.bsv.de', 'mailto:a@b.de', 'tel:+492131']) expect(sichereAdresse(a)).toBe(true)
    for (const a of ['javascript:alert(1)', ' JavaScript:alert(1)', '//evil.de', 'data:text/html,x', '/\\evil.de']) expect(sichereAdresse(a)).not.toBe(true)
  })
})
