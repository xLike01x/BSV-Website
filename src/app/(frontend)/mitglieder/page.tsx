import { hasRole } from '@/access/roles'
import { darf, rechteLaden } from '@/access/rollenRechte'
import { TeamPflege } from '@/bsv/components/TeamPflege'
import { terminSchluessel } from '@/bsv/wiederholung'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { AbmeldenButton } from '@/bsv/components/AbmeldenButton'
import { Profilfoto } from '@/bsv/components/Profilfoto'
import { AusweisKarten } from '@/bsv/components/AusweisKarte'
import { ausweiseFuer } from '@/mitgliedschaften/ausweise'
import { aktuellerBenutzer, getAusfaelle, getTermine, getVerein, payload } from '@/bsv/data'
import { bildUrl, datum, farbe, kurzZeit, uhrzeit } from '@/bsv/lib'
import type { Angebote } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mein BSV', robots: { index: false } }

const PASS_STATUS: Record<string, { text: string; farbe: string }> = {
  eingereicht: { text: 'Eingereicht – wird geprüft', farbe: 'var(--bsv-muted)' },
  pruefung: { text: 'In Prüfung', farbe: '#1d4ed8' },
  unterlagen_fehlen: { text: 'Unterlagen fehlen', farbe: '#e8590c' },
  verband: { text: 'Beim Verband eingereicht', farbe: '#7c3aed' },
  erteilt: { text: '✓ Spielerlaubnis erteilt', farbe: 'var(--bsv-green)' },
  abgelehnt: { text: 'Abgelehnt / zurückgezogen', farbe: '#b91c1c' },
}

const ROLLE: Record<string, string> = {
  webadmin: 'Web-Admin',
  admin: 'Admin',
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  passwesen: 'Passwesen',
  uebungsleitung: 'Trainer',
  teamredaktion: 'Team-Redaktion',
  mitglied: 'Mitglied',
}

