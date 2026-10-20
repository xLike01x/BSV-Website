import type { Payload } from 'payload'

import { papierkorbAufraeumen } from './papierkorb'
import { passUnterlagenAufraeumen } from '@/passantraege/aufraeumen'
import { datenschutzAutomatisch } from '@/datenschutz/aufraeumen'
import { statistikAufraeumen } from '@/statistik/aufraeumen'

const g = globalThis as unknown as { __bsvTaeglich?: NodeJS.Timeout }

/** Läuft kurz nach dem Start und dann einmal täglich: Papierkorb leeren, Datenschutz-Fristen */
export function taeglicheAufgaben(payload: Payload) {
  if (g.__bsvTaeglich) clearInterval(g.__bsvTaeglich)
  const lauf = async () => {
    await papierkorbAufraeumen(payload).catch((e) => payload.logger.warn({ err: e }, 'Papierkorb-Aufräumen fehlgeschlagen'))
    // Registrierungen, die 60 Tage nicht freigegeben wurden, entfernen
    await payload
      .delete({ collection: 'users', where: { and: [{ freigegeben: { equals: false } }, { createdAt: { less_than: new Date(Date.now() - 60 * 86400000).toISOString() } }] }, overrideAccess: true })
      .then((r) => r.docs.length && payload.logger.info(`${r.docs.length} alte, nicht freigegebene Registrierungen entfernt`))
      .catch((e) => payload.logger.warn({ err: e }, 'Alte Registrierungen aufräumen fehlgeschlagen'))
    // Registrierungen ohne bestätigte E-Mail nach 7 Tagen entfernen (Tippfehler, Bots, fremde Adressen)
    await payload
      .delete({
        collection: 'users',
        where: { and: [{ freigegeben: { equals: false } }, { registriertUeber: { equals: 'email' } }, { emailBestaetigt: { not_equals: true } }, { createdAt: { less_than: new Date(Date.now() - 7 * 86400000).toISOString() } }] },
        overrideAccess: true,
      })
      .then((r) => r.docs.length && payload.logger.info(`${r.docs.length} nie bestätigte Registrierungen entfernt`))
      .catch((e) => payload.logger.warn({ err: e }, 'Unbestätigte Registrierungen aufräumen fehlgeschlagen'))
    await passUnterlagenAufraeumen(payload).catch((e) => payload.logger.warn({ err: e }, 'Pass-Unterlagen aufräumen fehlgeschlagen'))
    await datenschutzAutomatisch(payload).catch((e) => payload.logger.warn({ err: e }, 'Datenschutz-Aufräumen fehlgeschlagen'))
    await statistikAufraeumen(payload).catch((e) => payload.logger.warn({ err: e }, 'Statistik aufräumen fehlgeschlagen'))
  }
  setTimeout(lauf, 60_000)
  g.__bsvTaeglich = setInterval(lauf, 24 * 60 * 60 * 1000)
}
