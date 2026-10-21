import { api, B, login, PASSWORT, pruefe } from './lib.mjs'

const ip = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`
const zeit = async (email, pw, kopf) => {
  const t = performance.now()
  await fetch(B + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...kopf }, body: JSON.stringify({ email, password: pw }) })
  return performance.now() - t
}

/** F-07, F-08, F-09: Ratenbegrenzung, Login-Zeitverhalten, Passwortregeln */
export default async function anmeldung(d) {
  // Antwortzeit: unbekannte E-Mail vs. bekanntes Konto mit falschem Passwort
  const k = { 'X-Real-IP': ip() }
  const unbekannt = [], bekannt = []
  for (let i = 0; i < 3; i++) {
    unbekannt.push(await zeit(`gibtsnicht${i}@bsv.test`, 'falsch-falsch', k))
    bekannt.push(await zeit('trainer-zumba-kids@bsv.test', 'falsch-falsch', k))
  }
  await login('trainer-zumba-kids@bsv.test') // setzt Fehlversuche zurück
  const m = (a) => a.sort((x, y) => x - y)[1]
  pruefe(`Login verrät nicht, ob ein Konto existiert (Median ${Math.round(m(unbekannt))} ms vs. ${Math.round(m(bekannt))} ms)`, Math.abs(m(unbekannt) - m(bekannt)) < 150, { unbekannt, bekannt })

  // Login-Bremse pro Adresse
  const fest = { 'X-Real-IP': ip() }
  let letzte = 0
  for (let i = 0; i < 21; i++) letzte = (await api(null, 'POST', '/api/users/login', { email: `bremse${i}@bsv.test`, password: 'falsch-falsch' }, fest)).s
  pruefe('Login: 21. Versuch von derselben Adresse → 429', letzte === 429, letzte)
  pruefe('Login: andere Adresse geht weiter', (await api(null, 'POST', '/api/users/login', { email: 'bremse@bsv.test', password: 'falsch-falsch' }, { 'X-Real-IP': ip() })).s !== 429)
  pruefe('X-Forwarded-For wird ignoriert (keine Umgehung über erfundene Kette)', (await api(null, 'POST', '/api/users/login', { email: 'x@bsv.test', password: 'falsch-falsch' }, { ...fest, 'X-Forwarded-For': '203.0.113.9' })).s === 429)

  // Passwortregeln
  const mi = await login('mitglied@bsv.test')
  const [ich] = await d.q(`select id from users where email='mitglied@bsv.test'`)
  let r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'kurz12345' })
  pruefe('Eigenes Passwort: weniger als 10 Zeichen → 400', r.s === 400, r)
  const regel = async (pw, teil) => {
    const x = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: pw, aktuellesPasswort: PASSWORT })
    return x.s === 400 && String(x.j?.errors?.[0]?.message ?? '').includes(teil)
  }
  pruefe('Passwortregel: ohne Großbuchstabe/Zahl/Sonderzeichen → 400', await regel('nurkleinbuchstaben', 'Großbuchstaben'))
  pruefe('Passwortregel: ohne Sonderzeichen → 400', await regel('OhneSonder123x', 'Sonderzeichen'))
  pruefe('Passwortregel: häufiges Passwort (Passwort123!) → 400', await regel('Passwort123!', 'zu leicht'))
  pruefe('Passwortregel: Vereinsbegriff (BSV1919bsv!) → 400', await regel('BSV1919bsv!', 'zu leicht'))
  pruefe('Passwortregel: Leetspeak (P@ssw0rt2026) → 400', await regel('P@ssw0rt2026', 'zu leicht'))
  pruefe('Passwortregel: Reihe (Abc!12345x) → 400', await regel('Abc!12345x', 'Reihen'))
  pruefe('Passwortregel: eigener Name im Passwort → 400', await regel('Mitglied#Rad7', 'Namen'))
  const reg = await api(null, 'POST', '/api/users/registrieren', { name: 'Erika Musterfrau', email: 'sicherheitstest-reg@bsv.test', passwort: 'Sommer2026!', datenschutz: true }, { 'X-Real-IP': ip() })
  pruefe('Registrierung mit leicht zu erratendem Passwort → 400', reg.s === 400 && String(reg.j?.fehler ?? '').includes('zu leicht'), reg.j)
  const reg2 = await api(null, 'POST', '/api/users/registrieren', { name: 'Erika Musterfrau', email: 'sicherheitstest-reg@bsv.test', passwort: 'Musterfrau!2027', datenschutz: true }, { 'X-Real-IP': ip() })
  pruefe('Registrierung mit eigenem Namen im Passwort → 400', reg2.s === 400 && String(reg2.j?.fehler ?? '').includes('Namen'), reg2.j)
  r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'Grüne Wiese 7 Tor!' })
  pruefe('Eigenes Passwort ändern ohne aktuelles Passwort → 400', r.s === 400, r)
  r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'Grüne Wiese 7 Tor!', aktuellesPasswort: 'falsch-falsch' })
  pruefe('… mit falschem aktuellem Passwort → 400', r.s === 400, r)
  r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'Grüne Wiese 7 Tor!', aktuellesPasswort: PASSWORT })
  pruefe('… mit richtigem aktuellem Passwort → 200', r.s === 200, r)
  const mi2 = await fetch(B + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'mitglied@bsv.test', password: 'Grüne Wiese 7 Tor!' }) })
  pruefe('… Anmeldung mit dem neuen Passwort', mi2.status === 200, mi2.status)
  // Das feste Testpasswort erfüllt die Regeln für echte Konten nicht – zurück über die Testkonten-Anlage
  const ad = await login('admin@bsv.test')
  r = await api(ad, 'POST', '/api/users/testkonten', {})
  pruefe('Testpasswort wiederhergestellt', r.s === 200 && Boolean(await login('mitglied@bsv.test')), r.s)
  r = await api(ad, 'POST', '/api/users', { email: 'sicherheitstest-kurz@bsv.test', name: 'Test', password: 'kurz', roles: ['mitglied'] })
  pruefe('Verwaltung legt Konto mit kurzem Passwort an → 400', r.s === 400, r)
  await d.q(`delete from users where email='sicherheitstest-kurz@bsv.test'`)

  // Zurücksetzen mit kurzem Passwort
  await api(null, 'POST', '/api/users/forgot-password', { email: 'mitglied@bsv.test' }, { 'X-Real-IP': ip() })
  const [t] = await d.q(`select reset_password_token from users where email='mitglied@bsv.test'`)
  if (t?.reset_password_token) {
    r = await api(null, 'POST', '/api/users/reset-password', { token: t.reset_password_token, password: 'kurz' })
    pruefe('Passwort zurücksetzen mit kurzem Passwort → 400', r.s === 400, r)
    await d.q(`update users set reset_password_token=null, reset_password_expiration=null where email='mitglied@bsv.test'`)
  } else pruefe('Reset-Token erzeugt', false, t)
  const f = { 'X-Real-IP': ip() }
  let s = 0
  for (let i = 0; i < 6; i++) s = (await api(null, 'POST', '/api/users/forgot-password', { email: `niemand${i}@bsv.test` }, f)).s
  pruefe('„Passwort vergessen“: 6. Anfrage derselben Adresse → 429', s === 429, s)

  // Zwei-Faktor (F-22, F-23, I-01): Testkonto über „Tunnel“-Kopfzeile wie ein echtes Verwaltungskonto behandeln
  const tunnel = { 'X-Forwarded-Host': 'tunnel.example.org', 'X-Real-IP': ip() }
  const [admin] = await d.q(`select id from users where email='admin@bsv.test'`)
  const r0 = await fetch(B + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...tunnel }, body: JSON.stringify({ email: 'admin@bsv.test', password: PASSWORT }) })
  pruefe('Testkonto über Tunnel gesperrt (Login 403)', r0.status === 403, r0.status)
  // Für die 2FA-Prüfung ein Sitzungs-Cookie des Testkontos nehmen und die Tunnel-Kopfzeile mitsenden
  const ck = await login('admin@bsv.test')
  try {
    const me = await api(ck, 'GET', '/api/users/me', undefined, tunnel)
    pruefe('/me zeigt ohne 2FA-Code keine Admin-Rolle', Array.isArray(me.j?.user?.roles) && !me.j.user.roles.includes('admin'), me.j?.user?.roles)
    const e1 = await api(ck, 'POST', '/api/users/zwei-faktor/einrichten', {}, tunnel)
    const e2 = await api(ck, 'POST', '/api/users/zwei-faktor/einrichten', {}, tunnel)
    pruefe('2FA-Einrichtung: zweiter Start überschreibt nicht (409)', e1.s === 200 && e2.s === 409, [e1.s, e2.s])
    let st = 0
    for (let i = 0; i < 6; i++) st = (await api(ck, 'POST', '/api/users/zwei-faktor/bestaetigen', { code: '000000' }, tunnel)).s
    const [z] = await d.q('select zwei_faktor_fehler from users where id=$1', [admin.id])
    pruefe('2FA: 6. Fehlversuch → 429, Zähler in der Datenbank', st === 429 && Number(z.zwei_faktor_fehler) >= 5, [st, z])
  } finally {
    await d.q(`update users set zwei_faktor_geheimnis=null, zwei_faktor_einrichtung_seit=null, zwei_faktor_fehler=null, zwei_faktor_fehler_seit=null, zwei_faktor_aktiv=false where id=$1`, [admin.id])
  }
}
