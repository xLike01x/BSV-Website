/**
 * Nimmt die Hilfe-Videos (public/hilfe/*.mp4 + Vorschaubild *.jpg) neu auf – z. B. nach Änderungen an der Verwaltung.
 * NUR LOKAL mit Testdaten ausführen! Alles, was beim Aufnehmen angelegt wird, wird danach wieder gelöscht
 * bzw. auf den alten Stand zurückgesetzt.
 *
 * Konten: standardmäßig die lokalen Testkonten (Rollen & Rechte → Testkonten anlegen), z. B. admin@bsv.test.
 * Andere Konten über BSV_<ROLLE>_EMAIL / _PASSWORT / _TOTP (Zwei-Faktor-Geheimnis, nur nötig, wenn 2FA aktiv ist).
 * Rollen: ADMIN, REDAKTION, KASSE, TEAM (Trainer mit genau einem Team).
 *
 *   BSV_URL=http://localhost:3000 node scripts/hilfe-videos.mjs [name …]
 *   BSV_FERTIG=1 …   → wandelt danach mit ffmpeg nach public/hilfe/<name>.mp4 und .jpg um
 *
 * Voraussetzung: Chromium für Playwright (oder BSV_CHROMIUM=<Pfad>) und ffmpeg.
 */
import crypto from 'crypto'
import { execFileSync } from 'child_process'
import fs from 'fs'
import { chromium } from '@playwright/test'

const OUT = process.env.BSV_VIDEO_OUT ?? 'hilfe-videos-roh'
const base = process.env.BSV_URL ?? 'http://localhost:3000'
const nur = process.argv.slice(2)
const soll = (name) => !nur.length || nur.includes(name)
fs.mkdirSync(OUT, { recursive: true })

/* ---------- Anmeldung (optional mit Zwei-Faktor) ---------- */
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
const STANDARD = { ADMIN: 'admin@bsv.test', REDAKTION: 'redaktion@bsv.test', KASSE: 'kasse@bsv.test', TEAM: 'trainer-f1-jugend@bsv.test' }

async function anmelden(prefix) {
  const ctx = await browser.newContext()
  const email = process.env[`BSV_${prefix}_EMAIL`] ?? STANDARD[prefix]
  const password = process.env[`BSV_${prefix}_PASSWORT`] ?? 'BSV-Test-2026!'
  const secret = process.env[`BSV_${prefix}_TOTP`]
  const r = await ctx.request.post(base + '/api/users/login', { data: { email, password } })
  if (!r.ok()) throw new Error(`Login ${prefix} (${email}) fehlgeschlagen`)
  if (secret)
    for (let k = 0; k < 3; k++) {
      const p = await ctx.request.post(base + '/api/users/zwei-faktor/pruefen', { data: { code: totp(secret, Math.floor(Date.now() / 30000)) } })
      if (p.ok()) break
      await new Promise((res) => setTimeout(res, 31000))
    }
  // Tour/Checkliste ausblenden, Seitenleiste offen, Einstiegs-Kästen zugeklappt (ruhigeres Bild)
  for (const [key, value] of [['bsv-tour', { erledigt: true }], ['bsv-erste-schritte', { ausgeblendet: true }], ['nav', { open: true }], ['bsv-hilfe-gesehen', { gesehen: true }]])
    await ctx.request.post(base + '/api/payload-preferences/' + key, { data: { value } })
  const me = (await (await ctx.request.get(base + '/api/users/me')).json()).user
  return { ctx, state: await ctx.storageState(), api: ctx.request, me }
}

const admin = await anmelden('ADMIN')
const redaktion = await anmelden('REDAKTION')
const kasse = await anmelden('KASSE')
const team = await anmelden('TEAM')
const api = admin.api
const json = async (r) => (await r).json()
const anonym = async (pfad, data) => {
  const c = await browser.newContext()
  const r = await c.request.post(base + pfad, { data, headers: { 'X-Real-IP': `198.51.100.${Math.floor(Math.random() * 200) + 20}` } })
  const j = await r.json().catch(() => ({}))
  await c.close()
  if (!r.ok()) console.log(`Testdaten ${pfad} fehlgeschlagen:`, r.status(), JSON.stringify(j).slice(0, 200))
  return j.doc?.id ?? null
}
const teamId = (await json(api.get(`${base}/api/angebote?where[leitung][contains]=${team.me.id}&limit=1&depth=0`))).docs[0]?.id

/* ---------- Mauszeiger + Untertitel ---------- */
const OVERLAY = `(()=>{const add=()=>{if(document.getElementById('pw-cursor'))return;
const st=document.createElement('style');st.textContent='nextjs-portal{display:none!important}';document.head.appendChild(st);
const c=document.createElement('div');c.id='pw-cursor';c.style.cssText='position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(21,122,67,.35);border:2px solid #157a43;pointer-events:none;transition:transform .12s;left:-50px;top:-50px';document.body.appendChild(c);
document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'},true);
document.addEventListener('mousedown',()=>{c.style.transform='scale(.6)'},true);document.addEventListener('mouseup',()=>{c.style.transform='scale(1)'},true);
const u=document.createElement('div');u.id='pw-untertitel';u.style.cssText='position:fixed;z-index:2147483646;left:50%;bottom:28px;transform:translateX(-50%);max-width:80%;padding:12px 22px;border-radius:14px;background:rgba(29,29,31,.88);color:#fff;font:600 20px/1.35 Geist,system-ui,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:opacity .25s;pointer-events:none';document.body.appendChild(u);
const t=sessionStorage.getItem('pw-untertitel');if(t){u.textContent=t;u.style.opacity='1'}
window.__untertitel=(text)=>{sessionStorage.setItem('pw-untertitel',text||'');u.textContent=text||'';u.style.opacity=text?'1':'0'}};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',add):add()})()`

