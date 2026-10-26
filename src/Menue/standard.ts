/** Standard-Menü und -Fußzeile. Werden in der Verwaltung vorausgefüllt und gelten, solange eine Liste leer ist. */

type Eintrag = { label: string; ziel: 'adresse' | 'aufklapp'; adresse?: string; neuerTab?: boolean; aufklapp?: string }

const a = (label: string, adresse: string, neuerTab = false): Eintrag => ({ label, ziel: 'adresse', adresse, neuerTab })

export const STANDARD_HAUPTMENUE: Eintrag[] = [
  { label: 'Fußball', ziel: 'aufklapp', aufklapp: 'fussball' },
  { label: 'Breitensport', ziel: 'aufklapp', aufklapp: 'breitensport' },
  { label: 'Verein', ziel: 'aufklapp', aufklapp: 'verein' },
  a('News', '/news'),
  a('Termine', '/termine'),
  a('Kunstrasen', '/kunstrasen'),
  a('Kontakt', '/kontakt'),
]

export const STANDARD_VEREIN_UEBER_UNS: Eintrag[] = [
  a('Vorstand', '/verein#vorstand'),
  a('Mitgliedsbeiträge', '/verein#beitraege'),
  a('Satzung & Downloads', '/verein#downloads'),
  a('Mitglied werden', '/mitglied-werden'),
  a('Informationspflichten (DSGVO)', '/verein#dsgvo'),
]

export const STANDARD_VEREIN_MEHR: Eintrag[] = [
  a('Termine', '/termine'),
  a('Kunstrasen 2026', '/kunstrasen'),
  a('Vereinskollektion (JAKO) ↗', 'https://team.jako.de/de/team/buederichersv/', true),
  a('Merch-Shop (fan12) ↗', 'https://buedericher-spielverein.fan12.de', true),
]

export const STANDARD_FUSSZEILE: { titel: string; eintraege: Eintrag[] }[] = [
  {
    titel: 'Fußball',
    eintraege: [a('Junioren', '/fussball#junioren'), a('Juniorinnen', '/fussball#juniorinnen'), a('Senioren', '/fussball#senioren'), a('Damen', '/fussball#seniorinnen')],
  },
  {
    titel: 'Breitensport',
    eintraege: [a('BSV Kids', '/breitensport#kids'), a('Erwachsene & Senioren', '/breitensport#erwachsene'), a('Termine', '/termine')],
  },
  {
    titel: 'Verein',
    eintraege: [a('Vorstand', '/verein#vorstand'), a('Satzung', '/verein#downloads'), a('Mitgliedsbeiträge', '/verein#beitraege'), a('Mitglied werden', '/mitglied-werden')],
  },
  {
    titel: 'Entdecken',
    eintraege: [
      a('News', '/news'),
      a('Kunstrasen 2026', '/kunstrasen'),
      a('Spielecke', '/spielecke'),
      a('Vereinskollektion ↗', 'https://team.jako.de/de/team/buederichersv/', true),
      a('Merch-Shop ↗', 'https://buedericher-spielverein.fan12.de', true),
    ],
  },
]
