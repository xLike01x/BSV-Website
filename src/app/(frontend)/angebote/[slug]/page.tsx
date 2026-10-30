import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import RichText from '@/components/RichText'
import { Bild } from '@/bsv/components/Bild'
import { ExternesWidget } from '@/bsv/components/ExternesWidget'
import { ProbetrainingForm } from '@/bsv/components/ProbetrainingForm'
import { Galerie } from '@/bsv/components/Galerie'
import { T } from '@/bsv/components/Text'
import { getAlben, getAngebot, getAngebote, getAusfaelle, getPlatzhalter, getTeamGalerie, getTeamNews, getTexte } from '@/bsv/data'
import { Teilen } from '@/bsv/components/Teilen'
import { JsonLd } from '@/bsv/components/JsonLd'
import { absolut, brotkrumen, seite } from '@/bsv/seo'
import { BEREICH_LABEL, bildUrl, datum, farbe, initialen, UNTERGRUPPE_LABEL, zeitText } from '@/bsv/lib'

export const revalidate = 60

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  // Im Testbetrieb (pnpm dev) nichts vorab erzeugen: Next startet dafür bei jedem ersten Aufruf einen eigenen Prozess,
  // der Payload samt Datenbankprüfung („Pulling schema …“) neu hochfährt – 10 Sekunden und mehr. Die Seiten entstehen dann
  // beim Aufruf. Live (next build) werden sie wie bisher vorab erzeugt.
  if (process.env.NODE_ENV === 'development') return []
  const angebote = await getAngebote()
  return angebote.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const a = await getAngebot(decodeURIComponent(slug))
  if (!a) return {}
  return seite(a.title, a.kurzbeschreibung ?? `${a.title} beim Büdericher SV 1919 – Zeiten, Ort und Probetraining.`, bildUrl(a.bild, 'og'))
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

/** Hinweis-Banner: nur mit Text und bis einschließlich zum eingestellten Tag (deutsche Zeit) */
const bannerAktiv = (a: { bannerText?: string | null; bannerBis?: string | null }) => {
  if (!a.bannerText?.trim()) return false
  if (!a.bannerBis) return true
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  const bis = new Date(a.bannerBis).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })
  return heute <= bis
}

