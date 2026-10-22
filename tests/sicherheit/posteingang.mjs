import { api, B, login, pruefe } from './lib.mjs'

/**
 * Posteingang & Mitgliedsanträge: Notizen-Verlauf, „Wer kümmert sich?“, Entscheidung mit Mail, Export für die Kasse,
 * Startseiten-Vorschlag für News. Prüft vor allem, wer was darf – und dass geschützte Felder nicht von außen setzbar sind.
 */
const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const MAIL = 'sicherheitstest-posteingang@bsv.test'
const basis = {
  vorname: 'Posteingangtest',
  nachname: 'Sicherheit',
  geburtsdatum: '1988-04-04',
  email: MAIL,
  strasse: 'Teststraße 2',
  plz: '41470',
  ort: 'Neuss',
  mitgliedsart: 'aktiv',
  kontoinhaber: 'Posteingangtest',
  iban: 'DE89370400440532013000',
  sepaMandat: true,
  satzungAkzeptiert: true,
}

const post = (cookie, pfad, body) => api(cookie, 'POST', pfad, body ?? {})

export default async function posteingang(d) {
  const [kasse, admin, redaktion, mitglied] = await Promise.all(['kasse', 'admin', 'redaktion', 'mitglied'].map((r) => login(`${r}@bsv.test`)))
  const [t1, t2] = await d.q(
    `select u.email, ar.parent_id as team from users u join angebote_rels ar on ar.users_id=u.id and ar.path='leitung'
     where u.email like 'trainer-%' and u.testkonto = true order by ar.parent_id limit 2`,
  )
  const trainer = await login(t1.email)
  const fremderTrainer = await login(t2.email)
  const postIds = []
  try {
    // --- Öffentliches Formular kann geschützte Felder nicht setzen ---------
    const neu = await api(null, 'POST', '/api/mitgliedsantraege', { ...basis, zustaendig: 1, zustaendigName: 'Hacker', verlauf: [{ text: 'gefälscht', am: new Date().toISOString() }], exportiertAm: new Date().toISOString(), aufgenommenAm: new Date().toISOString() }, ip())
    pruefe('Antrag über das Formular angelegt', neu.s === 201, neu.j)
    const id = neu.j?.doc?.id
    const [roh] = await d.q(`select zustaendig_id, zustaendig_name, exportiert_am, aufgenommen_am, (select count(*)::int from mitgliedsantraege_verlauf v where v._parent_id=m.id) n from mitgliedsantraege m where id=$1`, [id])
    pruefe('Formular: Zuständig/Verlauf/Export-Datum werden ignoriert', roh && !roh.zustaendig_id && !roh.zustaendig_name && !roh.exportiert_am && !roh.aufgenommen_am && roh.n === 0, roh)
    pruefe('Formular: Antwort enthält nur die ID (keine IBAN zurück an den Browser)', neu.j?.doc && Object.keys(neu.j.doc).join() === 'id', neu.j)

    // --- Notizen ----------------------------------------------------------
    const pfad = `/api/mitgliedsantraege/${id}`
    pruefe('Notiz ohne Anmeldung → 401', (await post(null, `${pfad}/notiz`, { text: 'x' })).s === 401)
    pruefe('Notiz als Mitglied → 403', (await post(mitglied, `${pfad}/notiz`, { text: 'x' })).s === 403)
    pruefe('Notiz als Redaktion (kein Zugriff auf Anträge) → 403', (await post(redaktion, `${pfad}/notiz`, { text: 'x' })).s === 403)
    pruefe('Notiz zu nicht vorhandenem Antrag → 403', (await post(kasse, `/api/mitgliedsantraege/999999/notiz`, { text: 'x' })).s === 403)
    pruefe('Leere Notiz → 400', (await post(kasse, `${pfad}/notiz`, { text: '   ' })).s === 400)
    pruefe('Zu lange Notiz → 400', (await post(kasse, `${pfad}/notiz`, { text: 'a'.repeat(2001) })).s === 400)
    const tp = await fetch(B + `${pfad}/notiz`, { method: 'POST', headers: { 'Content-Type': 'text/plain', Cookie: kasse }, body: JSON.stringify({ text: 'x' }) })
    pruefe('Notiz als text/plain (fremdes Formular) → 415', tp.status === 415, tp.status)
    const n1 = await post(kasse, `${pfad}/notiz`, { text: '<b>Angerufen</b>' })
    pruefe('Notiz als Kasse → 200 mit Name', n1.s === 200 && n1.j?.verlauf?.at(-1)?.vonName === 'Test Kasse' && n1.j?.verlauf?.at(-1)?.text === '<b>Angerufen</b>', n1.j)

    // Verlauf, Zuständigkeit und Export-Datum lassen sich nicht über ein normales Speichern ändern
    await api(kasse, 'PATCH', pfad, { verlauf: [{ text: 'umgeschrieben', am: new Date().toISOString() }], zustaendig: null, zustaendigName: 'X', exportiertAm: new Date().toISOString() })
    const [nachPatch] = await d.q(`select (select string_agg(text, '|') from mitgliedsantraege_verlauf v where v._parent_id=m.id) t, zustaendig_name, exportiert_am from mitgliedsantraege m where id=$1`, [id])
    pruefe('PATCH: Verlauf/Name/Export-Datum bleiben unverändert', nachPatch.t === '<b>Angerufen</b>' && !nachPatch.zustaendig_name && !nachPatch.exportiert_am, nachPatch)

    // Gleichzeitige Notizen gehen nicht verloren
    await Promise.all([1, 2, 3, 4, 5, 6].map((i) => post(kasse, `${pfad}/notiz`, { text: `parallel ${i}` })))
    const [par] = await d.q(`select count(*)::int n from mitgliedsantraege_verlauf where _parent_id=$1 and text like 'parallel %'`, [id])
    pruefe('6 gleichzeitige Notizen → alle 6 gespeichert', par.n === 6, par)

    // --- Wer kümmert sich? -------------------------------------------------
    pruefe('Übernehmen als Redaktion → 403', (await post(redaktion, `${pfad}/zustaendig`, { uebernehmen: true })).s === 403)
    const ue = await post(admin, `${pfad}/zustaendig`, { uebernehmen: true })
    pruefe('Übernehmen als Admin → Name gespeichert', ue.s === 200 && ue.j?.zustaendigName === 'Test Admin', ue.j)
    pruefe('Abgeben durch Kasse, obwohl Admin zuständig → 400', (await post(kasse, `${pfad}/zustaendig`, { uebernehmen: false })).s === 400)
    await api(kasse, 'PATCH', pfad, { zustaendig: (await d.q(`select id from users where email='kasse@bsv.test'`))[0].id })
    const [z] = await d.q(`select zustaendig_name from mitgliedsantraege where id=$1`, [id])
    pruefe('Kasse kann Zuständigkeit nicht per PATCH umschreiben', z.zustaendig_name === 'Test Admin', z)
    await api(admin, 'PATCH', pfad, { zustaendig: (await d.q(`select id from users where email='redaktion@bsv.test'`))[0].id })
    const [zl] = await d.q(`select zustaendig_name, (select count(*)::int from mitgliedsantraege_verlauf v where v._parent_id=m.id and v.text like 'Zuständig: Test Redaktion%') n from mitgliedsantraege m where id=$1`, [id])
    pruefe('Admin setzt Zuständig von Hand → steht im Verlauf', zl.zustaendig_name === 'Test Redaktion' && zl.n === 1, zl)
    await api(kasse, 'PATCH', pfad, { email: 'sicherheitstest-posteingang+neu@bsv.test' })
    const [em] = await d.q(`select count(*)::int n from mitgliedsantraege_verlauf where _parent_id=$1 and text like 'E-Mail-Adresse geändert:%'`, [id])
    pruefe('Geänderte E-Mail-Adresse steht im Verlauf', em.n === 1, em)
    await d.q(`update mitgliedsantraege set email=$1 where id=$2`, [MAIL, id])
    const ue2 = await post(kasse, `${pfad}/zustaendig`, { uebernehmen: true })
    pruefe('Übernehmen als Kasse → 200', ue2.s === 200 && ue2.j?.zustaendigName === 'Test Kasse', ue2.j)

    // --- Prüfhilfe ----------------------------------------------------------
    pruefe('Prüfhilfe als Redaktion → 403', (await api(redaktion, 'GET', `${pfad}/pruefung`)).s === 403)
    const pr = await api(kasse, 'GET', `${pfad}/pruefung`)
    pruefe('Prüfhilfe als Kasse → 200', pr.s === 200 && Array.isArray(pr.j?.antraege) && Array.isArray(pr.j?.mitgliedschaften), pr.j)

    // --- Entscheidung --------------------------------------------------------
    pruefe('Entscheidung als Redaktion → 403', (await post(redaktion, `${pfad}/entscheidung`, { status: 'aufgenommen' })).s === 403)
    pruefe('Entscheidung als Trainer → 403', (await post(trainer, `${pfad}/entscheidung`, { status: 'aufgenommen' })).s === 403)
    pruefe('Unbekannter Status → 400', (await post(kasse, `${pfad}/entscheidung`, { status: 'geloescht' })).s === 400)
    pruefe('Mail ohne Text → 400', (await post(kasse, `${pfad}/entscheidung`, { status: 'rueckfrage', mail: { betreff: 'x', text: '' } })).s === 400)
    const ent = await post(kasse, `${pfad}/entscheidung`, { status: 'aufgenommen', mail: { betreff: 'Willkommen\r\nBcc: boese@example.org', text: 'Hallo,\n\nwillkommen!' }, an: 'boese@example.org' })
    pruefe('Aufnehmen mit Mail → 200', ent.s === 200 && ent.j?.status === 'aufgenommen', ent.j)
    const [nach] = await d.q(`select status, aufgenommen_am, (select count(*)::int from mitgliedschaften where antrag_id=$1) ausweise, (select string_agg(text, '|' order by _order) from mitgliedsantraege_verlauf v where v._parent_id=$1) verlauf from mitgliedsantraege where id=$1`, [id])
    pruefe('Aufnehmen: Status, Datum, Mitgliedschaft und Verlauf', nach.status === 'aufgenommen' && nach.aufgenommen_am && nach.ausweise === 1 && /Status: Neu → Aufgenommen/.test(nach.verlauf) && /E-Mail/.test(nach.verlauf), nach)

    pruefe('Nach „Aufgenommen“ kein Wechsel auf „Abgelehnt“ → 400', (await post(kasse, `${pfad}/entscheidung`, { status: 'abgelehnt' })).s === 400)
    pruefe('Keine weitere Mail bei unverändertem Status → 400', (await post(kasse, `${pfad}/entscheidung`, { status: 'aufgenommen', mail: { betreff: 'Spam', text: 'beliebig' } })).s === 400)

    // --- Export ---------------------------------------------------------------
    const exp = (cookie, body) => fetch(B + '/api/mitgliedsantraege/export', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body ?? {}) })
    pruefe('Export ohne Anmeldung → 401', (await exp(null)).status === 401)
    pruefe('Export als Redaktion → 403', (await exp(redaktion)).status === 403)
    pruefe('Export als Trainer → 403', (await exp(trainer)).status === 403)
    pruefe('Export per GET nicht möglich', (await fetch(B + '/api/mitgliedsantraege/export', { headers: { Cookie: kasse } })).status !== 200)
    const e1 = await exp(kasse)
    const csv = await e1.text()
    pruefe('Export als Kasse → CSV', e1.status === 200 && /text\/csv/.test(e1.headers.get('content-type') ?? '') && e1.headers.get('cache-control') === 'no-store', e1.status)
    pruefe('Export enthält den Antrag', csv.includes('"Posteingangtest"'))
    pruefe('Export enthält keine Bankdaten', !csv.includes('DE89') && !csv.includes('3013000') && !/IBAN|Kontoinhaber/i.test(csv))
    const [ex] = await d.q(`select exportiert_am from mitgliedsantraege where id=$1`, [id])
    pruefe('Export setzt „exportiert am“', Boolean(ex.exportiert_am), ex)
    const e2 = await (await exp(kasse)).text()
    pruefe('Zweiter Export enthält den Antrag nicht mehr', !e2.includes('"Posteingangtest"'))
    const e3 = await (await exp(kasse, { alle: true })).text()
    pruefe('Export „alle“ enthält ihn wieder', e3.includes('"Posteingangtest"'))

    // CSV-Injection: Formeln werden entschärft
    const boese = await api(null, 'POST', '/api/mitgliedsantraege', { ...basis, vorname: '=HYPERLINK("http://x")', ort: '\n =cmd', email: MAIL }, ip())
    if (boese.s === 201) {
      await post(kasse, `/api/mitgliedsantraege/${boese.j.doc.id}/entscheidung`, { status: 'aufgenommen' })
      const e4 = await (await exp(kasse)).text()
      pruefe('CSV: Formel wird als Text exportiert', e4.includes(`"'=HYPERLINK(""http://x"")"`) && !e4.includes(';"=HYPERLINK'), e4.slice(0, 400))
      pruefe('CSV: Formel nach Zeilenumbruch/Leerzeichen wird entschärft', !/;"\s*=cmd/.test(e4) && /"'\s*=cmd"/.test(e4), e4.slice(0, 600))
    } else pruefe('CSV-Injection: Formular lehnt Formel-Namen ab (ebenfalls sicher)', boese.s === 400, boese.j)

    // --- Kontakt- und Probetraining-Anfragen ---------------------------------
    const k = await api(null, 'POST', '/api/kontaktanfragen', { name: 'Posteingangtest', email: MAIL, betreff: 'Test', nachricht: 'Hallo', datenschutz: true }, ip())
    const kid = k.j?.doc?.id
    pruefe('Kontakt: Notiz als Kasse ohne Freigabe → 403', (await post(kasse, `/api/kontaktanfragen/${kid}/notiz`, { text: 'x' })).s === 403)
    pruefe('Kontakt: Notiz als Redaktion → 200', (await post(redaktion, `/api/kontaktanfragen/${kid}/notiz`, { text: 'Rückruf' })).s === 200)
    await api(redaktion, 'PATCH', `/api/kontaktanfragen/${kid}`, { status: 'erledigt' })
    const [kv] = await d.q(`select string_agg(text, '|' order by _order) t from kontaktanfragen_verlauf where _parent_id=$1`, [kid])
    pruefe('Kontakt: Statuswechsel steht im Verlauf', /Status: Neu → Erledigt/.test(kv?.t ?? ''), kv)

    const p = await api(null, 'POST', '/api/probetraining', { name: 'Posteingangtest', email: MAIL, angebot: t1.team, datenschutz: true }, ip())
    const pid = p.j?.doc?.id
    pruefe('Probetraining: Notiz als Trainer eines anderen Teams → 403', (await post(fremderTrainer, `/api/probetraining/${pid}/notiz`, { text: 'x' })).s === 403)
    pruefe('Probetraining: Übernehmen als eigener Trainer → 200', (await post(trainer, `/api/probetraining/${pid}/zustaendig`, { uebernehmen: true })).s === 200)

    // --- News: Startseiten-Vorschlag -----------------------------------------
    const lex = { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [{ type: 'text', text: 'Testbericht', format: 0, mode: 'normal', style: '', detail: 0, version: 1 }] }] } }
    const n = await api(trainer, 'POST', '/api/posts', { title: 'Posteingangtest News', content: lex, team: t1.team, _status: 'published', startseiteVorschlag: true, aufStartseite: true })
    const nid = n.j?.doc?.id
    if (nid) postIds.push(nid)
    pruefe('Trainer: News mit Vorschlag angelegt, „Auf Startseite“ bleibt aus', n.s === 201 && n.j?.doc?.startseiteVorschlag === true && n.j?.doc?.aufStartseite === false, n.j?.doc ?? n.j)
    pruefe('Trainer kann Vorschlag nicht selbst annehmen → 403', (await post(trainer, `/api/posts/${nid}/startseite`, { annehmen: true })).s === 403)
    pruefe('Kasse kann Vorschlag nicht annehmen → 403', (await post(kasse, `/api/posts/${nid}/startseite`, { annehmen: true })).s === 403)
    const an = await post(redaktion, `/api/posts/${nid}/startseite`, { annehmen: true })
    const [pn] = await d.q(`select auf_startseite, startseite_vorschlag, _status from posts where id=$1`, [nid])
    pruefe('Redaktion nimmt an → auf der Startseite, weiter veröffentlicht', an.s === 200 && pn.auf_startseite === true && pn.startseite_vorschlag === false && pn._status === 'published', { an: an.j, pn })

    // Veröffentlichte News mit offenem Entwurf: Annehmen darf den Entwurf weder veröffentlichen noch die News offline nehmen
    const n2 = await api(trainer, 'POST', '/api/posts', { title: 'Posteingangtest Live', content: lex, team: t1.team, _status: 'published', startseiteVorschlag: true })
    const n2id = n2.j?.doc?.id
    if (n2id) postIds.push(n2id)
    await api(trainer, 'PATCH', `/api/posts/${n2id}?draft=true`, { title: 'Posteingangtest Entwurf', _status: 'draft' })
    const an2 = await post(redaktion, `/api/posts/${n2id}/startseite`, { annehmen: true })
    const [live] = await d.q(`select title, _status, auf_startseite from posts where id=$1`, [n2id])
    pruefe('Offener Entwurf: Live-Fassung bleibt veröffentlicht und unverändert, kommt auf die Startseite', an2.s === 200 && live.title === 'Posteingangtest Live' && live._status === 'published' && live.auf_startseite === true, { an2: an2.j, live })
    const entwurf = await api(redaktion, 'GET', `/api/posts/${n2id}?draft=true&depth=0`)
    pruefe('Offener Entwurf: bleibt Entwurf und übernimmt die Entscheidung', entwurf.j?.title === 'Posteingangtest Entwurf' && entwurf.j?._status === 'draft' && entwurf.j?.aufStartseite === true, entwurf.j && { t: entwurf.j.title, s: entwurf.j._status, a: entwurf.j.aufStartseite })
    await api(trainer, 'PATCH', `/api/posts/${n2id}`, { _status: 'published' })
    const [spaeter] = await d.q(`select title, auf_startseite from posts where id=$1`, [n2id])
    pruefe('Offener Entwurf: nach dem Veröffentlichen weiter auf der Startseite', spaeter.title === 'Posteingangtest Entwurf' && spaeter.auf_startseite === true, spaeter)
  } finally {
    await d.q(`delete from mitgliedschaften where antrag_id in (select id from mitgliedsantraege where email=$1)`, [MAIL])
    await d.q(`delete from mitgliedsantraege where email=$1`, [MAIL])
    await d.q(`delete from kontaktanfragen where email=$1`, [MAIL])
    await d.q(`delete from probetraining where email=$1`, [MAIL])
    for (const id of postIds) {
      await d.q(`delete from search where id in (select parent_id from search_rels where posts_id = $1)`, [id]).catch(() => {})
      await d.q(`delete from _posts_v where parent_id=$1`, [id]).catch(() => {})
      await d.q(`delete from posts where id=$1`, [id]).catch(() => {})
    }
  }
}
