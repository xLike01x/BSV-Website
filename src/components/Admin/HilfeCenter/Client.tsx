'use client'
import React, { useMemo, useState } from 'react'

import { AnleitungBox, FaqBox, Feedback, FrageAnAdmin, HilfeVideo, tourStarten } from '../Hilfe/bausteine'
import type { HilfeBereich } from '../Hilfe/daten'
import { GLOSSAR, type Faq, type RolleKey, type RollenProfil } from '../Hilfe/extras'

type Props = {
  bereiche: HilfeBereich[]
  faq: Faq[]
  rolle: RolleKey
  profil: RollenProfil
  rollenAuswahl: { key: RolleKey; label: string }[]
  ansprechperson: string | null
}

const norm = (s: string) => s.toLocaleLowerCase('de-DE')

export default function HilfeCenterClient({ bereiche, faq, rolle, profil, rollenAuswahl, ansprechperson }: Props) {
  const [suche, setSuche] = useState('')
  const q = norm(suche.trim())

  const treffer = useMemo(() => {
    if (!q) return null
    const passt = (...t: (string | undefined)[]) => t.some((x) => x && norm(x).includes(q))
    const anleitungen = bereiche.flatMap((b) =>
      b.anleitungen.filter((a) => passt(a.titel, ...a.schritte)).map((a) => ({ a, bereich: b.titel })),
    )
    const fragen = faq.filter((f) => passt(f.frage, f.antwort))
    const begriffe = GLOSSAR.filter((g) => passt(g.name, g.text))
    const themen = bereiche.filter((b) => passt(b.titel, b.kurz, ...b.tun, ...b.wirkung, ...(b.tipps ?? []), ...b.felder.map((f) => f.name + ' ' + f.text)))
    return { anleitungen, fragen, themen, begriffe }
  }, [q, bereiche, faq])

  const videos = bereiche.flatMap((b) => b.anleitungen.filter((a) => a.video).map((a) => ({ a, bereich: b.titel })))
  const fuerMich = bereiche.flatMap((b) => b.anleitungen.filter((a) => profil.anleitungen.some(([bb, id]) => bb === b.schluessel && id === a.id)))

  return (
    <div className="bsv-hc">
      <header className="bsv-hc__kopf">
        <p className="bsv-hc__ueber">Hilfe-Center</p>
        <h1>Wie können wir helfen?</h1>
        <label className="bsv-hc__suche">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Suchen, z. B. „Bild hochladen“, „Ausfall“ oder „Passwort“"
            aria-label="Hilfe durchsuchen"
            autoFocus
          />
        </label>
      </header>

      {treffer ? (
        <section className="bsv-hc__abschnitt">
          <h2>
            Suchergebnisse für „{suche.trim()}“
          </h2>
          {treffer.anleitungen.length + treffer.fragen.length + treffer.themen.length + treffer.begriffe.length === 0 && (
            <p className="bsv-hc__leer">
              Nichts gefunden. Versuch ein anderes Wort – oder stell unten eine Frage an den Admin.
            </p>
          )}
          {treffer.anleitungen.map(({ a, bereich }) => (
            <div key={bereich + a.id}>
              <p className="bsv-hc__bereich">{bereich}</p>
              <AnleitungBox a={a} />
            </div>
          ))}
          {treffer.fragen.length > 0 && <h3>Häufige Fragen</h3>}
          <FaqBox faq={treffer.fragen} />
          {treffer.begriffe.length > 0 && <h3>Begriffe</h3>}
          <Begriffe liste={treffer.begriffe} />
          {treffer.themen.length > 0 && <h3>Passende Bereiche</h3>}
          <div className="bsv-hc__kacheln">
            {treffer.themen.map((b) => (
              <BereichKachel key={b.schluessel} b={b} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="bsv-hc__abschnitt bsv-hc__fuer-mich">
            <div>
              <h2>Für dich als {profil.label}</h2>
              <p>{profil.kurz}</p>
              <div className="bsv-hc__reihe">
                <a className="bsv-hilfe__btn bsv-hilfe__btn--primaer" href={`/admin/hilfe/kurzanleitung?rolle=${rolle}`}>
                  🖨️ Kurzanleitung drucken
                </a>
                <button type="button" className="bsv-hilfe__btn" onClick={tourStarten}>
                  🧭 Tour starten
                </button>
              </div>
              {rollenAuswahl.length > 0 && (
                <p className="bsv-hc__klein">
                  Kurzanleitungen für andere Rollen (zum Verteilen):{' '}
                  {rollenAuswahl.map((r, i) => (
                    <React.Fragment key={r.key}>
                      {i > 0 && ' · '}
                      <a href={`/admin/hilfe/kurzanleitung?rolle=${r.key}`}>{r.label}</a>
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
            <div>
              <h3>Das brauchst du am häufigsten</h3>
              {fuerMich.map((a, i) => (
                <AnleitungBox key={a.id} a={a} offen={i === 0} />
              ))}
            </div>
          </section>

          {videos.length > 0 && (
            <section className="bsv-hc__abschnitt">
              <h2>Kurze Videos</h2>
              <div className="bsv-hc__videos">
                {videos.map(({ a, bereich }) => (
                  <figure key={a.id}>
                    <HilfeVideo src={a.video!} />
                    <figcaption>
                      <strong>{a.titel}</strong>
                      <span>{bereich}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          <section className="bsv-hc__abschnitt">
            <h2>Häufige Fragen</h2>
            <FaqBox faq={faq} />
          </section>

          <section className="bsv-hc__abschnitt">
            <h2>Begriffe einfach erklärt</h2>
            <Begriffe liste={GLOSSAR} />
          </section>

          <section className="bsv-hc__abschnitt">
            <h2>Alle Bereiche</h2>
            <div className="bsv-hc__kacheln">
              {bereiche
                .filter((b) => b.schluessel !== 'hilfe-center')
                .map((b) => (
                  <BereichKachel key={b.schluessel} b={b} />
                ))}
            </div>
          </section>
        </>
      )}

      <section className="bsv-hc__abschnitt bsv-hc__kontakt">
        <h2>Nicht gefunden, was du suchst?</h2>
        <p>{ansprechperson ? `Frag ${ansprechperson} – direkt hier:` : 'Stell deine Frage direkt an einen Admin:'}</p>
        <FrageAnAdmin bereich="hilfe-center" bereichTitel="Hilfe-Center" />
        <Feedback bereich="hilfe-center" />
      </section>
    </div>
  )
}

function Begriffe({ liste }: { liste: { name: string; text: string }[] }) {
  if (!liste.length) return null
  return (
    <dl className="bsv-hc__glossar">
      {liste.map((g) => (
        <div key={g.name}>
          <dt>{g.name}</dt>
          <dd>{g.text}</dd>
        </div>
      ))}
    </dl>
  )
}

function BereichKachel({ b }: { b: HilfeBereich }) {
  return (
    <details className="bsv-hc__kachel">
      <summary>
        <strong>{b.titel}</strong>
        <span>{b.kurz}</span>
      </summary>
      {b.rollenHinweis && <p className="bsv-hilfe__rolle">{b.rollenHinweis}</p>}
      {b.anleitungen.map((a) => (
        <AnleitungBox key={a.id} a={a} />
      ))}
      {b.tun.length > 0 && (
        <>
          <h4>Was kann ich hier machen?</h4>
          <ul>
            {b.tun.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
      {b.wirkung.length > 0 && (
        <>
          <h4>Was passiert dann?</h4>
          <ul>
            {b.wirkung.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
      {b.felder.length > 0 && (
        <>
          <h4>Was bedeuten die Felder?</h4>
          <Begriffe liste={b.felder} />
        </>
      )}
      {(b.tipps?.length ?? 0) > 0 && (
        <>
          <h4>Gut zu wissen</h4>
          <ul>
            {b.tipps!.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
    </details>
  )
}
