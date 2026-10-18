/**
 * Nimmt die Hilfe-Videos (public/hilfe/*.mp4) neu auf – z. B. nach Design-Änderungen.
 * NUR LOKAL mit Testdaten ausführen! Alles, was beim Aufnehmen angelegt wird, wird danach wieder gelöscht
 * bzw. auf den alten Stand zurückgesetzt.
 *
 * Braucht zwei Testkonten (mit eingerichteter Zwei-Faktor-Anmeldung):
 *   - Admin
 *   - Team-Redaktion mit genau einem eigenen Team
 *
 *   BSV_URL=http://localhost:3000 \
 *   BSV_ADMIN_EMAIL=… BSV_ADMIN_PASSWORT=… BSV_ADMIN_TOTP=<Geheimnis> \
 *   BSV_TEAM_EMAIL=…  BSV_TEAM_PASSWORT=…  BSV_TEAM_TOTP=<Geheimnis> \
 *   node scripts/hilfe-videos.mjs [name …]
 *
 * Ergebnis: hilfe-videos-roh/<name>.webm → mit ffmpeg nach public/hilfe/<name>.mp4 umwandeln (siehe README).
 * Voraussetzung: einmal `pnpm exec playwright install chromium` und ffmpeg.
 */
import crypto from 'crypto'
import fs from 'fs'
import { chromium } from '@playwright/test'

const OUT = process.env.BSV_VIDEO_OUT ?? 'hilfe-videos-roh'
const base = process.env.BSV_URL ?? 'http://localhost:3000'
const nur = process.argv.slice(2)
fs.mkdirSync(OUT, { recursive: true })

/* ---------- Anmeldung mit Zwei-Faktor ---------- */
function decode(s) {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const c of s.replace(/\s/g, '').toUpperCase()) bits += a.indexOf(c).toString(2).padStart(5, '0')
  const o = []
  for (let i = 0; i + 8 <= bits.length; i += 8) o.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(o)
}
function totp(secret, step) {
  const b = Buffer.alloc(8)
  b.writeBigUInt64BE(BigInt(step))
  const h = crypto.createHmac('sha1', decode(secret)).update(b).digest()
  const o = h[h.length - 1] & 15
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0')
}

const browser = await chromium.launch(process.env.BSV_CHROMIUM ? { executablePath: process.env.BSV_CHROMIUM } : {})

async function anmelden(prefix) {
  const ctx = await browser.newContext()
  const email = process.env[`BSV_${prefix}_EMAIL`]
  const password = process.env[`BSV_${prefix}_PASSWORT`]
  const secret = process.env[`BSV_${prefix}_TOTP`] ?? ''
  const r = await ctx.request.post(base + '/api/users/login', { data: { email, password } })
  if (!r.ok()) throw new Error(`Login ${prefix} fehlgeschlagen`)
  for (let k = 0; k < 3; k++) {
    const p = await ctx.request.post(base + '/api/users/zwei-faktor/pruefen', { data: { code: totp(secret, Math.floor(Date.now() / 30000)) } })
    if (p.ok()) break
    await new Promise((res) => setTimeout(res, 31000))
  }
  // Tour/Checkliste ausblenden, Seitenleiste offen
  for (const [key, value] of [['bsv-tour', { erledigt: true }], ['bsv-erste-schritte', { ausgeblendet: true }], ['nav', { open: true }]])
    await ctx.request.post(base + '/api/payload-preferences/' + key, { data: { value } })
  const state = await ctx.storageState()
  return { ctx, state }
}

const admin = await anmelden('ADMIN')
const team = await anmelden('TEAM')
const api = admin.ctx.request
const apiTeam = team.ctx.request

