import crypto from 'node:crypto'

import { api, B, login, pruefe } from './lib.mjs'

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const totp = (geheimnis, t = Date.now()) => {
  let bits = ''
  for (const c of geheimnis.replace(/\s+/g, '').toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, '0')
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)))
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(Math.floor(t / 30000)))
  const h = crypto.createHmac('sha1', key).update(msg).digest()
  const o = h[h.length - 1] & 0xf
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, '0')
}
const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const anmelden = async (email, password) => {
  const r = await fetch(B + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...ip() }, body: JSON.stringify({ email, password }) })
  return r.headers.get('set-cookie')?.match(/payload-token=[^;]+/)?.[0] ?? null
}
const status = async (ck) => (await api(ck, 'GET', '/api/users/zwei-faktor/status')).j ?? {}

/** Freiwillige Zwei-Faktor-Anmeldung für Mitglieder; Pflicht (nicht abschaltbar) für Verwaltungszugänge */
export default async function zweifaktor(d) {
  const ad = await login('admin@bsv.test')
  const MAIL = 'sicherheitstest-2fa@bsv.test'
  const STAFF = 'sicherheitstest-2fa-staff@bsv.test'
  const PW = 'Lila Laterne 7 leuchtet!'
  await d.q('delete from users where email = any($1)', [[MAIL, STAFF]])
  try {
    let r = await api(ad, 'POST', '/api/users', { email: MAIL, name: 'Test Zweifaktor', password: PW, roles: ['mitglied'], freigegeben: true })
    if (r.s !== 201) return pruefe('Mitgliedskonto angelegt', false, r)
    let ck = await anmelden(MAIL, PW)
    let st = await status(ck)
    pruefe('Mitglied: Zwei-Faktor freiwillig, nicht eingerichtet, nicht offen', st.freiwillig === true && !st.eingerichtet && !st.offen, st)

    r = await api(ck, 'POST', '/api/users/zwei-faktor/einrichten', {})
    pruefe('Einschalten ohne Passwort → 400', r.s === 400, r.s)
    r = await api(ck, 'POST', '/api/users/zwei-faktor/einrichten', { passwort: 'Falsches Passwort 1!' })
    pruefe('Einschalten mit falschem Passwort → 400', r.s === 400, r.s)
    r = await api(ck, 'POST', '/api/users/zwei-faktor/einrichten', { passwort: PW })
    const geheimnis = String(r.j?.geheimnis ?? '')
    pruefe('Einschalten mit Passwort → QR-Code', r.s === 200 && Boolean(r.j?.qr) && geheimnis.length > 10, r.s)
    // Ein richtiges Passwort bei einer laufenden Einrichtung setzt den Code-Fehlerzähler nicht zurück
    for (let i = 0; i < 4; i++) await api(ck, 'POST', '/api/users/zwei-faktor/bestaetigen', { code: '000001' })
    r = await api(ck, 'POST', '/api/users/zwei-faktor/einrichten', { passwort: PW })
    pruefe('Einrichtung läuft schon: erneutes Einschalten → 409', r.s === 409, r.s)
    await api(ck, 'POST', '/api/users/zwei-faktor/bestaetigen', { code: '000001' })
    r = await api(ck, 'POST', '/api/users/zwei-faktor/bestaetigen', { code: '000001' })
    pruefe('… der Zähler läuft weiter: 6. falscher Code → 429', r.s === 429, r.s)
    await d.q('update users set zwei_faktor_fehler = 0, zwei_faktor_fehler_seit = null where email=$1', [MAIL])
    r = await api(ck, 'POST', '/api/users/zwei-faktor/bestaetigen', { code: totp(geheimnis) })
    const codes = r.j?.wiederherstellungscodes ?? []
    pruefe('Ersten Code bestätigen → eingeschaltet, 10 Wiederherstellungscodes', r.s === 200 && codes.length === 10, r)
    st = await status(ck)
    pruefe('Aktuelle Sitzung bleibt freigeschaltet', st.eingerichtet === true && !st.offen, st)

    // Neue Anmeldung: ohne Code keine Mitgliedsrechte
    ck = await anmelden(MAIL, PW)
    st = await status(ck)
    const me = await api(ck, 'GET', '/api/users/me')
    pruefe('Neue Anmeldung: Code nötig, vorher keine Rolle', st.offen === true && Array.isArray(me.j?.user?.roles) && me.j.user.roles.length === 0, { st, roles: me.j?.user?.roles })
    r = await api(ck, 'POST', '/api/users/zwei-faktor/ausschalten', { passwort: PW, code: codes[0] })
    pruefe('Ausschalten ohne vorherigen Code (Sitzung offen) → 403', r.s === 403, r.s)
    r = await api(ck, 'POST', '/api/users/zwei-faktor/pruefen', { code: codes[1] })
    st = await status(ck)
    pruefe('Mit Wiederherstellungscode angemeldet', r.s === 200 && st.offen === false, { r: r.s, st })

    // Ausschalten: Passwort UND Code nötig
    r = await api(ck, 'POST', '/api/users/zwei-faktor/ausschalten', { passwort: PW, code: '000000' })
    pruefe('Ausschalten mit falschem Code → 400', r.s === 400, r.s)
    r = await api(ck, 'POST', '/api/users/zwei-faktor/ausschalten', { passwort: 'Falsches Passwort 1!', code: codes[2] })
    pruefe('Ausschalten mit falschem Passwort → 400', r.s === 400, r.s)
    r = await api(ck, 'POST', '/api/users/zwei-faktor/ausschalten', { passwort: PW, code: codes[2] })
    pruefe('Ausschalten mit Passwort und Code → 200', r.s === 200, r)
    const [db] = await d.q('select zwei_faktor_aktiv, zwei_faktor_geheimnis, zwei_faktor_codes from users where email=$1', [MAIL])
    pruefe('… Geheimnis und Codes gelöscht', db.zwei_faktor_aktiv === false && db.zwei_faktor_geheimnis === null && db.zwei_faktor_codes === null, db)
    ck = await anmelden(MAIL, PW)
    st = await status(ck)
    pruefe('Danach wieder ohne Code anmelden', st.offen === false && st.eingerichtet === false, st)

    // Aktuelles Passwort beim Passwortwechsel: höchstens 5 Versuche
    const [ich] = await d.q('select id from users where email=$1', [MAIL])
    let letzte = 0
    for (let i = 0; i < 6; i++) letzte = (await api(ck, 'PATCH', `/api/users/${ich.id}`, { password: 'Neue Wolke 4 zieht weiter!', aktuellesPasswort: 'Falsch Falsch 1!' })).s
    pruefe('Passwort ändern: 6. falsches aktuelles Passwort → 429', letzte === 429, letzte)

    // Nur Zusatzrechte (sonst Mitglied): Pflicht, nicht abschaltbar
    await d.q('update users set zusatzrechte_news = true where email=$1', [MAIL])
    const zk = await anmelden(MAIL, PW)
    const sz = await status(zk)
    r = await api(zk, 'POST', '/api/users/zwei-faktor/ausschalten', { passwort: PW, code: '000000' })
    pruefe('Nur Zusatzrecht: nicht freiwillig, Ausschalten → 403', sz.freiwillig === false && r.s === 403, { sz, s: r.s })

    // Verwaltungszugang: Pflicht, nicht abschaltbar
    r = await api(ad, 'POST', '/api/users', { email: STAFF, name: 'Test Pflicht', password: PW, roles: ['redaktion'] })
    if (r.s === 201) {
      const sk = await anmelden(STAFF, PW)
      const s2 = await status(sk)
      pruefe('Verwaltungszugang: nicht freiwillig, Code offen', s2.freiwillig === false && s2.offen === true, s2)
      r = await api(sk, 'POST', '/api/users/zwei-faktor/ausschalten', { passwort: PW, code: '000000' })
      pruefe('Verwaltungszugang: Ausschalten → 403', r.s === 403, r.s)
    } else pruefe('Verwaltungskonto angelegt', false, r)
  } finally {
    await d.q('delete from users where email = any($1)', [[MAIL, STAFF]])
  }
}
