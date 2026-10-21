import { api, login, mitWebAdmin, pruefe } from './lib.mjs'

/** F-21, F-25, I-03: einzelne Rechte-Lücken */
export default async function rechte(d) {
  // F-21: Trainer hängt Passantrag nicht an ein fremdes Team
  const tr = await login('trainer-alte-herren@bsv.test')
  const [antrag] = await d.q(`select p.id, p.team_id from passantraege p join angebote_rels r on r.parent_id=p.team_id and r.path='leitung' join users u on u.id=r.users_id where u.email='trainer-alte-herren@bsv.test' limit 1`)
  if (antrag) {
    const [fremd] = await d.q(`select id from angebote where bereich='fussball' and id <> $1 limit 1`, [antrag.team_id])
    await api(tr, 'PATCH', `/api/passantraege/${antrag.id}`, { team: fremd.id })
    const [nachher] = await d.q('select team_id from passantraege where id=$1', [antrag.id])
    pruefe('Trainer kann Passantrag nicht an fremdes Team hängen', nachher.team_id === antrag.team_id, nachher)
    if (nachher.team_id !== antrag.team_id) await d.q('update passantraege set team_id=$1 where id=$2', [antrag.team_id, antrag.id])
  } else pruefe('Passantrag für Test vorhanden', false)

  // QA-07: Reihenfolge ganz oder gar nicht, nur mit eigenen Rechten
  const vorher = await d.q(`select id, reihenfolge from angebote where bereich='fussball' order by id limit 3`)
  const eigen = await d.q(`select r.parent_id id from angebote_rels r join users u on u.id=r.users_id where u.email='trainer-alte-herren@bsv.test' and r.path='leitung'`)
  const fremd = vorher.find((a) => !eigen.some((e) => e.id === a.id))
  const [altEigen] = await d.q('select reihenfolge from angebote where id=$1', [eigen[0].id])
  await d.q('update angebote set reihenfolge=777 where id=$1', [eigen[0].id])
  const r0 = await api(tr, 'POST', '/api/angebote/reihenfolge', { ids: [eigen[0].id, fremd.id] })
  const [nachEigen] = await d.q('select reihenfolge from angebote where id=$1', [eigen[0].id])
  await d.q('update angebote set reihenfolge=$1 where id=$2', [altEigen.reihenfolge, eigen[0].id])
  pruefe('Reihenfolge mit fremdem Team → abgelehnt, nichts geändert', r0.s === 400 && Number(nachEigen.reihenfolge) === 777, [r0.s, nachEigen])
  const red = await login('redaktion@bsv.test')
  const r1 = await api(red, 'POST', '/api/angebote/reihenfolge', { ids: vorher.map((a) => a.id).reverse() })
  const neu = await d.q(`select id, reihenfolge from angebote where id = any($1) order by reihenfolge`, [vorher.map((a) => a.id)])
  pruefe('Redaktion speichert Reihenfolge in einem Schritt', r1.s === 200 && neu[0].id === vorher[2].id, [r1.s, neu])
  for (const a of vorher) await d.q('update angebote set reihenfolge=$1 where id=$2', [a.reihenfolge, a.id])

  // Team-Zuordnung direkt beim Benutzer (nur Admin), gespeichert beim Team
  {
    const ad = await login('admin@bsv.test')
    const [u] = await d.q(`select id from users where email='trainer-yoga@bsv.test'`)
    const alt = (await d.q(`select parent_id from angebote_rels where path='leitung' and users_id=$1`, [u.id])).map((r) => r.parent_id)
    const [neu] = await d.q(`select id from angebote where id <> all($1) and bereich='erwachsene' limit 1`, [alt])
    const g = await api(ad, 'GET', `/api/users/${u.id}?depth=0`)
    pruefe('Benutzer zeigt seine Teams', JSON.stringify([...(g.j?.teamsVerantwortlich ?? [])].sort()) === JSON.stringify([...alt].sort()), [g.j?.teamsVerantwortlich, alt])
    const p = await api(ad, 'PATCH', `/api/users/${u.id}`, { teamsVerantwortlich: [...alt, neu.id] })
    const jetzt = (await d.q(`select parent_id from angebote_rels where path='leitung' and users_id=$1`, [u.id])).map((r) => r.parent_id)
    pruefe('Admin ordnet beim Benutzer ein Team zu → steht beim Team', p.s === 200 && jetzt.includes(neu.id), [p.s, jetzt])
    await api(ad, 'PATCH', `/api/users/${u.id}`, { teamsVerantwortlich: alt })
    const zurueck = (await d.q(`select parent_id from angebote_rels where path='leitung' and users_id=$1`, [u.id])).map((r) => r.parent_id)
    pruefe('… und wieder entfernen', !zurueck.includes(neu.id) && alt.every((x) => zurueck.includes(x)), zurueck)
    const tr2 = await login('trainer-yoga@bsv.test')
    await api(tr2, 'PATCH', `/api/users/${u.id}`, { teamsVerantwortlich: [...alt, neu.id] })
    const selbst = (await d.q(`select parent_id from angebote_rels where path='leitung' and users_id=$1`, [u.id])).map((r) => r.parent_id)
    pruefe('Trainer kann sich nicht selbst Teams zuordnen', !selbst.includes(neu.id), selbst)
  }

  // F-25: Bearbeitungssperren nur für die Verwaltung
  const mi = await login('mitglied@bsv.test')
  const r = await api(mi, 'GET', '/api/payload-locked-documents')
  pruefe('Mitglied sieht keine Bearbeitungssperren', r.s === 403, r.s)
  pruefe('Redaktion sieht Bearbeitungssperren', (await api(await login('redaktion@bsv.test'), 'GET', '/api/payload-locked-documents')).s === 200)

  // I-03: Admin übernimmt kein anderes Admin-Konto
  let andererId = null
  try {
    await mitWebAdmin(d, 'admin@bsv.test', async () => {
      const wa = await login('admin@bsv.test')
      const n = await api(wa, 'POST', '/api/users', { email: 'sicherheitstest-admin@bsv.test', name: 'Sicherheitstest Admin', password: 'Ein-Langes-Passwort-1', roles: ['admin'] })
      andererId = n.j?.doc?.id
      pruefe('Web-Admin legt zweiten Admin an', Boolean(andererId), n.j)
    })
    if (andererId) {
      const ad = await login('admin@bsv.test')
      pruefe('Admin ändert E-Mail eines anderen Admins → 403', (await api(ad, 'PATCH', `/api/users/${andererId}`, { email: 'uebernommen@bsv.test' })).s === 403)
      pruefe('Admin ändert Passwort eines anderen Admins → 403', (await api(ad, 'PATCH', `/api/users/${andererId}`, { password: 'Fremder#Zugriff7x' })).s === 403)
      pruefe('Admin löscht anderen Admin → 403', (await api(ad, 'DELETE', `/api/users/${andererId}`)).s === 403)
      pruefe('Admin ändert Namen eines anderen Admins → 200', (await api(ad, 'PATCH', `/api/users/${andererId}`, { name: 'Sicherheitstest Admin 2' })).s === 200)
    }
  } finally {
    await d.q(`delete from users where email in ('sicherheitstest-admin@bsv.test','uebernommen@bsv.test')`)
  }
}
