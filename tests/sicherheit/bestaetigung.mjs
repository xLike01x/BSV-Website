import crypto from 'node:crypto'

import { api, B, login, pruefe } from './lib.mjs'

/** „Passt noch?“: Bestätigen per Knopf (nur wer das Team bearbeiten darf) und per Link aus der E-Mail (signiert, befristet, nur per Klick) */
const schluessel = () => Buffer.from(crypto.hkdfSync('sha256', process.env.ENCRYPTION_KEY, 'bsv-1919', 'bsv:bestaetigung', 32))
const token = (team, konto, ablaufMs = Date.now() + 86400000) => {
  const teil = `${team.toString(36)}.${konto.toString(36)}.${Math.floor(ablaufMs / 1000).toString(36)}`
  return `${teil}.${crypto.createHmac('sha256', schluessel()).update(`team-bestaetigen:${teil}`).digest('base64url').slice(0, 32)}`
}

export default async function bestaetigung(d) {
  const [eigen] = await d.q(`select r.parent_id id from angebote_rels r join users u on u.id = r.users_id where u.email = 'trainer-f1-jugend@bsv.test' and r.path = 'leitung' limit 1`)
  const [trainer] = await d.q(`select id from users where email = 'trainer-f1-jugend@bsv.test'`)
  const [fremd] = await d.q(`select a.id from angebote a where a.id <> $1 and not exists (select 1 from angebote_rels r where r.parent_id = a.id and r.path = 'leitung' and r.users_id = $2) order by a.id limit 1`, [eigen.id, trainer.id])
  const vorher = await d.q('select id, bestaetigt_am, bestaetigt_von from angebote where id in ($1, $2)', [eigen.id, fremd.id])
  const stand = async (id) => (await d.q('select bestaetigt_am, bestaetigt_von, updated_at from angebote where id = $1', [id]))[0]
  const zuruecksetzen = () => d.q(`update angebote set bestaetigt_am = '2020-01-01', bestaetigt_von = 'Test' where id in ($1, $2)`, [eigen.id, fremd.id])
  const tr = await login('trainer-f1-jugend@bsv.test')
  const kasse = await login('kasse@bsv.test')
  try {
    // Knopf in der Verwaltung / im Mitgliederbereich
    await zuruecksetzen()
    pruefe('Ohne Anmeldung: bestätigen → 401', (await api(null, 'POST', `/api/angebote/${eigen.id}/bestaetigen`, {})).s === 401)
    pruefe('Kasse (darf Teams nicht bearbeiten) → 403', (await api(kasse, 'POST', `/api/angebote/${eigen.id}/bestaetigen`, {})).s === 403)
    pruefe('Trainer: fremdes Team → 403', (await api(tr, 'POST', `/api/angebote/${fremd.id}/bestaetigen`, {})).s === 403)
    const ohneJson = await fetch(`${B}/api/angebote/${eigen.id}/bestaetigen`, { method: 'POST', headers: { Cookie: tr, 'Content-Type': 'text/plain' }, body: '{}' })
    pruefe('Ohne JSON (Formular von fremder Seite) → 415', ohneJson.status === 415)
    const fastJson = await fetch(`${B}/api/angebote/${eigen.id}/bestaetigen`, { method: 'POST', headers: { Cookie: tr, 'Content-Type': 'text/plain; x=application/json' }, body: '{}' })
    pruefe('„application/json“ nur als Zusatz im Content-Type → 415', fastJson.status === 415)
    pruefe('Unsinnige ID → 400', (await api(tr, 'POST', '/api/angebote/abc/bestaetigen', {})).s === 400)
    const geaendertVorher = (await stand(eigen.id)).updated_at
    const ok = await api(tr, 'POST', `/api/angebote/${eigen.id}/bestaetigen`, {})
    const s1 = await stand(eigen.id)
    pruefe('Trainer: eigenes Team bestätigen', ok.s === 200 && new Date(s1.bestaetigt_am) > new Date('2025-01-01'), ok.j)
    pruefe('„Zuletzt geändert“ bleibt unverändert', String(s1.updated_at) === String(geaendertVorher))
    pruefe('Fremdes Team blieb unberührt', new Date((await stand(fremd.id)).bestaetigt_am) < new Date('2021-01-01'))
    pruefe('„Bestätigt von“ enthält keine E-Mail-Adresse', s1.bestaetigt_von && !s1.bestaetigt_von.includes('@'), s1.bestaetigt_von)
    const nochmal = await api(tr, 'POST', `/api/angebote/${eigen.id}/bestaetigen`, {})
    const s1b = await stand(eigen.id)
    pruefe('Doppelklick innerhalb 10 Minuten: kein erneutes Schreiben', nochmal.s === 200 && String(s1b.bestaetigt_am) === String(s1.bestaetigt_am) && nochmal.j?.von === s1.bestaetigt_von, nochmal.j)
    const mitglied = await login('mitglied@bsv.test')
    const alsMitglied = await api(mitglied, 'GET', `/api/angebote/${eigen.id}?depth=0`)
    pruefe('Mitglied (ohne Team-Rechte): sieht „bestätigt von“ nicht', alsMitglied.s === 200 && !('bestaetigtVon' in (alsMitglied.j ?? {})), Object.keys(alsMitglied.j ?? {}))
    const alsTrainer = await api(tr, 'GET', `/api/angebote/${eigen.id}?depth=0`)
    pruefe('Trainer sieht „bestätigt von“', alsTrainer.s === 200 && 'bestaetigtVon' in (alsTrainer.j ?? {}))

    // Direkt über die Schnittstelle setzen geht nicht
    await zuruecksetzen()
    await api(tr, 'PATCH', `/api/angebote/${eigen.id}`, { bestaetigtAm: new Date().toISOString(), bestaetigtVon: 'Hacker', erinnertAm: new Date().toISOString() })
    const s2 = await stand(eigen.id)
    pruefe('Felder lassen sich nicht direkt setzen', new Date(s2.bestaetigt_am) < new Date('2021-01-01') && s2.bestaetigt_von === 'Test', s2)
    const anonym = await api(null, 'GET', `/api/angebote/${eigen.id}?depth=0`)
    pruefe('Öffentlich: kein „bestätigt von“ und kein Erinnerungsdatum', anonym.s === 200 && !('bestaetigtVon' in (anonym.j ?? {})) && !('erinnertAm' in (anonym.j ?? {})), Object.keys(anonym.j ?? {}))

    // Link aus der E-Mail
    await zuruecksetzen()
    const t = token(eigen.id, trainer.id)
    const seite = await fetch(`${B}/team-bestaetigen?t=${encodeURIComponent(t)}`)
    const html = await seite.text()
    pruefe('Link öffnet die Seite mit Knopf …', seite.status === 200 && html.includes('Ja, passt noch'))
    pruefe('… und bestätigt beim bloßen Öffnen noch nichts (E-Mail-Programme öffnen Links vorab)', new Date((await stand(eigen.id)).bestaetigt_am) < new Date('2021-01-01'))
    pruefe('Seite ist für Suchmaschinen gesperrt', /noindex/.test(html))
    const ungueltig = await fetch(`${B}/team-bestaetigen?t=${encodeURIComponent(t.slice(0, -2) + 'xx')}`)
    pruefe('Veränderter Link: Seite meldet „gilt nicht“', (await ungueltig.text()).includes('Der Link gilt nicht'))
    pruefe('Link ohne JSON → 415', (await fetch(`${B}/api/angebote/bestaetigen-link`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ t }) })).status === 415)
    pruefe('Veränderte Signatur → 400', (await api(null, 'POST', '/api/angebote/bestaetigen-link', { t: t.slice(0, -2) + 'xx' })).s === 400)
    pruefe('Fremdes Team in den Link geschrieben → 400', (await api(null, 'POST', '/api/angebote/bestaetigen-link', { t: `${fremd.id.toString(36)}${t.slice(t.indexOf('.'))}` })).s === 400)
    pruefe('Abgelaufener Link → 410', (await api(null, 'POST', '/api/angebote/bestaetigen-link', { t: token(eigen.id, trainer.id, Date.now() - 1000) })).s === 410)
    const nichtMehr = await api(null, 'POST', '/api/angebote/bestaetigen-link', { t: token(fremd.id, trainer.id) })
    pruefe('Gültig signiert, aber Team nicht (mehr) betreut → 400 „nicht-mehr“', nichtMehr.s === 400 && nichtMehr.j?.fehler === 'nicht-mehr', nichtMehr.j)
    pruefe('Kein Text als Link → 400', (await api(null, 'POST', '/api/angebote/bestaetigen-link', { t: { a: 1 } })).s === 400)
    pruefe('Fremdes Team weiterhin unberührt', new Date((await stand(fremd.id)).bestaetigt_am) < new Date('2021-01-01'))
    const klick = await api(null, 'POST', '/api/angebote/bestaetigen-link', { t })
    const s3 = await stand(eigen.id)
    pruefe('Klick auf „Ja, passt noch“ bestätigt (mit Name der Person)', klick.s === 200 && new Date(s3.bestaetigt_am) > new Date('2025-01-01') && s3.bestaetigt_von && s3.bestaetigt_von !== 'Test', { j: klick.j, s3 })

    // Zeiten ändern gilt als bestätigt
    await zuruecksetzen()
    const [{ zeiten }] = await d.q(`select coalesce(json_agg(json_build_object('tag', tag, 'von', von, 'bis', bis, 'ort', ort, 'hinweis', hinweis) order by _order), '[]'::json) zeiten from angebote_zeiten where _parent_id = $1`, [eigen.id])
    const neu = [...zeiten, { tag: 'Sonntag', von: '09:00', bis: '10:00', ort: 'Sicherheitstest' }]
    const p = await api(tr, 'PATCH', `/api/angebote/${eigen.id}`, { zeiten: neu })
    pruefe('Trainingszeiten geändert → gilt als bestätigt', p.s === 200 && new Date((await stand(eigen.id)).bestaetigt_am) > new Date('2025-01-01'), p.j?.errors)
    await api(tr, 'PATCH', `/api/angebote/${eigen.id}`, { zeiten })
    await zuruecksetzen()
    await api(tr, 'PATCH', `/api/angebote/${eigen.id}`, { bannerText: '' })
    pruefe('Andere Änderung (ohne Zeiten) bestätigt nicht automatisch', new Date((await stand(eigen.id)).bestaetigt_am) < new Date('2021-01-01'))
  } finally {
    for (const v of vorher) await d.q('update angebote set bestaetigt_am = $2, bestaetigt_von = $3 where id = $1', [v.id, v.bestaetigt_am, v.bestaetigt_von])
  }
}
