import crypto from 'node:crypto'

import { api, login, pruefe } from './lib.mjs'

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const anmelden = async (email, password) => (await api(null, 'POST', '/api/users/login', { email, password }, ip())).s

/**
 * Audit 2026-10 F-1: Vorab angelegtes Konto (fremde E-Mail + Passwort des Angreifers).
 * Die Bestätigung muss ein Passwort verlangen; danach gilt das Passwort des Angreifers nicht mehr.
 */
export default async function registrierung(d) {
  const ad = await login('admin@bsv.test')
  const ANGREIFER = 'Fremdes-Postfach-Uebernahme-42!'
  const OPFER = 'Mein Hund frisst 3 Aepfel!'
  const konten = ['sicherheitstest-vorab@bsv.test', 'sicherheitstest-gleich@bsv.test', 'sicherheitstest-website@bsv.test']
  await d.q(`delete from users where email = any($1)`, [konten])
  const anlegen = async (email) => {
    const r = await api(ad, 'POST', '/api/users', { email, name: 'Test Vorab', password: ANGREIFER, roles: ['mitglied'], freigegeben: false })
    if (r.s !== 201) throw new Error('Testkonto ließ sich nicht anlegen: ' + r.s)
    const t = crypto.randomBytes(32).toString('base64url')
    await d.q(
      `update users set registriert_ueber='email', email_bestaetigt=false, freigegeben=false, bestaetigung_hash=$2, bestaetigung_bis=now() + interval '1 day' where email=$1`,
      [email, sha(t)],
    )
    return t
  }
  const bestaetigen = (body) => api(null, 'POST', '/api/users/registrieren/bestaetigen', body, ip())
  const zustand = async (email) => (await d.q(`select email_bestaetigt, bestaetigung_hash from users where email=$1`, [email]))[0]

  try {
    // 0. Echte Registrierung über die Website (mit gelöster Rechenaufgabe) – legt ein wartendes, unbestätigtes Konto an
    //    (Regression: Teil-Updates per db.updateOne({ id }) scheiterten an Pflichtspalten → 500)
    const kopf = ip()
    const a = (await api(null, 'GET', '/api/users/registrieren/aufgabe', undefined, kopf)).j
    let zahl = 0
    while (crypto.createHash('sha256').update(a.salz + zahl).digest('hex') !== a.ziel) zahl++
    await new Promise((ok) => setTimeout(ok, 3100))
    const reg = { name: 'Test Vorab', email: konten[2], passwort: ANGREIFER, datenschutz: true, botschutz: { ...a, zahl } }
    let r = await api(null, 'POST', '/api/users/registrieren', reg, kopf)
    const [neu] = await d.q(`select registriert_ueber, email_bestaetigt, freigegeben, bestaetigung_hash is not null as link from users where email=$1`, [konten[2]])
    pruefe('Registrierung über die Website → 201, Konto wartet unbestätigt mit Link', r.s === 201 && neu?.registriert_ueber === 'email' && neu.email_bestaetigt === false && neu.freigegeben === false && neu.link === true, { r, neu })
    const [vorher] = await d.q(`select hash from users where email=$1`, [konten[2]])
    const b = (await api(null, 'GET', '/api/users/registrieren/aufgabe', undefined, kopf)).j
    zahl = 0
    while (crypto.createHash('sha256').update(b.salz + zahl).digest('hex') !== b.ziel) zahl++
    await new Promise((ok) => setTimeout(ok, 3100))
    r = await api(null, 'POST', '/api/users/registrieren', { ...reg, passwort: 'Ganz-Anderes-Passwort-99?', botschutz: { ...b, zahl } }, ip())
    const [nachher] = await d.q(`select hash from users where email=$1`, [konten[2]])
    pruefe('Zweite Registrierung mit derselben Adresse: gleiche Antwort wie neu (201), Passwort bleibt', r.s === 201 && r.j?.ok === true && vorher.hash === nachher.hash, r)

    // 1. Fremder Passwort, Opfer klickt und legt ein eigenes fest
    const t = await anlegen(konten[0])
    pruefe('Unbestätigtes Konto: Anmelden → 403', (await anmelden(konten[0], ANGREIFER)) === 403)
    r = await bestaetigen({ t })
    pruefe('Bestätigen ohne Passwort prüft nur den Link (bestätigt nicht)', r.s === 200 && r.j?.passwortNoetig === true && (await zustand(konten[0])).email_bestaetigt === false, r)
    r = await bestaetigen({ t, passwort: 12345 })
    pruefe('Bestätigen: Passwort als Zahl → 400', r.s === 400 && (await zustand(konten[0])).email_bestaetigt === false, r)
    r = await bestaetigen({ t, passwort: 'Sommer2026!' })
    pruefe('Bestätigen: neues Passwort gegen die Regeln → 400, nicht bestätigt', r.s === 400 && r.j?.fehler === 'passwort' && (await zustand(konten[0])).email_bestaetigt === false, r)
    r = await bestaetigen({ t: 'x'.repeat(43), passwort: OPFER })
    pruefe('Bestätigen: falscher Link → 400', r.s === 400 && r.j?.fehler === 'ungueltig', r)
    r = await bestaetigen({ t, passwort: OPFER })
    pruefe('Bestätigen mit neuem Passwort → 200 (neues Passwort)', r.s === 200 && r.j?.neuesPasswort === true, r)
    const z = await zustand(konten[0])
    pruefe('Danach bestätigt, Link verbraucht', z.email_bestaetigt === true && z.bestaetigung_hash === null, z)
    pruefe('Passwort aus der Vorab-Registrierung gilt nicht mehr', (await anmelden(konten[0], ANGREIFER)) === 401)
    pruefe('Neues Passwort gilt', (await anmelden(konten[0], OPFER)) === 200)
    r = await bestaetigen({ t, passwort: ANGREIFER })
    pruefe('Link ein zweites Mal → 400 ungültig', r.s === 400 && r.j?.fehler === 'ungueltig', r)

    // 2. Normalfall: eigenes Passwort von der Registrierung bleibt
    const t2 = await anlegen(konten[1])
    r = await bestaetigen({ t: t2, passwort: ANGREIFER })
    pruefe('Bestätigen mit dem Registrierungs-Passwort → 200, Passwort bleibt', r.s === 200 && r.j?.neuesPasswort === false, r)
    pruefe('Registrierungs-Passwort gilt weiter', (await anmelden(konten[1], ANGREIFER)) === 200)
  } finally {
    await d.q(`delete from users where email = any($1)`, [konten])
  }
}
