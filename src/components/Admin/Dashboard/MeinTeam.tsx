import React from 'react'

export type TeamUebersicht = {
  id: number
  titel: string
  slug?: string | null
  zeiten: { tag?: string | null; von?: string | null; bis?: string | null; ort?: string | null }[]
  ausfaelle: { id: number; datum: string; grund?: string | null }[]
  probetraining: number | null
  passantraege: number | null
  news: { id: number; titel: string; entwurf: boolean }[]
}

const tag = (iso: string) => new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date(iso))

/** „Mein Team“: alles Wichtige zu den eigenen Teams auf einen Blick – mit den häufigsten Aktionen */
export default function MeinTeam({ teams, darfAusfall, darfNews }: { teams: TeamUebersicht[]; darfAusfall: boolean; darfNews: boolean }) {
  if (!teams.length) return null
  return (
    <section className="bsv-dash__meinteam" aria-label={teams.length === 1 ? 'Mein Team' : 'Meine Teams'}>
      <h2>{teams.length === 1 ? 'Mein Team' : 'Meine Teams'}</h2>
      <div className="bsv-dash__meinteam-raster">
        {teams.map((t) => (
          <article key={t.id} className="bsv-dash__box bsv-dash__team">
            <header>
              <h3>{t.titel}</h3>
              {t.slug && (
                <a href={`/angebote/${t.slug}`} target="_blank" rel="noopener">
                  Seite ansehen ↗
                </a>
              )}
            </header>

            <dl>
              <dt>Training</dt>
              <dd>
                {t.zeiten.length ? (
                  <ul>
                    {t.zeiten.slice(0, 4).map((z, i) => (
                      <li key={i}>
                        {z.tag} {z.von}
                        {z.bis && `–${z.bis}`}
                        {z.ort && <span> · {z.ort}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <a href={`/admin/collections/angebote/${t.id}`}>Noch keine Zeiten – jetzt eintragen</a>
                )}
              </dd>

              <dt>Ausfälle</dt>
              <dd>
                {t.ausfaelle.length ? (
                  <ul>
                    {t.ausfaelle.slice(0, 3).map((a) => (
                      <li key={a.id}>
                        <a href={`/admin/collections/ausfaelle/${a.id}`}>
                          {tag(a.datum)}
                          {a.grund && ` · ${a.grund}`}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Keine gemeldet'
                )}
              </dd>

              {(t.probetraining !== null || t.passantraege !== null) && (
                <>
                  <dt>Offen</dt>
                  <dd className="bsv-dash__team-offen">
                    {t.probetraining !== null && (
                      <a href={`/admin/collections/probetraining?where[and][0][angebot][equals]=${t.id}&where[and][1][status][equals]=neu`} className={t.probetraining ? 'is-neu' : undefined}>
                        {t.probetraining} Probetraining
                      </a>
                    )}
                    {t.passantraege !== null && (
                      <a href={`/admin/collections/passantraege?where[and][0][team][equals]=${t.id}&where[and][1][status][equals]=eingereicht`} className={t.passantraege ? 'is-neu' : undefined}>
                        {t.passantraege} Passantr{t.passantraege === 1 ? 'ag' : 'äge'}
                      </a>
                    )}
                  </dd>
                </>
              )}

              <dt>News</dt>
              <dd>
                {t.news.length ? (
                  <ul>
                    {t.news.map((n) => (
                      <li key={n.id}>
                        <a href={`/admin/collections/posts/${n.id}`}>{n.titel || 'Ohne Titel'}</a>
                        {n.entwurf && <span className="bsv-dash__team-entwurf"> Entwurf</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Noch keine'
                )}
              </dd>
            </dl>

            <div className="bsv-dash__aktionen">
              {darfNews && (
                <a className="bsv-dash__btn bsv-dash__btn--primaer" href="/admin/collections/posts/create">
                  + News
                </a>
              )}
              {darfAusfall && (
                <a className="bsv-dash__btn" href="/admin/collections/ausfaelle/create">
                  Ausfall melden
                </a>
              )}
              <a className="bsv-dash__btn" href={`/admin/collections/angebote/${t.id}`}>
                Zeiten & Infos
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
