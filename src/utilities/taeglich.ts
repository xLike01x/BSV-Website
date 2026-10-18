import type { Payload } from 'payload'

import { papierkorbAufraeumen } from './papierkorb'
import { datenschutzAutomatisch } from '@/datenschutz/aufraeumen'

const g = globalThis as unknown as { __bsvTaeglich?: NodeJS.Timeout }

/** Läuft kurz nach dem Start und dann einmal täglich: Papierkorb leeren, Datenschutz-Fristen */
export function taeglicheAufgaben(payload: Payload) {
  if (g.__bsvTaeglich) clearInterval(g.__bsvTaeglich)
  const lauf = async () => {
    await papierkorbAufraeumen(payload).catch((e) => payload.logger.warn({ err: e }, 'Papierkorb-Aufräumen fehlgeschlagen'))
    await datenschutzAutomatisch(payload).catch((e) => payload.logger.warn({ err: e }, 'Datenschutz-Aufräumen fehlgeschlagen'))
  }
  setTimeout(lauf, 60_000)
  g.__bsvTaeglich = setInterval(lauf, 24 * 60 * 60 * 1000)
}
