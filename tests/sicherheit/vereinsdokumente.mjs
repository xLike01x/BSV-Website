/**
 * Mediathek-Ordner „Vereinsdokumente“: Nur Redaktion (bzw. Zusatzrecht „medien“) legt Dateien hinein oder heraus.
 * Trainer und Anonyme können den Ordner nicht setzen und Vereinsdokumente nicht ändern. Die Ordner bleiben eindeutig
 * (Team schließt Vereinsdokument aus, Vereinsdokument schließt Sponsoren-Logo aus).
 */
import { readFileSync } from 'fs'

import { api, B, login, pruefe } from './lib.mjs'

const verboten = (r) => r.s === 401 || r.s === 403

/** Echte, kleine PDF-Datei aus dem Projekt (Payload prüft PDFs beim Hochladen) */
const PDF = readFileSync(new URL('../../src/bsv/seed/vereinsdokumente/Abteilungsordnung-Fussball-Senioren-Entwurf-2015.pdf', import.meta.url))

async function hochladen(cookie, name, typ, inhalt, daten) {
  const fd = new FormData()
  fd.append('file', new Blob([inhalt], { type: typ }), name)
  fd.append('_payload', JSON.stringify(daten))
  const r = await fetch(B + '/api/media', { method: 'POST', headers: { Cookie: cookie }, body: fd })
  return { s: r.status, j: await r.json().catch(() => null) }
}

