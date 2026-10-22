import type { CollectionBeforeValidateHook, PayloadRequest } from 'payload'
import { APIError } from 'payload'

/**
 * Absicherung des Formular-Baukastens (Audit F-29)
 * 1. Eingänge nur mit Feldern, die das Formular wirklich hat; Pflichtfelder müssen ausgefüllt sein.
 * 2. E-Mail-Benachrichtigungen: Empfänger, die aus Besucher-Eingaben stammen ({{feld}}), dürfen nur EINE gültige Adresse
 *    sein (z. B. Bestätigung an den Absender); CC/BCC aus Besucher-Eingaben werden verworfen – sonst ließe sich
 *    die Website als Spam-Schleuder an beliebig viele Adressen missbrauchen. Absender und Antwortadresse ebenso.
 */
type Feld = { name?: string; required?: boolean; blockType?: string }
type Eingang = { field?: string; value?: unknown }

export const eingangPruefen: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data || req.payloadAPI === 'local') return data
  const formId = typeof data.form === 'object' ? (data.form as { id?: number })?.id : data.form
  const form = formId ? ((await req.payload.findByID({ collection: 'forms', id: formId as number, depth: 0, overrideAccess: true, req }).catch(() => null)) as { fields?: Feld[] } | null) : null
  if (!form) throw new APIError('Formular nicht gefunden.', 400)
  const felder = (form.fields ?? []).filter((f) => f.name && f.blockType !== 'message')
  const erlaubt = new Set(felder.map((f) => f.name!))
  const eingaben = (Array.isArray(data.submissionData) ? data.submissionData : []) as Eingang[]
  const sauber = eingaben.filter((e) => typeof e?.field === 'string' && erlaubt.has(e.field)).map((e) => ({ field: e.field!, value: String(e.value ?? '').slice(0, 5000) }))
  for (const f of felder) {
    if (f.required && !sauber.some((e) => e.field === f.name && e.value.trim() !== '' && e.value !== 'false')) {
      throw new APIError(`Bitte das Feld „${f.name}“ ausfüllen.`, 400)
    }
  }
  data.submissionData = sauber
  return data
}

const EINE_ADRESSE = /^[^\s@,;<>]{1,64}@[^\s@,;<>]{1,190}\.[a-z]{2,}$/i
type Mail = { to?: string; cc?: string; bcc?: string; from?: string; replyTo?: string; [k: string]: unknown }
type Vorlage = { emailTo?: string | null; cc?: string | null; bcc?: string | null; emailFrom?: string | null; replyTo?: string | null }

export const mailsPruefen = async (mails: Mail[], params: { data?: { form?: unknown }; req: PayloadRequest }) => {
  const formId = typeof params.data?.form === 'object' ? (params.data?.form as { id?: number })?.id : params.data?.form
  const form = formId ? ((await params.req.payload.findByID({ collection: 'forms', id: formId as number, depth: 0, overrideAccess: true, req: params.req }).catch(() => null)) as { emails?: Vorlage[] } | null) : null
  const vorlagen = form?.emails ?? []
  const ausEingabe = (v?: string | null) => Boolean(v && v.includes('{{'))
  return mails
    .map((m, i) => {
      const v = vorlagen[i] ?? {}
      const neu: Mail = { ...m }
      if (ausEingabe(v.cc)) neu.cc = ''
      if (ausEingabe(v.bcc)) neu.bcc = ''
      if (ausEingabe(v.emailFrom)) neu.from = undefined
      // Das Plugin nimmt für „Antwort an“ ersatzweise den Absender – also auch dessen Platzhalter prüfen
      if (ausEingabe(v.replyTo || v.emailFrom) && !EINE_ADRESSE.test(String(m.replyTo ?? '').trim())) neu.replyTo = undefined
      if (ausEingabe(v.emailTo) && !EINE_ADRESSE.test(String(m.to ?? '').trim())) return null
      return neu
    })
    .filter((m): m is Mail => m !== null)
}
