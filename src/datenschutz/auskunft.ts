import type { CollectionSlug, Endpoint, PayloadRequest, Where } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * Auskunft nach Art. 15 DSGVO bzw. Datenübertragbarkeit nach Art. 20 (Audit DSGVO-07):
 * GET /api/datenschutz/auskunft?email=… – nur Admins. Sammelt alles, was zu dieser E-Mail-Adresse gespeichert ist
 * (auch im Papierkorb), und liefert es als JSON-Datei. Passwort-Prüfwerte, 2FA-Geheimnisse und Tokens sind nie enthalten.
 */
const OHNE = new Set(['hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'sessions', 'loginAttempts', 'lockUntil', 'bestaetigungHash', 'bestaetigungBis', 'zweiFaktorGeheimnis', 'zweiFaktorCodes', 'zweiFaktorSitzungen', 'zweiFaktorLetzterSchritt', '_rollen', '_zweiFaktorOffen'])
const sauber = (doc: unknown): unknown => {
  if (Array.isArray(doc)) return doc.map(sauber)
  if (!doc || typeof doc !== 'object') return doc
  return Object.fromEntries(Object.entries(doc as Record<string, unknown>).filter(([k]) => !OHNE.has(k)).map(([k, v]) => [k, sauber(v)]))
}

async function suche(req: PayloadRequest, collection: string, where: Where) {
  const r = await req.payload
    .find({ collection: collection as CollectionSlug, where, trash: true, depth: 0, limit: 0, pagination: false, overrideAccess: false, user: req.user, req })
    .catch(() => null)
  return (r?.docs ?? []).map(sauber)
}

export const auskunftEndpunkt: Endpoint = {
  path: '/datenschutz/auskunft',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin')) return Response.json({ fehler: 'Nur für Admins.' }, { status: 403 })
    const email = String(req.searchParams.get('email') ?? '').trim().toLowerCase()
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email)) return Response.json({ fehler: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })

    const konten = (await suche(req, 'users', { email: { equals: email } })) as { id: number }[]
    const ids = konten.map((k) => k.id)
    const mitKonto = (feld: string): Where[] => (ids.length ? [{ [feld]: { in: ids } }] : [])
    const daten = {
      hinweis: 'Auskunft nach Art. 15 DSGVO – alle zu dieser E-Mail-Adresse gespeicherten Daten der Vereinswebsite (inkl. Papierkorb). IBANs sind entschlüsselt: vertraulich behandeln.',
      erstellt: new Date().toISOString(),
      email,
      benutzerkonten: konten,
      mitgliedsantraege: await suche(req, 'mitgliedsantraege', { email: { equals: email } }),
      mitgliedschaften: await suche(req, 'mitgliedschaften', { or: [{ email: { equals: email } }, ...mitKonto('konto')] }),
      probetraining: await suche(req, 'probetraining', { email: { equals: email } }),
      kontaktanfragen: await suche(req, 'kontaktanfragen', { email: { equals: email } }),
      formularEingaenge: await suche(req, 'form-submissions', { 'submissionData.value': { equals: email } }),
      passantraege: ids.length ? await suche(req, 'passantraege', { or: mitKonto('antragsteller') }) : [],
      passUnterlagen: ids.length ? await suche(req, 'passdokumente', { or: mitKonto('hochgeladenVon') }) : [],
      profilfotos: ids.length ? await suche(req, 'profilbilder', { or: mitKonto('besitzer') }) : [],
      terminZuAbsagen: ids.length ? await suche(req, 'termin-rueckmeldungen', { or: mitKonto('mitglied') }) : [],
      besucherstatistik: 'Keine personenbezogene Zuordnung möglich (keine IP-Adressen, täglich wechselnde Kennung).',
    }
    req.payload.logger.info(`Datenschutz-Auskunft erstellt von ${(req.user as { email?: string }).email ?? 'unbekannt'}`)
    const datei = `auskunft-${email.replace(/[^a-z0-9]+/gi, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    return new Response(JSON.stringify(daten, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${datei}"`, 'Cache-Control': 'no-store' },
    })
  },
}