export default async function AngebotSeite({ params }: Args) {
  const { slug } = await params
  const a = await getAngebot(decodeURIComponent(slug))
  if (!a) notFound()

  const [alle, ausfaelle, teamNews, galerie, tx, w, alben] = await Promise.all([getAngebote(), getAusfaelle([a.id]), getTeamNews(a.id), getTeamGalerie(a.id), getTexte(), getPlatzhalter(), getAlben(a.id, 6)])
  const [tint] = farbe(a.kategorie)
  const istFussball = a.bereich === 'fussball'
  const bereichHref = istFussball ? '/fussball' : '/breitensport'
  const gruppe = istFussball ? UNTERGRUPPE_LABEL[a.untergruppe ?? ''] : BEREICH_LABEL[a.bereich]
  const zeiten = a.zeiten ?? []
  // „Stand“: wann die Angaben zuletzt bestätigt wurden (Zeiten geändert, Knopf in der Verwaltung oder „Passt noch?“-Mail)
  const standIso = (a as { bestaetigtAm?: string | null }).bestaetigtAm ?? a.updatedAt
  const stand = {
    monat: new Date(standIso).toLocaleDateString('de-DE', { month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' }),
    alt: Date.now() - new Date(standIso).getTime() > 365 * 86400000,
  }
  const leitung = a.team?.[0]
  const istKind = (a.alterVon ?? 18) < 14
  const passend = alle
    .filter((x) => x.id !== a.id && x.bereich === a.bereich && (x.alterVon ?? 0) <= (a.alterBis ?? 99) && (x.alterBis ?? 99) >= (a.alterVon ?? 0))
    .slice(0, 3)

  return (
    <>
      <JsonLd
        daten={[
          brotkrumen([
            [istFussball ? 'Fußball' : 'Breitensport', istFussball ? '/fussball' : '/breitensport'],
            [a.title, `/angebote/${a.slug}`],
          ]),
          {
            '@context': 'https://schema.org',
            '@type': istFussball ? 'SportsTeam' : 'Course',
            name: a.title,
            description: a.kurzbeschreibung ?? undefined,
            url: absolut(`/angebote/${a.slug}`),
            image: absolut(bildUrl(a.bild, 'og')),
            ...(istFussball
              ? { sport: 'Fußball', memberOf: { '@type': 'SportsOrganization', name: 'Büdericher Spielverein 1919 e.V.' } }
              : { provider: { '@type': 'SportsOrganization', name: 'Büdericher Spielverein 1919 e.V.', url: absolut('/') } }),
          },
        ]}
      />
      <section className="wrap-narrow" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <nav aria-label="Brotkrumen" className="crumbs">
          <Link href={bereichHref}>{istFussball ? 'Fußball' : 'Breitensport'}</Link> › {gruppe} › <span style={{ color: 'var(--bsv-ink)' }}>{a.title}</span>
        </nav>
        {bannerAktiv(a) && (
          <p role="status" className={`team-banner team-banner--${a.bannerArt ?? 'info'}`}>
            <span aria-hidden="true">{a.bannerArt === 'wichtig' ? '⚠️' : 'ℹ️'}</span> {a.bannerText}
          </p>
        )}
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
              <Teilen titel={a.title} text={`${a.title} beim BSV 1919`} />
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
                  {leitung.rolle || 'Trainer'}
                </span>
                <strong style={{ fontSize: 19 }}>{leitung.name}</strong>
              </span>
            </div>
          )}
        </div>
        {zeiten.length > 0 && (
          <p className="muted" style={{ margin: '14px 0 0', fontSize: 14 }}>
            Stand der Trainingszeiten: {stand.monat}
            {stand.alt ? ' – bitte vor dem ersten Besuch kurz beim Team nachfragen, ob sie noch stimmen.' : ''}
          </p>
        )}
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
                {istFussball ? 'Trainerteam' : 'Trainer'}
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
            {a.fupaWidgetId && <ExternesWidget anbieter="FuPa" titel="FuPa: Kader, Spiele & Tabelle" widgetId={a.fupaWidgetId} />}
            {a.fussballDeTeamId && <ExternesWidget anbieter="FUSSBALL.DE" titel="Spielplan" widgetId={a.fussballDeTeamId} typ="spielplan" />}
            {a.fussballDeTeamId && <ExternesWidget anbieter="FUSSBALL.DE" titel="Tabelle" widgetId={a.fussballDeTeamId} typ="tabelle" />}
          </div>
        </section>
      )}

      {teamNews.length > 0 && (
        <section className="wrap-narrow" style={{ paddingBottom: 72 }}>
          <h2 className="t-3" style={{ marginBottom: 20 }}>
            Neues {istFussball ? 'aus dem Team' : 'aus der Gruppe'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px 20px' }}>
            {teamNews.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`} className="card card-soft" style={{ gap: 0 }}>
                <span className="card-img" style={{ aspectRatio: '16 / 9' }}>
                  {n.heroImage && typeof n.heroImage === 'object' ? <Bild media={n.heroImage} size="small" sizes="360px" /> : null}
                </span>
                <span className="card-body">
                  <span className="card-cat green">{datum(n.publishedAt)}</span>
                  <strong className="card-title">{n.title}</strong>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {galerie.length > 0 && (
        <section className="wrap-narrow" style={{ paddingBottom: 72 }}>
          <h2 className="t-3" style={{ marginBottom: 20 }}>
            Bilder
          </h2>
          <Galerie
            bilder={galerie.map((m) => ({
              id: m.id,
              klein: bildUrl(m, 'square') ?? '',
              gross: bildUrl(m, 'xlarge') ?? '',
              alt: m.alt ?? '',
            }))}
          />
        </section>
      )}

      {alben.length > 0 && (
        <section className="wrap-narrow" style={{ paddingBottom: 72 }}>
          <h2 className="t-3" style={{ marginBottom: 20 }}>
            Fotoalben
          </h2>
          <div className="alben-raster">
            {alben.map((al) => {
              const erstes = (al.bilder ?? []).find((b) => typeof b === 'object')
              return (
                <Link key={al.id} href={`/galerie/${al.slug}`} className="card card-soft album-karte">
                  <span className="album-cover">{erstes && <Bild media={erstes} size="medium" sizes="(max-width: 700px) 100vw, 380px" />}</span>
                  <span style={{ padding: '14px 18px 18px' }}>
                    <span className="card-cat" style={{ color: 'var(--bsv-green)' }}>
                      {datum(al.datum, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <strong style={{ display: 'block', fontSize: 18, marginTop: 4 }}>{al.titel}</strong>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section id="probe" className="sec-soft" style={{ padding: '100px 22px', scrollMarginTop: 56 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 className="t-sec rv center" style={{ fontSize: 'clamp(40px, 5vw, 60px)' }}>
            <T text={tx.probetraining?.titel} werte={w} />
          </h2>
          <p className="rv lead center" style={{ margin: '14px auto 36px', maxWidth: 520, fontSize: 19 }}>
            {leitung ? `Die Anfrage geht direkt an ${leitung.name}.` : 'Die Anfrage geht direkt an die Trainer.'} Wir melden uns per E-Mail.
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
