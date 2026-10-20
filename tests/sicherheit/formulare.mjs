import { api, pruefe } from './lib.mjs'

const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const basis = {
  vorname: 'Sicherheitstest',
  nachname: 'Formular',
  geburtsdatum: '1990-05-05',
  email: 'sicherheitstest-antrag@bsv.test',
  strasse: 'Teststraße 1',
  plz: '41470',
  ort: 'Neuss',
  mitgliedsart: 'aktiv',
  kontoinhaber: 'Sicherheitstest',
  iban: 'DE89370400440532013000',
  sepaMandat: true,
  satzungAkzeptiert: true,
}

/** F-18: Server prüft öffentliche Formulare selbst */
export default async function formulare(d) {
  const [team] = await d.q(`select id from angebote where aktiv is not false limit 1`)
  const antrag = (extra) => api(null, 'POST', '/api/mitgliedsantraege', { ...basis, ...extra }, ip())
  try {
    pruefe('Antrag: Geburtsdatum in der Zukunft → 400', (await antrag({ geburtsdatum: '2031-05-05' })).s === 400)
    pruefe('Antrag: PLZ „abc“ → 400', (await antrag({ plz: 'abc' })).s === 400)
    pruefe('Antrag: Vorname mit 4.000 Zeichen → 400', (await antrag({ vorname: 'a'.repeat(4000) })).s === 400)
    pruefe('Antrag: Familie ohne Familienmitglied → 400', (await antrag({ mitgliedsart: 'familie' })).s === 400)
    pruefe('Antrag: Erwachsene mit Jugendtarif → 400', (await antrag({ mitgliedsart: 'jugend' })).s === 400)
    pruefe('Antrag: passiv mit Teams → 400', (await antrag({ mitgliedsart: 'passiv', angebote: [team.id] })).s === 400)
    const ok = await antrag({ angebote: [team.id] })
    pruefe('Antrag: gültige Angaben → 201', ok.s === 201, ok.j)
    const k = (extra) => api(null, 'POST', '/api/kontaktanfragen', { name: 'Sicherheitstest', email: 'sicherheitstest-antrag@bsv.test', betreff: 'x', nachricht: 'Test', ...extra }, ip())
    pruefe('Kontakt: Datenschutz-Haken „false“ → 400', (await k({ datenschutz: false })).s === 400)
    pruefe('Kontakt: ohne Datenschutz-Haken → 400', (await k({})).s === 400)
    const p = await api(null, 'POST', '/api/probetraining', { name: 'Sicherheitstest', email: 'sicherheitstest-antrag@bsv.test', angebot: team.id, datenschutz: false }, ip())
    pruefe('Probetraining: Datenschutz-Haken „false“ → 400', p.s === 400, p.j)
  } finally {
    await d.q(`delete from mitgliedsantraege where email='sicherheitstest-antrag@bsv.test'`)
    await d.q(`delete from kontaktanfragen where email='sicherheitstest-antrag@bsv.test'`)
    await d.q(`delete from probetraining where email='sicherheitstest-antrag@bsv.test'`)
  }
}
