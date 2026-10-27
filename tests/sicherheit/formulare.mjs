import { api, pruefe } from './lib.mjs'

const ip = () => ({ 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}` })
const basis = {
  vorname: 'Sicherheitstest',
  nachname: 'Formular',
  geburtsdatum: '1990-05-05',
  email: 'sicherheitstest-antrag@bsv.test',
  geschlecht: 'd',
  strasse: 'Teststraße 1',
  plz: '41470',
  ort: 'Neuss',
  mitgliedsart: 'aktiv',
  kontoinhaber: 'Sicherheitstest',
  iban: 'DE89370400440532013000',
  sepaMandat: true,
  satzungAkzeptiert: true,
}

/** F-18: Server prüft öffentliche Formulare selbst */
export default async function formulare(d) {
  const [team] = await d.q(`select id from angebote where aktiv is not false limit 1`)
  const antrag = (extra) => api(null, 'POST', '/api/mitgliedsantraege', { ...basis, ...extra }, ip())
  try {
    pruefe('Antrag: Geburtsdatum in der Zukunft → 400', (await antrag({ geburtsdatum: '2031-05-05' })).s === 400)
    pruefe('Antrag: PLZ „abc“ → 400', (await antrag({ plz: 'abc' })).s === 400)
    pruefe('Antrag: Vorname mit 4.000 Zeichen → 400', (await antrag({ vorname: 'a'.repeat(4000) })).s === 400)
    pruefe('Antrag: Familie ohne Familienmitglied → 400', (await antrag({ mitgliedsart: 'familie' })).s === 400)
    pruefe('Antrag: Erwachsene mit Jugendtarif → 400', (await antrag({ mitgliedsart: 'jugend' })).s === 400)
    pruefe('Antrag: passiv mit Teams → 400', (await antrag({ mitgliedsart: 'passiv', angebote: [team.id] })).s === 400)
    const ok = await antrag({ angebote: [team.id] })
    pruefe('Antrag: gültige Angaben → 201', ok.s === 201, ok.j)
    // Beitrittserklärung: Geschlecht Pflicht (auch je Familienmitglied), Einwilligungen werden gespeichert
    pruefe('Antrag: ohne Geschlecht → 400', (await antrag({ geschlecht: undefined })).s === 400)
    pruefe('Antrag: Geschlecht „x“ → 400', (await antrag({ geschlecht: 'x' })).s === 400)
    pruefe('Antrag: Familienmitglied ohne Geschlecht → 400', (await antrag({ mitgliedsart: 'familie', familienmitglieder: [{ vorname: 'Kind' }] })).s === 400)
    const fam = await antrag({ mitgliedsart: 'familie', familienmitglieder: [{ vorname: 'Kind', geburtsdatum: '2012-03-03', geschlecht: 'm' }], fotoEinwilligung: true, fotoSocialMedia: false, fotoPresse: true, fotoKindEinverstanden: true, kontaktEinwilligung: true })
    pruefe('Antrag: Familie mit Geschlecht und Einwilligungen → 201', fam.s === 201, fam.j)
    if (fam.j?.doc?.id) {
      const [z] = await d.q('select geschlecht, foto_einwilligung, foto_social_media, foto_presse, foto_kind_einverstanden, kontakt_einwilligung from mitgliedsantraege where id=$1', [fam.j.doc.id])
      pruefe('Antrag: Geschlecht und Einwilligungen gespeichert', z?.geschlecht === 'd' && z.foto_einwilligung === true && z.foto_social_media === false && z.foto_presse === true && z.foto_kind_einverstanden === true && z.kontakt_einwilligung === true, z)
      const [g] = await d.q('select geschlecht from mitgliedsantraege_familienmitglieder where _parent_id=$1', [fam.j.doc.id])
      pruefe('Antrag: Geschlecht des Familienmitglieds gespeichert', g?.geschlecht === 'm', g)
    }
    const k = (extra) => api(null, 'POST', '/api/kontaktanfragen', { name: 'Sicherheitstest', email: 'sicherheitstest-antrag@bsv.test', betreff: 'x', nachricht: 'Test', ...extra }, ip())
    pruefe('Kontakt: Datenschutz-Haken „false“ → 400', (await k({ datenschutz: false })).s === 400)
    pruefe('Kontakt: ohne Datenschutz-Haken → 400', (await k({})).s === 400)
    const p = await api(null, 'POST', '/api/probetraining', { name: 'Sicherheitstest', email: 'sicherheitstest-antrag@bsv.test', angebot: team.id, datenschutz: false }, ip())
    pruefe('Probetraining: Datenschutz-Haken „false“ → 400', p.s === 400, p.j)
    // Formular-Baukasten
    const red = await (await import('./lib.mjs')).login('redaktion@bsv.test')
    const lex = { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [{ type: 'text', text: 'Danke', format: 0, mode: 'normal', style: '', detail: 0, version: 1 }] }] } }
    const f = await api(red, 'POST', '/api/forms', { title: 'Sicherheitstest-Formular', fields: [{ blockType: 'text', name: 'vorname', label: 'Vorname', required: true }, { blockType: 'email', name: 'email', label: 'E-Mail', required: true }], confirmationType: 'message', confirmationMessage: lex, emails: [{ emailTo: '{{email}}', cc: '{{email}}', subject: 'Test', message: lex }] })
    const formId = f.j?.doc?.id
    pruefe('Testformular angelegt', Boolean(formId), f.j)
    if (formId) {
      const ein = (daten) => api(null, 'POST', '/api/form-submissions', { form: formId, submissionData: daten }, ip())
      pruefe('Baukasten: Pflichtfeld fehlt → 400', (await ein([{ field: 'email', value: 'a@bsv.test' }])).s === 400)
      const ok = await ein([{ field: 'vorname', value: 'Test' }, { field: 'email', value: 'a@bsv.test' }, { field: 'fremd', value: 'eingeschmuggelt' }])
      pruefe('Baukasten: gültiger Eingang → 201', ok.s === 201, ok.j)
      const [row] = await d.q(`select count(*)::int n from form_submissions_submission_data where _parent_id=$1 and field='fremd'`, [ok.j?.doc?.id ?? 0])
      pruefe('Baukasten: fremde Felder werden verworfen', row?.n === 0, row)
    }
  } finally {
    await d.q(`delete from form_submissions where form_id in (select id from forms where title='Sicherheitstest-Formular')`).catch(() => {})
    await d.q(`delete from forms where title='Sicherheitstest-Formular'`).catch(() => {})
    await d.q(`delete from mitgliedsantraege where email='sicherheitstest-antrag@bsv.test'`)
    await d.q(`delete from kontaktanfragen where email='sicherheitstest-antrag@bsv.test'`)
    await d.q(`delete from probetraining where email='sicherheitstest-antrag@bsv.test'`)
  }
}