const ergebnisse = []
/** Beim Aufräumen nur löschen, was seit dem Start dieses Skripts entstanden ist */
const START = new Date(Date.now() - 60000).toISOString()
const seitStart = `where[createdAt][greater_than]=${encodeURIComponent(START)}`
async function aufnahme(name, wer, fn, aufraeumen) {
  if (!soll(name)) return
  const ctx = await browser.newContext({ storageState: wer.state, viewport: { width: 1440, height: 860 }, recordVideo: { dir: `${OUT}/tmp-${name}`, size: { width: 1440, height: 860 } } })
  await ctx.addInitScript(OVERLAY)
  const page = await ctx.newPage()
  // Ab wann ist die erste Seite fertig geladen? Davor ist das Video leer – wird beim Umwandeln abgeschnitten
  const beginn = Date.now()
  let schnitt = null
  const untertitel = async (text, ms = 1500) => {
    await page.evaluate((t) => window.__untertitel?.(t), text).catch(() => {})
    await page.waitForTimeout(text ? ms : 200)
  }
  const zeige = async (loc) => {
    if (process.env.BSV_DEBUG) console.log('   zeige', String(loc).slice(0, 110))
    await loc.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {})
    const b = await loc.boundingBox({ timeout: 8000 }).catch(() => null)
    if (b) await page.mouse.move(b.x + b.width / 2, b.y + Math.min(b.height / 2, 20), { steps: 18 })
    await page.waitForTimeout(350)
  }
  const klick = async (loc) => {
    if (process.env.BSV_DEBUG) console.log('   klick', String(loc).slice(0, 110))
    await zeige(loc)
    await loc.click({ timeout: 10000 })
    await page.waitForTimeout(700)
  }
  const tippe = async (loc, text, leeren = false) => {
    await klick(loc)
    if (leeren) {
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Delete')
    }
    await page.keyboard.type(text, { delay: 45 })
    await page.waitForTimeout(400)
  }
  const waehle = async (loc, suchtext) => {
    await klick(loc)
    if (suchtext) await page.keyboard.type(suchtext, { delay: 60 })
    await page.waitForTimeout(800)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(700)
  }
  const gehe = async (pfad) => {
    await page.goto(base + pfad, { waitUntil: 'load', timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(900)
    if (!(await page.locator('.nav--nav-open').count())) {
      await page.locator('.nav-toggler').first().click().catch(() => {})
      await page.waitForTimeout(500)
    }
    if (schnitt === null) schnitt = Math.max(0.8, (Date.now() - beginn) / 1000 - 0.6)
  }
  const menue = async (text) => {
    await klick(page.locator('.nav__link', { hasText: text }).first())
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(900)
  }
  /** „Neu erstellen“ in der Liste */
  const neu = async () => {
    await klick(page.locator('.list-create-new-doc__create-new-button, a.btn, button.btn').filter({ hasText: /^\s*Neu erstellen\s*$/ }).first())
    await page.waitForURL(/\/create|\/\d+$/, { timeout: 30000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
  }
  /** Eintrag in der Liste öffnen (optional die Zeile mit diesem Text) */
  const oeffne = async (text) => {
    const zeilen = page.locator('.table tbody tr')
    const zeile = text ? zeilen.filter({ hasText: text }).first() : zeilen.first()
    await klick(zeile.locator('a').first())
    await page.waitForURL(/\/collections\/[^/]+\/\d+/, { timeout: 30000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1000)
  }
  /** Menüpunkt links nur zeigen (die Seite ist schon geöffnet – spart das langsame Dashboard) */
  const menueZeigen = async (text) => {
    await zeige(page.locator('.nav__link', { hasText: text }).first())
    await page.waitForTimeout(400)
  }
  const h = { page, untertitel, zeige, klick, tippe, waehle, gehe, menue, neu, oeffne, menueZeigen }
  let ok = true
  try {
    await fn(h)
    await page.waitForTimeout(1300)
  } catch (e) {
    ok = false
    console.log(`${name}: FEHLER`, e.message.split('\n')[0])
    await page.screenshot({ path: `${OUT}/${name}-fehler.png` }).catch(() => {})
  }
  const video = page.video()
  await ctx.close()
  fs.copyFileSync(await video.path(), `${OUT}/${name}.webm`)
  fs.rmSync(`${OUT}/tmp-${name}`, { recursive: true, force: true })
  if (aufraeumen) await aufraeumen().catch((e) => console.log(`${name}: Aufräumen fehlgeschlagen`, e.message))
  console.log(`${name}: ${ok ? 'ok' : 'mit Fehler'}`)
  ergebnisse.push({ name, ok, schnitt: schnitt ?? 0.8 })
}

/** Endgültig löschen: über die API (Papierkorb) und – nur als Web-Admin möglich – aus dem Web-Admin-Papierkorb */
const weg = (coll, id, request = api) => (id ? request.delete(`${base}/api/${coll}/${id}`) : null)
const neueIdAus = (page) => page.url().match(/collections\/[^/]+\/(\d+)/)?.[1] ?? null

/* ================================================================== */
/* Trainer / Team-Redaktion                                            */
/* ================================================================== */

let newsId = null
await aufnahme('news-schreiben', team, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, gehe, menue }) => {
  await gehe('/admin/collections/posts')
  await untertitel('Links auf „News“ klicken')
  await menueZeigen('News')
  await untertitel('Oben eine Vorlage wählen – oder „Neu erstellen“ für eine leere News')
  await zeige(page.locator('.bsv-einstieg').first())
  await neu()
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await untertitel('1. Eine kurze Überschrift eingeben')
  await tippe(page.locator('#field-title'), 'F1 gewinnt Hallenturnier in Neuss')
  await untertitel('2. Ein Titelbild auswählen')
  await klick(page.getByText('Aus vorhandenen auswählen').first())
  await page.waitForTimeout(1200)
  await klick(page.locator('.list-drawer tbody tr').first().locator('button, a').first())
  await untertitel('3. Den Text schreiben – wer, was, wann, wo')
  await tippe(page.locator('[contenteditable="true"]').first(), 'Am Samstag hat unsere F1 das Hallenturnier in Neuss gewonnen. Im Finale stand es 2:1 gegen den TuS Grefrath. Danke an alle Eltern fürs Anfeuern!')
  await untertitel('Rechts prüft der Kasten „Vor dem Veröffentlichen“, ob alles passt', 2200)
  await zeige(page.locator('.bsv-hinweise').first())
  await untertitel('Soll die News auch auf die Startseite? Hier vorschlagen', 1800)
  await klick(page.locator('#field-startseiteVorschlag'))
  await untertitel('4. „Veröffentlichen“ – oder erst „Entwurf speichern“')
  await zeige(page.locator('#action-save'))
  await klick(page.locator('#action-save-draft'))
  await page.waitForTimeout(1500)
  newsId = neueIdAus(page)
  await untertitel('Fertig! Die Redaktion sieht deinen Vorschlag auf ihrer Übersicht.', 2200)
}, async () => {
  const r = await json(api.get(`${base}/api/posts?where[title][equals]=${encodeURIComponent('F1 gewinnt Hallenturnier in Neuss')}&draft=true&depth=0`))
  for (const d of r.docs ?? []) await weg('posts', d.id)
  void newsId
})

/* Ausfall: der schnelle Weg direkt über der Liste */
await aufnahme('ausfall-melden', team, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe, menue }) => {
  await gehe('/admin/collections/ausfaelle')
  await untertitel('Links auf „Trainingsausfälle“ klicken')
  await menueZeigen('Trainingsausfälle')
  await untertitel('Oben im Kasten „Schnell melden“ ausfüllen')
  const f = page.locator('.bsv-ausfall').first()
  await zeige(f)
  await untertitel('1. Team wählen (ist bei einem Team schon gewählt)')
  await zeige(f.locator('select').first())
  await untertitel('2. Tag antippen – Heute, Morgen oder ein Datum')
  await klick(f.locator('.bsv-ausfall__tage button').nth(1))
  await untertitel('3. Den Grund wählen')
  await zeige(f.locator('select').nth(1))
  await f.locator('select').nth(1).selectOption({ index: 1 }).catch(() => {})
  await page.waitForTimeout(800)
  await untertitel('4. „Ausfall melden“ – steht sofort auf der Teamseite und im Mitgliederbereich', 2200)
  await klick(f.locator('.bsv-ausfall__senden'))
  await page.waitForTimeout(1800)
  await untertitel('Mehr Angaben (z. B. Nachholtermin)? Den Eintrag in der Liste öffnen.', 2200)
}, async () => {
  const heute = new Date(Date.now() - 864e5).toISOString()
  const r = await json(api.get(`${base}/api/ausfaelle?where[and][0][angebot][equals]=${teamId}&where[and][1][createdAt][greater_than]=${encodeURIComponent(new Date(Date.now() - 10 * 60000).toISOString())}&depth=0&limit=5`))
  for (const d of r.docs ?? []) await weg('ausfaelle', d.id)
  void heute
})

