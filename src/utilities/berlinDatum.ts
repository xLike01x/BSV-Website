const FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Kalendertag in Deutschland als „JJJJ-MM-TT“ – unabhängig von der Zeitzone des Servers */
export const berlinDatum = (d: Date | string): string =>
  FORMAT.format(typeof d === 'string' ? new Date(d) : d)

/** „JJJJ-MM-TT“ → „TT.MM.JJJJ“ */
export const deutschesDatum = (ymd: string) => {
  const [y, m, t] = ymd.slice(0, 10).split('-')
  return `${t}.${m}.${y}`
}

/** Tag als Datumswert speichern wie die Datumsfelder der Verwaltung (Mittag UTC → in Deutschland immer derselbe Tag) */
export const tagAlsIso = (ymd: string) => `${ymd.slice(0, 10)}T12:00:00.000Z`