export default async function vereinsdokumente(d) {
  const red = await login('redaktion@bsv.test')
  const trainer = await login('trainer-f1-jugend@bsv.test')
  const zustand = async (id) => (await d.q('select team_id, allgemein, sponsoren, vereinsdokument from media where id=$1', [id]))[0]
  try {
    const dok = await hochladen(red, 'sicherheitstest-vereinsdokument.pdf', 'application/pdf', PDF, { alt: 'Testdokument', personen: 'keine', vereinsdokument: true })
    pruefe('Redaktion legt PDF direkt als Vereinsdokument an', dok.s === 201, dok.j?.errors ?? dok.s)
    if (dok.s !== 201) return
    const id = dok.j.doc.id
    let z = await zustand(id)
    pruefe('Vereinsdokument gilt als Vereinsdatei (allgemein), nicht Sponsoren', z.vereinsdokument === true && z.allgemein === true && !z.sponsoren && z.team_id === null, z)

    // Ordner-Abfrage der Mediathek findet es; „Verein allgemein“ und „Noch nicht zugeordnet“ nicht
    const imOrdner = await api(red, 'GET', '/api/media?where[and][0][vereinsdokument][equals]=true&where[and][1][team][exists]=false&depth=0&limit=200')
    pruefe('Ordner „Vereinsdokumente“ zeigt die Datei', (imOrdner.j?.docs ?? []).some((m) => m.id === id), imOrdner.s)
    const allg = await api(red, 'GET', '/api/media?where[and][0][allgemein][equals]=true&where[and][1][sponsoren][not_equals]=true&where[and][2][vereinsdokument][not_equals]=true&where[and][3][team][exists]=false&depth=0&limit=500')
    pruefe('Ordner „Verein allgemein“ zeigt sie nicht', allg.s === 200 && !(allg.j?.docs ?? []).some((m) => m.id === id), allg.s)

    // Trainer: Vereinsdokument nicht ändern, nicht herausnehmen, nicht in sein Team ziehen
    pruefe('Trainer: Vereinsdokument nicht ändern', verboten(await api(trainer, 'PATCH', `/api/media/${id}`, { alt: 'Geändert' })))
    pruefe('Trainer: nicht aus dem Ordner nehmen', verboten(await api(trainer, 'PATCH', `/api/media/${id}`, { vereinsdokument: false })))
    pruefe('Trainer: Vereinsdokument nicht löschen', verboten(await api(trainer, 'DELETE', `/api/media/${id}`)))
    z = await zustand(id)
    pruefe('Nach Trainer-Versuchen unverändert', z.vereinsdokument === true && z.team_id === null, z)

    // Anonym
    pruefe('Anonym: nicht ändern', verboten(await api('', 'PATCH', `/api/media/${id}`, { vereinsdokument: false })))
    const datei = await fetch(`${B}/api/media/file/sicherheitstest-vereinsdokument.pdf`)
    pruefe('Öffentliche Datei als PDF ausgeliefert', datei.status === 200 && (datei.headers.get('content-type') ?? '').includes('application/pdf'), datei.status)

    // Trainer-Upload: Feld wird ignoriert (Bild landet im eigenen Team), Team kann nicht auf „kein Team“ gesetzt werden
    const bild = await hochladen(trainer, 'sicherheitstest-trainer-dok.pdf', 'application/pdf', PDF, { alt: 'Trainer', personen: 'keine', vereinsdokument: true })
    pruefe('Trainer-Upload klappt', bild.s === 201, bild.j?.errors ?? bild.s)
    if (bild.s === 201) {
      const zb = await zustand(bild.j.doc.id)
      pruefe('Trainer kann nichts zum Vereinsdokument machen', zb.vereinsdokument !== true && zb.team_id !== null, zb)
      const raus = await api(trainer, 'PATCH', `/api/media/${bild.j.doc.id}`, { team: null, vereinsdokument: true })
      const zb2 = await zustand(bild.j.doc.id)
      // (Payload antwortet 200, setzt aber das eigene Team wieder ein und ignoriert das Feld)
      pruefe('Trainer: eigenes Bild nicht in „Vereinsdokumente“ verschieben', zb2.vereinsdokument !== true && zb2.team_id !== null, { s: raus.s, zb2 })
    }

    // Eindeutige Ordner bei Verschieben durch die Redaktion
    await api(red, 'PATCH', `/api/media/${id}`, { sponsoren: true })
    z = await zustand(id)
    pruefe('Als Sponsoren-Logo markiert → nicht mehr Vereinsdokument', z.sponsoren === true && z.vereinsdokument === false, z)
    await api(red, 'PATCH', `/api/media/${id}`, { team: null, allgemein: true, sponsoren: false, vereinsdokument: true })
    z = await zustand(id)
    pruefe('Redaktion zieht zurück nach „Vereinsdokumente“', z.vereinsdokument === true && z.sponsoren === false, z)
    const [team] = await d.q("select id from angebote order by id limit 1")
    await api(red, 'PATCH', `/api/media/${id}`, { team: team.id })
    z = await zustand(id)
    pruefe('Einem Team zugeordnet → nicht mehr Vereinsdokument', z.vereinsdokument === false && z.team_id === team.id, z)

    // „Satzung & Downloads“: PDFs ohne Ordner wandern automatisch nach „Vereinsdokumente“, Fotos nicht
    const lose = await hochladen(red, 'sicherheitstest-vereinsdokument-lose.pdf', 'application/pdf', PDF, { alt: 'Lose', personen: 'keine' })
    const sharp = (await import('sharp')).default
    const jpg = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#1b7a43' } }).jpeg().toBuffer()
    const foto = await hochladen(red, 'sicherheitstest-trainer-dok-foto.jpg', 'image/jpeg', jpg, { alt: 'Foto', personen: 'keine' })
    pruefe('Testdateien ohne Ordner angelegt', lose.s === 201 && foto.s === 201, [lose.s, foto.s])
    if (lose.s === 201 && foto.s === 201) {
      const vorher = await api(red, 'GET', '/api/globals/verein?depth=0')
      const alt = vorher.j?.downloads ?? []
      const neu = await api(red, 'POST', '/api/globals/verein', {
        downloads: [...alt, { titel: 'Sicherheitstest PDF', datei: lose.j.doc.id }, { titel: 'Sicherheitstest Foto', datei: foto.j.doc.id }],
      })
      try {
        pruefe('Redaktion trägt Downloads ein', neu.s === 200, neu.j?.errors ?? neu.s)
        const zl = await zustand(lose.j.doc.id)
        pruefe('PDF aus „Satzung & Downloads“ landet in „Vereinsdokumente“', zl.vereinsdokument === true && zl.allgemein === true, zl)
        const zf = await zustand(foto.j.doc.id)
        pruefe('Foto aus „Satzung & Downloads“ bleibt, wo es ist', zf.vereinsdokument !== true && zf.allgemein !== true, zf)
      } finally {
        const zurueck = await api(red, 'POST', '/api/globals/verein', { downloads: alt })
        pruefe('Downloads wiederhergestellt', zurueck.s === 200 && (zurueck.j?.result?.downloads ?? []).length === alt.length, zurueck.s)
      }
    }
  } finally {
    const reste = await d.q(`delete from media where filename like 'sicherheitstest-vereinsdokument%' or filename like 'sicherheitstest-trainer-dok%' returning *`).catch(() => [])
    const fs = await import('fs/promises')
    for (const row of reste) for (const [k, f] of Object.entries(row)) if (k.endsWith('filename') && f) await fs.rm(new URL(`../../medien/${f}`, import.meta.url), { force: true })
  }
}
