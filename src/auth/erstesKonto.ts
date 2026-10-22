/**
 * pnpm konto:erstes – legt auf einem frischen Server das erste Konto (Web-Admin) an.
 * Auf der Live-Website ist „Erstes Konto anlegen“ im Browser gesperrt: Sonst könnte jeder, der die neue Adresse
 * vor dir findet, sich selbst zum Web-Admin machen. Nur wer auf dem Server angemeldet ist, kann dieses Skript starten.
 */
import readline from 'readline/promises'
import { getPayload } from 'payload'
import config from '@payload-config'

import { passwortFehler } from './passwortRegeln'

/** Eingabe ohne Anzeige (Passwort) */
function verdeckt(frage: string): Promise<string> {
  return new Promise((ok) => {
    const stdin = process.stdin
    process.stdout.write(frage)
    let wert = ''
    const fertig = () => {
      stdin.setRawMode?.(false)
      stdin.pause()
      stdin.removeListener('data', lesen)
      process.stdout.write('\n')
      ok(wert)
    }
    const lesen = (b: Buffer) => {
      for (const z of b.toString('utf8')) {
        if (z === '\r' || z === '\n') return fertig()
        if (z === '\u0003') process.exit(1) // Strg+C
        if (z === '\u007f' || z === '\b') wert = wert.slice(0, -1)
        else wert += z
      }
    }
    stdin.setRawMode?.(true)
    stdin.resume()
    stdin.on('data', lesen)
  })
}

const payload = await getPayload({ config })
const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
if (totalDocs > 0) {
  console.log(`Es gibt schon ${totalDocs} Konto/Konten – das erste Konto ist längst angelegt. Weitere Konten in der Verwaltung unter „Benutzer“ anlegen.`)
  process.exit(0)
}

console.log('\nErstes Konto anlegen (wird Web-Admin). Danach im Browser anmelden und die Zwei-Faktor-Anmeldung einrichten.\n')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const name = (await rl.question('Vor- und Nachname: ')).trim().replace(/\s+/g, ' ').slice(0, 120)
const email = (await rl.question('E-Mail-Adresse: ')).trim().toLowerCase()
rl.close()
if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.log('Name oder E-Mail-Adresse ungültig – abgebrochen, nichts angelegt.')
  process.exit(1)
}
let passwort = ''
for (;;) {
  passwort = await verdeckt('Passwort (unsichtbar): ')
  const fehler = passwortFehler(passwort, { name, email })
  if (fehler) {
    console.log(`  ${fehler}`)
    continue
  }
  if ((await verdeckt('Passwort wiederholen: ')) === passwort) break
  console.log('  Die beiden Eingaben sind verschieden – bitte noch einmal.')
}

await payload.create({
  collection: 'users',
  data: { name, email, password: passwort, freigegeben: true } as never,
  overrideAccess: true,
  // erlaubt das erste Konto auch auf der Live-Website (siehe Users → „erstes Konto“)
  context: { bsvErstesKonto: true },
})
console.log(`\n✅ Konto für ${email} angelegt (Web-Admin). Jetzt unter /login anmelden und die Zwei-Faktor-Anmeldung einrichten.`)
process.exit(0)
