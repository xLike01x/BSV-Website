import type { CollectionSlug, Payload, Where } from 'payload'

import { hasRole } from '@/access/roles'
import { mailHtml, mailSenden } from '@/auth/mail'
import { automatischeMailsAn } from '@/sport/bestaetigung'
import { WARTEND } from '@/auth/registrierung'
import { faellige } from '@/datenschutz/aufraeumen'
import { sicherungenAuflisten } from '@/sicherung/kern'
import { getServerSideURL } from '@/utilities/getURL'

import { wartungLesen, wartungsHinweise } from './pruefen'

/**
 * Monatsbericht: einmal im Monat eine E-Mail an alle Admins – was liegt offen, was ist veraltet.
 * Kommt auch, wenn alles erledigt ist („Alles in Ordnung“) – so merkt man, dass der Versand funktioniert.
 * Technik-Teil (Sicherung, Speicher, Versionen) nur für Web-Admins. Nie an Testkonten.
 */
const VERWALTUNG = ['webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'lesen']
const UNBESTAETIGT_TAGE = 180

type Konto = { id: number; name?: string | null; email: string; roles?: string[] | null; mailBenachrichtigung?: boolean | null; freigegeben?: boolean | null; testkonto?: boolean | null }
type Team = { id: number; title: string; leitung?: unknown[] | null; zeiten?: unknown[] | null; bestaetigtAm?: string | null }

const vor = (tage: number) => new Date(Date.now() - tage * 86400000).toISOString()
const zahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`
const namen = (teams: Team[], max = 8) => teams.slice(0, max).map((t) => t.title).join(', ') + (teams.length > max ? ` und ${teams.length - max} weitere` : '')

export type Bericht = { allgemein: string[]; technik: string[] }

/** Inhalte des Berichts (auch für Tests nutzbar) */
export async function berichtErstellen(payload: Payload): Promise<Bericht> {
  const zaehle = (collection: string, where: Where) => payload.count({ collection: collection as CollectionSlug, where, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0)
  const [antraege, kontakt, probe, pass, registrierungen, kuendigungen, kuendigungenDfb] = await Promise.all([
    zaehle('mitgliedsantraege', { status: { equals: 'neu' } }),
    zaehle('kontaktanfragen', { status: { equals: 'neu' } }),
    zaehle('probetraining', { status: { equals: 'neu' } }),
    zaehle('passantraege', { status: { equals: 'eingereicht' } }),
    zaehle('users', WARTEND),
    zaehle('kuendigungen', { status: { equals: 'neu' } }),
    zaehle('kuendigungen', { status: { equals: 'bestaetigt' } }),
  ])
  const teams = (
    await payload.find({ collection: 'angebote', where: { aktiv: { not_equals: false } }, limit: 500, pagination: false, depth: 0, overrideAccess: true, select: { title: true, leitung: true, zeiten: true, bestaetigtAm: true } as never })
  ).docs as unknown as Team[]
  const ohneLeitung = teams.filter((t) => !(t.leitung ?? []).length)
  const ohneZeiten = teams.filter((t) => !(t.zeiten ?? []).length)
  const grenze = vor(UNBESTAETIGT_TAGE)
  const unbestaetigt = teams.filter((t) => !t.bestaetigtAm || t.bestaetigtAm < grenze)
  const [alteZugaenge, ohne2fa] = await Promise.all([
    zaehle('users', {
      and: [
        { roles: { in: VERWALTUNG } },
        { testkonto: { not_equals: true } },
        { or: [{ letzteAnmeldung: { less_than: vor(182) } }, { and: [{ letzteAnmeldung: { exists: false } }, { createdAt: { less_than: vor(30) } }] }] },
      ],
    }),
    zaehle('users', { and: [{ roles: { in: VERWALTUNG } }, { testkonto: { not_equals: true } }, { zweiFaktorAktiv: { not_equals: true } }] }),
  ])
  const frist = await faellige(payload, ['admin']).catch(() => [])
  const fristSumme = frist.reduce((s, x) => s + x.anzahl, 0)

  const offen = [
    antraege && zahl(antraege, 'neuer Mitgliedsantrag', 'neue Mitgliedsanträge'),
    kontakt && zahl(kontakt, 'neue Kontaktanfrage', 'neue Kontaktanfragen'),
    probe && zahl(probe, 'neue Probetraining-Anfrage', 'neue Probetraining-Anfragen'),
    pass && zahl(pass, 'eingereichter Passantrag', 'eingereichte Passanträge'),
    registrierungen && zahl(registrierungen, 'Registrierung wartet auf Freigabe', 'Registrierungen warten auf Freigabe'),
    kuendigungen && zahl(kuendigungen, 'neue Kündigung', 'neue Kündigungen'),
    kuendigungenDfb && zahl(kuendigungenDfb, 'bestätigte Kündigung noch im DFBnet auszutragen', 'bestätigte Kündigungen noch im DFBnet auszutragen'),
  ].filter(Boolean) as string[]
  const allgemein: string[] = []
  if (offen.length) allgemein.push(`📥 Offen im Posteingang: ${offen.join(', ')}.`)
  if (ohneLeitung.length) allgemein.push(`👥 ${zahl(ohneLeitung.length, 'aktives Team/aktiver Kurs', 'aktive Teams/Kurse')} ohne Verantwortliche: ${namen(ohneLeitung)}.`)
  if (unbestaetigt.length) allgemein.push(`🕒 Seit über 6 Monaten nicht bestätigt („Passt noch?“): ${namen(unbestaetigt)}.`)
  if (ohneZeiten.length) allgemein.push(`📅 Ohne Trainingszeiten (auf der Website steht „auf Anfrage“): ${namen(ohneZeiten)}.`)
  if (alteZugaenge) allgemein.push(`🔑 ${zahl(alteZugaenge, 'Zugang mit Verwaltungsrechten wurde', 'Zugänge mit Verwaltungsrechten wurden')} seit über 6 Monaten nicht genutzt – noch nötig? (Rollen & Rechte)`)
  if (ohne2fa) allgemein.push(`🛡️ ${zahl(ohne2fa, 'Zugang hat', 'Zugänge haben')} die Zwei-Faktor-Anmeldung noch nicht eingerichtet.`)
  if (fristSumme) allgemein.push(`🧹 ${zahl(fristSumme, 'alter Eintrag mit persönlichen Daten ist', 'alte Einträge mit persönlichen Daten sind')} über der Datenschutz-Frist (Einstellungen → Datenschutz-Fristen).`)

  const technik: string[] = []
  const letzte = sicherungenAuflisten()[0]
  const tage = letzte ? Math.floor((Date.now() - new Date(letzte.erstellt).getTime()) / 86400000) : null
  if (tage === null) technik.push('💾 Es gibt noch keine Datensicherung.')
  else if (tage > 2) technik.push(`💾 Die letzte Datensicherung ist ${tage} Tage alt – läuft die tägliche Sicherung?`)
  for (const h of await wartungsHinweise(payload).catch(() => [])) technik.push(`${h.symbol} ${h.text}`)
  return { allgemein, technik }
}

/** Täglich aufgerufen: verschickt den Bericht höchstens einmal pro Kalendermonat */
export async function monatsberichtVerschicken(payload: Payload, jetzt = new Date()): Promise<number> {
  if (!automatischeMailsAn()) return 0
  const w = await wartungLesen(payload)
  const zuletzt = w.monatsberichtAm ? new Date(w.monatsberichtAm) : null
  if (zuletzt && zuletzt.getFullYear() === jetzt.getFullYear() && zuletzt.getMonth() === jetzt.getMonth()) return 0

  const konten = (await payload.find({ collection: 'users', where: { roles: { contains: 'admin' } }, limit: 200, pagination: false, depth: 0, overrideAccess: true })).docs as unknown as Konto[]
  const empfaenger = konten.filter((k) => !k.testkonto && k.freigegeben !== false && k.mailBenachrichtigung !== false)
  const bericht = await berichtErstellen(payload)
  const monat = jetzt.toLocaleDateString('de-DE', { month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' })
  const link = `${getServerSideURL()}/admin`
  const fuss = 'Du bekommst diesen Bericht einmal im Monat, weil du Admin bist. Abbestellen: in der Verwaltung oben rechts → „Mein Konto“ → Haken „E-Mail-Benachrichtigungen“ entfernen.'
  let mails = 0
  for (const k of empfaenger) {
    const punkte = [...bericht.allgemein, ...(hasRole(k as never, 'webadmin') ? bericht.technik : [])]
    const absaetze = [
      k.name ? `Hallo ${k.name.split(' ')[0]},` : 'Hallo,',
      punkte.length ? `das ist der Monatsbericht der BSV-Website für ${monat}. Diese Punkte brauchen Aufmerksamkeit:` : `das ist der Monatsbericht der BSV-Website für ${monat}: Alles in Ordnung – nichts liegt offen. 🎉`,
      ...punkte,
    ]
    const ok = await mailSenden(payload, {
      an: k.email,
      betreff: punkte.length ? `BSV-Website: Monatsbericht ${monat} (${punkte.length} ${punkte.length === 1 ? 'Punkt' : 'Punkte'})` : `BSV-Website: Monatsbericht ${monat} – alles in Ordnung`,
      text: `${absaetze.join('\n\n')}\n\n${link}\n\n${fuss}`,
      html: mailHtml({ titel: `Monatsbericht ${monat}`, absaetze, knopf: 'Zur Verwaltung', link, fuss }),
    }).catch((e) => {
      payload.logger.error({ err: e }, 'Monatsbericht konnte nicht verschickt werden')
      return false
    })
    if (ok) mails++
  }
  // Auch ohne Empfänger merken – sonst würde jeden Tag neu versucht. Schlug jede Mail fehl, morgen erneut.
  if (mails || !empfaenger.length) await payload.updateGlobal({ slug: 'wartung' as never, data: { monatsberichtAm: jetzt.toISOString() } as never, overrideAccess: true })
  if (mails) payload.logger.info(`Monatsbericht an ${mails} Admins verschickt`)
  return mails
}