let bildId = null
await aufnahme('bilder-hochladen', team, async ({ page, neu, oeffne, menueZeigen, untertitel, zeige, klick, tippe, waehle, gehe, menue }) => {
  await gehe('/admin/collections/media')
  await untertitel('Links auf „Mediathek“ klicken')
  await menueZeigen('Mediathek')
  await neu()
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await untertitel('1. Foto auswählen oder hierher ziehen')
  await zeige(page.getByText('Datei auswählen').first())
  await page.locator('input[type=file]').first().setInputFiles('seed/bilder/hallenstadtmeister.jpg')
  await page.waitForTimeout(1500)
  await untertitel('2. Kurz beschreiben, was zu sehen ist')
  await tippe(page.locator('#field-alt'), 'Die F1 jubelt mit dem Pokal')
  await untertitel('3. Pflicht: Sind Personen zu erkennen? Kinderfotos nur mit Einwilligung der Eltern', 2400)
  await klick(page.locator('#field-personen label, [id^="field-personen"] label').nth(1))
  await untertitel('4. Rechts bei „Ordner (Team / Kurs)“ dein Team wählen', 2000)
  await waehle(page.locator('#field-team'), 'F1')
  await untertitel('5. Speichern')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(2000)
  bildId = neueIdAus(page)
  await untertitel('Fertig! Das Bild steht jetzt für News und Galerie zur Auswahl.', 2000)
}, async () => {
  const r = await json(api.get(`${base}/api/media?${seitStart}&where[filename][like]=hallenstadtmeister&depth=0&limit=20`))
  for (const d of r.docs ?? []) await weg('media', d.id)
  void bildId
})

const zeitenVorher = teamId ? (await json(api.get(`${base}/api/angebote/${teamId}?depth=0`))).zeiten : []
await aufnahme('trainingszeiten', team, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, waehle, gehe, zeige, menue }) => {
  await gehe('/admin/collections/angebote')
  await untertitel('Links auf „Teams & Kurse“, dann dein Team öffnen')
  await menueZeigen('Teams & Kurse')
  await gehe(`/admin/collections/angebote/${teamId}`)
  await untertitel('Nach unten zu „Trainingszeiten“')
  const knopf = page.getByRole('button', { name: /Termin hinzufügen/ }).first()
  await zeige(knopf)
  await untertitel('„Termin hinzufügen“ klicken')
  await klick(knopf)
  const n = Array.isArray(zeitenVorher) ? zeitenVorher.length : 0
  await untertitel('Tag, Uhrzeit und Ort eintragen')
  await waehle(page.locator(`#field-zeiten__${n}__tag`), 'Mittwoch')
  await tippe(page.locator(`#field-zeiten__${n}__von`), '17:00')
  await tippe(page.locator(`#field-zeiten__${n}__bis`), '18:30')
  await tippe(page.locator(`#field-zeiten__${n}__ort`), 'Kunstrasen Büderich')
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  await untertitel('Die neue Zeit steht sofort auf der Teamseite und im Wochenplan.', 2000)
}, async () => {
  if (teamId) await api.patch(`${base}/api/angebote/${teamId}`, { data: { zeiten: zeitenVorher } })
})