/* ---------- Mauszeiger + Untertitel ---------- */
const OVERLAY = `(()=>{const add=()=>{if(document.getElementById('pw-cursor'))return;
const c=document.createElement('div');c.id='pw-cursor';c.style.cssText='position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(21,122,67,.35);border:2px solid #157a43;pointer-events:none;transition:transform .12s;left:-50px;top:-50px';document.body.appendChild(c);
document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'},true);
document.addEventListener('mousedown',()=>{c.style.transform='scale(.6)'},true);document.addEventListener('mouseup',()=>{c.style.transform='scale(1)'},true);
const u=document.createElement('div');u.id='pw-untertitel';u.style.cssText='position:fixed;z-index:2147483646;left:50%;bottom:28px;transform:translateX(-50%);max-width:80%;padding:12px 22px;border-radius:14px;background:rgba(29,29,31,.88);color:#fff;font:600 20px/1.35 Geist,system-ui,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:opacity .25s;pointer-events:none';document.body.appendChild(u);
const t=sessionStorage.getItem('pw-untertitel');if(t){u.textContent=t;u.style.opacity='1'}
window.__untertitel=(text)=>{sessionStorage.setItem('pw-untertitel',text||'');u.textContent=text||'';u.style.opacity=text?'1':'0'}};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',add):add()})()`

async function aufnahme(name, wer, fn, aufraeumen) {
  if (nur.length && !nur.includes(name)) return
  const ctx = await browser.newContext({ storageState: wer.state, viewport: { width: 1440, height: 860 }, recordVideo: { dir: `${OUT}/tmp-${name}`, size: { width: 1440, height: 860 } } })
  await ctx.addInitScript(OVERLAY)
  const page = await ctx.newPage()
  const untertitel = async (text) => {
    await page.evaluate((t) => window.__untertitel?.(t), text).catch(() => {})
    await page.waitForTimeout(text ? 1400 : 200)
  }
  const zeige = async (loc) => {
    if (process.env.BSV_DEBUG) console.log('   zeige', String(loc).slice(0, 110))
    await loc.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {})
    const b = await loc.boundingBox({ timeout: 8000 }).catch(() => null)
    if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 })
    await page.waitForTimeout(300)
  }
  const klick = async (loc) => {
    if (process.env.BSV_DEBUG) console.log('   klick', String(loc).slice(0, 110))
    await zeige(loc)
    await loc.click()
    await page.waitForTimeout(600)
  }
  const tippe = async (loc, text, leeren = false) => {
    await klick(loc)
    if (leeren) {
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Delete')
    }
    await page.keyboard.type(text, { delay: 50 })
    await page.waitForTimeout(400)
  }
  const waehle = async (loc, suchtext) => {
    await klick(loc)
    if (suchtext) await page.keyboard.type(suchtext, { delay: 60 })
    await page.waitForTimeout(700)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(700)
  }
  const gehe = async (pfad) => {
    await page.goto(base + pfad, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    // Seitenleiste sicher öffnen
    if (!(await page.locator('.nav--nav-open').count())) {
      await page.locator('.nav-toggler').first().click().catch(() => {})
      await page.waitForTimeout(500)
    }
  }
  const h = { page, untertitel, zeige, klick, tippe, waehle, gehe }
  let ok = true
  try {
    await fn(h)
    await page.waitForTimeout(1200)
  } catch (e) {
    ok = false
    console.log(`${name}: FEHLER`, e.message.split('\n')[0])
  }
  const video = page.video()
  await ctx.close()
  fs.copyFileSync(await video.path(), `${OUT}/${name}.webm`)
  fs.rmSync(`${OUT}/tmp-${name}`, { recursive: true, force: true })
  if (aufraeumen) await aufraeumen(page.url?.() ?? '').catch((e) => console.log(`${name}: Aufräumen fehlgeschlagen`, e.message))
  console.log(`${name}: ${ok ? 'ok' : 'mit Fehler'}`)
}

const neueId = { wert: null }
const merkeId = (page) => {
  const m = page.url().match(/collections\/[^/]+\/(\d+)/)
  neueId.wert = m ? m[1] : null
}
const loesche = (coll, request = api) => async () => {
  if (neueId.wert) await request.delete(`${base}/api/${coll}/${neueId.wert}`)
  neueId.wert = null
}
const json = async (r) => (await r).json()

/* ================================================================== */
/* Team-Redaktion                                                      */
/* ================================================================== */

