import { getTranslation } from '@payloadcms/translations'
import { getNavGroups } from '@payloadcms/ui/shared'
import type { AdminViewServerProps, CollectionSlug, Where } from 'payload'
import React from 'react'

import { hauptRolle, ROLLEN_PROFIL } from '../Hilfe/extras'
import Tour from '../Tour'
import ErsteSchritte from './ErsteSchritte'
import { aufgabenFuer } from './aufgaben'
import './index.scss'

const ADMIN = '/admin'
const TZ = 'Europe/Berlin'

type Aktivitaet = { wann: string; was: string; titel: string; href: string; farbe: string }

/** Kleine Hilfsfunktion: Fehler beim Zählen (z. B. fehlende Rechte) dürfen das Dashboard nie sprengen. */
async function sicher<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

function vorWann(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  const std = Math.round(min / 60)
  if (std < 24) return `vor ${std} Std.`
  const tage = Math.round(std / 24)
  if (tage === 1) return 'gestern'
  if (tage < 7) return `vor ${tage} Tagen`
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(new Date(iso))
}

const ROLLEN_LABEL: Record<string, string> = {
  webadmin: 'Web-Admin',
  admin: 'Admin',
  redaktion: 'Redaktion',
  kasse: 'Kasse',
  uebungsleitung: 'Trainer',
  teamredaktion: 'Team-Redaktion',
  mitglied: 'Mitglied',
}

