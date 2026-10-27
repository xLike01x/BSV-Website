/**
 * Technik-Bereiche (Weiterleitungen, Suchindex): lesen darf die Website (öffentlich), ändern nur Web-Admins –
 * auch über die Schnittstelle, nicht nur über die ausgeblendete Seitenleiste.
 */
import { api, login, mitWebAdmin, pruefe } from './lib.mjs'

export default async function technik(d) {
  const verboten = (r) => r.s === 403 || r.s === 401
  const [news] = await d.q("select id from posts where _status='published' and deleted_at is null order by id limit 1")
  const weiterleitung = (zusatz) => ({ from: `/sicherheitstest-technik-${zusatz}-${Date.now()}`, to: { type: 'custom', url: '/termine' } })

  // Anonym: lesen erlaubt (für die Website), anlegen verboten
  const anon = await api(null, 'POST', '/api/redirects', weiterleitung('anon'))
  pruefe('Anonym: Weiterleitung anlegen verboten', verboten(anon), anon.s)

  for (const email of ['admin@bsv.test', 'redaktion@bsv.test']) {
    const c = await login(email)
    const r = await api(c, 'POST', '/api/redirects', weiterleitung('rolle'))
    pruefe(`${email}: Weiterleitung anlegen verboten`, verboten(r), r.s)
    const s = await api(c, 'POST', '/api/search', { title: 'Sicherheitstest', doc: { relationTo: 'posts', value: news?.id } })
    pruefe(`${email}: Suchindex-Eintrag anlegen verboten`, verboten(s), s.s)
    const [vorhanden] = await d.q('select id from search order by id limit 1')
    if (vorhanden) {
      const u = await api(c, 'PATCH', `/api/search/${vorhanden.id}`, { priority: 99 })
      pruefe(`${email}: Suchindex-Eintrag ändern verboten`, verboten(u), u.s)
      const l = await api(c, 'DELETE', `/api/search/${vorhanden.id}`)
      pruefe(`${email}: Suchindex-Eintrag löschen verboten`, verboten(l), l.s)
    }
  }

  // Web-Admin darf anlegen und löschen
  await mitWebAdmin(d, 'admin@bsv.test', async () => {
    const c = await login('admin@bsv.test')
    const r = await api(c, 'POST', '/api/redirects', weiterleitung('webadmin'))
    pruefe('Web-Admin: Weiterleitung anlegen erlaubt', r.s === 201, r.s)
    const id = r.j?.doc?.id
    if (id) {
      const l = await api(c, 'DELETE', `/api/redirects/${id}`)
      pruefe('Web-Admin: Weiterleitung löschen erlaubt', l.s === 200, l.s)
    }
  })
  await d.q("delete from redirects where \"from\" like '/sicherheitstest-technik-%'")

  // Öffentliches Lesen der Weiterleitungen bleibt (die Website braucht es)
  const lesen = await api(null, 'GET', '/api/redirects?limit=1')
  pruefe('Anonym: Weiterleitungen lesen weiterhin möglich', lesen.s === 200, lesen.s)
}