await aufnahme('news-schreiben', team, async ({ page, untertitel, klick, tippe, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „News“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'News' }).first())
  await untertitel('Oben auf „Neu erstellen“')
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first())
  await page.waitForLoadState('networkidle')
  await untertitel('1. Eine kurze Überschrift eingeben')
  await tippe(page.locator('#field-title'), 'Alte Herren gewinnen Freundschaftsspiel')
  await untertitel('2. Ein Titelbild auswählen')
  await klick(page.getByText('Aus vorhandenen auswählen').first())
  await page.waitForTimeout(1200)
  await klick(page.locator('.list-drawer tbody tr').first().locator('button, a').first())
  await untertitel('3. Den Text schreiben')
  await tippe(page.locator('[contenteditable="true"]').first(), 'Am Samstag haben die Alten Herren 3:1 gewonnen. Danke an alle Zuschauer!')
  await untertitel('Rechts siehst du, wo die News erscheinen wird')
  await page.mouse.move(1100, 330, { steps: 20 })
  await page.waitForTimeout(1500)
  await untertitel('4. „Entwurf speichern“ – oder gleich „Veröffentlichen“')
  await klick(page.locator('#action-save-draft'))
  await page.waitForTimeout(1500)
  merkeId(page)
  await untertitel('Fertig! Entwürfe sieht niemand außer euch.')
}, loesche('posts', apiTeam))

await aufnahme('ausfall-melden', team, async ({ page, untertitel, klick, tippe, waehle, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Trainingsausfälle“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'Trainingsausfälle' }).first())
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first())
  await page.waitForLoadState('networkidle')
  await untertitel('1. Dein Team auswählen')
  await waehle(page.locator('#field-angebot'))
  const d = new Date(Date.now() + 3 * 864e5)
  await untertitel('2. Das Datum eintragen')
  await tippe(page.locator('#field-datum input').first(), `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`)
  await page.keyboard.press('Escape')
  await untertitel('3. Den Grund auswählen')
  await waehle(page.locator('#field-grund'), 'Halle')
  await untertitel('Optional: ein Hinweis, z. B. ein Nachholtermin')
  await tippe(page.locator('#field-hinweis'), 'Nachholtermin am Freitag um 19 Uhr.')
  await untertitel('4. Speichern – der Hinweis steht sofort auf der Teamseite')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  merkeId(page)
}, loesche('ausfaelle', apiTeam))

await aufnahme('bilder-hochladen', team, async ({ page, untertitel, zeige, klick, tippe, waehle, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Mediathek“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'Mediathek' }).first())
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first())
  await page.waitForLoadState('networkidle')
  await untertitel('1. Foto auswählen oder hierher ziehen')
  await zeige(page.getByText('Datei auswählen').first())
  await page.locator('input[type=file]').first().setInputFiles('seed/bilder/hallenstadtmeister.jpg')
  await page.waitForTimeout(1500)
  await untertitel('2. Kurz beschreiben, was zu sehen ist')
  await tippe(page.locator('#field-alt'), 'Die Alten Herren mit dem Pokal')
  await untertitel('3. Optional: Team wählen und in die Galerie')
  await waehle(page.locator('#field-team'))
  await klick(page.locator('#field-inGalerie'))
  await untertitel('4. Speichern')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(2000)
  merkeId(page)
  await untertitel('Fertig! Das Bild steht jetzt überall zur Auswahl.')
}, loesche('media', apiTeam))

/* Trainingszeiten: eigenes Team, danach alter Stand */
const eigenesTeam = (await json(apiTeam.get(`${base}/api/users/me`))).user
const teamId = (await json(api.get(`${base}/api/angebote?where[leitung][contains]=${eigenesTeam.id}&limit=1&depth=0`))).docs[0]?.id
const zeitenVorher = teamId ? (await json(api.get(`${base}/api/angebote/${teamId}?depth=0`))).zeiten : []

await aufnahme('trainingszeiten', team, async ({ page, untertitel, klick, tippe, waehle, gehe, zeige }) => {
  await gehe('/admin')
  await untertitel('Links auf „Teams & Kurse“, dann dein Team öffnen')
  await klick(page.locator('.nav__link', { hasText: 'Teams & Kurse' }).first())
  await gehe(`/admin/collections/angebote/${teamId}`)
  await untertitel('Nach unten zu „Trainingszeiten“')
  const knopf = page.getByRole('button', { name: /Termin hinzufügen/ }).first()
  await zeige(knopf)
  await untertitel('„Termin hinzufügen“ klicken')
  await klick(knopf)
  const n = Array.isArray(zeitenVorher) ? zeitenVorher.length : 0
  await untertitel('Tag, Uhrzeit und Ort eintragen')
  await waehle(page.locator(`#field-zeiten__${n}__tag`), 'Mittwoch')
  await tippe(page.locator(`#field-zeiten__${n}__von`), '19:00')
  await tippe(page.locator(`#field-zeiten__${n}__bis`), '20:30')
  await tippe(page.locator(`#field-zeiten__${n}__ort`), 'Kutscher-Remy-Sportpark')
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  await untertitel('Die neue Zeit steht sofort auf der Teamseite.')
}, async () => {
  if (teamId) await api.patch(`${base}/api/angebote/${teamId}`, { data: { zeiten: zeitenVorher } })
})

