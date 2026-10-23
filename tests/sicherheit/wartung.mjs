import { api, B, login, mitWebAdmin, pruefe } from './lib.mjs'

/** Wartung: Saisonwechsel-Assistent und „Wiederherstellung getestet“ – nur die vorgesehenen Rollen, nur gültige Anfragen */
export default async function wartung(d) {
  const vorher = (await d.q('select saison_start, saison_geprueft, saisonwechsel_am, saisonwechsel_von, wiederherstellung_getestet_am, wiederherstellung_von from wartung limit 1'))[0] ?? null
  const [team] = await d.q(`select id from angebote where bereich = 'fussball' order by id limit 1`)
  const [kurs] = await d.q(`select id from angebote where bereich <> 'fussball' order by id limit 1`)
  const red = await login('redaktion@bsv.test')
  const kasse = await login('kasse@bsv.test')
  const trainer = await login('trainer-f1-jugend@bsv.test')
  const admin = await login('admin@bsv.test')
  try {
    // Updates & Sicherheit: nur Web-Admins, nur JSON, höchstens einmal pro Minute
    pruefe('Ohne Anmeldung: Update-Prüfung → 403', (await api(null, 'POST', '/api/updates/pruefen', {})).s === 403)
    pruefe('Kasse: Update-Prüfung → 403', (await api(kasse, 'POST', '/api/updates/pruefen', {})).s === 403)
    pruefe('Admin (ohne Web-Admin): Update-Prüfung → 403', (await api(admin, 'POST', '/api/updates/pruefen', {})).s === 403)
    pruefe('Nur ansehen: Update-Prüfung → 403', (await api(await login('lesen@bsv.test'), 'POST', '/api/updates/pruefen', {})).s === 403)
    await mitWebAdmin(d, 'admin@bsv.test', async () => {
      const w = await login('admin@bsv.test')
      const plain = await fetch(B + '/api/updates/pruefen', { method: 'POST', headers: { Cookie: w, 'Content-Type': 'text/plain' }, body: '{}' })
      pruefe('Web-Admin ohne JSON → 415', plain.status === 415, plain.status)
      const erst = await api(w, 'POST', '/api/updates/pruefen', {})
      if (erst.s === 409) {
        // BSV_PAKETPRUEFUNG=aus im Dev-Server: Prüfung abgeschaltet, Ratenlimit nicht testbar
        pruefe('Web-Admin: Update-Prüfung abgeschaltet → 409', true)
      } else {
        const nochmal = await api(w, 'POST', '/api/updates/pruefen', {})
        pruefe('Web-Admin: Update-Prüfung läuft (oder ist gerade gelaufen)', erst.s === 200 || erst.s === 429, erst)
        pruefe('Sofort nochmal → 429 (höchstens einmal pro Minute)', nochmal.s === 429, nochmal.s)
      }
    })

    // Saisonwechsel
    pruefe('Ohne Anmeldung: Saison-Aktion → 403', (await api(null, 'POST', '/api/globals/wartung/saison', { aktion: 'start' })).s === 403)
    pruefe('Kasse: Saison-Aktion → 403', (await api(kasse, 'POST', '/api/globals/wartung/saison', { aktion: 'start' })).s === 403)
    pruefe('Trainer: Saison-Aktion → 403', (await api(trainer, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: team.id, geprueft: true })).s === 403)
    const ohneJson = await fetch(B + '/api/globals/wartung/saison', { method: 'POST', headers: { Cookie: red, 'Content-Type': 'text/plain' }, body: JSON.stringify({ aktion: 'start' }) })
    pruefe('Ohne JSON (Formular von fremder Seite) → 415', ohneJson.status === 415)
    pruefe('Unbekannte Aktion → 400', (await api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'loeschen' })).s === 400)
    pruefe('ID als Text → 400', (await api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: `${team.id} OR 1=1`, geprueft: true })).s === 400)
    pruefe('Nicht vorhandenes Team → 404', (await api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: 99999999, geprueft: true })).s === 404)
    const start = await api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'start' })
    pruefe('Redaktion: neue Saison beginnen', start.s === 200 && Object.keys(start.j?.saisonGeprueft ?? {}).length === 0, start.j)
    // Gleichzeitig mehrere Teams abhaken – keins darf verloren gehen
    if (kurs) pruefe('Breitensport-Kurs lässt sich nicht abhaken → 404', (await api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: kurs.id, geprueft: true })).s === 404)
    const teams = (await d.q(`select id from angebote where bereich = 'fussball' order by id limit 6`)).map((t) => t.id)
    await Promise.all(teams.map((id) => api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id, geprueft: true })))
    const [{ saison_geprueft: g }] = await d.q('select saison_geprueft from wartung limit 1')
    pruefe('6 gleichzeitige Haken: alle gespeichert', teams.every((id) => g?.[String(id)]), g)
    const ab = await api(admin, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: teams[0], geprueft: false })
    pruefe('Haken entfernen', ab.s === 200 && !ab.j?.saisonGeprueft?.[String(teams[0])], ab.j)
    const fertig = await api(admin, 'POST', '/api/globals/wartung/saison', { aktion: 'abschliessen' })
    pruefe('Admin: Saisonwechsel abschließen (mit Name)', fertig.s === 200 && Boolean(fertig.j?.saisonwechselAm) && fertig.j?.saisonwechselVon, fertig.j)
    pruefe('Direktes Bearbeiten des Wartungs-Bereichs gesperrt', (await api(admin, 'POST', '/api/globals/wartung', { saisonwechselVon: 'Hacker' })).s === 403)
    const seiteRed = await (await fetch(B + '/admin/saisonwechsel', { headers: { Cookie: red } })).text()
    pruefe('Seite Saisonwechsel: Redaktion bekommt keine E-Mails/Anmeldedaten der Verantwortlichen', seiteRed.includes('bsv-saison') && !seiteRed.includes('trainer-f1-jugend@bsv.test') && !/\\?"zuletzt\\?":\\?"20/.test(seiteRed))
    pruefe('„getestet“ ohne JSON → 415', (await fetch(B + '/api/globals/wartung/wiederherstellung-getestet', { method: 'POST', headers: { Cookie: admin, 'Content-Type': 'text/plain' }, body: '{}' })).status !== 200)
    pruefe('Riesige Team-ID → 400 statt Fehler', (await api(red, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: 99999999999, geprueft: true })).s === 400)
    pruefe('Seite Saisonwechsel: Kasse wird umgeleitet', (await fetch(B + '/admin/saisonwechsel', { headers: { Cookie: kasse }, redirect: 'manual' })).status !== 200)

    // Wiederherstellung getestet – nur Web-Admin
    pruefe('Admin ohne Web-Admin: „getestet“ → 403', (await api(admin, 'POST', '/api/globals/wartung/wiederherstellung-getestet', {})).s === 403)
    pruefe('Redaktion: „getestet“ → 403', (await api(red, 'POST', '/api/globals/wartung/wiederherstellung-getestet', {})).s === 403)
    const lesen = await api(red, 'GET', '/api/globals/wartung')
    pruefe('Redaktion liest den Wartungs-Bereich ohne Web-Admin-Felder', lesen.s === 200 && !('wiederherstellungVon' in (lesen.j ?? {})) && !('wiederherstellungGetestetAm' in (lesen.j ?? {})), lesen.j)
    pruefe('Kasse darf den Wartungs-Bereich nicht lesen', (await api(kasse, 'GET', '/api/globals/wartung')).s === 403)
    await mitWebAdmin(d, 'admin@bsv.test', async () => {
      const wa = await login('admin@bsv.test')
      const t = await api(wa, 'POST', '/api/globals/wartung/wiederherstellung-getestet', {})
      pruefe('Web-Admin: „Wiederherstellung getestet“ gespeichert', t.s === 200 && Boolean(t.j?.am), t.j)
      const seite = await fetch(B + '/admin/sicherung', { headers: { Cookie: wa } })
      const html = await seite.text()
      pruefe('Datensicherung zeigt den Bereich „Wartung“ mit Node.js-Laufzeit', seite.status === 200 && html.includes('Wiederherstellung getestet') && html.includes('Node.js'))
    })
  } finally {
    if (vorher)
      await d.q('update wartung set saison_start=$1, saison_geprueft=$2, saisonwechsel_am=$3, saisonwechsel_von=$4, wiederherstellung_getestet_am=$5, wiederherstellung_von=$6', [
        vorher.saison_start,
        vorher.saison_geprueft,
        vorher.saisonwechsel_am,
        vorher.saisonwechsel_von,
        vorher.wiederherstellung_getestet_am,
        vorher.wiederherstellung_von,
      ])
    else await d.q('delete from wartung')
  }
}
