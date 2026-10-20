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
  r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'Neues-Passwort-123' })
  pruefe('Eigenes Passwort ändern ohne aktuelles Passwort → 400', r.s === 400, r)
  r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'Neues-Passwort-123', aktuellesPasswort: 'falsch-falsch' })
  pruefe('… mit falschem aktuellem Passwort → 400', r.s === 400, r)
  r = await api(mi, 'PATCH', `/api/users/${ich.id}`, { password: 'Neues-Passwort-123', aktuellesPasswort: PASSWORT })
  pruefe('… mit richtigem aktuellem Passwort → 200', r.s === 200, r)
  const mi2 = await fetch(B + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'mitglied@bsv.test', password: 'Neues-Passwort-123' }) })
  const c2 = mi2.headers.get('set-cookie')?.match(/payload-token=[^;]+/)?.[0]
  r = await api(c2, 'PATCH', `/api/users/${ich.id}`, { password: PASSWORT, aktuellesPasswort: 'Neues-Passwort-123' })
  pruefe('Testpasswort wiederhergestellt', r.s === 200, r)

  const ad = await login('admin@bsv.test')
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
}