/* ================================================================== */
/* Admin / Redaktion                                                   */
/* ================================================================== */

await aufnahme('seite-bausteine', admin, async ({ page, untertitel, klick, tippe, gehe }) => {
  await gehe('/admin/collections/pages/create')
  await page.waitForURL(/pages\/\d+/, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  merkeId(page)
  await untertitel('1. Einen Titel für die Seite eingeben')
  await tippe(page.locator('#field-title'), 'Sommerfest 2027')
  await untertitel('2. Reiter „Inhalt (Bausteine)“ öffnen')
  await klick(page.getByRole('button', { name: /Inhalt \(Bausteine\)/ }).first())
  await untertitel('3. „Baustein hinzufügen“ klicken')
  await klick(page.getByRole('button', { name: /Baustein hinzufügen/ }).first())
  await page.waitForTimeout(800)
  await untertitel('4. Eine Art wählen, z. B. „Text (in Spalten)“')
  await klick(page.locator('.blocks-drawer__block').filter({ hasText: 'Text (in Spalten)' }).first().locator('button').first())
  await untertitel('5. Baustein aufklappen, „Spalte hinzufügen“ und Text schreiben')
  const zu = page.locator('.collapsible--collapsed > .collapsible__toggle-wrap .collapsible__toggle')
  if (await zu.count()) await klick(zu.last())
  await klick(page.getByRole('button', { name: /Spalte hinzufügen/ }).first())
  await page.waitForTimeout(600)
  if (await zu.count()) await klick(zu.last())
  const editor = page.locator('[contenteditable="true"]').last()
  await tippe(editor, 'Am 5. Juli feiern wir auf dem Sportplatz – mit Grill, Hüpfburg und Fußballturnier für Kinder!')
  await untertitel('Weitere Bausteine genauso hinzufügen – am Griff links verschieben')
  await page.mouse.move(380, 300, { steps: 20 })
  await page.waitForTimeout(1500)
  await untertitel('Mit dem Bildschirm-Symbol oben siehst du die Seite als Vorschau')
  await page.mouse.move(1000, 90, { steps: 20 })
  await page.waitForTimeout(1500)
}, async () => {
  if (neueId.wert) await api.delete(`${base}/api/pages/${neueId.wert}`)
  neueId.wert = null
  // Durch das automatische Zwischenspeichern entstandene leere Entwürfe entfernen
  const leer = await json(api.get(`${base}/api/pages?where[title][exists]=false&draft=true&depth=0&limit=20`))
  for (const d of leer.docs ?? []) await api.delete(`${base}/api/pages/${d.id}`)
  const r = await json(api.get(`${base}/api/pages?where[title][equals]=Sommerfest 2027&draft=true&depth=0`))
  for (const d of r.docs ?? []) await api.delete(`${base}/api/pages/${d.id}`)
})

const menueVorher = await json(api.get(`${base}/api/globals/menue?depth=0`))
const menueZurueck = async () => {
  const ohneIds = (l) => (l ?? []).map(({ id, ...r }) => ({ ...r, eintraege: r.eintraege?.map(({ id: _i, ...e }) => e) }))
  await api.post(`${base}/api/globals/menue`, {
    data: { links: ohneIds(menueVorher.links), vereinUeberUns: ohneIds(menueVorher.vereinUeberUns), vereinMehr: ohneIds(menueVorher.vereinMehr), fusszeile: ohneIds(menueVorher.fusszeile) },
  })
}
await aufnahme('menue-link', admin, async ({ page, untertitel, klick, tippe, waehle, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Menü & Fußzeile“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'Menü' }).first())
  await page.waitForURL('**/globals/menue', { timeout: 15000 }).catch(() => gehe('/admin/globals/menue'))
  await page.waitForTimeout(1200)
  await untertitel('Ganz unten „Eintrag hinzufügen“ klicken')
  await klick(page.getByRole('button', { name: /Eintrag hinzufügen/ }).first())
  const n = (menueVorher.links ?? []).length
  // Neue Zeile aufklappen
  const neu = page.locator('#field-links .array-field__row').last()
  if (await neu.locator('.collapsible--collapsed').count().then((c) => c > 0).catch(() => false) || (await neu.getAttribute('class'))?.includes('collapsed'))
    await klick(neu.locator('.collapsible__toggle').first())
  await untertitel('Text eingeben, so heißt der Link auf der Website')
  await tippe(page.locator(`#field-links__${n}__label`), 'Kunstrasen')
  await untertitel('Die Seite auswählen')
  await waehle(page.locator(`#field-links__${n}__seite`), 'Kunst')
  await untertitel('Speichern – der Link steht danach oben im Menü')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, menueZurueck)

