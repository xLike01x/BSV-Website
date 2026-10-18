/** pnpm sicherung:erstellen – Sicherung ohne Verwaltung erstellen */
import { getPayload } from 'payload'
import config from '@payload-config'

import { sicherungErstellen, type Pool } from './kern'

const payload = await getPayload({ config })
const info = await sicherungErstellen((payload.db as unknown as { pool: Pool }).pool, 'Befehl')
console.log(`✅ Sicherung erstellt: backups/${info.datei} (${(info.groesse / 1024 / 1024).toFixed(1)} MB)`)
process.exit(0)