export default async function Dashboard(props: AdminViewServerProps) {
  const { initPageResult } = props
  const { permissions, req, visibleEntities } = initPageResult
  const { payload, i18n, user } = req
  if (!user) return null

  const darf = (slug: string, aktion: 'read' | 'create' | 'update' = 'read') =>
    Boolean((permissions.collections as Record<string, Record<string, unknown>> | undefined)?.[slug]?.[aktion])
  const darfGlobal = (slug: string) => Boolean((permissions.globals as Record<string, Record<string, unknown>> | undefined)?.[slug]?.update)

  const rollen = ((user as { roles?: string[] }).roles ?? []) as string[]
  const istTeamRolle = !rollen.some((r) => ['admin', 'redaktion', 'kasse', 'passwesen'].includes(r))
  const vorname = ((user as { name?: string }).name || user.email || '').split(/[\s@]/)[0]
  const zaehle = (collection: CollectionSlug, where?: Where) =>
    sicher(async () => (await payload.count({ collection, where, user, overrideAccess: false, req })).totalDocs, 0)

  const heute = new Date()
  heute.setHours(0, 0, 0, 0)

  // Eigene Teams (Verantwortliche) – für Übungsleitung und Team-Redaktion
  const eigeneTeams = await sicher(
    async () =>
      (
        await payload.find({
          collection: 'angebote',
          where: { leitung: { contains: user.id } },
          limit: 20,
          depth: 0,
          sort: 'title',
          select: { title: true, slug: true },
        })
      ).docs,
    [] as { id: number; title: string; slug?: string | null }[],
  )

  const [verein, antraege, probe, kontakt, news, termine, ausfaelle] = await Promise.all([
    sicher(() => payload.findGlobal({ slug: 'verein', depth: 0 }), null),
    darf('mitgliedsantraege') ? zaehle('mitgliedsantraege', { status: { equals: 'neu' } }) : Promise.resolve(null),
    darf('probetraining') ? zaehle('probetraining', { status: { equals: 'neu' } }) : Promise.resolve(null),
    darf('kontaktanfragen') ? zaehle('kontaktanfragen', { status: { equals: 'neu' } }) : Promise.resolve(null),
    zaehle('posts', {
      and: [{ _status: { equals: 'published' } }, ...(istTeamRolle && eigeneTeams.length ? [{ team: { in: eigeneTeams.map((t) => t.id) } }] : [])],
    }),
    zaehle('termine', { beginn: { greater_than_equal: heute.toISOString() } }),
    zaehle('ausfaelle', {
      and: [{ datum: { greater_than_equal: heute.toISOString() } }, ...(istTeamRolle && eigeneTeams.length ? [{ angebot: { in: eigeneTeams.map((t) => t.id) } }] : [])],
    }),
  ])

  type Karte = { label: string; wert: number | string; farbe: string; href?: string; hinweis?: string }
  const karten: Karte[] = []
  if (!istTeamRolle) {
    karten.push({ label: 'Mitglieder', wert: (verein?.mitglieder ?? 0).toLocaleString('de-DE'), farbe: 'gruen', href: `${ADMIN}/globals/verein`, hinweis: 'laut Vereinsdaten' })
  } else {
    karten.push({ label: eigeneTeams.length === 1 ? 'Mein Team' : 'Meine Teams', wert: eigeneTeams.length, farbe: 'gruen' })
  }
  if (antraege !== null) karten.push({ label: 'Offene Mitgliedsanträge', wert: antraege, farbe: 'orange', href: `${ADMIN}/collections/mitgliedsantraege?where[status][equals]=neu` })
  if (probe !== null) karten.push({ label: 'Neue Probetraining-Anfragen', wert: probe, farbe: 'blau', href: `${ADMIN}/collections/probetraining?where[status][equals]=neu` })
  if (kontakt !== null && karten.length < 4) karten.push({ label: 'Neue Kontaktanfragen', wert: kontakt, farbe: 'orange', href: `${ADMIN}/collections/kontaktanfragen?where[status][equals]=neu` })
  karten.push({ label: istTeamRolle ? 'News meiner Teams' : 'News veröffentlicht', wert: news, farbe: 'lila', href: `${ADMIN}/collections/posts` })
  if (karten.length < 4) karten.push({ label: 'Kommende Termine', wert: termine, farbe: 'blau', href: `${ADMIN}/collections/termine` })
  if (karten.length < 4) karten.push({ label: 'Gemeldete Ausfälle', wert: ausfaelle, farbe: 'orange', href: `${ADMIN}/collections/ausfaelle` })

  // Schnellzugriff – nur was die Rolle wirklich darf
  const aktionen: { label: string; href: string; primaer?: boolean }[] = []
  if (darf('posts', 'create')) aktionen.push({ label: '+ News schreiben', href: `${ADMIN}/collections/posts/create`, primaer: true })
  if (darf('termine', 'create')) aktionen.push({ label: '+ Termin anlegen', href: `${ADMIN}/collections/termine/create` })
  if (darf('ausfaelle', 'create')) aktionen.push({ label: 'Ausfall melden', href: `${ADMIN}/collections/ausfaelle/create` })
  if (darf('media', 'create')) aktionen.push({ label: 'Bilder hochladen', href: `${ADMIN}/collections/media/create` })
  if (darfGlobal('texte')) aktionen.push({ label: 'Website-Texte', href: `${ADMIN}/globals/texte` })
  if (darfGlobal('menue')) aktionen.push({ label: 'Menü & Fußzeile', href: `${ADMIN}/globals/menue` })
  if (darf('pages', 'create')) aktionen.push({ label: 'Seite bearbeiten', href: `${ADMIN}/collections/pages` })
  if (rollen.includes('admin')) aktionen.push({ label: 'Rollen-Übersicht', href: `${ADMIN}/rollen` })
  if (darfGlobal('verein')) aktionen.push({ label: 'Vereinsdaten & Vorstand', href: `${ADMIN}/globals/verein` })

  // Letzte Aktivitäten aus mehreren Bereichen zusammenführen
  const quellen: { slug: CollectionSlug; was: (d: Record<string, unknown>) => string; titel: (d: Record<string, unknown>) => string; farbe: string }[] = [
    { slug: 'posts', was: (d) => (d._status === 'published' ? 'News veröffentlicht' : 'News-Entwurf'), titel: (d) => String(d.title ?? ''), farbe: 'lila' },
    { slug: 'termine', was: () => 'Termin', titel: (d) => String(d.title ?? ''), farbe: 'blau' },
    { slug: 'ausfaelle', was: () => 'Ausfall gemeldet', titel: (d) => String(d.grund || 'Training fällt aus'), farbe: 'orange' },
    { slug: 'mitgliedsantraege', was: (d) => (d.status === 'neu' ? 'Neuer Mitgliedsantrag' : 'Mitgliedsantrag'), titel: (d) => [d.vorname, d.nachname].filter(Boolean).join(' '), farbe: 'orange' },
    { slug: 'probetraining', was: (d) => (d.status === 'neu' ? 'Neue Probetraining-Anfrage' : 'Probetraining'), titel: (d) => String(d.name ?? ''), farbe: 'blau' },
    { slug: 'kontaktanfragen', was: () => 'Kontaktanfrage', titel: (d) => String(d.betreff ?? ''), farbe: 'gruen' },
  ]
  // Team-Rollen sehen nur Aktivitäten ihrer eigenen Teams
  const teamIds = eigeneTeams.map((t) => t.id)
  const teamFilter: Partial<Record<string, Where>> =
    istTeamRolle && teamIds.length ? { posts: { team: { in: teamIds } }, ausfaelle: { angebot: { in: teamIds } } } : {}
  const listen = await Promise.all(
    quellen
      .filter((q) => darf(q.slug))
      .map((q) =>
        sicher(async () => {
          const r = await payload.find({ collection: q.slug, where: teamFilter[q.slug], sort: '-updatedAt', limit: 5, depth: 0, user, overrideAccess: false, req, draft: q.slug === 'posts' })
          return r.docs.map(
            (d): Aktivitaet => ({
              wann: String((d as { updatedAt: string }).updatedAt),
              was: q.was(d as unknown as Record<string, unknown>),
              titel: q.titel(d as unknown as Record<string, unknown>),
              href: `${ADMIN}/collections/${q.slug}/${d.id}`,
              farbe: q.farbe,
            }),
          )
        }, [] as Aktivitaet[]),
      ),
  )
  const aktivitaeten = listen
    .flat()
    .sort((a, b) => b.wann.localeCompare(a.wann))
    .slice(0, 7)

  const gruppen = getNavGroups(permissions, visibleEntities, payload.config, i18n)

  // Willkommen: Was darf ich mit meiner Rolle?
  const rolle = hauptRolle(rollen)
  const profil = ROLLEN_PROFIL[rolle]
  const teamNamen = eigeneTeams.map((t) => t.title)

  // Erste Schritte: erste eigene News (bzw. Ausfall für Übungsleitungen)
  const ersteAufgabe =
    rolle === 'kasse' || rolle === 'passwesen'
      ? undefined
      : rolle === 'uebungsleitung'
        ? {
            label: 'Zum Üben einen Trainingsausfall anlegen (danach gern wieder löschen)',
            href: `${ADMIN}/collections/ausfaelle/create`,
            erledigt: aktivitaeten.some((a) => a.href.includes('/ausfaelle/')),
          }
        : {
            label: 'Eine erste News als Entwurf anlegen',
            href: `${ADMIN}/collections/posts/create`,
            erledigt: (await zaehle('posts', { authors: { contains: user.id } })) > 0,
          }

  // Wichtige Aufgaben (Datensicherung, Datenschutz, alte Zugänge) – je nach Rolle
  const aufgaben = await aufgabenFuer(req, rollen)

  return (
    <div className="bsv-dash gutter--left gutter--right">
      <header className="bsv-dash__kopf">
        <div>
          <h1>
            Hallo, {vorname}.
          </h1>
          <p>
            Das ist heute im Verein los.
            {rollen.length > 0 && (
              <span className="bsv-dash__rolle">
                {rollen
                  .filter((r) => !(r === 'admin' && rollen.includes('webadmin')))
                  .map((r) => ROLLEN_LABEL[r] ?? r)
                  .join(' · ')}
              </span>
            )}
          </p>
        </div>
        <div className="bsv-dash__kopf-aktionen">
          <Tour />
          <a className="bsv-dash__website" href="/" target="_blank" rel="noopener">
            Website ansehen ↗
          </a>
        </div>
      </header>

      <details className="bsv-dash__willkommen" open={!((user as { name?: string }).name)}>
        <summary>
          <strong>
            Du bist {profil.label}
            {teamNamen.length > 0 && <> für {teamNamen.join(', ')}</>}.
          </strong>{' '}
          <span>{profil.kurz}</span>
        </summary>
        <div className="bsv-dash__willkommen-inhalt">
          <div>
            <h3>Das kannst du</h3>
            <ul>
              {profil.darf.map((d) => (
                <li key={d}>✓ {d}</li>
              ))}
            </ul>
          </div>
          {profil.darfNicht.length > 0 && (
            <div>
              <h3>Das machen andere</h3>
              <ul className="bsv-dash__willkommen-nicht">
                {profil.darfNicht.map((d) => (
                  <li key={d}>– {d}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="bsv-dash__willkommen-links">
            <a className="bsv-dash__btn" href={`${ADMIN}/hilfe/kurzanleitung?rolle=${rolle}`}>
              🖨️ Kurzanleitung für {profil.label}
            </a>
            <a className="bsv-dash__btn" href={`${ADMIN}/hilfe`}>
              📖 Hilfe-Center
            </a>
          </div>
        </div>
      </details>

      {aufgaben.length > 0 && (
        <ul className="bsv-dash__aufgaben" aria-label="Zu erledigen">
          {aufgaben.map((a) => (
            <li key={a.key} className={`is-${a.art}`}>
              <span aria-hidden="true">{a.symbol}</span>
              <span>{a.text}</span>
              <a href={a.href}>{a.link} ›</a>
            </li>
          ))}
        </ul>
      )}

      <ErsteSchritte
        hatName={Boolean((user as { name?: string }).name)}
        zweiFaktor={Boolean((user as { zweiFaktorAktiv?: boolean }).zweiFaktorAktiv)}
        ersteAufgabe={ersteAufgabe}
      />

      <section className="bsv-dash__karten" aria-label="Kennzahlen">
        {karten.slice(0, 4).map((k) => {
          const inhalt = (
            <>
              <span className="bsv-dash__karte-label">{k.label}</span>
              <strong className={`bsv-dash__zahl bsv-dash__zahl--${k.farbe}`}>{k.wert}</strong>
              {k.hinweis && <span className="bsv-dash__karte-hinweis">{k.hinweis}</span>}
            </>
          )
          return k.href ? (
            <a key={k.label} className="bsv-dash__karte bsv-dash__karte--link" href={k.href}>
              {inhalt}
            </a>
          ) : (
            <div key={k.label} className="bsv-dash__karte">
              {inhalt}
            </div>
          )
        })}
      </section>

      <div className="bsv-dash__raster">
        <section className="bsv-dash__box">
          <h2>Schnellzugriff</h2>
          <div className="bsv-dash__aktionen">
            {aktionen.map((a) => (
              <a key={a.href} href={a.href} className={a.primaer ? 'bsv-dash__btn bsv-dash__btn--primaer' : 'bsv-dash__btn'}>
                {a.label}
              </a>
            ))}
          </div>

          {eigeneTeams.length > 0 && (
            <>
              <h3>{eigeneTeams.length === 1 ? 'Mein Team' : 'Meine Teams'}</h3>
              <ul className="bsv-dash__teams">
                {eigeneTeams.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}</strong>
                    <span>
                      <a href={`${ADMIN}/collections/posts/create`}>News</a>
                      <a href={`${ADMIN}/collections/angebote/${t.id}`}>Bearbeiten</a>
                      {t.slug && (
                        <a href={`/angebote/${t.slug}`} target="_blank" rel="noopener">
                          Seite ↗
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="bsv-dash__box bsv-dash__aktivitaeten">
          <h2>Letzte Aktivitäten</h2>
          {aktivitaeten.length === 0 && <p className="bsv-dash__leer">Noch nichts passiert.</p>}
          <ul className="bsv-dash__liste">
            {aktivitaeten.map((a) => (
              <li key={a.href}>
                <a href={a.href}>
                  <span className={`bsv-dash__punkt bsv-dash__punkt--${a.farbe}`} aria-hidden="true" />
                  <span className="bsv-dash__liste-text">
                    <strong>{a.was}</strong>
                    {a.titel && <span> · {a.titel}</span>}
                  </span>
                  <time dateTime={a.wann}>{vorWann(a.wann)}</time>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bsv-dash__bereiche" aria-label="Alle Bereiche">
        <h2>Alle Bereiche</h2>
        <div className="bsv-dash__gruppen">
          {gruppen.map((g) => (
            <div key={g.label} className="bsv-dash__gruppe">
              <h3>{g.label}</h3>
              <ul>
                {g.entities.map((e) => (
                  <li key={e.slug}>
                    <a href={`${ADMIN}/${e.type}/${e.slug}`}>
                      {getTranslation(e.label, i18n)}
                      <span aria-hidden="true">›</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
