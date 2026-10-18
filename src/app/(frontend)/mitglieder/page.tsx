import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { AbmeldenButton } from '@/bsv/components/AbmeldenButton'
import { aktuellerBenutzer, getAusfaelle, getTermine, getVerein, payload } from '@/bsv/data'
import { bildUrl, datum, farbe, kurzZeit, uhrzeit } from '@/bsv/lib'
import type { Angebote } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mein BSV', robots: { index: false } }

const ROLLE: Record<string, string> = {
  webadmin: 'Web-Admin',
  admin: 'Admin',
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  uebungsleitung: 'Übungsleitung',
  teamredaktion: 'Team-Redaktion',
  mitglied: 'Mitglied',
}

export default async function MitgliederSeite() {
  const user = await aktuellerBenutzer()
  if (!user) redirect('/login?weiter=/mitglieder')

  const p = await payload()
  // Ohne bestätigten zweiten Faktor gelten nur Mitgliedsrechte; die echten Rollen stehen in _rollen
  const zf = user as typeof user & { _rollen?: string[]; _zweiFaktorOffen?: boolean }
  const echteRollen = zf._rollen ?? user.roles ?? []
  const rollen = user.roles ?? []
  const istStaff = rollen.some((r) => r !== 'mitglied')
  const zweiFaktorOffen = Boolean(zf._zweiFaktorOffen)
  const meine = (user.angebote ?? []).filter((a): a is Angebote => typeof a === 'object')
  const geleitet = rollen.includes('uebungsleitung') || rollen.includes('teamredaktion')
    ? (await p.find({ collection: 'angebote', where: { leitung: { contains: user.id } }, depth: 0, limit: 50, overrideAccess: true })).docs
    : []
  const alleIds = Array.from(new Set([...meine, ...geleitet].map((a) => a.id)))
  const [ausfaelle, termine, verein, anfragen] = await Promise.all([
    alleIds.length ? getAusfaelle(alleIds) : Promise.resolve([]),
    getTermine(6),
    getVerein(),
    geleitet.length && rollen.includes('uebungsleitung')
      ? p.count({ collection: 'probetraining', where: { and: [{ angebot: { in: geleitet.map((g) => g.id) } }, { status: { equals: 'neu' } }] }, overrideAccess: true })
      : Promise.resolve({ totalDocs: 0 }),
  ])
  // Geschützte Dateien kommen über /api/dokumente/file/… (prüft die Anmeldung); alte Einträge notfalls noch aus der Mediathek
  const dateiUrl = (d: { dokument?: unknown; datei?: unknown }) => {
    const dok = d.dokument as { url?: string | null } | null | undefined
    return (typeof dok === 'object' && dok?.url) || bildUrl(d.datei as never) || null
  }
  const downloads = (verein.downloads ?? []).filter((d) => d.nurMitglieder && dateiUrl(d))
  const vorname = (user.name ?? '').split(' ')[0]

  return (
    <div style={{ background: 'var(--bsv-soft)', minHeight: '80vh' }}>
      <section className="wrap-narrow" style={{ paddingTop: 72, paddingBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p className="kicker in1" style={{ fontSize: 17 }}>
            {echteRollen.map((r) => ROLLE[r] ?? r).join(' · ')}
          </p>
          <h1 className="t-page in2" style={{ fontSize: 'clamp(44px, 6vw, 72px)' }}>
            Hallo {vorname}!
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {istStaff && (
            <a href="/admin" className="btn btn-primary">
              Zur Verwaltung
            </a>
          )}
          {zweiFaktorOffen && (
            <Link href="/login/zwei-faktor?weiter=/admin" className="btn btn-primary">
              Zur Verwaltung (Code bestätigen)
            </Link>
          )}
          <AbmeldenButton />
        </div>
      </section>

      {ausfaelle.length > 0 && (
        <section className="wrap-narrow" style={{ paddingBottom: 24 }}>
          {ausfaelle.map((f) => (
            <p key={f.id} className="notice" role="status" style={{ margin: '0 0 10px' }}>
              <strong>{typeof f.angebot === 'object' ? f.angebot.title : 'Training'} fällt aus</strong> am {datum(f.datum, { weekday: 'long', day: '2-digit', month: '2-digit' })} · {f.grund}
              {f.hinweis ? ` – ${f.hinweis}` : ''}
            </p>
          ))}
        </section>
      )}

      <section className="wrap-narrow" style={{ paddingBottom: 100, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20, alignItems: 'start' }}>
        {geleitet.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 28, padding: 32, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
              <h2 className="t-3" style={{ fontSize: 26 }}>
                Meine Teams &amp; Kurse zum Pflegen
              </h2>
              {anfragen.totalDocs > 0 && (
                <a href="/admin/collections/probetraining" className="link-more">
                  {anfragen.totalDocs} neue Probetraining-{anfragen.totalDocs === 1 ? 'Anfrage' : 'Anfragen'} ›
                </a>
              )}
            </div>
            <div className="grid-cards" style={{ marginTop: 20 }}>
              {geleitet.map((a) => (
                <div key={a.id} className="info" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ fontSize: 20 }}>{a.title}</strong>
                  <span className="muted">{kurzZeit(a)}</span>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 15 }}>
                    <a href={`/admin/collections/ausfaelle/create`} className="link-more">
                      Ausfall melden ›
                    </a>
                    <a href={`/admin/collections/posts/create`} className="link-more">
                      News schreiben ›
                    </a>
                    <a href={`/admin/collections/angebote/${a.id}`} className="link-more">
                      Bearbeiten ›
                    </a>
                    <Link href={`/angebote/${a.slug}`}>Ansehen</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
          <h2 className="t-3" style={{ fontSize: 26, marginBottom: 16 }}>
            Meine Teams &amp; Kurse
          </h2>
          {meine.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>
              Noch keine Angebote hinterlegt. Die Verwaltung ordnet deine Teams und Kurse nach der Aufnahme zu.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meine.map((a) => (
              <Link key={a.id} href={`/angebote/${a.slug}`} className="card card-soft" style={{ padding: 18, gap: 2 }}>
                <span className="card-cat" style={{ color: farbe(a.kategorie)[0] }}>
                  {a.kategorie}
                </span>
                <strong style={{ fontSize: 19 }}>{a.title}</strong>
                <span className="card-meta">{kurzZeit(a)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
          <h2 className="t-3" style={{ fontSize: 26, marginBottom: 16 }}>
            Nächste Termine
          </h2>
          {termine.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>
              Gerade stehen keine Termine an.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {termine.map((t) => (
              <div key={t.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, textAlign: 'center', background: 'var(--bsv-green-tint)', borderRadius: 14, padding: '6px 0', flex: '0 0 auto' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bsv-green)' }}>{datum(t.beginn, { month: 'short' })}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{datum(t.beginn, { day: 'numeric' })}</div>
                </div>
                <div>
                  <strong>{t.title}</strong>
                  <div className="muted" style={{ fontSize: 15 }}>
                    {uhrzeit(t.beginn)} Uhr{t.nurMitglieder ? ' · nur für Mitglieder' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/termine" className="link-more" style={{ display: 'inline-block', marginTop: 18 }}>
            Alle Termine ›
          </Link>
        </div>

        <div id="downloads" style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
          <h2 className="t-3" style={{ fontSize: 26, marginBottom: 16 }}>
            Downloads für Mitglieder
          </h2>
          {downloads.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>
              Hier erscheinen z. B. die Protokolle der Jahreshauptversammlung.
            </p>
          )}
          {downloads.map((d, i) => (
            <a key={d.id ?? i} href={dateiUrl(d) ?? '#'} target="_blank" rel="noopener" className="card card-soft" style={{ padding: 18, marginBottom: 10 }}>
              <span className="card-cat muted">{d.hinweis || 'PDF'}</span>
              <strong>{d.titel}</strong>
            </a>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
          <h2 className="t-3" style={{ fontSize: 26, marginBottom: 16 }}>
            Mein Konto
          </h2>
          <p style={{ margin: 0 }}>
            <strong>{user.name}</strong>
            <br />
            <span className="muted">{user.email}</span>
          </p>
          <p className="muted" style={{ fontSize: 15, marginTop: 14 }}>
            Adresse oder Bankverbindung geändert? Gib uns kurz Bescheid.
          </p>
          <Link href="/kontakt?thema=Änderung meiner Mitgliedsdaten" className="link-more">
            Änderung mitteilen ›
          </Link>
        </div>
      </section>
    </div>
  )
}
