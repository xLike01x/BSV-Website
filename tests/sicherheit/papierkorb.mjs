import { api, login, mitWebAdmin, pruefe } from './lib.mjs'

/** F-01, F-02, F-10: zweistufiger Papierkorb */
export default async function papierkorb(d) {
  const tr = await login('trainer-yoga@bsv.test')
  const ad = await login('admin@bsv.test')
  const [team] = await d.q(`select a.id from angebote a join angebote_rels r on r.parent_id=a.id join users u on u.id=r.users_id where u.email='trainer-yoga@bsv.test' and r.path='leitung' limit 1`)
  const neu = async (h) => (await api(tr, 'POST', '/api/ausfaelle', { angebot: team.id, datum: '2099-01-15', grund: 'Sonstiges', benachrichtigen: false, hinweis: 'SICHERHEITSTEST-' + h })).j.doc.id
  const stand = async (id) => (await d.q('select deleted_at is not null pk, endgueltig_am is not null s2 from ausfaelle where id=$1', [id]))[0] ?? 'weg'
  const weg = async (id) => api(tr, 'PATCH', `/api/ausfaelle/${id}`, { deletedAt: new Date().toISOString() })
  try {
    const X = await neu('X'), Y = await neu('Y'), Z = await neu('Z')
    let r = await api(tr, 'DELETE', `/api/ausfaelle/${X}`)
    pruefe('Trainer: endgültig löschen eines nicht gelöschten Eintrags → 403', r.s === 403, r)
    pruefe('… und dabei wird nichts verschoben', !(await stand(X)).s2 && !(await stand(Y)).s2 && !(await stand(Z)).s2)
    await weg(X)
    r = await api(tr, 'DELETE', `/api/ausfaelle/${X}?trash=true`)
    pruefe('Trainer: endgültig löschen aus dem Papierkorb → 200', r.s === 200, r)
    pruefe('… nur dieser Eintrag liegt im Web-Admin-Papierkorb', (await stand(X)).s2 === true && !(await stand(Y)).s2 && !(await stand(Z)).s2)
    pruefe('… und ist nicht wirklich gelöscht', (await stand(X)) !== 'weg')
    pruefe('Trainer sieht Web-Admin-Papierkorb nicht', (await api(tr, 'GET', `/api/ausfaelle/${X}?trash=true`)).s === 404)
    r = await api(tr, 'PATCH', `/api/ausfaelle/${X}?trash=true`, { deletedAt: null })
    pruefe('Trainer kann aus dem Web-Admin-Papierkorb nicht wiederherstellen', r.s >= 400 && (await stand(X)).s2 === true, r)
    await api(tr, 'PATCH', `/api/ausfaelle/${Y}`, { endgueltigAm: '2000-01-01T00:00:00.000Z', endgueltigVon: 'Fälschung' })
    pruefe('Trainer kann Papierkorb-Markierung nicht selbst setzen', !(await stand(Y)).s2)
    await weg(Z)
    pruefe('Anonym: gelöschte Einträge nicht per ?trash=true lesbar', (await api(null, 'GET', `/api/ausfaelle/${Z}?trash=true`)).s === 404)
    pruefe('Anonym: auch nicht über die Liste', (await api(null, 'GET', `/api/ausfaelle?trash=true&where[id][equals]=${Z}`)).j?.docs?.length === 0)
    pruefe('Trainer sieht den eigenen Papierkorb', (await api(tr, 'GET', `/api/ausfaelle?trash=true&where[id][equals]=${Z}`)).j?.docs?.length === 1)
    await api(tr, 'DELETE', `/api/ausfaelle?trash=true&where[id][in]=${Z},${Y}`)
    pruefe('Mehrfach-Löschen: nur Einträge aus dem Papierkorb wandern weiter', (await stand(Z)).s2 === true && !(await stand(Y)).s2)
    r = await api(ad, 'DELETE', `/api/ausfaelle/${Y}`)
    pruefe('Admin: endgültig löschen → Web-Admin-Papierkorb', r.s === 200 && (await stand(Y)).s2 === true, r)
    await mitWebAdmin(d, 'admin@bsv.test', async () => {
      const wa = await login('admin@bsv.test')
      r = await api(wa, 'DELETE', `/api/ausfaelle/${X}?trash=true`)
      pruefe('Web-Admin: löscht wirklich', r.s === 200 && (await stand(X)) === 'weg', r)
      pruefe('Web-Admin: Mehrfach-Löschen ohne Filter wird abgelehnt', (await api(wa, 'DELETE', '/api/ausfaelle')).s === 400)
    })
    r = await api(null, 'POST', '/api/kontaktanfragen', { name: 'Sicherheitstest', email: 'sicherheitstest@bsv.test', betreff: 'x', nachricht: 'Regressionstest Papierkorb', datenschutz: true, endgueltigAm: '2000-01-01T00:00:00.000Z', endgueltigVon: 'Fälschung', deletedAt: '2000-01-01T00:00:00.000Z' }, { 'X-Real-IP': '198.51.100.' + Math.floor(Math.random() * 250) })
    const [k] = await d.q(`select deleted_at, endgueltig_am, endgueltig_von from kontaktanfragen where email='sicherheitstest@bsv.test'`)
    pruefe('Anonymes Formular: Papierkorb-Felder werden ignoriert', r.s === 201 && !k?.deleted_at && !k?.endgueltig_am && !k?.endgueltig_von, [r.s, k])
  } finally {
    await d.q(`delete from ausfaelle where hinweis like 'SICHERHEITSTEST-%'`)
    await d.q(`delete from kontaktanfragen where email='sicherheitstest@bsv.test'`)
  }
}