/* Probetraining-Anfrage beantworten (Trainer) */
let probeId = null
if (soll('anfrage-beantworten')) probeId = await anonym('/api/probetraining', { name: 'Sabine Beispiel', email: 'sabine@beispiel.test', teilnehmer: 'Leon', alter: 7, angebot: teamId, wunschtermin: 'Nächsten Dienstag', nachricht: 'Leon würde gern einmal mittrainieren. Was muss er mitbringen?', datenschutz: true })
await aufnahme('anfrage-beantworten', team, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, gehe, waehle, menue }) => {
  await gehe('/admin/collections/probetraining')
  await untertitel('Neue Anfragen siehst du oben links an der orangen Zahl')
  await menueZeigen('Probetraining')
  await untertitel('Die neue Anfrage öffnen')
  await oeffne()
  await untertitel('1. „Ich kümmere mich“ – dann sehen alle, dass du dran bist', 2000)
  await klick(page.getByRole('button', { name: /Ich kümmere mich/ }))
  await untertitel('2. „Antworten“ öffnet dein E-Mail-Programm – oder „Anrufen“', 2200)
  await zeige(page.getByRole('link', { name: /Antworten/ }))
  await untertitel('3. Kurz notieren, was ausgemacht ist')
  await tippe(page.locator('#bsv-notiz'), 'Zugesagt für Dienstag 17 Uhr, Schienbeinschoner mitbringen.')
  await klick(page.getByRole('button', { name: /Notiz speichern/ }))
  await untertitel('4. Status setzen, z. B. „Zugesagt“, und speichern')
  await waehle(page.locator('#field-status'), 'Zuge')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  await untertitel('Notizen und Status stehen mit Name und Uhrzeit im Verlauf.', 2200)
  await zeige(page.locator('.bsv-posteingang__verlauf'))
}, async () => {
  await weg('probetraining', probeId)
})

/* ================================================================== */
/* Redaktion                                                           */
/* ================================================================== */

let vorschlagId = null
if (soll('vorschlag-annehmen')) {
  const lex = { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [{ type: 'text', text: 'Unsere F1 hat das Hallenturnier gewonnen.', format: 0, mode: 'normal', style: '', detail: 0, version: 1 }] }] } }
  const r = await team.api.post(`${base}/api/posts`, { data: { title: 'F1 gewinnt Hallenturnier', content: lex, team: teamId, _status: 'published', startseiteVorschlag: true } })
  vorschlagId = (await r.json()).doc?.id ?? null
}
await aufnahme('vorschlag-annehmen', redaktion, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe }) => {
  await gehe('/admin')
  await untertitel('Trainer können ihre News für die Startseite vorschlagen', 2000)
  await zeige(page.locator('.bsv-dash__vorschlaege'))
  await untertitel('Ein Klick auf den Titel öffnet die News zum Lesen', 2000)
  await zeige(page.locator('.bsv-dash__vorschlaege li a').first())
  await untertitel('Passt sie? „Auf die Startseite“ – sonst „Nein, danke“', 2200)
  await klick(page.locator('.bsv-dash__vorschlaege li').first().getByRole('button', { name: 'Auf die Startseite' }))
  await page.waitForTimeout(1200)
  await untertitel('Fertig – die News steht jetzt auch auf der Startseite.', 2200)
}, async () => {
  await weg('posts', vorschlagId)
})

await aufnahme('termin-anlegen', redaktion, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, gehe, menue }) => {
  await gehe('/admin/collections/termine')
  await untertitel('Links auf „Termine“ klicken')
  await menueZeigen('Termine')
  await untertitel('Oben eine Vorlage wählen, z. B. „Vereinsfest“', 2000)
  const vorlage = page.locator('.bsv-einstieg button, .bsv-einstieg a').filter({ hasText: 'Vereinsfest' }).first()
  await zeige(vorlage)
  await klick(vorlage)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1200)
  await untertitel('Die Felder sind schon ausgefüllt – Titel und Datum anpassen', 2200)
  await tippe(page.locator('#field-title'), 'Sommerfest 2027', true)
  await zeige(page.locator('#field-beginn'))
  await untertitel('Rechts siehst du, ob der Termin für alle oder nur für Mitglieder sichtbar ist', 2200)
  await zeige(page.locator('.bsv-hinweise').first())
  await untertitel('„Speichern“ – der Termin steht sofort im Kalender', 2000)
  await zeige(page.locator('#action-save'))
}, null)

let kontaktId = null
if (soll('kontakt-beantworten')) kontaktId = await anonym('/api/kontaktanfragen', { name: 'Peter Beispiel', email: 'peter@beispiel.test', betreff: 'Frage zum Mitgliedsbeitrag', nachricht: 'Hallo, gibt es einen Familienbeitrag, wenn zwei Kinder im Verein sind?', datenschutz: true })
await aufnahme('kontakt-beantworten', redaktion, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, gehe, waehle, menue }) => {
  await gehe('/admin/collections/kontaktanfragen')
  await untertitel('Links unter „Posteingang“ auf „Kontaktanfragen“')
  await menueZeigen('Kontaktanfragen')
  await untertitel('Die neue Nachricht öffnen')
  await oeffne()
  await untertitel('1. „Ich kümmere mich“')
  await klick(page.getByRole('button', { name: /Ich kümmere mich/ }))
  await untertitel('2. „Antworten“ – Adresse und Betreff sind schon eingetragen', 2200)
  await zeige(page.getByRole('link', { name: /Antworten/ }))
  await untertitel('3. Kurz notieren, was du geantwortet hast')
  await tippe(page.locator('#bsv-notiz'), 'Familienbeitrag erklärt, Link zum Antrag geschickt.')
  await klick(page.getByRole('button', { name: /Notiz speichern/ }))
  await untertitel('4. Status „Erledigt“ und speichern')
  await waehle(page.locator('#field-status'), 'Erled')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  await weg('kontaktanfragen', kontaktId)
})

