import type { Termine } from '@/payload-types'

/** iCalendar (.ics) für Termine – für Handy-, Outlook- und Google-Kalender */
const esc = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
    // übrige Steuerzeichen entfernen (kein Einschleusen weiterer Kalender-Zeilen)
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
const zeit = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
/** Zeilen nach 75 Bytes umbrechen (RFC 5545) */
const falten = (zeile: string) => {
  const teile: string[] = []
  let rest = zeile
  while (Buffer.byteLength(rest, 'utf8') > 75) {
    let n = 75
    while (Buffer.byteLength(rest.slice(0, n), 'utf8') > 75) n--
    teile.push(rest.slice(0, n))
    rest = ' ' + rest.slice(n)
  }
  teile.push(rest)
  return teile.join('\r\n')
}

export function ical(termine: Termine[], basis: string, name = 'BSV 1919 – Termine') {
  const z: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Buedericher SV 1919//Website//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:Europe/Berlin',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
  ]
  for (const t of termine) {
    const ende = t.ende ?? new Date(new Date(t.beginn).getTime() + 2 * 3600000).toISOString()
    z.push(
      'BEGIN:VEVENT',
      `UID:termin-${t.id}@bsv1919`,
      `DTSTAMP:${zeit(t.updatedAt)}`,
      `DTSTART:${zeit(t.beginn)}`,
      `DTEND:${zeit(ende)}`,
      `SUMMARY:${esc(t.title)}`,
      ...(t.ort ? [`LOCATION:${esc(t.ort)}`] : []),
      ...(t.beschreibung ? [`DESCRIPTION:${esc(t.beschreibung)}`] : []),
      `URL:${basis}/termine`,
      'END:VEVENT',
    )
  }
  z.push('END:VCALENDAR')
  return z.map(falten).join('\r\n') + '\r\n'
}

/** Link „In Google Kalender eintragen“ */
export function googleKalender(t: Pick<Termine, 'title' | 'beginn' | 'ende' | 'ort' | 'beschreibung'>) {
  const ende = t.ende ?? new Date(new Date(t.beginn).getTime() + 2 * 3600000).toISOString()
  const p = new URLSearchParams({ action: 'TEMPLATE', text: t.title, dates: `${zeit(t.beginn)}/${zeit(ende)}`, location: t.ort ?? '', details: t.beschreibung ?? '' })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
