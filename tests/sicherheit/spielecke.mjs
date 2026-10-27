import { api, login, pruefe } from './lib.mjs'

/** Spielecke: Tagesrekord ohne Namen – nur gültige Werte, kein direkter Zugriff, ausgeschaltete Spiele zählen nicht */
export default async function spielecke(d) {
  const ip = () => ({ 'X-Real-IP': `203.0.113.${Math.floor(Math.random() * 200) + 20}` })
  const melden = (body) => api(null, 'POST', '/api/spielstatistik/melden', body, ip())
  const vorher = (await api(null, 'GET', '/api/spielstatistik/heute')).j
  pruefe('Tageswerte öffentlich lesbar (nur Zahlen)', vorher && Object.keys(vorher).sort().join() === 'elfmeterSchuesse,elfmeterTore,hochhaltenRekord,hochhaltenSpiele,memoryBester,memorySpiele', vorher)
  const r = await melden({ spiel: 'elfmeter', wert: 3 })
  pruefe('Gültige Elfmeter-Runde wird gezählt', r.s === 200 && r.j?.elfmeterTore === (vorher?.elfmeterTore ?? 0) + 3, r.j)
  for (const [body, name] of [
    [{ spiel: 'elfmeter', wert: 6 }, 'mehr als 5 Tore'],
    [{ spiel: 'hochhalten', wert: 100000 }, 'unrealistischer Rekord'],
    [{ spiel: 'hochhalten', wert: -3 }, 'negativer Wert'],
    [{ spiel: 'hochhalten', wert: '1 OR 1=1' }, 'Text statt Zahl'],
    [{ spiel: 'anderes', wert: 1 }, 'unbekanntes Spiel'],
    [{ spiel: 'memory', wert: 17 }, 'Memory schneller als möglich (17 Züge)'],
    [{ spiel: 'memory', wert: 401 }, 'Memory mit unrealistisch vielen Zügen'],
  ]) pruefe(`Abgelehnt: ${name}`, (await melden(body)).s === 400)
  // Memory: weniger Züge = besser; ein schlechterer Wert ändert den Bestwert nicht
  const m1 = await melden({ spiel: 'memory', wert: 300 })
  const m2 = await melden({ spiel: 'memory', wert: 399 })
  pruefe('Memory: schlechterer Wert ändert den Bestwert nicht', m1.s === 200 && m2.s === 200 && m2.j?.memoryBester === m1.j?.memoryBester && m2.j?.memorySpiele === (m1.j?.memorySpiele ?? 0) + 1, { m1: m1.j, m2: m2.j })
  pruefe('Tabelle nicht direkt lesbar', (await api(null, 'GET', '/api/spielstatistik?limit=5')).s === 403)
  pruefe('Tabelle nicht direkt beschreibbar', (await api(null, 'POST', '/api/spielstatistik', { datum: '2026-01-01', hochhaltenRekord: 9999 })).s === 403)
  const admin = await login('admin@bsv.test')
  await api(admin, 'POST', '/api/globals/animationen', { elfmeter: false })
  try {
    pruefe('Ausgeschaltetes Spiel zählt nicht', (await melden({ spiel: 'elfmeter', wert: 5 })).s === 403)
  } finally {
    await api(admin, 'POST', '/api/globals/animationen', { elfmeter: true })
  }
  const [zeile] = await d.q(`select count(*)::int as n from information_schema.columns where table_name = 'spielstatistik' and column_name ~ '(ip|name|kennung|user)'`)
  pruefe('Keine Spalten für IP, Namen oder Kennungen', zeile?.n === 0, zeile)

  // ── Rangliste mit Spitznamen ──
  const eintragen = (body) => api(null, 'POST', '/api/spielergebnisse/eintragen', body, ip())
  const NAME = 'SichTest'
  try {
    const ok1 = await eintragen({ spiel: 'hochhalten', wert: 7, spitzname: NAME })
    pruefe('Rangliste: gültiger Eintrag angenommen', ok1.s === 200 && ok1.j?.ok === true, ok1.j)
    for (const [body, name] of [
      [{ spiel: 'hochhalten', wert: 7, spitzname: 'Arschloch' }, 'Schimpfwort'],
      [{ spiel: 'hochhalten', wert: 7, spitzname: 'F 1 c k' }, 'verschleiertes Schimpfwort'],
      [{ spiel: 'hochhalten', wert: 7, spitzname: '<img src=x>' }, 'HTML'],
      [{ spiel: 'hochhalten', wert: 7, spitzname: 'www-test' }, 'Internetadresse'],
      [{ spiel: 'hochhalten', wert: 7, spitzname: '0171 2345678' }, 'Telefonnummer'],
      [{ spiel: 'hochhalten', wert: 7, spitzname: 'x'.repeat(40) }, 'zu langer Name'],
      [{ spiel: 'hochhalten', wert: 9999, spitzname: 'Max' }, 'unrealistischer Wert'],
      [{ spiel: 'memory', wert: 5, spitzname: 'Max' }, 'Memory unmöglich schnell'],
      [{ spiel: 'huetchen', wert: 101, spitzname: 'Max' }, 'Hütchenspiel unrealistisch viele Runden'],
      [{ spiel: 'huetchen', wert: 0, spitzname: 'Max' }, 'Hütchenspiel ohne richtige Runde'],
    ]) pruefe(`Rangliste abgelehnt: ${name}`, (await eintragen(body)).s === 400)
    const hu = await eintragen({ spiel: 'huetchen', wert: 6, spitzname: NAME })
    const huListe = await api(null, 'GET', '/api/spielergebnisse/rangliste?spiel=huetchen&zeitraum=7')
    pruefe('Rangliste Hütchenspiel: Eintrag angenommen und sichtbar', hu.s === 200 && (huListe.j?.eintraege ?? []).some((e) => e.spitzname === NAME && e.wert === 6), { hu: hu.j, liste: huListe.j })
    await api(admin, 'POST', '/api/globals/animationen', { huetchen: false })
    try {
      pruefe('Rangliste Hütchenspiel: Spiel aus → kein Eintrag', (await eintragen({ spiel: 'huetchen', wert: 6, spitzname: NAME })).s === 403)
      pruefe('Rangliste Hütchenspiel: Spiel aus → Liste leer', ((await api(null, 'GET', '/api/spielergebnisse/rangliste?spiel=huetchen&zeitraum=immer')).j?.eintraege ?? []).length === 0)
    } finally {
      await api(admin, 'POST', '/api/globals/animationen', { huetchen: true })
    }
    const liste = await api(null, 'GET', '/api/spielergebnisse/rangliste?spiel=hochhalten&zeitraum=immer')
    pruefe('Rangliste öffentlich: nur Platz, Spitzname, Wert, Datum', liste.s === 200 && (liste.j?.eintraege ?? []).every((e) => Object.keys(e).sort().join() === 'datum,platz,spitzname,wert'), liste.j?.eintraege?.[0])
    pruefe('Rangliste: Einträge nicht direkt lesbar ohne Anmeldung', (await api(null, 'GET', '/api/spielergebnisse')).s === 403)
    pruefe('Rangliste: direktes Anlegen gesperrt (auch für Admin)', (await api(admin, 'POST', '/api/spielergebnisse', { spiel: 'hochhalten', wert: 250, spitzname: 'Hacker' })).s === 403)
    const [eintrag] = await d.q(`select id from spielergebnisse where spitzname = $1 limit 1`, [NAME])
    const trainer = await login('trainer-1-mannschaft@bsv.test')
    pruefe('Rangliste: Trainer sieht die Einträge in der Verwaltung nicht', [403].includes((await api(trainer, 'GET', '/api/spielergebnisse')).s) || ((await api(trainer, 'GET', '/api/spielergebnisse')).j?.docs ?? []).length === 0)
    pruefe('Rangliste: Trainer kann nicht löschen', [403, 404].includes((await api(trainer, 'DELETE', `/api/spielergebnisse/${eintrag?.id}`)).s))
    const red = await login('redaktion@bsv.test')
    pruefe('Rangliste: Redaktion darf Spitznamen nicht umschreiben', (await api(red, 'PATCH', `/api/spielergebnisse/${eintrag?.id}`, { spitzname: 'Anders', wert: 250 })).j?.doc?.spitzname !== 'Anders')
    pruefe('Rangliste: Redaktion kann löschen', (await api(red, 'DELETE', `/api/spielergebnisse/${eintrag?.id}`)).s === 200)
    const [spalten] = await d.q(`select count(*)::int as n from information_schema.columns where table_name = 'spielergebnisse' and column_name ~ '(ip|kennung|user|konto|email)'`)
    pruefe('Rangliste: keine Spalten für IP, Konto oder E-Mail', spalten?.n === 0, spalten)
  } finally {
    await d.q(`delete from spielergebnisse where spitzname = $1`, [NAME])
  }
}