let seiteId = null
await aufnahme('seite-bausteine', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, gehe }) => {
  await gehe('/admin/collections/pages/create')
  await page.waitForURL(/pages\/\d+/, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  seiteId = neueIdAus(page)
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
  const spalte = page.locator('.array-field__row').filter({ hasText: 'Spalte 01' }).first()
  await spalte.waitFor({ timeout: 10000 })
  await page.waitForTimeout(800)
  if (!(await spalte.locator('[contenteditable="true"]').isVisible().catch(() => false))) await klick(spalte.locator('.collapsible__toggle').first())
  await tippe(spalte.locator('[contenteditable="true"]').first(), 'Am 5. Juli feiern wir auf dem Sportplatz – mit Grill, Hüpfburg und Fußballturnier für Kinder!')
  await untertitel('Weitere Bausteine genauso hinzufügen – am Griff links verschieben', 2000)
  await page.mouse.move(380, 300, { steps: 20 })
  await untertitel('Mit dem Bildschirm-Symbol oben siehst du die Seite als Vorschau', 2000)
  await page.mouse.move(1000, 90, { steps: 20 })
  await page.waitForTimeout(1200)
}, async () => {
  if (seiteId) await api.delete(`${base}/api/pages/${seiteId}`)
  // Auch leere Entwürfe, die beim Öffnen von „Neu“ automatisch entstehen – nur die aus diesem Lauf
  for (const w of [`where[title][equals]=${encodeURIComponent('Sommerfest 2027')}`, 'where[title][exists]=false']) {
    const r = await json(api.get(`${base}/api/pages?${w}&${seitStart}&draft=true&depth=0&limit=50`))
    for (const d of r.docs ?? []) await api.delete(`${base}/api/pages/${d.id}`)
  }
})

const menueVorher = await json(api.get(`${base}/api/globals/menue?depth=0`))
const menueZurueck = async () => {
  const ohneIds = (l) => (l ?? []).map(({ id: _id, ...r }) => ({ ...r, eintraege: r.eintraege?.map(({ id: _i, ...e }) => e) }))
  await api.post(`${base}/api/globals/menue`, {
    data: { links: ohneIds(menueVorher.links), vereinUeberUns: ohneIds(menueVorher.vereinUeberUns), vereinMehr: ohneIds(menueVorher.vereinMehr), fusszeile: ohneIds(menueVorher.fusszeile) },
  })
}
await aufnahme('menue-link', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, waehle, gehe, menue }) => {
  await gehe('/admin/globals/menue')
  await untertitel('Links unter „Website-Aufbau“ auf „Menü & Fußzeile“')
  await menueZeigen('Menü & Fußzeile')
  await untertitel('Reiter „Hauptmenü oben“')
  await klick(page.locator('.tabs-field__tab-button', { hasText: 'Hauptmenü oben' }))
  await untertitel('Ganz unten „Eintrag hinzufügen“ klicken')
  await klick(page.getByRole('button', { name: /Eintrag hinzufügen/ }).first())
  const n = (menueVorher.links ?? []).length
  const zeileNeu = page.locator('#field-links .array-field__row').filter({ hasText: `Eintrag ${n + 1}` }).first()
  await zeileNeu.waitFor({ timeout: 10000 })
  await page.waitForTimeout(800)
  if (!(await page.locator(`#field-links__${n}__label`).isVisible().catch(() => false))) await klick(zeileNeu.locator('.collapsible__toggle').first())
  await untertitel('Text eingeben – so heißt der Link auf der Website')
  await tippe(page.locator(`#field-links__${n}__label`), 'Kunstrasen')
  await untertitel('Die Seite auswählen')
  await waehle(page.locator(`#field-links__${n}__seite`), 'Kunst')
  await untertitel('Speichern – der Link steht danach oben im Menü')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, menueZurueck)

await aufnahme('menue-reihenfolge', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe, menue }) => {
  await gehe('/admin/globals/menue')
  await untertitel('Links auf „Menü & Fußzeile“')
  await menueZeigen('Menü & Fußzeile')
  await klick(page.locator('.tabs-field__tab-button', { hasText: 'Hauptmenü oben' }))
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
  await untertitel('Entfernen: drei Punkte rechts am Eintrag → „Entfernen“', 2000)
  await zeige(zeile('News').locator('.array-actions__button').first())
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, menueZurueck)

const texteVorher = await json(api.get(`${base}/api/globals/texte?depth=0`))
await aufnahme('startseite-bilder', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, zeige, gehe, menue }) => {
  await gehe('/admin/globals/texte')
  await untertitel('Links unter „Website-Aufbau“ auf „Texte & Bilder“')
  await menueZeigen('Texte & Bilder')
  await untertitel('Reiter „Startseite“ – ganz oben „Bilder oben und Kachel-Bilder“', 2200)
  await zeige(page.locator('#field-heroBilder').first())
  await untertitel('Bis zu 4 große Bilder ganz oben auf der Startseite', 2000)
  await untertitel('Austauschen: mit dem × das alte Bild entfernen …', 2000)
  await zeige(page.locator('#field-heroBilder button').filter({ hasText: '' }).first())
  await untertitel('… dann „Aus vorhandenen auswählen“ und ein neues Bild wählen', 2200)
  await zeige(page.locator('#field-heroBilder').getByText('Aus vorhandenen auswählen').first())
  await untertitel('Darunter die Bilder der Kacheln Fußball, Kids und Fitness', 2000)
  await zeige(page.locator('#field-bildFussball').first())
  await untertitel('Zum Schluss oben rechts „Speichern“', 2000)
  await zeige(page.locator('#action-save'))
}, null)