await aufnahme('menue-reihenfolge', admin, async ({ page, untertitel, klick, zeige, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Menü & Fußzeile“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'Menü' }).first())
  await page.waitForURL('**/globals/menue', { timeout: 15000 }).catch(() => gehe('/admin/globals/menue'))
  await page.waitForTimeout(1200)
  await untertitel('Oben in der Liste = links auf der Website')
  const zeile = (text) => page.locator('#field-links .array-field__row').filter({ has: page.locator('.array-field__row-header', { hasText: new RegExp('^' + text + '$') }) }).first()
  await zeige(zeile('News'))
  await untertitel('Den Eintrag am Griff links (⋮⋮) anfassen …')
  const g = await zeile('News').locator('.collapsible__drag').first().boundingBox()
  const ziel = await zeile('Fußball').boundingBox()
  if (g && ziel) {
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2, { steps: 12 })
    await page.mouse.down()
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 - 8, { steps: 4 })
    await untertitel('… und nach oben ziehen')
    await page.mouse.move(g.x + g.width / 2, ziel.y + 4, { steps: 40 })
    await page.waitForTimeout(500)
    await page.mouse.up()
  }
  await page.waitForTimeout(800)
  await untertitel('Entfernen: drei Punkte rechts am Eintrag → „Entfernen“')
  await zeige(zeile('Kunstrasen').locator('.array-actions__button').first())
  await page.waitForTimeout(800)
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, menueZurueck)

/* Verantwortliche: an einem anderen Angebot zeigen, danach alter Stand */
const anderes = (await json(api.get(`${base}/api/angebote?where[slug][equals]=yoga&limit=1&depth=0`))).docs[0]
await aufnahme('team-verantwortliche', admin, async ({ page, untertitel, klick, zeige, waehle, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Teams & Kurse“ und das Team öffnen')
  await klick(page.locator('.nav__link', { hasText: 'Teams & Kurse' }).first())
  await gehe(`/admin/collections/angebote/${anderes.id}`)
  await untertitel('Nach unten zu „Verantwortliche“')
  await zeige(page.locator('#field-leitung'))
  await untertitel('Die Person auswählen (sie braucht ein Konto mit Rolle Übungsleitung)')
  await waehle(page.locator('#field-leitung'), 'Tom')
  await untertitel('Speichern – ab jetzt darf die Person dieses Team pflegen')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  await api.patch(`${base}/api/angebote/${anderes.id}`, { data: { leitung: (anderes.leitung ?? []).map((l) => (typeof l === 'object' ? l.id : l)) } })
})

const vereinVorher = await json(api.get(`${base}/api/globals/verein?depth=0`))
await aufnahme('vorstand', admin, async ({ page, untertitel, klick, tippe, zeige, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Vereinsdaten“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'Vereinsdaten' }).first())
  const knopf = page.getByRole('button', { name: /Person hinzufügen/ }).first()
  await untertitel('Nach unten zu „Vorstand und Ansprechpersonen“')
  await zeige(knopf)
  await untertitel('„Person hinzufügen“ klicken')
  await klick(knopf)
  const n = (vereinVorher.vorstand ?? []).length
  await untertitel('Name und Funktion eintragen')
  await tippe(page.locator(`#field-vorstand__${n}__name`), 'Erika Musterfrau')
  await tippe(page.locator(`#field-vorstand__${n}__rolle`), 'Jugendwartin')
  await untertitel('Reihenfolge: am Griff links ziehen')
  await page.mouse.move(80, 380, { steps: 10 })
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  await api.post(`${base}/api/globals/verein`, { data: { vorstand: vereinVorher.vorstand ?? [] } })
})

