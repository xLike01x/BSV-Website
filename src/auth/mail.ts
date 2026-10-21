import type { EmailAdapter, Payload } from 'payload'

/** Ist der E-Mail-Versand eingerichtet (SMTP_HOST in der .env)? */
export const emailAktiv = () => Boolean(process.env.SMTP_HOST)

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Einheitliche, schlichte BSV-Mail mit einem großen Knopf */
export function mailHtml({ titel, absaetze, knopf, link, fuss, liste }: { titel: string; absaetze: string[]; knopf?: string; link?: string; fuss?: string; liste?: { titel: string; text?: string; knopf: string; link: string }[] }) {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#1d2a22">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px">
<p style="margin:0 0 4px;font-size:13px;color:#2e7d4f;font-weight:bold">BSV 1919 e.V.</p>
<h1 style="margin:0 0 16px;font-size:24px">${esc(titel)}</h1>
${absaetze.map((a) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;white-space:pre-line">${esc(a)}</p>`).join('')}
${(liste ?? []).map((e) => `<div style="margin:0 0 12px;padding:14px 16px;border:1px solid #e3e8e4;border-radius:12px"><p style="margin:0 0 4px;font-size:16px;font-weight:bold">${esc(e.titel)}</p>${e.text ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#445;white-space:pre-line">${esc(e.text)}</p>` : ''}<a href="${esc(e.link)}" style="display:inline-block;background:#2e7d4f;color:#fff;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:999px;font-size:14px">${esc(e.knopf)}</a></div>`).join('')}
${knopf && link ? `<p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#2e7d4f;color:#fff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">${esc(knopf)}</a></p><p style="margin:0 0 14px;font-size:13px;color:#667;word-break:break-all">Knopf geht nicht? Diesen Link in den Browser kopieren:<br>${esc(link)}</p>` : ''}
${fuss ? `<p style="margin:20px 0 0;font-size:13px;color:#667;line-height:1.5">${esc(fuss)}</p>` : ''}
</td></tr></table></td></tr></table></body></html>`
}

/**
 * Nur beim Entwickeln ohne SMTP: Mails (auch „Passwort vergessen“) samt Link im Fenster des Servers anzeigen,
 * damit sich alles ohne Postfach ausprobieren lässt.
 */
export const anzeigeMail: EmailAdapter = ({ payload }) => ({
  name: 'anzeige',
  defaultFromAddress: 'website@bsv.test',
  defaultFromName: 'BSV 1919',
  sendEmail: async (m) => {
    const text = typeof m.text === 'string' && m.text ? m.text : String(m.html ?? '').replace(/<a [^>]*href="([^"]+)"[^>]*>/g, ' $1 ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
    payload.logger.info(`\n──── E-Mail (Versand nicht eingerichtet, nur Anzeige) ────\nAn: ${String(m.to)}\nBetreff: ${m.subject}\n\n${text}\n─────────────────────────────────────────────`)
  },
})

/** Verschickt eine E-Mail (live über SMTP; ohne SMTP auf der Live-Website passiert nichts) */
export async function mailSenden(payload: Payload, m: { an: string; betreff: string; text: string; html: string; antwortAn?: string }): Promise<boolean> {
  if (!emailAktiv() && process.env.NODE_ENV === 'production') return false
  await payload.sendEmail({ to: m.an, subject: m.betreff, text: m.text, html: m.html, ...(m.antwortAn ? { replyTo: m.antwortAn } : {}) })
  return true
}
