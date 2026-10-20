import { api, login, mitWebAdmin, pruefe } from './lib.mjs'

const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })

/** F-04, F-13: Fristen und IBAN im Web-Admin-Papierkorb */
export default async function datenschutz(d) {
  const antrag = await api(null, 'POST', '/api/mitgliedsantraege', { vorname: 'Sicherheitstest', nachname: 'Datenschutz', geburtsdatum: '1990-05-05', email: 'sicherheitstest-ds@bsv.test', strasse: 'Teststraße 1', plz: '41470', ort: 'Neuss', mitgliedsart: 'passiv', kontoinhaber: 'Test', iban: 'DE89370400440532013000', sepaMandat: true, satzungAkzeptiert: true }, ip())
  const id = antrag.j?.doc?.id
  try {
    pruefe('Testantrag angelegt', Boolean(id), antrag.j)
    if (!id) return
    const ka = await login('kasse@bsv.test')
    await api(ka, 'PATCH', `/api/mitgliedsantraege/${id}`, { deletedAt: new Date().toISOString() })
    const r = await api(ka, 'DELETE', `/api/mitgliedsantraege/${id}?trash=true`)
    const [z] = await d.q('select iban, endgueltig_am from mitgliedsantraege where id=$1', [id])
    pruefe('Kasse löscht endgültig → Web-Admin-Papierkorb', r.s === 200 && Boolean(z?.endgueltig_am), r)
    pruefe('… und die IBAN ist sofort entfernt', z?.iban === '', { iban: z?.iban ? 'noch da' : z?.iban })
    await mitWebAdmin(d, 'admin@bsv.test', async () => {
      const wa = await login('admin@bsv.test')
      const w = await api(wa, 'POST', '/api/papierkorb/aktion', { aktion: 'wiederherstellen', eintraege: [{ slug: 'mitgliedsantraege', id }] })
      pruefe('Web-Admin kann den Antrag (ohne IBAN) wiederherstellen', w.s === 200 && w.j?.ok === 1, w.j)
    })
    // Fristen-Übersicht kennt die neuen Regeln
    await d.q(`insert into kontaktanfragen (name, email, betreff, nachricht, datenschutz, status, updated_at, created_at) values ('Sicherheitstest', 'sicherheitstest-ds@bsv.test', 'x', 'alt', true, 'neu', now() - interval '13 months', now() - interval '13 months')`)
    const ad = await login('admin@bsv.test')
    const f = await api(ad, 'GET', '/api/datenschutz/faellig')
    pruefe('Fristen: nie erledigte Kontaktanfragen werden erkannt', (f.j?.faellig ?? []).some((x) => x.id === 'kontaktanfragen-offen'), f.j)
    const a = await fetch((await import('./lib.mjs')).B + '/api/datenschutz/auskunft?email=mitglied@bsv.test', { headers: { Cookie: ad } })
    const text = await a.text()
    pruefe('Auskunft (Art. 15) als Datei für Admins', a.status === 200 && /attachment/.test(a.headers.get('content-disposition') ?? '') && JSON.parse(text).benutzerkonten?.length === 1, a.status)
    pruefe('… ohne Passwort-Prüfwerte und 2FA-Geheimnisse', !/"hash"|"salt"|zweiFaktorGeheimnis/.test(text))
    pruefe('Auskunft für Redaktion gesperrt', (await api(await login('redaktion@bsv.test'), 'GET', '/api/datenschutz/auskunft?email=mitglied@bsv.test')).s === 403)
    const [ds] = await d.q('select automatisch from datenschutz')
    pruefe('„Automatisch aufräumen“ ist eingeschaltet', ds?.automatisch === true, ds)
  } finally {
    await d.q(`delete from mitgliedsantraege where email='sicherheitstest-ds@bsv.test'`)
    await d.q(`delete from kontaktanfragen where email='sicherheitstest-ds@bsv.test'`)
  }
}
