import { api, login, pruefe } from './lib.mjs'

const tag = 86400000
const iso = (ms) => new Date(Date.now() + ms).toISOString()
const TITEL = 'Sicherheitstest Zusage'

/**
 * Zu- und Absagen im Mitgliederbereich: nur das eigene Konto, nur freigeschaltete Mitglieder, nur Termine mit Haken,
 * Anmeldeschluss und Begleitung werden serverseitig geprüft, die Liste sieht nur die Verwaltung.
 */
export default async function zusagen(d) {
  const admin = await login('admin@bsv.test')
  const [mitglied] = await d.q(`select id from users where email = 'mitglied@bsv.test' and testkonto = true`)
  const [kasse] = await d.q(`select id from users where email = 'kasse@bsv.test' and testkonto = true`)
  if (!mitglied || !kasse) return pruefe('Testkonten mitglied/kasse vorhanden', false)
  const neu = async (extra) => api(admin, 'POST', '/api/termine', { title: TITEL, beginn: iso(20 * tag), bereich: 'verein', ...extra })
  try {
    // Termine anlegen
    const t = (await neu({ anmeldung: true, begleitung: true, anmeldeschluss: iso(10 * tag) })).j?.doc
    const ohneBegleitung = (await neu({ anmeldung: true })).j?.doc
    const ohneHaken = (await neu({})).j?.doc
    const vorbei = (await neu({ anmeldung: true })).j?.doc
    const nurMitglieder = (await neu({ anmeldung: true, nurMitglieder: true })).j?.doc
    pruefe('Termine mit Zu-/Absage angelegt', Boolean(t?.id && ohneBegleitung?.id && ohneHaken?.id && vorbei?.id && nurMitglieder?.id))
    await d.q(`update termine set anmeldeschluss = $1 where id = $2`, [iso(-2 * tag), vorbei.id])
    const wdh = await neu({ anmeldung: true, wiederholung: 'woechentlich', wiederholungBis: iso(60 * tag) })
    pruefe('Zu-/Absage bei wiederkehrendem Termin abgelehnt', wdh.s === 400, wdh.j)
    const spaet = await neu({ anmeldung: true, anmeldeschluss: iso(30 * tag) })
    pruefe('Anmeldeschluss nach dem Termin abgelehnt', spaet.s === 400, spaet.j)

    const antworten = (c, body) => api(c, 'POST', '/api/termin-rueckmeldungen/antworten', body)
    pruefe('Ohne Anmeldung: keine Antwort möglich', (await antworten(null, { termin: t.id, teilnahme: 'ja' })).s === 401)
    pruefe('Ohne Anmeldung: Liste nicht lesbar', (await api(null, 'GET', `/api/termin-rueckmeldungen?where[termin][equals]=${t.id}`)).s === 403)

    const m = await login('mitglied@bsv.test')
    // Fremdes Konto in der Anfrage wird ignoriert (immer das angemeldete Konto)
    let r = await antworten(m, { termin: t.id, teilnahme: 'ja', personen: 2, bemerkung: '<script>alert(1)</script> vegetarisch', mitglied: kasse.id, name: 'Falscher Name' })
    pruefe('Mitglied sagt zu (2 Personen)', r.s === 200 && r.j?.personen === 2, r.j)
    let zeilen = await d.q(`select mitglied_id, name, personen, teilnahme::text from termin_rueckmeldungen where termin_id = $1`, [t.id])
    pruefe('Antwort gehört dem angemeldeten Konto (fremde ID/Name ignoriert)', zeilen.length === 1 && zeilen[0].mitglied_id === mitglied.id && zeilen[0].name !== 'Falscher Name', zeilen)
    r = await antworten(m, { termin: t.id, teilnahme: 'nein', personen: 2 })
    zeilen = await d.q(`select personen, teilnahme::text from termin_rueckmeldungen where termin_id = $1`, [t.id])
    pruefe('Erneut antworten ändert den Eintrag (keine Doppelten), Absage = 0 Personen', r.s === 200 && zeilen.length === 1 && zeilen[0].teilnahme === 'nein' && Number(zeilen[0].personen) === 0, zeilen)
    // Gleichzeitig abgeschickt → trotzdem nur ein Eintrag
    await Promise.all([1, 2, 3].map(() => antworten(m, { termin: ohneBegleitung.id, teilnahme: 'ja', personen: 2 })))
    zeilen = await d.q(`select personen from termin_rueckmeldungen where termin_id = $1`, [ohneBegleitung.id])
    pruefe('Gleichzeitige Antworten: genau ein Eintrag', zeilen.length === 1, zeilen)
    pruefe('Ohne Begleitung: 2 Personen werden zu 1', Number(zeilen[0]?.personen) === 1, zeilen)

    pruefe('Termin ohne Haken: keine Antwort', (await antworten(m, { termin: ohneHaken.id, teilnahme: 'ja' })).s === 404)
    pruefe('Anmeldeschluss vorbei: keine Antwort', (await antworten(m, { termin: vorbei.id, teilnahme: 'ja' })).s === 409)
    pruefe('Unbekannter Termin: keine Antwort', (await antworten(m, { termin: 999999999, teilnahme: 'ja' })).s === 404)
    pruefe('Ungültige Antwort abgelehnt', (await antworten(m, { termin: t.id, teilnahme: 'vielleicht' })).s === 400)
    pruefe('Zu lange Bemerkung abgelehnt', (await antworten(m, { termin: t.id, teilnahme: 'ja', bemerkung: 'x'.repeat(301) })).s === 400)
    pruefe('Termin „nur für Mitglieder“: Mitglied darf antworten', (await antworten(m, { termin: nurMitglieder.id, teilnahme: 'ja' })).s === 200)

    // Antwort eines anderen Kontos (kasse) – darf das Mitglied weder sehen noch ändern
    const k = await login('kasse@bsv.test')
    pruefe('Zweites Konto antwortet', (await antworten(k, { termin: t.id, teilnahme: 'ja' })).s === 200)
    const [fremd] = await d.q(`select id from termin_rueckmeldungen where termin_id = $1 and mitglied_id = $2`, [t.id, kasse.id])
    const liste = await api(m, 'GET', `/api/termin-rueckmeldungen?where[termin][equals]=${t.id}&limit=50`)
    pruefe('Mitglied sieht nur die eigene Antwort', liste.s === 200 && liste.j?.docs?.length === 1 && liste.j.docs.every((x) => (x.mitglied?.id ?? x.mitglied) === mitglied.id), liste.j?.docs?.length)
    const einzeln = await api(m, 'GET', `/api/termin-rueckmeldungen/${fremd.id}`)
    pruefe('Mitglied kann fremde Antwort nicht direkt abrufen', einzeln.s === 403 || einzeln.s === 404, einzeln.s)
    pruefe('Mitglied kann fremde Antwort nicht ändern', [403, 404].includes((await api(m, 'PATCH', `/api/termin-rueckmeldungen/${fremd.id}`, { teilnahme: 'nein' })).s))
    pruefe('Mitglied kann fremde Antwort nicht löschen', [403, 404].includes((await api(m, 'DELETE', `/api/termin-rueckmeldungen/${fremd.id}`)).s))
    pruefe('Mitglied kann über die Schnittstelle nichts direkt anlegen', (await api(m, 'POST', '/api/termin-rueckmeldungen', { termin: t.id, mitglied: kasse.id, teilnahme: 'ja' })).s === 403)
    const [fremdDanach] = await d.q(`select teilnahme::text from termin_rueckmeldungen where id = $1`, [fremd.id])
    pruefe('Fremde Antwort unverändert', fremdDanach?.teilnahme === 'ja', fremdDanach)

    const trainer = await login('trainer-1-mannschaft@bsv.test')
    const tl = await api(trainer, 'GET', `/api/termin-rueckmeldungen?where[termin][equals]=${t.id}&limit=50`)
    pruefe('Trainer sieht die Liste nicht (nur eigene, hier keine)', tl.s === 200 && tl.j?.docs?.length === 0, tl.j?.docs?.length)
    const red = await login('redaktion@bsv.test')
    const rl = await api(red, 'GET', `/api/termin-rueckmeldungen?where[termin][equals]=${t.id}&limit=50`)
    pruefe('Redaktion sieht alle Antworten', rl.s === 200 && rl.j?.docs?.length === 2, rl.j?.docs?.length)
    const [leser] = await d.q(`select 1 from users where email = 'lesen@bsv.test' and testkonto = true`)
    if (leser) {
      const ll = await api(await login('lesen@bsv.test'), 'GET', `/api/termin-rueckmeldungen?where[termin][equals]=${t.id}&limit=50`)
      const [haken] = await d.q(`select lesen_benutzer from rollen_rechte limit 1`).catch(() => [{}])
      const erwartet = haken?.lesen_benutzer === false ? 0 : 2
      pruefe('„Nur ansehen“: Liste nur mit Haken „Benutzerkonten“', ll.s === 200 && ll.j?.docs?.length === erwartet, { anzahl: ll.j?.docs?.length, erwartet })
      const la = await api(await login('lesen@bsv.test'), 'PATCH', `/api/termin-rueckmeldungen/${fremd.id}`, { teilnahme: 'nein' })
      pruefe('„Nur ansehen“: Antworten nicht änderbar', [403, 404].includes(la.s), la.s)
    }

    // Noch nicht freigeschaltet → keine Antwort
    await d.q(`update users set freigegeben = false where id = $1`, [mitglied.id])
    try {
      const w = await login('mitglied@bsv.test')
      const a = await antworten(w, { termin: t.id, teilnahme: 'ja' })
      pruefe('Nicht freigeschaltetes Konto: keine Antwort', a.s === 403, a.j)
    } finally {
      await d.q(`update users set freigegeben = true where id = $1`, [mitglied.id])
    }
  } finally {
    await d.q(`delete from termin_rueckmeldungen where termin_id in (select id from termine where title = $1)`, [TITEL])
    await d.q(`delete from termine where title = $1`, [TITEL])
  }
}
