import { api, B, login, mitWebAdmin, pruefe } from './lib.mjs'

const absatz = (kinder) => ({ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: kinder })
const text = (t) => ({ type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 })
const lex = (kinder) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [absatz(kinder)] } })

/** Audit 2026-10 (dritter Durchgang): Upload per Adresse, Papierkorb/Versionen/Suche, Sortieren, Sperren, Feldrechte, Links */
export default async function haertung(d) {
  const ad = await login('admin@bsv.test')
  const red = await login('redaktion@bsv.test')
  const mi = await login('mitglied@bsv.test')
  const tr = await login('trainer-zumba-kids@bsv.test')
  const TITEL = 'Haertungstest endgueltig'
  const aufraeumen = async () => {
    const ids = (await d.q(`select id from posts where title like 'Haertungstest%'`)).map((r) => r.id)
    if (!ids.length) return
    await d.q(`delete from payload_locked_documents where id in (select parent_id from payload_locked_documents_rels where posts_id = any($1))`, [ids])
    await d.q(`delete from search where id in (select parent_id from search_rels where posts_id = any($1))`, [ids])
    await d.q(`delete from _posts_v where parent_id = any($1)`, [ids])
    await d.q(`delete from posts where id = any($1)`, [ids])
  }
  await aufraeumen()

  try {
    // Upload per Internet-Adresse (Server würde die Datei selbst abrufen) → 400
    let r = await api(mi, 'POST', '/api/profilbilder', { filename: 'a.jpg', url: 'http://bsv.invalid/a.jpg' })
    pruefe('Profilbild per Adresse statt Datei → 400', r.s === 400, r)
    r = await api(red, 'POST', '/api/media', { filename: 'a.jpg', url: 'http://bsv.invalid/a.jpg', alt: 'x', personen: 'keine' })
    pruefe('Mediathek per Adresse statt Datei → 400', r.s === 400, r)
    // Duplizieren: nutzt die gespeicherte Datei – eine mitgeschickte Adresse wird nicht abgerufen
    {
      const sharp = (await import('sharp')).default
      const png = await sharp({ create: { width: 60, height: 40, channels: 3, background: '#2a6f97' } }).png().toBuffer()
      const f = new FormData()
      f.append('file', new Blob([png], { type: 'image/png' }), 'haertungstest-dupl.png')
      f.append('_payload', JSON.stringify({ alt: 'Haertungstest', personen: 'keine' }))
      const u = await fetch(B + '/api/media', { method: 'POST', headers: { Cookie: red }, body: f })
      const vorlage = (await u.json().catch(() => null))?.doc
      try {
        if (vorlage?.id) {
          r = await api(red, 'POST', `/api/media/${vorlage.id}/duplicate`, { filename: 'a.jpg', url: 'http://bsv.invalid/a.jpg' })
          pruefe('Duplizieren mit mitgeschickter Adresse → 400', r.s === 400, r.s)
          r = await api(red, 'POST', `/api/media/${vorlage.id}/duplicate`, { alt: 'Haertungstest Kopie' })
          pruefe('Duplizieren ohne Adresse geht weiter', r.s === 201 || r.s === 200, r)
        } else pruefe('Vorlage für das Duplizieren hochgeladen', false, u.status)
      } finally {
        const fs = await import('fs/promises')
        for (const row of await d.q(`delete from media where alt like 'Haertungstest%' and filename like 'haertungstest-dupl%' returning *`))
          for (const [k, fn] of Object.entries(row)) if (k.endsWith('filename') && fn) await fs.rm(new URL(`../../medien/${fn}`, import.meta.url), { force: true })
      }
    }

    // Bild in den Papierkorb → auch der Bild-Zwischenspeicher (/_next/image) liefert es nicht mehr
    const sharp = (await import('sharp')).default
    const png = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#d4a017' } }).png().toBuffer()
    const fd = new FormData()
    fd.append('file', new Blob([png], { type: 'image/png' }), 'haertungstest-cache.png')
    fd.append('_payload', JSON.stringify({ alt: 'Haertungstest', personen: 'keine' }))
    const up = await fetch(B + '/api/media', { method: 'POST', headers: { Cookie: red }, body: fd })
    const bild = (await up.json().catch(() => null))?.doc
    try {
      pruefe('Testbild hochgeladen', up.status === 201 && Boolean(bild?.url), up.status)
      if (bild?.url) {
        const opt = `${B}/_next/image?url=${encodeURIComponent(new URL(bild.url, B).pathname)}&w=64&q=100`
        const v1 = await fetch(opt)
        await v1.arrayBuffer()
        const v2 = await fetch(opt)
        await v2.arrayBuffer()
        pruefe('Bild-Zwischenspeicher liefert das Bild (vorher)', v1.status === 200 && v2.status === 200, [v1.status, v2.status])
        const del = await api(red, 'PATCH', `/api/media/${bild.id}`, { deletedAt: new Date().toISOString() })
        const n1 = await fetch(opt)
        await n1.arrayBuffer()
        pruefe('Nach dem Papierkorb: Zwischenspeicher liefert das Bild nicht mehr', del.s === 200 && n1.status !== 200, [del.s, n1.status])
      }
    } finally {
      const reste = await d.q(`delete from media where filename like 'haertungstest-cache%' returning *`).catch(() => [])
      const fs = await import('fs/promises')
      for (const row of reste) for (const [k, f] of Object.entries(row)) if (k.endsWith('filename') && f) await fs.rm(new URL(`../../medien/${f}`, import.meta.url), { force: true })
    }

    // Admin löscht einen veröffentlichten Beitrag endgültig → auch Entwurfsansicht und Suche leer
    r = await api(ad, 'POST', '/api/posts', { title: TITEL, content: lex([text('Inhalt')]), _status: 'published' })
    const id = r.j?.doc?.id
    pruefe('Beitrag angelegt', r.s === 201 && Boolean(id), r.s)
    if (id) {
      const [vorher] = await d.q('select count(*)::int n from search_rels where posts_id = $1', [id])
      r = await api(ad, 'DELETE', `/api/posts/${id}`)
      pruefe('Admin: endgültig löschen → 200', r.s === 200, r)
      pruefe('Anonym: ?draft=true liefert den Beitrag nicht mehr', (await api(null, 'GET', `/api/posts/${id}?draft=true`)).s === 404)
      const liste = await api(null, 'GET', `/api/posts?draft=true&where[id][equals]=${id}`)
      pruefe('Anonym: auch nicht über die Liste mit ?draft=true', liste.j?.docs?.length === 0, liste.j?.docs?.length)
      const [nachher] = await d.q('select count(*)::int n from search_rels where posts_id = $1', [id])
      pruefe('Suchindex-Eintrag entfernt', vorher.n >= 1 && nachher.n === 0, { vorher, nachher })
    }

    // Sortieren über Felder verknüpfter Konten
    r = await api(mi, 'GET', '/api/angebote?sort=leitung.email&limit=1')
    pruefe('Mitglied: sortieren nach leitung.email → 400', r.s === 400, r.s)
    r = await api(mi, 'GET', '/api/posts?sort=-authors.name&limit=1')
    pruefe('Mitglied: sortieren nach authors.name → 400', r.s === 400, r.s)
    pruefe('Mitglied: normales Sortieren geht weiter', (await api(mi, 'GET', '/api/angebote?sort=title&limit=1')).s === 200)
    r = await api(mi, 'GET', '/api/angebote?sort=leitung__email&limit=1')
    pruefe('Mitglied: sortieren nach leitung__email (Schreibweise mit __) → 400', r.s === 400, r.s)
    r = await api(red, 'GET', '/api/posts/versions?sort=-version.title&limit=1')
    pruefe('Redaktion: Versionen nach version.title sortieren geht', r.s === 200, r.s)
    r = await api(red, 'GET', '/api/posts?sort=meta.title&limit=1')
    pruefe('Redaktion: nach Gruppenfeld meta.title sortieren geht', r.s === 200, r.s)

    // Bearbeitungssperre im Namen eines anderen
    const [admin] = await d.q(`select id from users where email='admin@bsv.test'`)
    const [trainer] = await d.q(`select id from users where email='trainer-zumba-kids@bsv.test'`)
    const [post] = await d.q(`select id from posts where deleted_at is null order by id limit 1`)
    if (post) {
      r = await api(tr, 'POST', '/api/payload-locked-documents', { document: { relationTo: 'posts', value: post.id }, user: { relationTo: 'users', value: admin.id }, globalSlug: null })
      const sid = r.j?.doc?.id
      const [besitzer] = sid ? await d.q(`select users_id from payload_locked_documents_rels where parent_id=$1 and path='user'`, [sid]) : [null]
      pruefe('Sperre anlegen: gehört immer dem Anlegenden', Boolean(sid) && besitzer?.users_id === trainer.id, { s: r.s, j: r.j, besitzer })
      if (sid) await d.q('delete from payload_locked_documents where id=$1', [sid])
    }

    // Einwilligungs-Nachweis bei Bildern: nur für Personen, die Bilder hochladen dürfen
    pruefe('Mitglied: nach Einwilligungs-Nachweis filtern → 400', (await api(mi, 'GET', '/api/media?where[einwilligungNachweis][exists]=true&limit=1')).s === 400)
    pruefe('Redaktion: Einwilligungs-Nachweis lesbar', (await api(red, 'GET', '/api/media?where[einwilligungNachweis][exists]=true&limit=1')).s === 200)

    // Zwei-Faktor-Haken: Admin darf zurücksetzen, aber nicht von Hand setzen
    const [m] = await d.q(`select id, zwei_faktor_aktiv from users where email='mitglied@bsv.test'`)
    r = await api(ad, 'PATCH', `/api/users/${m.id}`, { zweiFaktorAktiv: true })
    const [m2] = await d.q('select zwei_faktor_aktiv from users where id=$1', [m.id])
    pruefe('Admin setzt „Zwei-Faktor eingerichtet“ von Hand → bleibt aus', m2.zwei_faktor_aktiv !== true, { s: r.s, m2 })
    if (m2.zwei_faktor_aktiv === true && m.zwei_faktor_aktiv !== true) await d.q('update users set zwei_faktor_aktiv=false where id=$1', [m.id])

    // Links im Text: kein „javascript:“
    const link = { type: 'link', version: 3, direction: 'ltr', format: '', indent: 0, fields: { linkType: 'custom', url: 'javascript:alert(1)', newTab: false }, children: [text('Klick')] }
    r = await api(red, 'POST', '/api/posts', { title: 'Haertungstest Link', content: lex([link]), _status: 'draft' })
    pruefe('News mit „javascript:“-Link → 400', r.s === 400, r.s)
    link.fields.url = 'https://www.example.org/'
    r = await api(red, 'POST', '/api/posts', { title: 'Haertungstest Link', content: lex([link]), _status: 'draft' })
    pruefe('News mit https-Link → 201', r.s === 201, r)

    // Papierkorb: Verknüpfungen vor dem endgültigen Löschen; Pflicht-Verknüpfungen (Formular-Eingänge) gehen mit
    const f = await api(ad, 'POST', '/api/forms', { title: 'Haertungstest Formular', fields: [], confirmationType: 'message', confirmationMessage: lex([text('Danke')]) })
    const fid = f.j?.doc?.id
    pruefe('Testformular angelegt', f.s === 201 && Boolean(fid), f.j?.errors ?? f.s)
    if (fid) {
      await d.q('insert into form_submissions (form_id) values ($1), ($1)', [fid])
      await d.q('update forms set deleted_at = now() where id = $1', [fid])
      await mitWebAdmin(d, 'admin@bsv.test', async () => {
        const wa = await login('admin@bsv.test')
        const v = await api(wa, 'POST', '/api/papierkorb/verknuepfungen', { eintraege: [{ slug: 'forms', id: fid }] })
        const k = v.j?.eintraege?.[0]?.verknuepfungen ?? []
        pruefe('Verknüpfungen: 2 Formular-Eingänge werden mitgelöscht', v.s === 200 && k.some((x) => x.mitloeschen && x.anzahl === 2), v.j)
        const l = await api(wa, 'POST', '/api/papierkorb/aktion', { aktion: 'loeschen', eintraege: [{ slug: 'forms', id: fid }] })
        const [rest] = await d.q('select (select count(*) from forms where id=$1)::int f, (select count(*) from form_submissions where form_id=$1)::int s', [fid])
        pruefe('Formular mit Eingängen endgültig gelöscht (Eingänge mit)', l.s === 200 && l.j?.ok === 1 && rest.f === 0 && rest.s === 0, { l: l.j, rest })
      })
      pruefe('Verknüpfungen nur für Web-Admins', (await api(ad, 'POST', '/api/papierkorb/verknuepfungen', { eintraege: [{ slug: 'forms', id: 1 }] })).s === 403)
    }
    // Bild in einer News: wird als „noch verwendet“ gemeldet (dort entsteht eine Lücke)
    {
      const sharp = (await import('sharp')).default
      const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#aa3366' } }).png().toBuffer()
      const fd2 = new FormData()
      fd2.append('file', new Blob([png], { type: 'image/png' }), 'haertungstest-verkn.png')
      fd2.append('_payload', JSON.stringify({ alt: 'Haertungstest', personen: 'keine' }))
      const u = await fetch(B + '/api/media', { method: 'POST', headers: { Cookie: red }, body: fd2 })
      const bid = (await u.json().catch(() => null))?.doc?.id
      try {
        if (bid) {
          const n = await api(ad, 'POST', '/api/posts', { title: 'Haertungstest Bild', content: lex([text('x')]), heroImage: bid, _status: 'draft' })
          await mitWebAdmin(d, 'admin@bsv.test', async () => {
            const wa = await login('admin@bsv.test')
            const v = await api(wa, 'POST', '/api/papierkorb/verknuepfungen', { eintraege: [{ slug: 'media', id: bid }] })
            const k = v.j?.eintraege?.[0]?.verknuepfungen ?? []
            pruefe('Verknüpfungen: Bild wird in 1 News verwendet (Lücke, nicht mitlöschen)', n.s === 201 && k.some((x) => !x.mitloeschen && x.anzahl === 1 && /News/.test(x.bereich)), { n: n.s, k })
          })
        } else pruefe('Bild für den Verknüpfungs-Test hochgeladen', false, u.status)
      } finally {
        await aufraeumen()
        const fs = await import('fs/promises')
        for (const row of await d.q(`delete from media where filename like 'haertungstest-verkn%' returning *`))
          for (const [k2, fn] of Object.entries(row)) if (k2.endsWith('filename') && fn) await fs.rm(new URL(`../../medien/${fn}`, import.meta.url), { force: true })
      }
    }
  } finally {
    await aufraeumen()
    await d.q(`delete from forms where title = 'Haertungstest Formular'`).catch(() => {})
  }
}
