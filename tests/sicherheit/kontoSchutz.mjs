/**
 * Geschütztes Konto: Höchstens ein Web-Admin schützt sein eigenes Konto. Danach kann es niemand sonst ändern,
 * herabstufen oder löschen – auch kein anderer Web-Admin. Der Haken ist nur für die Person selbst sichtbar.
 */
import { api, login, pruefe } from './lib.mjs'

const verboten = (r) => r.s === 403 || r.s === 401

export default async function kontoSchutz(d) {
  const konto = async (email) => (await d.q('select id from users where email=$1 and testkonto = true', [email]))[0]
  const a = await konto('admin@bsv.test') // wird Web-Admin und schützt sich
  const b = await konto('kasse@bsv.test') // zweiter Web-Admin
  const r = await konto('redaktion@bsv.test')
  if (!a || !b || !r) throw new Error('Testkonten fehlen')
  const rollenVorher = await d.q('select parent_id, value, "order" from users_roles where parent_id = any($1)', [[a.id, b.id]])
  const [{ email: emailA }] = await d.q('select email from users where id=$1', [a.id])
  await d.q("insert into users_roles (\"order\", parent_id, value) values (98, $1, 'webadmin'), (98, $2, 'webadmin'), (99, $2, 'admin')", [a.id, b.id])
  await d.q('update users set konto_geschuetzt = false where konto_geschuetzt = true')
  try {
    const ca = await login('admin@bsv.test')
    const cb = await login('kasse@bsv.test')
    const cr = await login('redaktion@bsv.test')

    // Sichtbarkeit: auf dem eigenen Konto ja (solange noch niemand geschützt ist), bei anderen nie
    const eigen = await api(ca, 'GET', `/api/users/${a.id}?depth=0`)
    pruefe('Web-Admin sieht den Haken auf dem eigenen Konto', eigen.s === 200 && 'kontoGeschuetzt' in (eigen.j ?? {}), eigen.j?.kontoGeschuetzt)
    const fremd = await api(cb, 'GET', `/api/users/${a.id}?depth=0`)
    pruefe('Anderer Web-Admin sieht den Haken nicht', fremd.s === 200 && !('kontoGeschuetzt' in (fremd.j ?? {})), Object.keys(fremd.j ?? {}).includes('kontoGeschuetzt'))

    // Nur sich selbst schützen – nicht andere, nicht als Admin/Redaktion
    const fuerAndere = await api(cb, 'PATCH', `/api/users/${a.id}`, { kontoGeschuetzt: true })
    const [x1] = await d.q('select konto_geschuetzt from users where id=$1', [a.id])
    pruefe('Fremdes Konto schützen geht nicht', x1.konto_geschuetzt === false, fuerAndere.s)
    const redSelbst = await api(cr, 'PATCH', `/api/users/${r.id}`, { kontoGeschuetzt: true })
    const [x2] = await d.q('select konto_geschuetzt from users where id=$1', [r.id])
    pruefe('Redaktion kann sich nicht schützen', x2.konto_geschuetzt === false, redSelbst.s)

    const an = await api(ca, 'PATCH', `/api/users/${a.id}`, { kontoGeschuetzt: true })
    const [x3] = await d.q('select konto_geschuetzt from users where id=$1', [a.id])
    pruefe('Web-Admin schützt das eigene Konto', an.s === 200 && x3.konto_geschuetzt === true, an.s)

    // Zweiter Web-Admin kann sich jetzt nicht schützen und sieht den Haken auch auf seinem Konto nicht
    const bEigen = await api(cb, 'GET', `/api/users/${b.id}?depth=0`)
    pruefe('Zweiter Web-Admin sieht den Haken nicht mehr (verrät nichts)', bEigen.s === 200 && !('kontoGeschuetzt' in (bEigen.j ?? {})), bEigen.j?.kontoGeschuetzt)
    await api(cb, 'PATCH', `/api/users/${b.id}`, { kontoGeschuetzt: true })
    const [x4] = await d.q('select konto_geschuetzt from users where id=$1', [b.id])
    pruefe('Zweites geschütztes Konto nicht möglich', x4.konto_geschuetzt === false, x4)

    // Suche nach dem Feld verrät das geschützte Konto nicht
    const suche = await api(cb, 'GET', '/api/users?where[kontoGeschuetzt][equals]=true&depth=0&limit=5')
    pruefe('Filter nach dem Feld verrät nichts', suche.s !== 200 || !(suche.j?.docs ?? []).some((u) => u.id === a.id), { s: suche.s, n: suche.j?.totalDocs })

    // Anderer Web-Admin: herabstufen, E-Mail, Passwort, Zwei-Faktor, Name, löschen – alles verboten
    const versuche = [
      ['herabstufen', { roles: ['mitglied'] }],
      ['E-Mail ändern', { email: 'uebernahme@bsv.test' }],
      ['Passwort setzen', { password: 'Uebernahme-2026!x' }],
      ['Zwei-Faktor zurücksetzen', { zweiFaktorAktiv: false }],
      ['Name ändern', { name: 'Übernommen' }],
      ['Schutz entfernen', { kontoGeschuetzt: false }],
    ]
    for (const [was, daten] of versuche) {
      const res = await api(cb, 'PATCH', `/api/users/${a.id}`, daten)
      pruefe(`Anderer Web-Admin: ${was} verboten`, verboten(res), res.s)
    }
    const [nachher] = await d.q("select u.email, u.konto_geschuetzt, array(select value from users_roles where parent_id=u.id) as rollen from users u where id=$1", [a.id])
    pruefe('Konto unverändert (E-Mail, Schutz, Web-Admin)', nachher.email === emailA && nachher.konto_geschuetzt === true && nachher.rollen.includes('webadmin'), nachher)

    const loeschen = await api(cb, 'DELETE', `/api/users/${a.id}`)
    pruefe('Anderer Web-Admin: löschen verboten', verboten(loeschen), loeschen.s)
    const sammel = await api(cb, 'PATCH', `/api/users?where[id][equals]=${a.id}`, { roles: ['mitglied'] })
    const [nachSammel] = await d.q("select array(select value from users_roles where parent_id=$1) as rollen", [a.id])
    pruefe('Anderer Web-Admin: Sammel-Änderung wirkungslos', nachSammel.rollen.includes('webadmin'), { s: sammel.s, rollen: nachSammel.rollen })
    const sammelLoeschen = await api(cb, 'DELETE', `/api/users?where[id][equals]=${a.id}`)
    const [noch] = await d.q('select count(*)::int as n from users where id=$1', [a.id])
    pruefe('Anderer Web-Admin: Sammel-Löschen wirkungslos', noch.n === 1, sammelLoeschen.s)

    // Die Person selbst: darf ihr Konto ändern, aber Web-Admin nicht abgeben, solange geschützt
    const selbstName = await api(ca, 'PATCH', `/api/users/${a.id}`, { name: 'Test Admin' })
    pruefe('Selbst: Name ändern erlaubt', selbstName.s === 200, selbstName.s)
    const selbstRunter = await api(ca, 'PATCH', `/api/users/${a.id}`, { roles: ['admin'] })
    pruefe('Selbst: Web-Admin abgeben erst nach Schutz-Aus', selbstRunter.s === 400, selbstRunter.s)
    const selbstLoeschen = await api(ca, 'DELETE', `/api/users/${a.id}`)
    pruefe('Selbst: löschen erst nach Schutz-Aus', selbstLoeschen.s >= 400, selbstLoeschen.s)

    // Schutz ausschalten → wieder normal
    const aus = await api(ca, 'PATCH', `/api/users/${a.id}`, { kontoGeschuetzt: false })
    const [x5] = await d.q('select konto_geschuetzt from users where id=$1', [a.id])
    pruefe('Selbst: Schutz ausschalten', aus.s === 200 && x5.konto_geschuetzt === false, aus.s)
    const jetzt = await api(cb, 'PATCH', `/api/users/${a.id}`, { name: 'Test Admin' })
    pruefe('Danach darf ein anderer Web-Admin wieder ändern', jetzt.s === 200, jetzt.s)
  } finally {
    await d.q('update users set konto_geschuetzt = false where id = any($1)', [[a.id, b.id, r.id]])
    await d.q("update users set name = 'Test Admin' where id = $1", [a.id])
    await d.q('delete from users_roles where parent_id = any($1)', [[a.id, b.id]])
    for (const z of rollenVorher) await d.q('insert into users_roles ("order", parent_id, value) values ($1, $2, $3)', [z.order, z.parent_id, z.value])
  }
}