await aufnahme('startseite-bilder', admin, async ({ page, untertitel, klick, zeige, gehe }) => {
  await gehe('/admin/globals/verein')
  await untertitel('In den Vereinsdaten nach unten zu „Startseite“')
  // Zum Feld scrollen und Positionen direkt im Browser bestimmen
  // Payload zeichnet Felder erst, wenn sie ins Bild kommen – darum schrittweise nach unten scrollen
  await page.mouse.move(700, 450)
  for (let i = 0; i < 40 && !(await page.getByText('Bilder oben').first().isVisible().catch(() => false)); i++) {
    await page.mouse.wheel(0, 260)
    await page.waitForTimeout(140)
  }
  const hin = async (text, teil = 'label') =>
    page.evaluate(
      ([t, art]) => {
        const el = [...document.querySelectorAll('*')].find((e) => e.childElementCount <= 1 && e.textContent?.trim().startsWith(t) && e.getBoundingClientRect().height > 0)
        if (!el) return null
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
        const feld = el.closest('.field-type') ?? el.parentElement
        const ziel = art === 'x' ? [...(feld?.querySelectorAll('button') ?? [])].pop() ?? el : el
        const r = ziel.getBoundingClientRect()
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
      },
      [text, teil],
    )
  const fahre = async (p) => {
    if (p) await page.mouse.move(p.x, p.y, { steps: 20 })
    await page.waitForTimeout(600)
  }
  await fahre(await hin('Bilder oben (4 Stück)'))
  await untertitel('Ganz oben auf der Startseite: bis zu 4 große Bilder')
  await page.waitForTimeout(1200)
  await fahre(await hin('Kachel Fußball'))
  await untertitel('Darunter die Bilder der Kacheln Fußball, Kids und Fitness')
  await page.waitForTimeout(1000)
  await fahre(await hin('Kachel Fußball', 'x'))
  await untertitel('Austauschen: mit dem × das alte Bild entfernen …')
  await page.waitForTimeout(1500)
  await untertitel('… dann „Aus vorhandenen auswählen“ und ein neues Bild wählen')
  await page.waitForTimeout(1800)
  await fahre(await hin('Aktion auf der Startseite (grüne Box)'))
  await untertitel('Weiter unten: die grüne Aktions-Box der Startseite')
  await page.waitForTimeout(1500)
  await untertitel('Zum Schluss oben rechts „Speichern“')
  await zeige(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  await api.post(`${base}/api/globals/verein`, { data: { startseite: vereinVorher.startseite } })
})

const texteVorher = await json(api.get(`${base}/api/globals/texte?depth=0`))
await aufnahme('website-texte', admin, async ({ page, untertitel, klick, tippe, zeige, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Website-Texte“ klicken')
  await klick(page.locator('.nav__link', { hasText: 'Website-Texte' }).first())
  await untertitel('Oben den Reiter wählen – hier „Startseite“')
  await zeige(page.locator('.tabs-field__tabs, [class*="tabs-field"]').first())
  await untertitel('Den Text im Feld ändern')
  await tippe(page.locator('#field-heroText'), 'Fußball, Tanz, Turnen und Fitness – für alle Generationen.', true)
  await untertitel('Platzhalter wie {mitglieder} bitte stehen lassen')
  await page.waitForTimeout(800)
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  await api.post(`${base}/api/globals/texte`, { data: texteVorher })
})

await aufnahme('konto-anlegen', admin, async ({ page, untertitel, klick, tippe, waehle, gehe }) => {
  await gehe('/admin')
  await untertitel('Links auf „Benutzer“, dann „Neu erstellen“')
  await klick(page.locator('.nav__link', { hasText: 'Benutzer' }).first())
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first())
  await page.waitForLoadState('networkidle')
  await untertitel('E-Mail und ein vorläufiges Passwort eintragen')
  await tippe(page.locator('#field-email'), 'neue.uebungsleitung@beispiel.test')
  await tippe(page.locator('#field-password'), 'Vorlaeufig-2026!')
  await tippe(page.locator('#field-confirm-password'), 'Vorlaeufig-2026!')
  await untertitel('Name eintragen und die Rolle wählen')
  await tippe(page.locator('#field-name'), 'Erika Beispiel')
  await waehle(page.locator('#field-roles'), 'Übungs')
  await untertitel('Speichern – danach beim Team als „Verantwortliche“ eintragen')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  merkeId(page)
}, async () => {
  const r = await json(api.get(`${base}/api/users?where[email][equals]=neue.uebungsleitung@beispiel.test&depth=0`))
  for (const d of r.docs ?? []) await api.delete(`${base}/api/users/${d.id}`)
})

/* Mitgliedsantrag: Testantrag (nur Testdaten, Beispiel-IBAN) anlegen, danach löschen */
if (!nur.length || nur.includes('antrag-bearbeiten')) {
  const anonym = await browser.newContext()
  const r = await anonym.request.post(`${base}/api/mitgliedsantraege`, {
    data: {
      vorname: 'Max', nachname: 'Beispiel-Video', geburtsdatum: '1990-05-01', email: 'max@beispiel.test', strasse: 'Musterweg 1', plz: '46487', ort: 'Wesel',
      mitgliedsart: 'aktiv', kontoinhaber: 'Max Beispiel', iban: 'DE89370400440532013000', sepaMandat: true, satzungAkzeptiert: true, website: '',
    },
  })
  if (!r.ok()) console.log('Testantrag konnte nicht angelegt werden:', r.status(), (await r.text()).slice(0, 200))
  await anonym.close()
}
await aufnahme('antrag-bearbeiten', admin, async ({ page, untertitel, klick, waehle, gehe, zeige }) => {
  await gehe('/admin')
  await untertitel('Auf der Übersicht siehst du offene Anträge – oder links „Mitgliedsanträge“')
  await zeige(page.locator('.bsv-dash__karte', { hasText: 'Mitgliedsanträge' }).first())
  await klick(page.locator('.nav__link', { hasText: 'Mitgliedsanträge' }).first())
  await untertitel('Den Antrag mit Status „Neu“ öffnen')
  await klick(page.locator('.table tbody tr').first().locator('a').first())
  await untertitel('Angaben prüfen: Personen, Angebote, Beitrag, Bankverbindung')
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(1500)
  await page.mouse.wheel(0, -500)
  await untertitel('Nach der Übernahme den Status auf „Aufgenommen“ setzen')
  await waehle(page.locator('#field-status'), 'Aufgen')
  await untertitel('Speichern')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  const r = await json(api.get(`${base}/api/mitgliedsantraege?where[nachname][equals]=Beispiel-Video&depth=0`))
  for (const d of r.docs ?? []) await api.delete(`${base}/api/mitgliedsantraege/${d.id}`)
})

await aufnahme('formular-bauen', admin, async ({ page, untertitel, klick, tippe, gehe }) => {
  await gehe('/admin/collections/forms/create')
  await untertitel('1. Einen Namen vergeben (nur intern)')
  await tippe(page.locator('#field-title'), 'Anmeldung Sommerfest')
  await untertitel('2. Felder hinzufügen, z. B. ein Textfeld für den Namen')
  await klick(page.locator('#field-fields').getByRole('button', { name: /hinzufügen/ }).first())
  await page.waitForTimeout(800)
  await klick(page.getByText(/^Text$/).last())
  await page.waitForTimeout(800)
  await untertitel('Für jedes Feld: Bezeichnung und ob es Pflicht ist')
  await tippe(page.locator('#field-fields input[id$="__name"]').last(), 'name')
  await tippe(page.locator('#field-fields input[id$="__label"]').last(), 'Dein Name')
  await untertitel('3. Den Text auf dem Button festlegen')
  await tippe(page.locator('#field-submitButtonLabel'), 'Anmelden')
  await untertitel('4. Die Danke-Nachricht nach dem Absenden')
  await tippe(page.locator('[contenteditable="true"]').last(), 'Danke! Wir haben deine Anmeldung erhalten.')
  await untertitel('5. Speichern – dann auf einer Seite den Baustein „Formular“ einfügen')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  merkeId(page)
}, loesche('forms'))

await browser.close()
