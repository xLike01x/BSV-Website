import type { Payload } from 'payload'

import { papierkorbAufraeumen } from './papierkorb'
import { passUnterlagenAufraeumen } from '@/passantraege/aufraeumen'
import { rueckmeldungenAufraeumen } from '@/termine/rueckmeldungenAufraeumen'
import { datenschutzAutomatisch } from '@/datenschutz/aufraeumen'
import { statistikAufraeumen } from '@/statistik/aufraeumen'
import { sicherungErstellen, type Pool } from '@/sicherung/kern'
import { updatesPruefen } from '@/wartung/updates'
import { restAufraeumen } from '@/sicherung/umschluesseln'
import { alteAdressenEntfernen, erinnerungenVerschicken } from '@/sport/bestaetigung'
import { monatsberichtVerschicken } from '@/wartung/monatsbericht'
import { wartungsHinweise } from '@/wartung/pruefen'

const g = globalThis as unknown as { __bsvTaeglich?: NodeJS.Timeout }

/** Alle Aufräum-Regeln einmal ausführen (täglich und direkt nach dem Einspielen einer Sicherung) */
export async function einmalAufraeumen(payload: Payload) {
  await papierkorbAufraeumen(payload).catch((e) =>
    payload.logger.warn({ err: e }, 'Papierkorb-Aufräumen fehlgeschlagen'),
  )
  // Registrierungen, die 60 Tage nicht freigegeben wurden, entfernen
  await payload
    .delete({
      collection: 'users',
      where: {
        and: [
          { freigegeben: { equals: false } },
          { createdAt: { less_than: new Date(Date.now() - 60 * 86400000).toISOString() } },
        ],
      },
      overrideAccess: true,
    })
    .then(
      (r) =>
        r.docs.length &&
        payload.logger.info(`${r.docs.length} alte, nicht freigegebene Registrierungen entfernt`),
    )
    .catch((e) => payload.logger.warn({ err: e }, 'Alte Registrierungen aufräumen fehlgeschlagen'))
  // Registrierungen ohne bestätigte E-Mail nach 7 Tagen entfernen (Tippfehler, Bots, fremde Adressen)
  await payload
    .delete({
      collection: 'users',
      where: {
        and: [
          { freigegeben: { equals: false } },
          { registriertUeber: { equals: 'email' } },
          { emailBestaetigt: { not_equals: true } },
          { createdAt: { less_than: new Date(Date.now() - 7 * 86400000).toISOString() } },
        ],
      },
      overrideAccess: true,
    })
    .then(
      (r) =>
        r.docs.length &&
        payload.logger.info(`${r.docs.length} nie bestätigte Registrierungen entfernt`),
    )
    .catch((e) =>
      payload.logger.warn({ err: e }, 'Unbestätigte Registrierungen aufräumen fehlgeschlagen'),
    )
  await passUnterlagenAufraeumen(payload).catch((e) =>
    payload.logger.warn({ err: e }, 'Pass-Unterlagen aufräumen fehlgeschlagen'),
  )
  await rueckmeldungenAufraeumen(payload).catch((e) =>
    payload.logger.warn({ err: e }, 'Zu-/Absagen aufräumen fehlgeschlagen'),
  )
  await datenschutzAutomatisch(payload).catch((e) =>
    payload.logger.warn({ err: e }, 'Datenschutz-Aufräumen fehlgeschlagen'),
  )
  await statistikAufraeumen(payload).catch((e) =>
    payload.logger.warn({ err: e }, 'Statistik aufräumen fehlgeschlagen'),
  )
  // Leere Seiten-Entwürfe (nur „Neu erstellen“ geöffnet und wieder verlassen) nach einem Tag entfernen
  await payload
    .delete({
      collection: 'pages',
      where: {
        and: [
          { or: [{ title: { exists: false } }, { title: { equals: '' } }] },
          { _status: { equals: 'draft' } },
          { createdAt: { less_than: new Date(Date.now() - 86400000).toISOString() } },
        ],
      },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    .then((r) => r.docs.length && payload.logger.info(`${r.docs.length} leere Seiten-Entwürfe entfernt`))
    .catch((e) => payload.logger.warn({ err: e }, 'Leere Entwürfe aufräumen fehlgeschlagen'))
}

/** Läuft kurz nach dem Start und dann einmal täglich: Aufräumen, auf der Live-Website außerdem die tägliche Sicherung */
export function taeglicheAufgaben(payload: Payload) {
  if (g.__bsvTaeglich) clearInterval(g.__bsvTaeglich)
  const lauf = async () => {
    await einmalAufraeumen(payload)
    // Updates & Sicherheit (Node.js, PostgreSQL, Pakete, Server) – Hinweis für Web-Admins, Seite /admin/updates
    await updatesPruefen(payload)
    if (process.env.NODE_ENV === 'production' && process.env.BSV_SICHERUNG !== 'aus') {
      await sicherungErstellen(
        (payload.db as unknown as { pool: Pool }).pool,
        'täglich automatisch',
      )
        .then((i) => payload.logger.info(`Tägliche Sicherung erstellt: backups/${i.datei}`))
        .catch((e) => payload.logger.error({ err: e }, 'Tägliche Sicherung fehlgeschlagen'))
    }
    // Reste eines abgebrochenen Schlüsselwechsels (entschlüsselte Zwischendateien) entfernen
    try {
      restAufraeumen()
    } catch (e) {
      payload.logger.warn({ err: e }, 'Zwischendateien des Schlüsselwechsels konnten nicht entfernt werden')
    }
    // „Passt noch?“-Mails an Trainer (alle 3 Monate je Team) und Monatsbericht an die Admins (einmal im Monat)
    await alteAdressenEntfernen(payload).catch((e) => payload.logger.warn({ err: e }, 'Bereinigung „bestätigt von“ fehlgeschlagen'))
    await erinnerungenVerschicken(payload).catch((e) => payload.logger.warn({ err: e }, '„Passt noch?“-Erinnerungen fehlgeschlagen'))
    await monatsberichtVerschicken(payload).catch((e) => payload.logger.warn({ err: e }, 'Monatsbericht fehlgeschlagen'))
    // Wartungs-Warnungen (Speicherplatz, auslaufende Versionen, offener Schlüsselwechsel) auch ins Protokoll
    for (const h of await wartungsHinweise(payload).catch(() => [])) if (h.art === 'warn') payload.logger.warn(`Wartung: ${h.text}`)
  }
  setTimeout(lauf, 60_000)
  g.__bsvTaeglich = setInterval(lauf, 24 * 60 * 60 * 1000)
}
