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
      pruefe('Admin ändert Passwort eines anderen Admins → 403', (await api(ad, 'PATCH', `/api/users/${andererId}`, { password: 'Uebernommen-12345' })).s === 403)
      pruefe('Admin löscht anderen Admin → 403', (await api(ad, 'DELETE', `/api/users/${andererId}`)).s === 403)
      pruefe('Admin ändert Namen eines anderen Admins → 200', (await api(ad, 'PATCH', `/api/users/${andererId}`, { name: 'Sicherheitstest Admin 2' })).s === 200)
    }
  } finally {
    await d.q(`delete from users where email in ('sicherheitstest-admin@bsv.test','uebernommen@bsv.test')`)
  }
}