await aufnahme('website-texte', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, gehe, menue }) => {
  await gehe('/admin/globals/texte')
  await untertitel('Links auf „Texte & Bilder“ klicken')
  await menueZeigen('Texte & Bilder')
  await untertitel('Oben den Reiter wählen – Startseite, Fußball, Verein …', 2000)
  await zeige(page.locator('.tabs-field__tabs').first())
  await untertitel('Den Text im Feld ändern')
  await tippe(page.locator('#field-heroText'), 'Fußball, Tanz, Turnen und Fitness am Rhein – mit über {mitglieder} Mitgliedern.', true)
  await untertitel('Platzhalter in {geschweiften Klammern} bitte stehen lassen – dort setzt die Website Zahlen ein', 2400)
  await untertitel('Oben rechts „Speichern“')
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  const { id: _i, updatedAt: _u, createdAt: _c, globalType: _g, ...daten } = texteVorher
  await api.post(`${base}/api/globals/texte`, { data: daten })
})

let formId = null
await aufnahme('formular-bauen', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, gehe }) => {
  await gehe('/admin/collections/forms')
  await untertitel('Am einfachsten: oben eine Vorlage wählen, z. B. „Anmeldung zu einer Veranstaltung“', 2400)
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
  await untertitel('5. Speichern – danach „Neue Seite mit diesem Formular erstellen“', 2200)
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
  formId = neueIdAus(page)
  await page.locator('.bsv-hinweise').first().scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(1500)
}, async () => {
  const r = await json(api.get(`${base}/api/forms?${seitStart}&where[title][equals]=${encodeURIComponent('Anmeldung Sommerfest')}&depth=0&limit=20`))
  for (const d of r.docs ?? []) await weg('forms', d.id)
  void formId
})

/* ================================================================== */
/* Kasse                                                               */
/* ================================================================== */

let antragId = null
if (soll('antrag-bearbeiten'))
  antragId = await anonym('/api/mitgliedsantraege', {
    vorname: 'Max', nachname: 'Beispiel', geburtsdatum: '1990-05-01', email: 'max@beispiel.test', telefon: '02131 123456', strasse: 'Musterweg 1', plz: '41460', ort: 'Neuss',
    mitgliedsart: 'aktiv', angebote: teamId ? [teamId] : [], kontoinhaber: 'Max Beispiel', iban: 'DE89370400440532013000', sepaMandat: true, satzungAkzeptiert: true, fotoEinwilligung: true, website: '',
  })
await aufnahme('antrag-bearbeiten', kasse, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe, menue }) => {
  await gehe('/admin/collections/mitgliedsantraege')
  await untertitel('Neue Anträge siehst du oben auf der Übersicht – oder links „Mitgliedsanträge“', 2200)
  await menueZeigen('Mitgliedsanträge')
  await untertitel('Den Antrag mit Status „Neu“ öffnen')
  await oeffne()
  await untertitel('1. „Ich kümmere mich“ – so bearbeitet niemand denselben Antrag doppelt', 2200)
  await klick(page.getByRole('button', { name: /Ich kümmere mich/ }))
  await untertitel('2. Der Kasten „Antrag prüfen“ zeigt Alter, Beitrag, IBAN und doppelte Anträge', 2600)
  await zeige(page.locator('.bsv-pruefung'))
  await page.mouse.wheel(0, 260)
  await page.waitForTimeout(1200)
  await untertitel('3. Passt alles? „Aufnehmen“ klicken')
  await klick(page.getByRole('button', { name: /Aufnehmen/ }).first())
  await untertitel('Die Willkommens-Mail ist schon geschrieben – hier kannst du sie noch anpassen', 2600)
  await zeige(page.locator('.bsv-pruefung__dialog textarea'))
  await untertitel('4. Bestätigen – die Mitgliedschaft für den Ausweis wird automatisch angelegt', 2400)
  await klick(page.locator('.bsv-pruefung__dialog button').first())
  await page.waitForTimeout(3500)
  await untertitel('Im Verlauf steht, wer was wann gemacht hat.', 2200)
  await zeige(page.locator('.bsv-posteingang__verlauf'))
}, async () => {
  if (antragId) {
    const m = await json(api.get(`${base}/api/mitgliedschaften?where[antrag][equals]=${antragId}&depth=0`))
    for (const d of m.docs ?? []) await weg('mitgliedschaften', d.id)
  }
  await weg('mitgliedsantraege', antragId)
})

let exportIds = []
if (soll('antraege-exportieren')) {
  for (const [vorname, nachname] of [['Lisa', 'Beispiel'], ['Tom', 'Muster']]) {
    const id = await anonym('/api/mitgliedsantraege', { vorname, nachname, geburtsdatum: '1985-02-02', email: `${vorname.toLowerCase()}@beispiel.test`, strasse: 'Musterweg 2', plz: '41460', ort: 'Neuss', mitgliedsart: 'passiv', kontoinhaber: `${vorname} ${nachname}`, iban: 'DE89370400440532013000', sepaMandat: true, satzungAkzeptiert: true, website: '' })
    if (id) {
      exportIds.push(id)
      await kasse.api.post(`${base}/api/mitgliedsantraege/${id}/entscheidung`, { data: { status: 'aufgenommen' } })
    }
  }
}
await aufnahme('antraege-exportieren', kasse, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe, menue }) => {
  await gehe('/admin/collections/mitgliedsantraege')
  await menueZeigen('Mitgliedsanträge')
  await untertitel('Oben in der Liste: „Für die Kasse“', 2000)
  await zeige(page.locator('.bsv-export'))
  await untertitel('„… neue exportieren“ lädt alle aufgenommenen, noch nicht exportierten Anträge', 2600)
  await klick(page.locator('.bsv-export button').first())
  await page.waitForTimeout(1800)
  await untertitel('Die Datei öffnet sich in Excel – ohne Bankdaten, eine Zeile pro Person', 2600)
  await zeige(page.locator('.bsv-export [role=status]'))
  await untertitel('Beim nächsten Mal kommen nur neue Anträge dazu. Datei nach dem Übertragen löschen!', 2800)
}, async () => {
  for (const id of exportIds) {
    const m = await json(api.get(`${base}/api/mitgliedschaften?where[antrag][equals]=${id}&depth=0`))
    for (const d of m.docs ?? []) await weg('mitgliedschaften', d.id)
    await weg('mitgliedsantraege', id)
  }
})

