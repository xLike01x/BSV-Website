import { api, B, login, pruefe } from './lib.mjs'

/** Kleinstes gültiges PNG (1 × 1 Pixel) */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
const NAME = 'Sicherheitstest-Kuendigung'

/** Quartalsende wie auf dem Server (deutscher Kalendertag) */
const quartalsende = () => {
  const [y, m] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number)
  const lm = Math.ceil(m / 3) * 3
  return `${y}-${String(lm).padStart(2, '0')}-${String(new Date(Date.UTC(y, lm, 0)).getUTCDate()).padStart(2, '0')}`
}

const einreichen = async (
  cookie,
  {
    ids,
    datei = PNG,
    typ = 'image/png',
    name = 'kuendigung.png',
    unterschrieben = true,
    kopf = true,
    grund,
  } = {},
) => {
  const fd = new FormData()
  if (datei) fd.append('file', new Blob([datei], { type: typ }), name)
  fd.append('_payload', JSON.stringify({ mitgliedschaften: ids, unterschrieben, grund }))
  const r = await fetch(`${B}/api/kuendigungen/einreichen`, {
    method: 'POST',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(kopf ? { 'x-bsv-kuendigung': '1' } : {}),
    },
    body: fd,
  })
  return { s: r.status, j: await r.json().catch(() => null) }
}

/**
 * Kündigung aus dem Mitgliederbereich: nur eigene Mitgliedschaften, Datei am Inhalt geprüft, keine doppelten Kündigungen,
 * Wirksamkeitsdatum vom Server, Status nur über die Knöpfe der Kasse, Schreiben nie öffentlich.
 */
