import type { CollectionAfterChangeHook } from 'payload'

/**
 * Mitgliedsantrag wird auf „Aufgenommen“ gesetzt → Mitgliedschaft(en) für den digitalen Ausweis anlegen
 * (Antragsteller/in + Familienmitglieder, alle unter der E-Mail des Antrags). Nur einmal je Antrag.
 */
export const mitgliedschaftAusAntrag: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.status !== 'aufgenommen' || previousDoc?.status === 'aufgenommen') return doc
  const vorhanden = await req.payload.count({ collection: 'mitgliedschaften', where: { antrag: { equals: doc.id } }, overrideAccess: true, req })
  if (vorhanden.totalDocs) return doc
  const heute = new Date().toISOString()
  const email = String(doc.email ?? '').toLowerCase()
  const angebote = (doc.angebote ?? []).map((a: unknown) => (a && typeof a === 'object' ? (a as { id: number }).id : a))
  const personen = [
    { vorname: doc.vorname, nachname: doc.nachname, geburtsdatum: doc.geburtsdatum, angebote },
    ...(doc.mitgliedsart === 'familie' ? (doc.familienmitglieder ?? []).map((f: { vorname?: string; nachname?: string; geburtsdatum?: string }) => ({ vorname: f.vorname, nachname: f.nachname || doc.nachname, geburtsdatum: f.geburtsdatum, angebote: [] })) : []),
  ]
  // Gibt es schon ein vertrauenswürdiges Konto mit dieser E-Mail (von der Verwaltung angelegt oder per Google bestätigt)?
  // Dann gleich verknüpfen. Selbst registrierte, unbestätigte Konten verknüpft die Kasse von Hand.
  const kandidat = (await req.payload.find({ collection: 'users', where: { and: [{ email: { equals: email } }, { freigegeben: { not_equals: false } }] }, limit: 1, depth: 0, overrideAccess: true, req })).docs[0] as
    | { id: number; registriertUeber?: string | null; emailBestaetigt?: boolean | null }
    | undefined
  const konto = kandidat && (!kandidat.registriertUeber || kandidat.registriertUeber === 'verwaltung' || kandidat.emailBestaetigt) ? kandidat : undefined
  for (const p of personen) {
    if (!p.vorname) continue
    await req.payload.create({
      collection: 'mitgliedschaften',
      data: { ...p, email, konto: konto?.id ?? null, art: doc.mitgliedsart ?? 'aktiv', eintritt: heute, aktiv: true, antrag: doc.id } as never,
      overrideAccess: true,
      req,
    })
  }
  return doc
}