/* ================================================================== */
/* Admin                                                               */
/* ================================================================== */

await aufnahme('konto-anlegen', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, waehle, gehe, menue }) => {
  await gehe('/admin/collections/users')
  await untertitel('Links unter „Mitglieder“ auf „Benutzer“, dann „Neu erstellen“', 2000)
  await menueZeigen('Benutzer')
  await neu()
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await untertitel('1. Name und E-Mail eintragen')
  await tippe(page.locator('#field-name'), 'Erika Beispiel')
  await tippe(page.locator('#field-email'), 'erika.beispiel@beispiel.test')
  await untertitel('2. Ein vorläufiges Passwort vergeben')
  await tippe(page.locator('#field-password'), 'Vorlaeufig-2027!')
  await tippe(page.locator('#field-confirm-password'), 'Vorlaeufig-2027!')
  await untertitel('3. Rollen ankreuzen – hier „Trainer“', 2000)
  await klick(page.locator('.bsv-rollen-kacheln label', { hasText: 'Trainer' }).first())
  await untertitel('4. Direkt darunter: für welche Teams? („Team-Berechtigungen“)', 2400)
  await waehle(page.locator('#field-teamsVerantwortlich'), 'F1')
  await untertitel('Oben zeigt „Was darf diese Person?“ in Klartext, was die Rollen erlauben', 2600)
  await zeige(page.locator('.bsv-wasdarf, [class*="wasdarf"]').first())
  await untertitel('5. Speichern – die Person richtet beim ersten Login die Zwei-Faktor-Anmeldung ein', 2600)
  await klick(page.locator('#action-save'))
  await page.waitForTimeout(1500)
}, async () => {
  const r = await json(api.get(`${base}/api/users?where[email][equals]=erika.beispiel@beispiel.test&depth=0`))
  for (const d of r.docs ?? []) await api.delete(`${base}/api/users/${d.id}`)
})

/* Bestehendem Konto Team-Rechte geben (statt früher „Verantwortliche“ beim Team) */
const passwesenKonto = (await json(api.get(`${base}/api/users?where[email][equals]=passwesen@bsv.test&depth=0`))).docs[0]
await aufnahme('team-verantwortliche', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, waehle, gehe, menue }) => {
  await gehe('/admin/collections/users')
  await untertitel('Links auf „Benutzer“ und die Person öffnen')
  await menueZeigen('Benutzer')
  await gehe(`/admin/collections/users/${passwesenKonto.id}`)
  await untertitel('Unter „Rollen“: „Trainer“ (oder „Team-Redaktion“) ankreuzen', 2200)
  await klick(page.locator('.bsv-rollen-kacheln label', { hasText: 'Trainer' }).first())
  await untertitel('Direkt darunter bei „Team-Berechtigungen“ das Team wählen', 2200)
  await waehle(page.locator('#field-teamsVerantwortlich'), 'F1')
  await untertitel('„Teams & Kurse“ weiter unten ist nur, wo die Person selbst mitspielt – gibt keine Rechte', 2800)
  await zeige(page.locator('#field-angebote'))
  await untertitel('Speichern – ab jetzt darf die Person dieses Team pflegen', 2000)
  await zeige(page.locator('#action-save'))
}, null)

const vereinVorher = await json(api.get(`${base}/api/globals/verein?depth=0`))
await aufnahme('vorstand', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, tippe, zeige, gehe, menue }) => {
  await gehe('/admin/globals/verein')
  await untertitel('Links unter „Einstellungen“ auf „Vereinsdaten“')
  await menueZeigen('Vereinsdaten')
  const knopf = page.getByRole('button', { name: /Person hinzufügen/ }).first()
  await untertitel('Nach unten zu „Vorstand und Ansprechpersonen“')
  await zeige(knopf)
  await untertitel('„Person hinzufügen“ klicken')
  await klick(knopf)
  const n = (vereinVorher.vorstand ?? []).length
  await untertitel('Name und Funktion eintragen')
  await tippe(page.locator(`#field-vorstand__${n}__name`), 'Erika Musterfrau')
  await tippe(page.locator(`#field-vorstand__${n}__rolle`), 'Jugendwartin')
  await untertitel('Reihenfolge: am Griff links ziehen', 1800)
  await untertitel('Oben rechts „Speichern“')
  await zeige(page.locator('#action-save'))
}, null)

