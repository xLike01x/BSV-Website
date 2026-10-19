import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { PassantragForm, type PassantragDaten } from '@/bsv/components/PassantragForm'
import { aktuellerBenutzer, getVerein, payload } from '@/bsv/data'
import { bildUrl } from '@/bsv/lib'
import { BEARBEITBAR, UNTERLAGEN } from '@/passantraege/Passantraege'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Passantrag', robots: { index: false } }

const id = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number | null))

/** /mitglieder/passantrag – Spielerpass beantragen (bzw. ?id=… Unterlagen nachreichen) */
export default async function PassantragSeite({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await aktuellerBenutzer()
  if (!user) redirect('/login?weiter=/mitglieder/passantrag')
  const u = user as typeof user & { _zweiFaktorOffen?: boolean; _wartetAufFreigabe?: boolean }
  if (u._zweiFaktorOffen) redirect('/login/zwei-faktor?weiter=/mitglieder/passantrag')
  if (u._wartetAufFreigabe || !(user.roles ?? []).length) redirect('/mitglieder')

  const p = await payload()
  const { id: roh } = await searchParams
  const [teams, verein] = await Promise.all([
    p.find({ collection: 'angebote', where: { and: [{ bereich: { equals: 'fussball' } }, { aktiv: { not_equals: false } }] }, sort: 'reihenfolge', limit: 100, depth: 0, overrideAccess: false }),
    getVerein(),
  ])

  let vorher: PassantragDaten | undefined
  if (roh && /^\d+$/.test(roh)) {
    const a = await p
      .find({ collection: 'passantraege', where: { and: [{ id: { equals: Number(roh) } }, { antragsteller: { equals: user.id } }] }, limit: 1, depth: 1, user, overrideAccess: false })
      .then((r) => r.docs[0])
      .catch(() => undefined)
    if (!a || !BEARBEITBAR.includes(a.status)) redirect('/mitglieder#passantraege')
    const dateien: Record<string, { id: number; name: string } | null> = {}
    for (const x of UNTERLAGEN) {
      const d = (a as unknown as Record<string, unknown>)[x.feld] as { id: number; filename?: string } | number | null
      dateien[x.feld] = d && typeof d === 'object' ? { id: d.id, name: d.filename ?? 'Datei' } : null
    }
    vorher = {
      id: a.id,
      fuer: a.fuer,
      spielerVorname: a.spielerVorname,
      spielerNachname: a.spielerNachname,
      geburtsdatum: a.geburtsdatum,
      staatsangehoerigkeit: a.staatsangehoerigkeit,
      erziehungsberechtigte: a.erziehungsberechtigte,
      team: id(a.team),
      art: a.art,
      bisherigerVerein: a.bisherigerVerein,
      abmeldedatum: a.abmeldedatum,
      dateien,
      hinweis: a.status === 'unterlagen_fehlen' ? a.hinweis : null,
    }
  }
  const v = verein as { passantragVorlage?: unknown; passantragVorlageUrl?: string | null }
  const vorlage = bildUrl(v.passantragVorlage as never) || v.passantragVorlageUrl || 'https://wdfv.de/download/spielberechtigungen/spielberechtigungsantrag.pdf'

  return (
    <div style={{ background: 'var(--bsv-soft)', minHeight: '80vh' }}>
      <section className="wrap-narrow" style={{ paddingTop: 72, paddingBottom: 100, maxWidth: 720 }}>
        <p className="kicker in1" style={{ fontSize: 17 }}>
          Fußball
        </p>
        <h1 className="t-page in2" style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}>
          {vorher ? 'Unterlagen nachreichen' : 'Spielerpass beantragen'}
        </h1>
        <p className="lead in2" style={{ margin: '10px 0 28px', fontSize: 19 }}>
          Für Meisterschaft, Pokal und Turniere mit Passpflicht braucht jede Spielerin und jeder Spieler eine Spielerlaubnis. Wir reichen den Antrag beim Verband ein.
        </p>
        <PassantragForm teams={teams.docs.map((t) => ({ id: t.id, title: t.title }))} unterlagen={UNTERLAGEN.map((x) => ({ ...x }))} vorher={vorher} vorlage={vorlage} />
      </section>
    </div>
  )
}
