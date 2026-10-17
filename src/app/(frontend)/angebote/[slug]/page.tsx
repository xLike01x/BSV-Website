import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import RichText from '@/components/RichText'
import { Bild } from '@/bsv/components/Bild'
import { ExternesWidget } from '@/bsv/components/ExternesWidget'
import { ProbetrainingForm } from '@/bsv/components/ProbetrainingForm'
import { getAngebot, getAngebote, getAusfaelle } from '@/bsv/data'
import { BEREICH_LABEL, bildUrl, datum, farbe, initialen, UNTERGRUPPE_LABEL, zeitText } from '@/bsv/lib'

export const revalidate = 60

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const angebote = await getAngebote()
  return angebote.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const a = await getAngebot(decodeURIComponent(slug))
  if (!a) return {}
  const img = bildUrl(a.bild, 'og')
  return {
    title: a.title,
    description: a.kurzbeschreibung ?? undefined,
    openGraph: img ? { images: [{ url: img }] } : undefined,
  }
}

const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

/** Die nächsten zwei Termine für den Wochentag des Trainings */
function naechsteTermine(tag?: string | null, von?: string | null): string[] {
  if (!tag) return []
  const ziel = TAGE.indexOf(tag)
  if (ziel < 0) return []
  const d = new Date()
  d.setDate(d.getDate() + ((ziel - d.getDay() + 7) % 7 || 7))
  return [0, 7].map((plus) => {
    const x = new Date(d)
    x.setDate(d.getDate() + plus)
    return `${tag}, ${datum(x.toISOString(), { day: '2-digit', month: '2-digit' })}${von ? `, ${von} Uhr` : ''}`
  })
}