export default async function MitgliederSeite({ searchParams }: { searchParams: Promise<{ passantrag?: string }> }) {
  const { passantrag: passOk } = await searchParams
  const user = await aktuellerBenutzer()
  if (!user) redirect('/login?weiter=/mitglieder')

  // Konten mit Verwaltungsrolle: erst den Code aus der App bestätigen, dann auch Mitgliederbereich
  if ((user as { _zweiFaktorOffen?: boolean })._zweiFaktorOffen) redirect('/login/zwei-faktor?weiter=/mitglieder')

  const p = await payload()
  const vorname0 = (user.name ?? '').split(' ')[0]
  // Profilfoto (eigenes – darf das Mitglied immer sehen)
  const fotoDoc = user.profilbild && typeof user.profilbild === 'object' ? user.profilbild : null
  const foto = fotoDoc ? (fotoDoc.sizes?.klein?.url ?? fotoDoc.url ?? null) : null
  const fotoGross = fotoDoc?.url ?? null

  // Selbst registriert, aber noch nicht freigegeben
  if ((user as { _wartetAufFreigabe?: boolean })._wartetAufFreigabe) {
    return (
      <div style={{ background: 'var(--bsv-soft)', minHeight: '80vh' }}>
        <section className="wrap-narrow" style={{ paddingTop: 72, paddingBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p className="kicker in1" style={{ fontSize: 17 }}>Registriert</p>
            <h1 className="t-page in2" style={{ fontSize: 'clamp(44px, 6vw, 72px)' }}>
              Hallo {vorname0}!
            </h1>
          </div>
          <AbmeldenButton />
        </section>
        <section className="wrap-narrow" style={{ paddingBottom: 100, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20, alignItems: 'start' }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
            <h2 className="t-3" style={{ fontSize: 26, marginBottom: 12 }}>
              Fast geschafft ✓
            </h2>
            <p style={{ margin: 0, lineHeight: 1.55 }}>
              Danke für deine Registrierung! Die Verwaltung prüft kurz, ob du Mitglied im BSV bist, und schaltet deinen Zugang dann frei. Danach siehst du hier deine Kurse, Ausfälle, Termine und Downloads.
            </p>
            <p className="muted" style={{ fontSize: 15, margin: '14px 0 0' }}>
              Noch kein Mitglied? <Link href="/mitglied-werden">Hier geht’s zum Mitgliedsantrag ›</Link>
            </p>
          </div>
          <div style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
            <h2 className="t-3" style={{ fontSize: 26, marginBottom: 16 }}>
              Mein Foto
            </h2>
            <Profilfoto name={user.name ?? ''} foto={fotoGross} fotoId={fotoDoc?.id ?? null} />
          </div>
        </section>
      </div>
    )
  }

  // Ohne bestätigten zweiten Faktor gelten nur Mitgliedsrechte; die echten Rollen stehen in _rollen
  const zf = user as typeof user & { _rollen?: string[]; _zweiFaktorOffen?: boolean }
  const echteRollen = zf._rollen ?? user.roles ?? []
  const rollen = user.roles ?? []
  // Knopf „Zur Verwaltung“ nur für Rollen, die die Verwaltung auch öffnen dürfen (gleiche Liste wie canUseAdminPanel)
  const istStaff = hasRole(user as never, 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion')
  const zweiFaktorOffen = Boolean(zf._zweiFaktorOffen)
  const meine = (user.angebote ?? []).filter((a): a is Angebote => typeof a === 'object')
  const geleitet = rollen.includes('uebungsleitung') || rollen.includes('teamredaktion')
    ? (await p.find({ collection: 'angebote', where: { leitung: { contains: user.id } }, depth: 0, limit: 50, overrideAccess: true })).docs
    : []
  // Team-Redaktion darf Ausfälle nur melden, wenn der Web-Admin es unter „Rollen-Rechte“ eingeschaltet lässt
  await rechteLaden(p)
  const darfAusfall = rollen.some((r) => ['admin', 'redaktion', 'uebungsleitung'].includes(r)) || darf(user, 'teamredaktion', 'ausfaelle')
  const alleIds = Array.from(new Set([...meine, ...geleitet].map((a) => a.id)))
  // Eigene Passanträge (auch für Kinder gestellte)
  const passantraege = (
    await p
      .find({ collection: 'passantraege', where: { antragsteller: { equals: user.id } }, sort: '-createdAt', limit: 20, depth: 1, user, overrideAccess: false })
      .catch(() => ({ docs: [] }))
  ).docs
  const ausweise = await ausweiseFuer(user).catch(() => [])
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
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {foto ? <img src={foto} alt="" className="avatar in1" /> : <span className="avatar in1">{vorname.slice(0, 1).toUpperCase()}</span>}
          <div>
          <p className="kicker in1" style={{ fontSize: 17 }}>
            {echteRollen.map((r) => ROLLE[r] ?? r).join(' · ')}
          </p>
          <h1 className="t-page in2" style={{ fontSize: 'clamp(44px, 6vw, 72px)' }}>
            Hallo {vorname}!
          </h1>
          </div>
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

      <section className="wrap-narrow" style={{ paddingBottom: 24 }} id="ausweis">
        <h2 className="t-3" style={{ fontSize: 26, marginBottom: 14 }}>
          {ausweise.length > 1 ? 'Mitgliedsausweise' : 'Mein Mitgliedsausweis'}
        </h2>
        {ausweise.length ? (
          <AusweisKarten ausweise={ausweise} />
        ) : (
          <p className="muted" style={{ margin: 0, background: '#fff', borderRadius: 20, padding: '18px 22px', lineHeight: 1.5 }}>
            Dein digitaler Ausweis erscheint hier, sobald die Verwaltung deine Mitgliedsdaten hinterlegt hat.
          </p>
        )}
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
                <TeamPflege
                  key={a.id}
                  darfAusfall={darfAusfall}
                  team={{
                    id: a.id,
                    title: a.title,
                    slug: a.slug ?? '',
                    zeit: kurzZeit(a),
                    tage: (a.zeiten ?? []).map((z) => z.tag).filter((t): t is NonNullable<typeof t> => Boolean(t)),
                    bannerText: a.bannerText ?? null,
                    bannerBis: a.bannerBis ?? null,
                    bannerArt: a.bannerArt ?? null,
                    ausfaelle: ausfaelle
                      .filter((x) => (typeof x.angebot === 'object' ? x.angebot?.id : x.angebot) === a.id)
                      .map((x) => ({ id: x.id, datum: x.datum, grund: x.grund ?? null })),
                  }}
                />
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
              <div key={terminSchluessel(t)} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
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

        <div id="passantraege" style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
          <h2 className="t-3" style={{ fontSize: 26, marginBottom: 8 }}>
            Spielerpass (Fußball)
          </h2>
          {passOk === 'ok' && (
            <p className="success" role="status" style={{ padding: '12px 16px', margin: '0 0 12px', textAlign: 'left' }}>
              ✓ Danke! Dein Antrag ist eingegangen. Den Stand siehst du hier.
            </p>
          )}
          {passantraege.length === 0 ? (
            <p className="muted" style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
              Für Meisterschaft und Pokal braucht jede Spielerin und jeder Spieler einen Spielerpass. Den Antrag stellst du hier – auch für dein Kind.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {passantraege.map((a) => {
                const st = PASS_STATUS[a.status] ?? PASS_STATUS.eingereicht!
                return (
                  <div key={a.id} className="card card-soft" style={{ padding: 16, gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: st.farbe }}>{st.text}</span>
                    <strong style={{ fontSize: 18 }}>
                      {a.spielerVorname} {a.spielerNachname}
                    </strong>
                    <span className="card-meta">{typeof a.team === 'object' && a.team ? a.team.title : ''}</span>
                    {a.status === 'unterlagen_fehlen' && a.hinweis && <span style={{ fontSize: 15 }}>Hinweis: {a.hinweis}</span>}
                    {['eingereicht', 'unterlagen_fehlen'].includes(a.status) && (
                      <Link href={`/mitglieder/passantrag?id=${a.id}`} className="link-more" style={{ fontSize: 15 }}>
                        {a.status === 'unterlagen_fehlen' ? 'Unterlagen nachreichen ›' : 'Ansehen / ändern ›'}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <Link href="/mitglieder/passantrag" className="btn btn-primary">
            Passantrag stellen
          </Link>
        </div>

        <div style={{ background: '#fff', borderRadius: 28, padding: 32 }}>
          <h2 className="t-3" style={{ fontSize: 26, marginBottom: 16 }}>
            Mein Foto
          </h2>
          <Profilfoto name={user.name ?? ''} foto={fotoGross} fotoId={fotoDoc?.id ?? null} />
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