export default async function kuendigungen(d) {
  const admin = await login('admin@bsv.test')
  const [mitglied] = await d.q(
    `select id from users where email = 'mitglied@bsv.test' and testkonto = true`,
  )
  const [kasseKonto] = await d.q(
    `select id from users where email = 'kasse@bsv.test' and testkonto = true`,
  )
  if (!mitglied || !kasseKonto) return pruefe('Testkonten mitglied/kasse vorhanden', false)
  const anlegen = async (vorname, konto) =>
    (
      await api(admin, 'POST', '/api/mitgliedschaften', {
        vorname,
        nachname: NAME,
        email: 'mitglied@bsv.test',
        art: 'jugend',
        konto,
        mitgliedsnummer: `T-${vorname}`,
      })
    ).j?.doc
  try {
    const kind = await anlegen('Kind', mitglied.id)
    const elternteil = await anlegen('Elternteil', mitglied.id)
    const fremd = await anlegen('Fremd', kasseKonto.id)
    pruefe('Test-Mitgliedschaften angelegt', Boolean(kind?.id && elternteil?.id && fremd?.id))

    const m = await login('mitglied@bsv.test')
    pruefe(
      'Ohne Anmeldung: keine Kündigung',
      (await einreichen(null, { ids: [kind.id] })).s === 401,
    )
    pruefe(
      'Ohne Sicherheits-Kopf (fremde Website): abgelehnt',
      (await einreichen(m, { ids: [kind.id], kopf: false })).s === 400,
    )
    pruefe(
      'Fremde Mitgliedschaft (manipulierte ID): abgelehnt',
      (await einreichen(m, { ids: [fremd.id] })).s === 403,
    )
    pruefe(
      'Unbekannte Mitgliedschaft: abgelehnt',
      (await einreichen(m, { ids: [999999999] })).s === 403,
    )
    pruefe(
      'Gemischt eigene + fremde: abgelehnt',
      (await einreichen(m, { ids: [kind.id, fremd.id] })).s === 403,
    )
    pruefe(
      'Ohne Bestätigung „unterschrieben“: abgelehnt',
      (await einreichen(m, { ids: [kind.id], unterschrieben: false })).s === 400,
    )
    pruefe(
      'Ohne Datei: abgelehnt',
      (await einreichen(m, { ids: [kind.id], datei: null })).s === 400,
    )
    pruefe(
      'HTML als PNG getarnt: abgelehnt',
      (
        await einreichen(m, {
          ids: [kind.id],
          datei: Buffer.from('<html><script>alert(1)</script></html>'.padEnd(200, ' ')),
        })
      ).s === 400,
    )
    pruefe(
      'SVG: abgelehnt',
      (
        await einreichen(m, {
          ids: [kind.id],
          datei: Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'.padEnd(200, ' '),
          ),
          typ: 'image/svg+xml',
          name: 'x.svg',
        })
      ).s === 400,
    )
    const gross = Buffer.concat([PNG, Buffer.alloc(11 * 1024 * 1024)])
    pruefe(
      'Größer als 10 MB: abgelehnt',
      [413, 400].includes((await einreichen(m, { ids: [kind.id], datei: gross })).s),
    )
    pruefe(
      'Zu langer Grund: abgelehnt',
      (await einreichen(m, { ids: [kind.id], grund: 'x'.repeat(501) })).s === 400,
    )
    const [vorher] = await d.q(`select count(*)::int as n from kuendigungen where konto_id = $1`, [
      mitglied.id,
    ])
    pruefe('Abgelehnte Versuche legen nichts an', vorher.n === 0, vorher)

    // Gültige Kündigung
    const ok = await einreichen(m, { ids: [kind.id], grund: '<b>Umzug</b>' })
    pruefe(
      'Eigene Mitgliedschaft kündigen: angenommen',
      ok.s === 200 && ok.j?.wirksamZum === quartalsende(),
      ok.j,
    )
    const [k] = await d.q(
      `select id, status::text, konto_id, wirksam_zum, dokument_id, email from kuendigungen where konto_id = $1 order by id desc limit 1`,
      [mitglied.id],
    )
    pruefe(
      'Kündigung gespeichert: Status „neu“, Konto, Schreiben, Quartalsende vom Server',
      k?.status === 'neu' &&
        k.konto_id === mitglied.id &&
        k.dokument_id &&
        new Date(k.wirksam_zum).toISOString().startsWith(quartalsende()),
      k,
    )
    pruefe(
      'Doppelte Kündigung derselben Person: abgelehnt',
      (await einreichen(m, { ids: [kind.id] })).s === 409,
    )

    // Lesen und Ändern durch das Mitglied
    pruefe(
      'Mitglied: Kündigungen nicht über die Schnittstelle lesbar',
      (await api(m, 'GET', '/api/kuendigungen')).s === 403,
    )
    pruefe(
      'Mitglied: einzelne Kündigung nicht abrufbar',
      [403, 404].includes((await api(m, 'GET', `/api/kuendigungen/${k.id}`)).s),
    )
    pruefe(
      'Mitglied: kann nichts direkt anlegen',
      (await api(m, 'POST', '/api/kuendigungen', { namen: 'x', mitgliedschaften: [fremd.id] }))
        .s === 403,
    )
    pruefe(
      'Mitglied: kann den Status nicht ändern (Schnittstelle)',
      [403, 404].includes(
        (await api(m, 'PATCH', `/api/kuendigungen/${k.id}`, { status: 'bestaetigt' })).s,
      ),
    )
    pruefe(
      'Mitglied: kann nicht selbst bestätigen',
      (await api(m, 'POST', `/api/kuendigungen/${k.id}/entscheidung`, { status: 'bestaetigt' }))
        .s === 403,
    )
    const fdDirekt = new FormData()
    fdDirekt.append('file', new Blob([PNG], { type: 'image/png' }), 'x.png')
    const direkt = await fetch(`${B}/api/kuendigungsdokumente`, {
      method: 'POST',
      headers: { Cookie: m },
      body: fdDirekt,
    })
    pruefe(
      'Mitglied: Schreiben nicht direkt hochladbar (nur über „einreichen“)',
      direkt.status === 403,
      direkt.status,
    )

    // Das hochgeladene Schreiben
    const dok = (await api(admin, 'GET', `/api/kuendigungsdokumente/${k.dokument_id}`)).j
    pruefe(
      'Schreiben als PNG gespeichert (Dateiart vom Inhalt)',
      dok?.mimeType === 'image/png' && String(dok?.filename ?? '').endsWith('.png'),
      dok,
    )
    const anonym = await fetch(`${B}${dok?.url ?? '/api/kuendigungsdokumente/file/x.png'}`)
    pruefe(
      'Schreiben ohne Anmeldung nicht abrufbar',
      anonym.status === 403 || anonym.status === 404,
      anonym.status,
    )
    const trainer = await login('trainer-1-mannschaft@bsv.test')
    const tDok = await fetch(`${B}${dok?.url}`, { headers: { Cookie: trainer } })
    pruefe(
      'Schreiben für andere Konten (Trainer) nicht abrufbar',
      tDok.status === 403 || tDok.status === 404,
      tDok.status,
    )
    const eigen = await fetch(`${B}${dok?.url}`, { headers: { Cookie: m } })
    pruefe(
      'Eigenes Schreiben für das Mitglied abrufbar, nicht zwischengespeichert',
      eigen.status === 200 && /no-store/.test(eigen.headers.get('cache-control') ?? ''),
      { s: eigen.status, cc: eigen.headers.get('cache-control') },
    )

    // Andere Rollen
    const red = await login('redaktion@bsv.test')
    pruefe(
      'Redaktion sieht keine Kündigungen',
      (await api(red, 'GET', '/api/kuendigungen')).s === 403,
    )
    pruefe(
      'Trainer sieht keine Kündigungen',
      (await api(trainer, 'GET', '/api/kuendigungen')).s === 403,
    )
    pruefe(
      'Trainer kann nicht entscheiden',
      (
        await api(trainer, 'POST', `/api/kuendigungen/${k.id}/entscheidung`, {
          status: 'bestaetigt',
        })
      ).s === 403,
    )

    // Zurückziehen
    const kasse = await login('kasse@bsv.test')
    pruefe(
      'Fremde Kündigung zurückziehen: abgelehnt',
      (
        await api(kasse, 'POST', `/api/kuendigungen/${k.id}/zurueckziehen`, undefined, {
          'x-bsv-kuendigung': '1',
        })
      ).s === 404,
    )
    pruefe(
      'Zurückziehen ohne Sicherheits-Kopf: abgelehnt',
      (await api(m, 'POST', `/api/kuendigungen/${k.id}/zurueckziehen`)).s === 400,
    )
    pruefe(
      'Eigene Kündigung zurückziehen',
      (
        await api(m, 'POST', `/api/kuendigungen/${k.id}/zurueckziehen`, undefined, {
          'x-bsv-kuendigung': '1',
        })
      ).s === 200,
    )
    pruefe(
      'Zweites Zurückziehen: abgelehnt',
      (
        await api(m, 'POST', `/api/kuendigungen/${k.id}/zurueckziehen`, undefined, {
          'x-bsv-kuendigung': '1',
        })
      ).s === 409,
    )

    // Neue Kündigung (ganze „Familie“) und Bearbeitung durch die Kasse
    const ok2 = await einreichen(m, { ids: [kind.id, elternteil.id] })
    pruefe('Nach dem Zurückziehen: neue Kündigung für beide möglich', ok2.s === 200, ok2.j)
    const [k2] = await d.q(
      `select id from kuendigungen where konto_id = $1 and status = 'neu' order by id desc limit 1`,
      [mitglied.id],
    )
    pruefe(
      'Kasse sieht die Kündigung',
      (await api(kasse, 'GET', `/api/kuendigungen/${k2.id}`)).s === 200,
    )
    pruefe(
      'Ungültiger Übergang (neu → im DFBnet ausgetragen): abgelehnt',
      (await api(kasse, 'POST', `/api/kuendigungen/${k2.id}/entscheidung`, { status: 'erledigt' }))
        .s === 400,
    )
    const p1 = await api(kasse, 'PATCH', `/api/kuendigungen/${k2.id}`, {
      status: 'bestaetigt',
      wirksamZum: '2020-01-01T12:00:00.000Z',
      namen: 'Anders',
    })
    const [nachPatch] = await d.q(
      `select status::text, wirksam_zum, namen from kuendigungen where id = $1`,
      [k2.id],
    )
    pruefe(
      'Status, Datum und Namen nicht über normales Speichern änderbar',
      nachPatch.status === 'neu' &&
        !String(nachPatch.namen).startsWith('Anders') &&
        new Date(nachPatch.wirksam_zum).toISOString().startsWith(quartalsende()),
      { s: p1.s, nachPatch },
    )
    const best = await api(kasse, 'POST', `/api/kuendigungen/${k2.id}/entscheidung`, {
      status: 'bestaetigt',
    })
    pruefe('Kasse bestätigt', best.s === 200, best.j)
    const ms = await d.q(
      `select id, austritt, aktiv from mitgliedschaften where id = any($1::int[])`,
      [[kind.id, elternteil.id]],
    )
    pruefe(
      'Bestätigen setzt „Gültig bis“ beider Mitgliedschaften aufs Quartalsende',
      ms.length === 2 &&
        ms.every(
          (x) =>
            x.austritt &&
            new Date(x.austritt).toISOString().startsWith(quartalsende()) &&
            x.aktiv !== false,
        ),
      ms,
    )
    pruefe(
      'Bestätigt ist endgültig (nicht mehr ablehnbar)',
      (await api(kasse, 'POST', `/api/kuendigungen/${k2.id}/entscheidung`, { status: 'abgelehnt' }))
        .s === 400,
    )
    pruefe(
      'Nach der Bestätigung: nicht mehr zurückziehbar',
      (
        await api(m, 'POST', `/api/kuendigungen/${k2.id}/zurueckziehen`, undefined, {
          'x-bsv-kuendigung': '1',
        })
      ).s === 409,
    )
    pruefe(
      'Bereits gekündigte Person nicht erneut kündbar',
      (await einreichen(m, { ids: [kind.id] })).s === 409,
    )
    pruefe(
      'Im DFBnet ausgetragen',
      (await api(kasse, 'POST', `/api/kuendigungen/${k2.id}/entscheidung`, { status: 'erledigt' }))
        .s === 200,
    )
    const [verlauf] = await d.q(
      `select count(*)::int as n from kuendigungen_verlauf where _parent_id = $1`,
      [k2.id],
    )
    pruefe('Verlauf hält die Schritte fest', verlauf.n >= 3, verlauf)

    // „Nur ansehen“: Kündigungen nur mit Haken „Mitgliedschaften“, Schreiben nie
    const [leser] = await d.q(
      `select 1 from users where email = 'lesen@bsv.test' and testkonto = true`,
    )
    if (leser) {
      const l = await login('lesen@bsv.test')
      const ld = await fetch(`${B}${dok?.url}`, { headers: { Cookie: l } })
      pruefe(
        '„Nur ansehen“: unterschriebenes Schreiben nicht abrufbar',
        ld.status === 403 || ld.status === 404,
        ld.status,
      )
      pruefe(
        '„Nur ansehen“: keine Entscheidung',
        (await api(l, 'POST', `/api/kuendigungen/${k2.id}/entscheidung`, { status: 'erledigt' }))
          .s === 403,
      )
    }
  } finally {
    // Aufräumen über die Schnittstelle, damit auch die Dateien gelöscht werden
    const reste = await d.q(
      `select k.id from kuendigungen k join kuendigungen_rels r on r.parent_id = k.id join mitgliedschaften m on m.id = r.mitgliedschaften_id where m.nachname = $1`,
      [NAME],
    )
    for (const r of [...new Set(reste.map((x) => x.id))])
      await api(admin, 'DELETE', `/api/kuendigungen/${r}`)
    await d.q(
      `delete from kuendigungen where konto_id in (select id from users where email = 'mitglied@bsv.test') and namen like $1`,
      [`%${NAME}%`],
    )
    await d.q(`delete from mitgliedschaften where nachname = $1`, [NAME])
  }
}
