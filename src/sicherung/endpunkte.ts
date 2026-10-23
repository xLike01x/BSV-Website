import fs from 'fs'
import type { Endpoint, PayloadRequest } from 'payload'
import { Readable } from 'stream'

import { hasRole } from '@/access/roles'

import { sicherungenAuflisten, sicherungErstellen, sicherungsPfad, type Pool } from './kern'

const pool = (req: PayloadRequest) => (req.payload.db as unknown as { pool: Pool }).pool
// Die Sicherung enthält ALLE Daten inkl. Passwort-Prüfwerte – deshalb nur für Web-Admins
const nurAdmin = (req: PayloadRequest) => hasRole(req.user as never, 'webadmin')

export const sicherungEndpunkte: Endpoint[] = [
  {
    path: '/sicherung',
    method: 'get',
    handler: async (req) => (nurAdmin(req) ? Response.json({ sicherungen: sicherungenAuflisten() }) : Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })),
  },
  {
    path: '/sicherung',
    method: 'post',
    handler: async (req) => {
      if (!nurAdmin(req)) return Response.json({ fehler: 'Nur für Web-Admins.' }, { status: 403 })
      try {
        const info = await sicherungErstellen(pool(req), `manuell (${(req.user as { email?: string })?.email ?? 'unbekannt'})`)
        return Response.json(info)
      } catch (e) {
        req.payload.logger.error({ err: e }, 'Sicherung fehlgeschlagen')
        const wo = process.env.NODE_ENV === 'production' ? 'im Server-Protokoll (sudo journalctl -u bsv -n 50)' : 'im schwarzen Server-Fenster'
        return Response.json({ fehler: `Die Sicherung ist fehlgeschlagen. Details stehen ${wo}.` }, { status: 500 })
      }
    },
  },
  {
    path: '/sicherung/datei/:datei',
    method: 'get',
    handler: async (req) => {
      if (!nurAdmin(req)) return new Response('Nur für Web-Admins.', { status: 403 })
      const p = sicherungsPfad(String(req.routeParams?.datei ?? ''))
      if (!p) return new Response('Nicht gefunden.', { status: 404 })
      const stream = Readable.toWeb(fs.createReadStream(p)) as unknown as ReadableStream
      return new Response(stream, {
        headers: {
          'Content-Type': p.endsWith('.enc') ? 'application/octet-stream' : 'application/gzip',
          'Content-Disposition': `attachment; filename="${String(req.routeParams?.datei)}"`,
          'Content-Length': String(fs.statSync(p).size),
        },
      })
    },
  },
]
