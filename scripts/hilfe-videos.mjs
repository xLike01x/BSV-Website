/**
 * Nimmt die Hilfe-Videos (public/hilfe/*.mp4) neu auf – z. B. nach Design-Änderungen.
 * Nur LOKAL mit Testdaten ausführen! Braucht ein Testkonto mit Rolle „Team-Redaktion“ (eigenes Team).
 *
 *   BSV_URL=http://localhost:3000 BSV_EMAIL=… BSV_PASSWORT=… BSV_TOTP=<Geheimnis> node scripts/hilfe-videos.mjs
 *
 * Danach mit ffmpeg nach public/hilfe/ umwandeln (siehe README, Abschnitt „Hilfe“).
 * Voraussetzung: einmal `pnpm exec playwright install chromium` und ffmpeg.
 */
import crypto from 'crypto'
import fs from 'fs'
import { chromium } from '@playwright/test'
const OUT = 'hilfe-videos-roh'
fs.mkdirSync(OUT, { recursive: true })
const b32 = String(process.env.BSV_TOTP ?? '').replace(/\s/g,'')
function decode(s){const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of s)bits+=a.indexOf(c).toString(2).padStart(5,'0');const o=[];for(let i=0;i+8<=bits.length;i+=8)o.push(parseInt(bits.slice(i,i+8),2));return Buffer.from(o)}
function totp(step){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(step));const h=crypto.createHmac('sha1',decode(b32)).update(b).digest();const o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1e6).padStart(6,'0')}
const base=process.env.BSV_URL ?? 'http://localhost:3000'
const browser=await chromium.launch()
const login=await browser.newContext()
await login.request.post(base+'/api/users/login',{data:{email:process.env.BSV_EMAIL,password:process.env.BSV_PASSWORT}})
for(let k=0;k<3;k++){const p=await login.request.post(base+'/api/users/zwei-faktor/pruefen',{data:{code:totp(Math.floor(Date.now()/30000))}});if(p.ok())break;await new Promise(r=>setTimeout(r,31000))}
// Tour als erledigt markieren, damit sie die Aufnahme nicht stört
await login.request.post(base+'/api/payload-preferences/bsv-tour',{data:{value:{erledigt:true}}})
await login.request.post(base+'/api/payload-preferences/nav',{data:{value:{open:true}}})
await login.request.post(base+'/api/payload-preferences/bsv-erste-schritte',{data:{value:{ausgeblendet:true}}})
for (const [c,w] of [['posts','where[title][equals]=Alte Herren gewinnen Freundschaftsspiel&draft=true'],['media','where[alt][equals]=Die Alten Herren mit dem Pokal'],['ausfaelle','where[hinweis][like]=Nachholtermin']]) {
  const r=await (await login.request.get(base+`/api/${c}?${w}&limit=20&depth=0`)).json()
  for (const d of r.docs??[]) console.log('aufräumen',c,d.id,(await login.request.delete(base+`/api/${c}/${d.id}`)).status())
}
const state=await login.storageState()

// Sichtbarer Mauszeiger mit Klick-Effekt
const CURSOR=`(()=>{const add=()=>{if(document.getElementById('pw-cursor'))return;const c=document.createElement('div');c.id='pw-cursor';c.style.cssText='position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(21,122,67,.35);border:2px solid #157a43;pointer-events:none;transition:transform .12s;left:-50px;top:-50px';document.body.appendChild(c);document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'},true);document.addEventListener('mousedown',()=>{c.style.transform='scale(.6)'},true);document.addEventListener('mouseup',()=>{c.style.transform='scale(1)'},true)};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',add):add()})()`

async function aufnahme(name, fn){
  const ctx=await browser.newContext({storageState:state, viewport:{width:1280,height:760}, recordVideo:{dir:OUT+'/roh-'+name, size:{width:1280,height:760}}})
  await ctx.addInitScript(CURSOR)
  const page=await ctx.newPage()
  const klick=async(loc)=>{const b=await loc.boundingBox(); if(b){await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18}); await page.waitForTimeout(250)} await loc.click(); await page.waitForTimeout(500)}
  const tippe=async(loc,text)=>{await klick(loc); await page.keyboard.type(text,{delay:55}); await page.waitForTimeout(400)}
  try { await fn(page,{klick,tippe}) } catch(e){ console.log(name,'FEHLER',e.message) }
  await page.waitForTimeout(1200)
  const m=page.url().match(/collections\/([^/]+)\/(\d+)/); if(m) console.log('  gelöscht', m[1], m[2], (await page.request.delete(base+`/api/${m[1]}/${m[2]}`)).status())
  const v=page.video(); await ctx.close(); fs.copyFileSync(await v.path(), `${OUT}/${name}.webm`); console.log(name,'ok', fs.statSync(`${OUT}/${name}.webm`).size)
}

