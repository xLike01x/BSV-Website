import { api, login, pruefe } from './lib.mjs'

const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const KONTO = 'mitglied@bsv.test'
const ALLE = ['news', 'seiten', 'termine', 'medien', 'sponsoren', 'teams', 'saisonwechsel', 'verein', 'datenschutz', 'statistik', 'papierkorb', 'hilfe', 'antraege']
const TEXT = { root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: null, children: [{ type: 'text', text: 'Test', version: 1, format: 0, mode: 'normal', style: '', detail: 0 }] }] } }
const PERSONEN = ['mitgliedsantraege', 'mitgliedschaften', 'kontaktanfragen', 'probetraining', 'form-submissions']

/**
 * Zusatzrechte für einzelne Bereiche: Ein Mitglied bekommt genau ein Recht und darf dann genau diesen Bereich –
 * nichts anderes, keine Bankdaten, kein endgültiges Löschen, keine Rechteausweitung.
 */
export default async function zusatzrechte(d) {
  const [konto] = await d.q('select id from users where email=$1 and testkonto = true', [KONTO])
  if (!konto) return pruefe('Testkonto mitglied@bsv.test vorhanden', false)
  const setzen = async (rechte) => {
    for (const k of ALLE) await d.q(`update users set "zusatzrechte_${k}" = $1 where id = $2`, [rechte.includes(k), konto.id])
  }
  const mit = async (rechte, fn) => {
    await setzen(rechte)
    try {
      return await fn(await login(KONTO))
    } finally {
      await setzen([])
    }
  }
  const nicht = (r) => r.s === 401 || r.s === 403 || (r.s === 200 && Array.isArray(r.j?.docs) && r.j.docs.length === 0)

  const admin = await login('admin@bsv.test')
  const [team] = await d.q(`select id, aktiv from angebote where bereich = 'fussball' order by id limit 1`)
  const [bild] = await d.q('select id, alt from media where deleted_at is null order by id limit 1')
  const [sponsor] = await d.q('select id, name from sponsoren order by id limit 1')
  const antrag = await api(null, 'POST', '/api/mitgliedsantraege', { vorname: 'Sicherheitstest', nachname: 'Zusatzrecht', geburtsdatum: '1990-05-05', email: 'sicherheitstest-zr@bsv.test', strasse: 'Teststraße 1', plz: '41470', ort: 'Neuss', mitgliedsart: 'passiv', kontoinhaber: 'Geheim Kontoinhaber', iban: 'DE89370400440532013000', sepaMandat: true, satzungAkzeptiert: true }, ip())
  const antragId = antrag.j?.doc?.id
  const neuePosts = []
  try {
    pruefe('Testantrag angelegt', Boolean(antragId), antrag.j)

    // Ohne Zusatzrecht: nichts davon
    await mit([], async (c) => {
      pruefe('Ohne Recht: keine News anlegen', nicht(await api(c, 'POST', '/api/posts', { title: 'ZR-Test', _status: 'draft' })))
      pruefe('Ohne Recht: keine Seite anlegen', nicht(await api(c, 'POST', '/api/pages', { title: 'ZR-Test', _status: 'draft' })))
      pruefe('Ohne Recht: Sponsor nicht ändern', nicht(await api(c, 'PATCH', `/api/sponsoren/${sponsor.id}`, { name: sponsor.name })))
      pruefe('Ohne Recht: Team nicht ändern', nicht(await api(c, 'PATCH', `/api/angebote/${team.id}`, { aktiv: team.aktiv })))
      pruefe('Ohne Recht: Bild nicht ändern', nicht(await api(c, 'PATCH', `/api/media/${bild.id}`, { alt: bild.alt })))
      pruefe('Ohne Recht: Vereinsdaten nicht ändern', nicht(await api(c, 'POST', '/api/globals/verein', {})))
      pruefe('Ohne Recht: Animationen nicht ändern', nicht(await api(c, 'POST', '/api/globals/animationen', { alle: false })))
      pruefe('Ohne Recht: keine Datenschutz-Fristen', nicht(await api(c, 'GET', '/api/globals/datenschutz')) || !('kontaktMonate' in ((await api(c, 'GET', '/api/globals/datenschutz')).j ?? {})))
      pruefe('Ohne Recht: keine Statistik', nicht(await api(c, 'GET', '/api/statistik?limit=1')))
      pruefe('Ohne Recht: kein Papierkorb', nicht(await api(c, 'GET', '/api/papierkorb/liste')))
      pruefe('Ohne Recht: keine Hilfe-Rückmeldungen', nicht(await api(c, 'GET', '/api/hilfe-feedback?limit=1')))
      pruefe('Ohne Recht: keine Mitgliedsanträge', nicht(await api(c, 'GET', '/api/mitgliedsantraege?limit=5')))
      pruefe('Ohne Recht: kein Saisonwechsel', nicht(await api(c, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: team.id, geprueft: false })))
    })

    // News
    await mit(['news'], async (c) => {
      const p = await api(c, 'POST', '/api/posts?draft=true', { title: 'ZR-Test Vereins-News', _status: 'draft', aufStartseite: true })
      if (p.j?.doc?.id) neuePosts.push(p.j.doc.id)
      pruefe('news: Vereins-News ohne Team anlegen, „Auf Startseite“ setzen', p.s === 201 && p.j?.doc?.aufStartseite === true, p.j)
      pruefe('news: trotzdem keine Seite anlegen', nicht(await api(c, 'POST', '/api/pages', { title: 'ZR-Test', _status: 'draft' })))
      pruefe('news: Bilder anderer nicht ändern', nicht(await api(c, 'PATCH', `/api/media/${bild.id}`, { alt: bild.alt })))
      pruefe('news: keine Mitgliedsanträge', nicht(await api(c, 'GET', '/api/mitgliedsantraege?limit=5')))
    })

    // Seiten
    await mit(['seiten'], async (c) => {
      const s = await api(c, 'POST', '/api/pages?draft=true', { title: 'ZR-Test Seite', slug: 'zr-test-seite', _status: 'draft' })
      pruefe('seiten: Seite anlegen', s.s === 201, s.j)
      if (s.j?.doc?.id) pruefe('seiten: Seite in den Papierkorb legen', (await api(c, 'PATCH', `/api/pages/${s.j.doc.id}?draft=true`, { deletedAt: new Date().toISOString() })).s === 200)
      await d.q(`delete from _pages_v where parent_id in (select id from pages where slug = 'zr-test-seite')`)
      await d.q(`delete from pages where slug = 'zr-test-seite'`)
      pruefe('seiten: „Texte & Bilder“ speichern', (await api(c, 'POST', '/api/globals/texte', {})).s === 200)
      pruefe('seiten: „Animationen“ speichern', (await api(c, 'POST', '/api/globals/animationen', {})).s === 200)
      pruefe('seiten: keine News anlegen', nicht(await api(c, 'POST', '/api/posts', { title: 'ZR-Test', _status: 'draft' })))
    })

    // Termine: Countdown auf der Startseite nur mit Seiten-Recht (wie früher unter „Texte & Bilder“)
    const termin = (c, extra) => api(c, 'POST', '/api/termine', { title: 'ZR-Test Termin', beginn: new Date(Date.now() + 5 * 86400000).toISOString(), bereich: 'verein', ...extra })
    await mit(['termine'], async (c) => {
      const t = await termin(c, { countdown: true, countdownText: 'ZR' })
      pruefe('termine: Termin anlegen', t.s === 201, t.j)
      pruefe('termine: ohne Seiten-Recht kein Countdown auf der Startseite', t.s === 201 && t.j?.doc?.countdown !== true && !t.j?.doc?.countdownText, t.j?.doc)
      if (t.j?.doc?.id) {
        await d.q('update termine set countdown = true where id = $1', [t.j.doc.id])
        const u = await api(c, 'PATCH', `/api/termine/${t.j.doc.id}`, { countdown: false, nurMitglieder: true })
        const [db] = await d.q('select countdown from termine where id = $1', [t.j.doc.id])
        pruefe('termine: Countdown-Haken nicht entfernbar, Termin trotzdem speicherbar', u.s === 200 && db?.countdown === true, u.j)
      }
    })
    await mit(['termine', 'seiten'], async (c) => {
      const t = await termin(c, { countdown: true })
      pruefe('termine + seiten: Countdown setzen', t.s === 201 && t.j?.doc?.countdown === true, t.j)
      const m = await termin(c, { countdown: true, nurMitglieder: true })
      pruefe('termine + seiten: Countdown bei „nur für Mitglieder“ abgelehnt', m.s === 400, m.j)
    })
    await mit([], async (c) => pruefe('Ohne Recht: keinen Termin anlegen', nicht(await termin(c, { countdown: true }))))

    // Medien, Sponsoren, Teams, Verein
    await mit(['medien'], async (c) => pruefe('medien: Bild ändern', (await api(c, 'PATCH', `/api/media/${bild.id}`, { alt: bild.alt })).s === 200))
    await mit(['sponsoren'], async (c) => {
      pruefe('sponsoren: Sponsor ändern', (await api(c, 'PATCH', `/api/sponsoren/${sponsor.id}`, { name: sponsor.name })).s === 200)
      pruefe('sponsoren: Bilder anderer nicht ändern', nicht(await api(c, 'PATCH', `/api/media/${bild.id}`, { alt: bild.alt })))
    })
    await mit(['teams'], async (c) => {
      pruefe('teams: fremdes Team ändern', (await api(c, 'PATCH', `/api/angebote/${team.id}`, { aktiv: team.aktiv })).s === 200)
      pruefe('teams: keine Sponsoren', nicht(await api(c, 'PATCH', `/api/sponsoren/${sponsor.id}`, { name: sponsor.name })))
    })
    await mit(['verein'], async (c) => pruefe('verein: Vereinsdaten speichern', (await api(c, 'POST', '/api/globals/verein', {})).s === 200))

    // Saisonwechsel
    await mit(['saisonwechsel'], async (c) => {
      const r = await api(c, 'POST', '/api/globals/wartung/saison', { aktion: 'pruefen', id: team.id, geprueft: false })
      pruefe('saisonwechsel: Team abhaken', r.s === 200, r.j)
    })

    // Datenschutz
    await mit(['datenschutz'], async (c) => {
      const g = await api(c, 'GET', '/api/globals/datenschutz')
      pruefe('datenschutz: Fristen lesen', g.s === 200 && 'kontaktMonate' in (g.j ?? {}), g.j && Object.keys(g.j))
      pruefe('datenschutz: Fristen speichern', (await api(c, 'POST', '/api/globals/datenschutz', {})).s === 200)
      const [ds] = await d.q('select kontakt_monate from datenschutz')
      const kuerzer = await api(c, 'POST', '/api/globals/datenschutz', { kontaktMonate: 1 })
      const [ds2] = await d.q('select kontakt_monate from datenschutz')
      pruefe('datenschutz: Fristen nicht unter den Standard kürzen', kuerzer.s === 403 && ds2.kontakt_monate === ds.kontakt_monate, { s: kuerzer.s, v: ds2.kontakt_monate })
      const laenger = await api(c, 'POST', '/api/globals/datenschutz', { kontaktMonate: (ds.kontakt_monate ?? 6) + 1 })
      pruefe('datenschutz: Fristen verlängern', laenger.s === 200)
      await d.q('update datenschutz set kontakt_monate = $1', [ds.kontakt_monate])
      pruefe('datenschutz: Auskunft (alle Daten einer Person) bleibt Admins vorbehalten', nicht(await api(c, 'GET', '/api/datenschutz/auskunft?email=kasse%40bsv.test')))
    })

    // Statistik
    await mit(['statistik'], async (c) => {
      pruefe('statistik: lesen', (await api(c, 'GET', '/api/statistik?limit=1')).s === 200)
      pruefe('statistik: nicht löschen', nicht(await api(c, 'DELETE', '/api/statistik?where[id][exists]=true')))
    })

    // Hilfe
    await mit(['hilfe'], async (c) => {
      pruefe('hilfe: Rückmeldungen lesen', (await api(c, 'GET', '/api/hilfe-feedback?limit=1')).s === 200)
      pruefe('hilfe: Hilfe-Texte speichern', (await api(c, 'POST', '/api/globals/hilfe', {})).s === 200)
      const fb = await api(c, 'POST', '/api/hilfe-feedback', { bereich: 'zr-test', hilfreich: true })
      const fbListe = await api(c, 'GET', '/api/hilfe-feedback?where[bereich][equals]=zr-test&depth=2')
      pruefe('hilfe: Rückmeldungen ohne „Von“ (wer sie geschrieben hat, sieht nur der Admin)', fb.s === 201 && (fbListe.j?.docs ?? []).length > 0 && fbListe.j.docs.every((x) => !('benutzer' in x)), fbListe.j?.docs?.[0])
      await d.q(`delete from hilfe_feedback where bereich = 'zr-test'`)
    })

    // Papierkorb: nur wiederherstellen, nur ohne persönliche Daten, nur der normale Papierkorb
    const geloescht = await api(admin, 'POST', '/api/posts', { title: 'ZR-Test Papierkorb', _status: 'draft', content: TEXT })
    const pid = geloescht.j?.doc?.id
    if (pid) neuePosts.push(pid)
    if (pid) await d.q('update posts set deleted_at = now() where id = $1', [pid])
    if (antragId) await d.q('update mitgliedsantraege set deleted_at = now() where id = $1', [antragId])
    await mit(['papierkorb'], async (c) => {
      const l = await api(c, 'GET', '/api/papierkorb/liste')
      const e = l.j?.eintraege ?? []
      pruefe('papierkorb: Liste sehen', l.s === 200 && e.some((x) => x.slug === 'posts' && x.id === pid), l.s)
      pruefe('papierkorb: keine Bereiche mit persönlichen Daten in der Liste', !e.some((x) => PERSONEN.includes(x.slug)), e.map((x) => x.slug))
      pruefe('papierkorb: nichts aus „Nur Web-Admin“', !e.some((x) => x.stufe === 'webadmin'))
      pruefe('papierkorb: Testeintrag vorhanden', Boolean(pid))
      pruefe('papierkorb: endgültig löschen verboten', nicht(await api(c, 'POST', '/api/papierkorb/aktion', { aktion: 'loeschen', eintraege: [{ slug: 'posts', id: pid }] })))
      pruefe('papierkorb: Mitgliedsantrag wiederherstellen verboten', nicht(await api(c, 'POST', '/api/papierkorb/aktion', { aktion: 'wiederherstellen', eintraege: [{ slug: 'mitgliedsantraege', id: antragId }] })))
      const w = await api(c, 'POST', '/api/papierkorb/aktion', { aktion: 'wiederherstellen', eintraege: [{ slug: 'posts', id: pid }] })
      const [nachher] = await d.q('select deleted_at from posts where id = $1', [pid])
      pruefe('papierkorb: News wiederherstellen', w.s === 200 && w.j?.ok === 1 && nachher?.deleted_at === null, w.j)
      await d.q(`update posts set deleted_at = now(), endgueltig_am = now() where id = $1`, [pid])
      const w2 = await api(c, 'POST', '/api/papierkorb/aktion', { aktion: 'wiederherstellen', eintraege: [{ slug: 'posts', id: pid }] })
      const [n2] = await d.q('select endgueltig_am from posts where id = $1', [pid])
      pruefe('papierkorb: Einträge aus „Nur Web-Admin“ nicht wiederherstellen', w2.j?.ok === 0 && n2?.endgueltig_am !== null, w2.j)
      if (bild) {
        await d.q('update media set deleted_at = now() where id = $1', [bild.id])
        const wb = await api(c, 'POST', '/api/papierkorb/aktion', { aktion: 'wiederherstellen', eintraege: [{ slug: 'media', id: bild.id }] })
        await d.q('update media set deleted_at = null where id = $1', [bild.id])
        pruefe('papierkorb: Bilder nur mit Zusatzrecht „medien“ zurückholen (Foto-Einwilligung)', nicht(wb), wb.s)
      }
      // Veröffentlichte News mit offenem Entwurf: bleibt nach dem Zurückholen online, mit dem veröffentlichten Text
      const pub = await api(admin, 'POST', '/api/posts', { title: 'ZR-Test Veröffentlicht', _status: 'published', content: TEXT })
      const pubId = pub.j?.doc?.id
      if (pubId) neuePosts.push(pubId)
      await api(admin, 'PATCH', `/api/posts/${pubId}?draft=true`, { title: 'ZR-Test ENTWURF', _status: 'draft' })
      await d.q('update posts set deleted_at = now() where id = $1', [pubId])
      await d.q(`delete from search where id in (select parent_id from search_rels where posts_id = $1)`, [pubId])
      const wp = await api(c, 'POST', '/api/papierkorb/aktion', { aktion: 'wiederherstellen', eintraege: [{ slug: 'posts', id: pubId }] })
      const oeffentlich = await api(null, 'GET', `/api/posts/${pubId}?depth=0`)
      pruefe('papierkorb: veröffentlichte News bleibt nach dem Zurückholen online (ohne den Entwurf)', wp.j?.ok === 1 && oeffentlich.s === 200 && oeffentlich.j?.title === 'ZR-Test Veröffentlicht', { ok: wp.j, s: oeffentlich.s, t: oeffentlich.j?.title })
      const [suche] = await d.q('select count(*)::int n from search_rels where posts_id = $1', [pubId])
      pruefe('papierkorb: zurückgeholte News ist wieder in der Suche', suche.n === 1, suche)
    })
    if (antragId) await d.q('update mitgliedsantraege set deleted_at = null where id = $1', [antragId])

    // Mitgliedsanträge ohne Bankdaten
    await mit(['antraege'], async (c) => {
      const liste = await api(c, 'GET', '/api/mitgliedsantraege?limit=50')
      const eintrag = (liste.j?.docs ?? []).find((x) => x.id === antragId)
      pruefe('antraege: Anträge sehen', liste.s === 200 && Boolean(eintrag), liste.s)
      const bank = (x) => x && ('iban' in x || 'kontoinhaber' in x || 'sepaMandat' in x)
      pruefe('antraege: keine IBAN, kein Kontoinhaber in der Liste', !bank(eintrag), eintrag && Object.keys(eintrag))
      const einzeln = await api(c, 'GET', `/api/mitgliedsantraege/${antragId}`)
      pruefe('antraege: keine Bankdaten im einzelnen Antrag', einzeln.s === 200 && !bank(einzeln.j), einzeln.j && Object.keys(einzeln.j))
      const auswahl = await api(c, 'GET', `/api/mitgliedsantraege/${antragId}?select[iban]=true&select[kontoinhaber]=true`)
      pruefe('antraege: auch mit select keine Bankdaten', !bank(auswahl.j), auswahl.j)
      const suche = await api(c, 'GET', `/api/mitgliedsantraege?where[kontoinhaber][like]=Geheim`)
      const sucheFalsch = await api(c, 'GET', `/api/mitgliedsantraege?where[kontoinhaber][like]=GibtEsNicht`)
      pruefe('antraege: Kontoinhaber lässt sich nicht erraten (Suche filtert nicht danach)', suche.s >= 400 || (suche.j?.totalDocs ?? 0) === (sucheFalsch.j?.totalDocs ?? 0), { a: suche.s, b: suche.j?.totalDocs, c: sucheFalsch.j?.totalDocs })
      const [vorher] = await d.q('select iban, kontoinhaber from mitgliedsantraege where id = $1', [antragId])
      await api(c, 'PATCH', `/api/mitgliedsantraege/${antragId}`, { iban: 'DE02120300000000202051', kontoinhaber: 'Hacker', sepaMandat: false })
      const [nachher] = await d.q('select iban, kontoinhaber, sepa_mandat from mitgliedsantraege where id = $1', [antragId])
      // Die IBAN wird beim Speichern neu verschlüsselt – deshalb über die Kasse im Klartext vergleichen
      const alsKasse = await api(await login('kasse@bsv.test'), 'GET', `/api/mitgliedsantraege/${antragId}`)
      pruefe('antraege: Bankdaten nicht änderbar', alsKasse.j?.iban === 'DE89370400440532013000' && nachher.kontoinhaber === vorher.kontoinhaber && nachher.sepa_mandat === true, { iban: alsKasse.j?.iban, k: nachher.kontoinhaber })
      const e = await api(c, 'POST', `/api/mitgliedsantraege/${antragId}/entscheidung`, { status: 'rueckfrage' })
      pruefe('antraege: Status setzen (Rückfrage)', e.s === 200, e.j)
      pruefe('antraege: nicht löschen', nicht(await api(c, 'DELETE', `/api/mitgliedsantraege/${antragId}`)))
      pruefe('antraege: kein Export für die Kasse', nicht(await api(c, 'POST', '/api/mitgliedsantraege/export', {})))
      pruefe('antraege: E-Mail-Vorlagen nur lesen', (await api(c, 'GET', '/api/globals/mailVorlagen')).s === 200 && nicht(await api(c, 'POST', '/api/globals/mailVorlagen', {})))
    })

    // Alle Zusatzrechte zusammen: keine Rechteausweitung
    await mit(ALLE, async (c) => {
      await api(c, 'PATCH', `/api/users/${konto.id}`, { roles: ['admin'], zusatzrechte: { registrierungen: true } })
      const [r] = await d.q(`select array_agg(value) rollen from users_roles where parent_id = $1`, [konto.id])
      const [z] = await d.q('select zusatzrechte_registrierungen from users where id = $1', [konto.id])
      pruefe('Alle Zusatzrechte: eigene Rolle/Zusatzrechte nicht änderbar', !r.rollen.includes('admin') && z.zusatzrechte_registrierungen !== true, r.rollen)
      const andere = await api(c, 'GET', '/api/users?limit=5')
      pruefe('Alle Zusatzrechte: keine anderen Benutzer sehen', (andere.j?.docs ?? []).every((u) => u.id === konto.id), andere.j?.docs?.length)
      pruefe('Alle Zusatzrechte: keine Datensicherung', nicht(await api(c, 'GET', '/api/sicherung')))
      const [mitBank] = await d.q('select 1 from mitgliedsantraege where id = $1', [antragId])
      const a = await api(c, 'GET', `/api/mitgliedsantraege/${antragId}`)
      pruefe('Alle Zusatzrechte: weiterhin keine Bankdaten', Boolean(mitBank) && a.s === 200 && !('iban' in (a.j ?? {})))
    })
  } finally {
    await setzen([])
    if (neuePosts.length) {
      await d.q(`delete from search where id in (select parent_id from search_rels where posts_id = any($1))`, [neuePosts]).catch(() => {})
      // Versionen zuerst (sonst bleiben sie verwaist zurück und tauchen unter „Letzte Aktivitäten“ auf)
      await d.q(`delete from _posts_v where parent_id = any($1)`, [neuePosts])
      await d.q(`delete from posts where id = any($1)`, [neuePosts])
    }
    await d.q(`delete from mitgliedsantraege where email = 'sicherheitstest-zr@bsv.test'`)
    await d.q(`delete from termine where title = 'ZR-Test Termin'`)
    await d.q(`delete from _pages_v where parent_id in (select id from pages where slug = 'zr-test-seite')`)
      await d.q(`delete from pages where slug = 'zr-test-seite'`)
  }
}
