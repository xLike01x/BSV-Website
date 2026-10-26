import { api, login, pruefe } from './lib.mjs'

/** Spielecke: Tagesrekord ohne Namen – nur gültige Werte, kein direkter Zugriff, ausgeschaltete Spiele zählen nicht */
export default async function spielecke(d) {
  const ip = () => ({ 'X-Real-IP': `203.0.113.${Math.floor(Math.random() * 200) + 20}` })
  const melden = (body) => api(null, 'POST', '/api/spielstatistik/melden', body, ip())
  const vorher = (await api(null, 'GET', '/api/spielstatistik/heute')).j
  pruefe('Tageswerte öffentlich lesbar (nur Zahlen)', vorher && Object.keys(vorher).sort().join() === 'elfmeterSchuesse,elfmeterTore,hochhaltenRekord,hochhaltenSpiele', vorher)
  const r = await melden({ spiel: 'elfmeter', wert: 3 })
  pruefe('Gültige Elfmeter-Runde wird gezählt', r.s === 200 && r.j?.elfmeterTore === (vorher?.elfmeterTore ?? 0) + 3, r.j)
  for (const [body, name] of [
    [{ spiel: 'elfmeter', wert: 6 }, 'mehr als 5 Tore'],
    [{ spiel: 'hochhalten', wert: 100000 }, 'unrealistischer Rekord'],
    [{ spiel: 'hochhalten', wert: -3 }, 'negativer Wert'],
    [{ spiel: 'hochhalten', wert: '1 OR 1=1' }, 'Text statt Zahl'],
    [{ spiel: 'anderes', wert: 1 }, 'unbekanntes Spiel'],
  ]) pruefe(`Abgelehnt: ${name}`, (await melden(body)).s === 400)
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
}
