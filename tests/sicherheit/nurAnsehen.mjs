import sharp from 'sharp'

import { api, B, login, mitWebAdmin, pruefe } from './lib.mjs'

const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const LESER = 'lesen@bsv.test'

/** Bereiche, die „Nur ansehen“ genauso vollständig lesen soll wie ein Admin */
const LESBAR = [
  'posts', 'pages', 'termine', 'angebote', 'media', 'sponsoren', 'alben', 'gesuche', 'ausfaelle', 'categories', 'dokumente',
  'forms', 'form-submissions', 'redirects', 'kontaktanfragen', 'probetraining', 'passantraege', 'mitgliedsantraege',
  'mitgliedschaften', 'users', 'profilbilder', 'hilfe-feedback',
]
const GLOBALS = ['header', 'footer', 'menue', 'texte', 'startseite', 'verein', 'datenschutz', 'mailVorlagen', 'hilfe', 'rollenRechte', 'wartung']
/** Upload-Bereiche: Anlegen nur mit Datei (sonst scheitert es schon vorher an der fehlenden Datei) */
const UPLOADS = new Set(['media', 'dokumente', 'profilbilder', 'passdokumente'])
/** Schreiben muss überall scheitern (hilfe-feedback ist die einzige Ausnahme fürs Anlegen) */
const SCHREIBEN = LESBAR.filter((s) => s !== 'hilfe-feedback').concat('passdokumente', 'search')
const GEHEIM = ['zweiFaktorGeheimnis', 'zweiFaktorCodes', 'zweiFaktorSitzungen', 'zweiFaktorFehler', 'bestaetigungHash', 'googleId', 'hash', 'salt']

const verboten = (r) => r.s === 401 || r.s === 403

/**
 * Rolle „Nur ansehen“: alles lesen, nichts ändern – Haken unter Rollen-Rechte schalten Bereiche ab,
 * Pass-Unterlagen, Papierkorb, Sicherung, Sicherheit und Exporte bleiben immer zu.
 */