const navAuf=async(page)=>{await page.waitForTimeout(1200); if(!(await page.locator('.nav--nav-open').count())){await page.locator('.nav-toggler').first().click().catch(()=>{});await page.waitForTimeout(600)}}

await aufnahme('news-schreiben', async (page,{klick,tippe})=>{
  await page.goto(base+'/admin',{waitUntil:'networkidle'}); await navAuf(page); await page.waitForTimeout(800)
  await klick(page.locator('.nav__link', {hasText:'News'}).first()); await page.waitForLoadState('networkidle')
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first()); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800)
  await tippe(page.locator('#field-title'),'Alte Herren gewinnen Freundschaftsspiel')
  await klick(page.getByText('Aus vorhandenen auswählen').first()); await page.waitForTimeout(1500)
  await klick(page.locator('.list-drawer .table tbody tr td a, .list-drawer .cell-filename button, .list-drawer tbody tr button').first()); await page.waitForTimeout(1200)
  await tippe(page.locator('[contenteditable="true"]').first(),'Am Samstag haben die Alten Herren 3:1 gewonnen. Danke an alle Zuschauer!')
  const team=page.locator('#field-team'); await klick(team); await page.waitForTimeout(600); await page.keyboard.press('Enter'); await page.waitForTimeout(1200)
  await page.mouse.move(1100,300,{steps:20}); await page.waitForTimeout(1500)
  await klick(page.locator('#action-save-draft')); await page.waitForTimeout(2000)
})

await aufnahme('ausfall-melden', async (page,{klick,tippe})=>{
  await page.goto(base+'/admin',{waitUntil:'networkidle'}); await navAuf(page); await page.waitForTimeout(800)
  await klick(page.locator('.nav__link', {hasText:'Trainingsausfälle'}).first()); await page.waitForLoadState('networkidle')
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first()); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800)
  await klick(page.locator('#field-angebot')); await page.waitForTimeout(600); await page.keyboard.press('Enter'); await page.waitForTimeout(800)
  const d=new Date(Date.now()+3*864e5); const ds=`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
  await tippe(page.locator('#field-datum input').first(), ds); await page.keyboard.press('Escape')
  await klick(page.locator('#field-grund')); await page.waitForTimeout(500); await page.keyboard.type('Halle',{delay:60}); await page.keyboard.press('Enter'); await page.waitForTimeout(700)
  await tippe(page.locator('#field-hinweis'),'Nachholtermin am Freitag um 19 Uhr.')
  await page.mouse.move(1100,300,{steps:20}); await page.waitForTimeout(1500)
  await klick(page.locator('#action-save')); await page.waitForTimeout(2000)
})

await aufnahme('bilder-hochladen', async (page,{klick,tippe})=>{
  await page.goto(base+'/admin',{waitUntil:'networkidle'}); await navAuf(page); await page.waitForTimeout(800)
  await klick(page.locator('.nav__link', {hasText:'Mediathek'}).first()); await page.waitForLoadState('networkidle')
  await klick(page.locator('.list-create-new-doc__create-new-button, .list-header__create-new-button').first()); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800)
  const btn=page.getByText('Datei auswählen').first(); const b=await btn.boundingBox(); if(b) await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18}); await page.waitForTimeout(400)
  await page.locator('input[type=file]').first().setInputFiles('seed/bilder/hallenstadtmeister.jpg'); await page.waitForTimeout(1500)
  await tippe(page.locator('#field-alt'),'Die Alten Herren mit dem Pokal')
  await klick(page.locator('#field-team')); await page.waitForTimeout(600); await page.keyboard.press('Enter'); await page.waitForTimeout(800)
  await klick(page.locator('#field-inGalerie')); await page.waitForTimeout(800)
  await page.mouse.move(1100,300,{steps:20}); await page.waitForTimeout(1500)
  await klick(page.locator('#action-save')); await page.waitForTimeout(2500)
})
await browser.close()
