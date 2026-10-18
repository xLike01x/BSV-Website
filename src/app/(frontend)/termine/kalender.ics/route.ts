import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { ical } from '@/bsv/ical'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * /termine/kalender.ics – öffentliche Termine als Kalender-Abo (ohne „nur für Mitglieder“).
 * /termine/kalender.ics?id=12 – ein einzelner Termin zum Herunterladen.
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const roh = new URL(request.url).searchParams.get('id')
  if (roh !== null && !/^\d{1,9}$/.test(roh)) return new Response('Termin nicht gefunden', { status: 404 })
  const id = roh
  const ab = new Date()
  ab.setMonth(ab.getMonth() - 1)
  const res = await payload.find({
    collection: 'termine',
    where: { and: [{ nurMitglieder: { not_equals: true } }, id ? { id: { equals: Number(id) } } : { beginn: { greater_than_equal: ab.toISOString() } }] },
    sort: 'beginn',
    limit: 500,
    depth: 0,
    overrideAccess: false,
  })
  if (id && !res.docs.length) return new Response('Termin nicht gefunden', { status: 404 })
  const datei = id ? `bsv-termin-${id}.ics` : 'bsv-termine.ics'
  return new Response(ical(res.docs, getServerSideURL()), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `${id ? 'attachment' : 'inline'}; filename="${datei}"`,
      'Cache-Control': 'public, max-age=900',
    },
  })
}