export default async function nurAnsehen(d) {
  // Testkonten (inkl. lesen@bsv.test) auf den aktuellen Stand bringen – danach neu anmelden (Sitzungen werden dabei ungültig)
  await api(await login('admin@bsv.test'), 'POST', '/api/users/testkonten', {})
  const admin = await login('admin@bsv.test')
  // Alle Haken für „Nur ansehen“ auf den Standard (an) – unabhängig von früheren Läufen
  const ALLE_AN = { posteingang: true, passantraege: true, mitgliedsantraege: true, bankdaten: true, mitgliedschaften: true, benutzer: true, statistik: true }
  await mitWebAdmin(d, 'admin@bsv.test', async () => api(await login('admin@bsv.test'), 'POST', '/api/globals/rollenRechte', { lesen: ALLE_AN }))
  const bild = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#1b7a43' } }).png().toBuffer()
  const hochladen = async (cookie, slug) => {
    const fd = new FormData()
    fd.append('file', new Blob([bild], { type: 'image/png' }), 'sicherheitstest-lesen.png')
    fd.append('_payload', JSON.stringify({ alt: 'x', titel: 'x' }))
    const r = await fetch(`${B}/api/${slug}`, { method: 'POST', headers: { Cookie: cookie }, body: fd })
    return { s: r.status, j: await r.json().catch(() => null) }
  }
  const [konto] = await d.q('select id from users where email=$1 and testkonto = true', [LESER])
  if (!konto) return pruefe('Testkonto lesen@bsv.test vorhanden', false)
  const leser = await login(LESER)

  const antrag = await api(null, 'POST', '/api/mitgliedsantraege', { vorname: 'Sicherheitstest', nachname: 'NurAnsehen', geburtsdatum: '1990-05-05', email: 'sicherheitstest-lesen@bsv.test', strasse: 'Teststraße 1', plz: '41470', ort: 'Neuss', mitgliedsart: 'passiv', kontoinhaber: 'Geheim Kontoinhaber', iban: 'DE89370400440532013000', sepaMandat: true, satzungAkzeptiert: true }, ip())
  const antragId = antrag.j?.doc?.id
  const [geloescht] = await d.q(`insert into posts (title, slug, _status, deleted_at, updated_at, created_at) values ('Sicherheitstest gelöscht', 'sicherheitstest-geloescht-' || floor(random()*1e9)::text, 'draft', now(), now(), now()) returning id`)
  try {
    pruefe('Testantrag angelegt', Boolean(antragId), antrag.j)

    // --- Lesen: genauso viel wie ein Admin ---
    for (const s of LESBAR) {
      const [a, l] = await Promise.all([api(admin, 'GET', `/api/${s}?limit=1&depth=0&draft=true`), api(leser, 'GET', `/api/${s}?limit=1&depth=0&draft=true`)])
      pruefe(`liest ${s} vollständig (${l.j?.totalDocs ?? l.s} = ${a.j?.totalDocs ?? a.s})`, l.s === 200 && a.s === 200 && l.j?.totalDocs === a.j?.totalDocs, { a: a.s, l: l.s })
    }
    for (const g of GLOBALS) {
      const r = await api(leser, 'GET', `/api/globals/${g}?depth=0`)
      pruefe(`liest Einstellung ${g}`, r.s === 200, r.s)
    }
    const v = await api(leser, 'GET', '/api/posts/versions?limit=1&depth=0')
    pruefe('liest Versionen (News)', v.s === 200 && v.j?.totalDocs > 0, v.s)
    const a = await api(leser, 'GET', `/api/mitgliedsantraege/${antragId}?depth=0`)
    pruefe('liest IBAN im Klartext (Haken „Bankdaten“ an)', a.j?.iban === 'DE89370400440532013000' && a.j?.kontoinhaber === 'Geheim Kontoinhaber', a.j?.iban)
    const nutzer = await api(leser, 'GET', '/api/users?limit=200&depth=0')
    const offen = (nutzer.j?.docs ?? []).flatMap((u) => GEHEIM.filter((k) => k in u))
    pruefe('Benutzer ohne Geheimnisse (2FA, Bestätigungs-Code, Passwort-Hash)', nutzer.s === 200 && offen.length === 0, offen)
    const pr = await api(leser, 'GET', `/api/mitgliedsantraege/${antragId}/pruefung`)
    pruefe('Prüfhilfe zum Antrag lesbar', pr.s === 200, pr.s)
    const fl = await api(leser, 'GET', '/api/datenschutz/faellig')
    pruefe('Datenschutz-Fristen: Fälliges lesbar', fl.s === 200 && Array.isArray(fl.j?.faellig), fl.s)

    // --- Nie sichtbar ---
    const pd = await api(leser, 'GET', '/api/passdokumente?limit=1')
    pruefe('Pass-Unterlagen: kein Zugriff', verboten(pd) || pd.j?.totalDocs === 0, pd.s)
    const tr = await api(leser, 'GET', `/api/posts/${geloescht.id}?trash=true&depth=0`)
    const trl = await api(leser, 'GET', `/api/posts?trash=true&where[id][equals]=${geloescht.id}&depth=0`)
    pruefe('Papierkorb: gelöschte News nicht lesbar', tr.s === 404 || verboten(tr), tr.s)
    pruefe('Papierkorb: gelöschte News nicht in der Liste', trl.j?.totalDocs === 0, trl.j?.totalDocs)
    for (const [m, p] of [['GET', '/api/sicherung'], ['GET', '/api/papierkorb/liste'], ['GET', '/api/mitgliedsantraege/export'], ['POST', '/api/datenschutz/auskunft'], ['GET', '/api/users/rechte-vorschau']]) {
      const r = await api(leser, m, p, m === 'POST' ? { email: 'mitglied@bsv.test' } : undefined)
      pruefe(`${m} ${p}: kein Zugriff`, verboten(r) || r.s === 404 || r.s === 405, r.s)
    }

    // --- Schreiben: überall abgelehnt ---
    const ids = {}
    for (const s of SCHREIBEN) {
      const [e] = await d.q(`select id from ${s.replace(/-/g, '_')} order by id limit 1`).catch(() => [])
      ids[s] = e?.id
      const c = UPLOADS.has(s) ? await hochladen(leser, s) : await api(leser, 'POST', `/api/${s}`, { title: 'x', name: 'x' })
      pruefe(`${s}: anlegen verboten`, verboten(c), c.s)
      if (!e) continue
      const u = await api(leser, 'PATCH', `/api/${s}/${e.id}`, { title: 'geändert', name: 'geändert' })
      pruefe(`${s}: ändern verboten`, verboten(u) || u.s === 404, u.s)
      const del = await api(leser, 'DELETE', `/api/${s}/${e.id}`)
      pruefe(`${s}: löschen verboten`, verboten(del) || del.s === 404, del.s)
      const massen = await api(leser, 'PATCH', `/api/${s}?where[id][equals]=${e.id}`, { title: 'geändert' })
      pruefe(`${s}: Massen-Änderung ohne Wirkung`, verboten(massen) || (massen.j?.docs ?? []).length === 0, massen.s)
    }
    for (const g of GLOBALS.concat('sicherheit')) {
      const r = await api(leser, 'POST', `/api/globals/${g}`, {})
      pruefe(`Einstellung ${g}: speichern verboten`, verboten(r), r.s)
    }
    const aktionen = [
      ['POST', `/api/kontaktanfragen/${ids.kontaktanfragen}/notiz`, { text: 'x' }],
      ['POST', `/api/mitgliedsantraege/${antragId}/zustaendig`, { uebernehmen: true }],
      ['POST', `/api/mitgliedsantraege/${antragId}/entscheidung`, { entscheidung: 'abgelehnt', mail: false }],
      ['POST', '/api/users/freigabe', { id: 1, aktion: 'ablehnen' }],
      ['POST', `/api/angebote/${ids.angebote}/bestaetigen`, {}],
      ['POST', '/api/angebote/reihenfolge', { ids: [ids.angebote] }],
      ['POST', '/api/globals/menue/ergaenzen', { label: 'x', adresse: '/x', wo: 'fusszeile' }],
      ['POST', '/api/media/auto-zuordnen?ausfuehren=1', {}],
      ['POST', `/api/posts/${ids.posts}/startseite`, { aufStartseite: true }],
      ['POST', '/api/globals/wartung/saison', {}],
      ['POST', '/api/datenschutz/aufraeumen', {}],
      ['POST', '/api/sicherung', {}],
      ['POST', '/api/papierkorb/aktion', { aktion: 'leeren' }],
      ['POST', '/api/users/testkonten', {}],
    ]
    for (const [m, p, body] of aktionen) {
      const r = await api(leser, m, p, body, { Origin: B })
      pruefe(`${m} ${p.replace(/\/\d+\//, '/<id>/')}: abgelehnt`, verboten(r) || r.s === 400 || r.s === 404, r.s)
    }
    // Versionen zurückholen, Duplizieren, Bearbeitungssperren (würden andere blockieren)
    const [ver] = await d.q('select id, parent_id from _posts_v where parent_id is not null order by id limit 1')
    if (ver) {
      const wh = await api(leser, 'POST', `/api/posts/versions/${ver.id}`, {})
      pruefe('Version zurückholen verboten', verboten(wh), wh.s)
      const du = await api(leser, 'POST', `/api/posts/${ver.parent_id}/duplicate`, {})
      pruefe('Duplizieren verboten', verboten(du), du.s)
      const sp = await api(leser, 'POST', '/api/payload-locked-documents', { document: { relationTo: 'posts', value: ver.parent_id } })
      pruefe('Bearbeitungssperre anlegen verboten', verboten(sp), sp.s)
      if (sp.j?.doc?.id) await d.q('delete from payload_locked_documents where id=$1', [sp.j.doc.id])
    }
    const [antragNachher] = await d.q('select status, zustaendig_id from mitgliedsantraege where id=$1', [antragId])
    pruefe('Antrag unverändert (Status, Zuständig)', antragNachher?.status === 'neu' && antragNachher?.zustaendig_id === null, antragNachher)

    // --- Eigenes Konto: Name ja, Rollen nein, fremde Konten nein ---
    const n = await api(leser, 'PATCH', `/api/users/${konto.id}`, { name: 'Test Nur ansehen' })
    pruefe('eigenen Namen ändern erlaubt', n.s === 200, n.s)
    await api(leser, 'PATCH', `/api/users/${konto.id}`, { roles: ['admin', 'lesen'] })
    const rollen = (await d.q('select value from users_roles where parent_id=$1', [konto.id])).map((r) => r.value)
    pruefe('eigene Rollen nicht erweiterbar', rollen.length === 1 && rollen[0] === 'lesen', rollen)
    const [fremd] = await d.q(`select id from users where email='mitglied@bsv.test'`)
    const f = await api(leser, 'PATCH', `/api/users/${fremd.id}`, { name: 'gekapert' })
    pruefe('fremdes Konto ändern verboten', verboten(f) || f.s === 404, f.s)

    // --- Rückmeldung in der Hilfe bleibt möglich ---
    const fb = await api(leser, 'POST', '/api/hilfe-feedback', { bereich: 'dashboard', hilfreich: true })
    pruefe('„Hat dir das geholfen?“ erlaubt', fb.s === 201, fb.s)
    if (fb.j?.doc?.id) await d.q('delete from hilfe_feedback where id=$1', [fb.j.doc.id])

    // --- Haken entfernen: Bereiche verschwinden ---
    await mitWebAdmin(d, 'admin@bsv.test', async () => {
      const webadmin = await login('admin@bsv.test')
      const aus = await api(webadmin, 'POST', '/api/globals/rollenRechte', { lesen: { bankdaten: false, benutzer: false, posteingang: false, mitgliedsantraege: true } })
      pruefe('Web-Admin entfernt Haken', aus.s === 200, aus.s)
    })
    try {
      const a2 = await api(leser, 'GET', `/api/mitgliedsantraege/${antragId}?depth=0`)
      pruefe('ohne Haken „Bankdaten“: keine IBAN, Antrag aber lesbar', a2.s === 200 && a2.j?.iban === undefined && a2.j?.kontoinhaber === undefined, { s: a2.s, iban: a2.j?.iban })
      const u2 = await api(leser, 'GET', '/api/users?limit=200&depth=0')
      pruefe('ohne Haken „Benutzer“: nur das eigene Konto', u2.j?.docs?.length === 1 && u2.j.docs[0].id === konto.id, u2.j?.docs?.length)
      const k2 = await api(leser, 'GET', '/api/kontaktanfragen?limit=1')
      pruefe('ohne Haken „Posteingang“: keine Kontaktanfragen', verboten(k2), k2.s)
      const p2 = await api(leser, 'GET', '/api/posteingang')
      pruefe('Seitenleiste blendet Registrierungen und Rollen aus', (p2.j?._aus ?? []).includes('registrierungen') && (p2.j?._aus ?? []).includes('rollen'), p2.j?._aus)
      const t2 = await api(leser, 'GET', `/api/angebote/${ids.angebote}/teilnehmende`)
      pruefe('ohne Haken „Benutzer“: keine Teilnehmenden-Liste', verboten(t2), t2.s)
    } finally {
      await mitWebAdmin(d, 'admin@bsv.test', async () => {
        const webadmin = await login('admin@bsv.test')
        await api(webadmin, 'POST', '/api/globals/rollenRechte', { lesen: ALLE_AN })
      })
    }

    // --- Mit einer weiteren Rolle (z. B. Redaktion) darf die Person dort wieder arbeiten ---
    await d.q(`insert into users_roles ("order", parent_id, value) values (2, $1, 'redaktion')`, [konto.id])
    try {
      const c = await login(LESER)
      const p = await api(c, 'POST', '/api/posts?draft=true', { title: 'Sicherheitstest Leser+Redaktion', _status: 'draft' })
      pruefe('Nur ansehen + Redaktion: News-Entwurf anlegen erlaubt', p.s === 201, p.s)
      if (p.j?.doc?.id) {
        await d.q('delete from _posts_v where parent_id=$1', [p.j.doc.id])
        await d.q('delete from posts where id=$1', [p.j.doc.id])
      }
    } finally {
      await d.q(`delete from users_roles where parent_id=$1 and value='redaktion'`, [konto.id])
    }
  } finally {
    if (antragId) await d.q('delete from mitgliedsantraege where id=$1', [antragId])
    for (const t of UPLOADS) await d.q(`delete from ${t} where filename like 'sicherheitstest-lesen%'`).catch(() => {})
    await d.q('delete from _posts_v where parent_id=$1', [geloescht.id])
    await d.q('delete from posts where id=$1', [geloescht.id])
  }
}