let regId = null
if (soll('registrierung-freigeben')) {
  const r = await api.post(`${base}/api/users`, { data: { email: 'jan.beispiel@beispiel.test', name: 'Jan Beispiel', password: 'Beispiel-2027!', roles: ['mitglied'], freigegeben: false, registriertUeber: 'website', emailBestaetigt: true } })
  regId = (await r.json()).doc?.id ?? null
  if (!regId) console.log('Testregistrierung konnte nicht angelegt werden')
}
await aufnahme('registrierung-freigeben', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe, menue }) => {
  await gehe('/admin/registrierungen')
  await untertitel('Neue Registrierungen: links unter „Posteingang“', 2000)
  await menueZeigen('Registrierungen')
  await untertitel('Prüfen: Kennst du die Person? Ist die E-Mail bestätigt?', 2400)
  await zeige(page.locator('.bsv-reg__kopf').first())
  await untertitel('Teams anhaken, in denen die Person mitmacht – Wünsche sind markiert', 2400)
  await zeige(page.locator('.bsv-reg__teams').first())
  await untertitel('„Freigeben“ – die Person bekommt eine E-Mail und kann sich anmelden', 2400)
  await klick(page.locator('.bsv-reg__ja').first())
  await page.waitForTimeout(1500)
  await untertitel('Den Ausweis bekommt sie über „Mitgliedschaften“ (gleiche E-Mail wird automatisch verknüpft).', 2800)
}, async () => {
  if (regId) await api.delete(`${base}/api/users/${regId}`)
})

let korbId = null
if (soll('papierkorb')) {
  korbId = await anonym('/api/kontaktanfragen', { name: 'Versehentlich Gelöscht', email: 'geloescht@beispiel.test', betreff: 'Bitte zurückholen', nachricht: 'Diese Nachricht wurde aus Versehen gelöscht.', datenschutz: true })
  // So wie „Löschen“ in der Liste: in den Papierkorb des Bereichs (nicht endgültig)
  if (korbId) await api.patch(`${base}/api/kontaktanfragen/${korbId}`, { data: { deletedAt: new Date().toISOString() } })
}
await aufnahme('papierkorb', admin, async ({ page, neu, oeffne, menueZeigen, untertitel, klick, zeige, gehe, menue }) => {
  await gehe('/admin/collections/kontaktanfragen')
  await untertitel('Etwas aus Versehen gelöscht? Die Liste des Bereichs öffnen', 2200)
  await menueZeigen('Kontaktanfragen')
  await untertitel('Oben rechts auf „Papierkorb“')
  await klick(page.getByRole('link', { name: 'Papierkorb' }).or(page.getByRole('button', { name: 'Papierkorb' })).first())
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await untertitel('Den Eintrag öffnen …')
  await oeffne('Bitte zurückholen')
  await untertitel('… und „Wiederherstellen“ klicken. 30 Tage lang geht das.', 2400)
  const w = page.getByRole('button', { name: /Wiederherstellen/ }).first()
  await klick(w)
  await page.waitForTimeout(800)
  const best = page.locator('.confirmation-modal button, [role=dialog] button').filter({ hasText: /Wiederherstellen|Bestätigen/ }).first()
  if (await best.count()) await klick(best)
  await page.waitForTimeout(1500)
  await untertitel('Fertig – der Eintrag ist wieder da.', 2000)
}, async () => {
  // So wie „Löschen“ in der Liste: in den Papierkorb des Bereichs (nicht endgültig)
  if (korbId) await api.patch(`${base}/api/kontaktanfragen/${korbId}`, { data: { deletedAt: new Date().toISOString() } })
})

let saisonTeam = null
await aufnahme('saisonwechsel', admin, async ({ page, menueZeigen, untertitel, klick, zeige, gehe }) => {
  await gehe('/admin/saisonwechsel')
  await page.waitForSelector('.bsv-saison__liste', { timeout: 30000 })
  await untertitel('Einmal im Jahr: links unter „Sport“ auf „Saisonwechsel“', 2200)
  await menueZeigen('Saisonwechsel')
  await untertitel('Zuerst „Neue Saison beginnen“ – das setzt die Häkchen vom letzten Jahr zurück', 2600)
  await zeige(page.getByRole('button', { name: /Neue Saison beginnen/ }))
  await untertitel('Jedes Team auf einen Blick: Verantwortliche, Trainingszeiten, Bilder', 2400)
  const erste = page.locator('.bsv-saison__liste > li').first()
  await zeige(erste)
  await untertitel('⚠️ zeigt, was auffällt – z. B. keine Zeiten oder ein Trainer, der lange nicht da war', 2800)
  await zeige(erste.locator('.bsv-saison__hinweise').or(erste.locator('.bsv-saison__name')).first())
  await untertitel('Auf den Namen klicken, im Team anpassen, speichern – und zurück', 2600)
  await zeige(erste.locator('.bsv-saison__name a'))
  await untertitel('Passt alles? Links das Häkchen setzen', 2000)
  saisonTeam = Number((await erste.locator('.bsv-saison__name a').getAttribute('href'))?.split('/').pop())
  await klick(erste.locator('input[type=checkbox]'))
  await page.waitForTimeout(1200)
  await untertitel('„Nur noch nicht geprüfte“ zeigt, was noch fehlt', 2200)
  await klick(page.getByLabel('Nur noch nicht geprüfte'))
  await page.waitForTimeout(600)
  await untertitel('Zum Schluss „Saisonwechsel abschließen“', 2200)
  await zeige(page.getByRole('button', { name: /abschließen/ }))
}, async () => {
  if (saisonTeam) await api.post(`${base}/api/globals/wartung/saison`, { data: { aktion: 'pruefen', id: saisonTeam, geprueft: false } })
})

await browser.close()

/* ---------- Umwandeln (optional) ---------- */
if (process.env.BSV_FERTIG) {
  for (const { name, ok, schnitt } of ergebnisse) {
    if (!ok) continue
    const roh = `${OUT}/${name}.webm`
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(schnitt.toFixed(2)), '-i', roh, '-vf', 'scale=1152:-2', '-c:v', 'libx264', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', `public/hilfe/${name}.mp4`])
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String((schnitt + 2.5).toFixed(2)), '-i', roh, '-frames:v', '1', '-vf', 'scale=960:-2', '-q:v', '4', `public/hilfe/${name}.jpg`])
    console.log(`→ public/hilfe/${name}.mp4`)
  }
}
console.log(ergebnisse.map((e) => `${e.ok ? '✓' : '✗'} ${e.name}`).join('\n'))