export default async function AngebotSeite({ params }: Args) {
  const { slug } = await params
  const a = await getAngebot(decodeURIComponent(slug))
  if (!a) notFound()

  const [alle, ausfaelle] = await Promise.all([getAngebote(), getAusfaelle([a.id])])
  const [tint] = farbe(a.kategorie)
  const istFussball = a.bereich === 'fussball'
  const bereichHref = istFussball ? '/fussball' : '/breitensport'
  const gruppe = istFussball ? UNTERGRUPPE_LABEL[a.untergruppe ?? ''] : BEREICH_LABEL[a.bereich]
  const zeiten = a.zeiten ?? []
  const leitung = a.team?.[0]
  const istKind = (a.alterVon ?? 18) < 14
  const passend = alle
    .filter((x) => x.id !== a.id && x.bereich === a.bereich && (x.alterVon ?? 0) <= (a.alterBis ?? 99) && (x.alterBis ?? 99) >= (a.alterVon ?? 0))
    .slice(0, 3)

  return (
    <>
      <section className="wrap-narrow" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <nav aria-label="Brotkrumen" className="crumbs">
          <Link href={bereichHref}>{istFussball ? 'Fußball' : 'Breitensport'}</Link> › {gruppe} › <span style={{ color: 'var(--bsv-ink)' }}>{a.title}</span>
        </nav>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
          <div style={{ flex: '1 1 460px', minWidth: 0 }}>
            <p className="in1" style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 600, color: tint }}>
              {[a.kategorie !== 'Fußball' ? a.kategorie : gruppe, a.alterText].filter(Boolean).join(' · ')}
            </p>
            <h1 className="t-page in2" style={{ fontSize: 'clamp(48px, 7.5vw, 96px)', lineHeight: 1 }}>
              {a.title}
            </h1>
            {a.kurzbeschreibung && (
              <p className="in3" style={{ margin: '22px 0 0', fontSize: 21, lineHeight: 1.45, color: 'var(--bsv-ink-2)', maxWidth: 520 }}>
                {a.kurzbeschreibung}
              </p>
            )}
            <div className="in3" style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#probe" className="btn btn-primary">
                Probetraining anfragen
              </a>
              <Link href={`/mitglied-werden?angebot=${a.slug}`} className="btn btn-ghost">
                {istFussball ? 'Für dieses Team anmelden' : 'Fest anmelden'}
              </Link>
            </div>
          </div>
          <div className="in2" style={{ flex: '1 1 420px', minWidth: 0, aspectRatio: '4 / 3', borderRadius: 32, overflow: 'hidden', background: farbe(a.kategorie)[1], boxShadow: `0 30px 60px ${tint}26` }}>
            <Bild media={a.bild} priority sizes="(max-width: 900px) 100vw, 560px" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </section>

      {ausfaelle.length > 0 && (
        <section className="wrap-narrow" style={{ paddingBottom: 24 }}>
          {ausfaelle.map((f) => (
            <p key={f.id} className="notice" role="status" style={{ margin: '0 0 10px' }}>
              <strong>Fällt aus am {datum(f.datum, { weekday: 'long', day: '2-digit', month: '2-digit' })}</strong> · {f.grund}
              {f.hinweis ? ` – ${f.hinweis}` : ''}
            </p>
          ))}
        </section>
      )}

      <section className="wrap-narrow" style={{ paddingBottom: 64 }}>
        <div className="grid-info">
          {zeiten.length === 0 && (
            <div className="info">
              <p className="info-label">Wann</p>
              <p className="info-value">Auf Anfrage</p>
              <p className="info-sub">Frag einfach ein Probetraining an</p>
            </div>
          )}
          {zeiten.map((z, i) => (
            <div className="info" key={z.id ?? i}>
              <p className="info-label">{i === 0 ? 'Wann' : 'Außerdem'}</p>
              <p className="info-value">{z.tag ? `${z.tag}s` : z.von ? zeitText(z) : 'Training'}</p>
              <p className="info-sub">{[z.tag && z.von ? zeitText(z) : '', z.hinweis].filter(Boolean).join(' · ') || ' '}</p>
            </div>
          ))}
          <div className="info">
            <p className="info-label">Wo</p>
            <p className="info-value">{zeiten.find((z) => z.ort)?.ort ?? 'Kutscher-Remy-Sportpark'}</p>
            <p className="info-sub">{(zeiten.find((z) => z.ort)?.ort ?? '').includes('Petri') ? 'Petristraße, 46487 Wesel' : 'Schützenstraße 25a, 46487 Wesel'}</p>
          </div>
          <div className="info">
            <p className="info-label">Für wen</p>
            <p className="info-value">{a.alterText}</p>
            <p className="info-sub">Mitglieder, Schnuppern erwünscht</p>
          </div>
          {leitung && (
            <div className="info" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                {leitung.foto && typeof leitung.foto === 'object' ? <Bild media={leitung.foto} size="small" sizes="56px" alt="" /> : initialen(leitung.name)}
              </span>
              <span>
                <span className="info-label" style={{ display: 'block' }}>
                  {leitung.rolle || (istFussball ? 'Trainer' : 'Übungsleitung')}
                </span>
                <strong style={{ fontSize: 19 }}>{leitung.name}</strong>
              </span>
            </div>
          )}
        </div>
      </section>

      {(a.beschreibung || (a.team?.length ?? 0) > 1) && (
        <section className="wrap-narrow" style={{ paddingBottom: 72, display: 'flex', flexWrap: 'wrap', gap: 48 }}>
          {a.beschreibung && (
            <div style={{ flex: '2 1 480px', minWidth: 0 }}>
              <h2 className="t-3" style={{ marginBottom: 20 }}>
                {istFussball ? 'Über das Team' : 'Über den Kurs'}
              </h2>
              <RichText data={a.beschreibung} enableGutter={false} enableProse={false} className="prose-bsv" />
            </div>
          )}
          {(a.team?.length ?? 0) > 0 && (
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <h2 className="t-3" style={{ marginBottom: 20 }}>
                {istFussball ? 'Trainerteam' : 'Übungsleitung'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {a.team!.map((t, i) => (
                  <div key={t.id ?? i} className="info" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 20 }}>
                    <span className="avatar">{t.foto && typeof t.foto === 'object' ? <Bild media={t.foto} size="small" sizes="64px" alt="" /> : initialen(t.name)}</span>
                    <span>
                      <strong style={{ display: 'block', fontSize: 18 }}>{t.name}</strong>
                      <span className="muted" style={{ fontSize: 15 }}>
                        {t.rolle}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 15, marginTop: 16 }}>
                Kontakt läuft über das Formular unten – Telefonnummern stehen aus Datenschutzgründen nicht öffentlich auf der Seite.
              </p>
            </div>
          )}
        </section>
      )}

      {istFussball && (a.fupaWidgetId || a.fussballDeTeamId) && (
        <section className="wrap-narrow" style={{ paddingBottom: 72 }}>
          <h2 className="t-3" style={{ marginBottom: 20 }}>
            Kader, Spiele &amp; Tabelle
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
            {a.fupaWidgetId && <ExternesWidget anbieter="FuPa" titel="Kader" widgetId={a.fupaWidgetId} />}
            {a.fussballDeTeamId && <ExternesWidget anbieter="FUSSBALL.DE" titel="Spielplan" widgetId={a.fussballDeTeamId} typ="spielplan" />}
            {a.fussballDeTeamId && <ExternesWidget anbieter="FUSSBALL.DE" titel="Tabelle" widgetId={a.fussballDeTeamId} typ="tabelle" />}
          </div>
        </section>
      )}

      <section id="probe" className="sec-soft" style={{ padding: '100px 22px', scrollMarginTop: 56 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 className="t-sec rv center" style={{ fontSize: 'clamp(40px, 5vw, 60px)' }}>
            Einfach mal reinschnuppern.
          </h2>
          <p className="rv lead center" style={{ margin: '14px auto 36px', maxWidth: 520, fontSize: 19 }}>
            {leitung ? `Die Anfrage geht direkt an ${leitung.name}.` : 'Die Anfrage geht direkt an die Übungsleitung.'} Wir melden uns per E-Mail.
          </p>
          <ProbetrainingForm
            angebotId={a.id}
            angebotName={a.title}
            ansprechperson={leitung?.name}
            istKinderangebot={istKind}
            terminVorschlaege={naechsteTermine(zeiten[0]?.tag, zeiten[0]?.von)}
          />
        </div>
      </section>

      {passend.length > 0 && (
        <section className="wrap-narrow" style={{ padding: '90px 22px' }}>
          <h2 className="t-3 rv" style={{ marginBottom: 24 }}>
            Das könnte auch passen
          </h2>
          <div className="grid-cards">
            {passend.map((x) => (
              <Link key={x.id} href={`/angebote/${x.slug}`} className="card card-soft rv" style={{ padding: 24, gap: 4 }}>
                <span className="card-cat" style={{ color: farbe(x.kategorie)[0] }}>
                  {x.kategorie}
                </span>
                <strong style={{ fontSize: 20 }}>{x.title}</strong>
                <span className="card-meta">{x.alterText}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
