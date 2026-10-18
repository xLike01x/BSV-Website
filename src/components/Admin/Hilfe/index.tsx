'use client'
import { useAuth, usePreferences } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { EINSTIEGE } from '../Einstieg/einstiege'
import { Ablauf, Zusammenhang } from './Zusammenhang'
import { AnleitungBox, FaqBox, Feedback, FelderBox, FrageAnAdmin, tourStarten } from './bausteine'
import { ansichtAus, hilfeFuer, ladeHilfeGlobal, type HilfeGlobal } from './daten'
import { GLOSSAR, hauptRolle, ROLLEN_PROFIL } from './extras'
import { HILFE_BEARBEITEN, HILFE_LISTE } from './texte'
import { HILFE_GESEHEN_PREF } from '../prefs'
import './hilfe.scss'

const Abschnitt = ({ titel, punkte }: { titel: string; punkte?: string[] }) =>
  punkte && punkte.length > 0 ? (
    <section className="bsv-hilfe__abschnitt">
      <h3>{titel}</h3>
      <ul>
        {punkte.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  ) : null

/** „? Hilfe“-Knopf oben rechts: erklärt in einfachen Worten den aktuellen Bereich. */
export default function Hilfe() {
  const pfad = usePathname() ?? '/admin'
  const { user } = useAuth<{ roles?: string[] }>()
  const [offen, setOffen] = useState(false)
  const [global, setGlobal] = useState<HilfeGlobal | null>(null)
  const { setPreference } = usePreferences()

  const ansicht = ansichtAus(pfad)
  const rolle = hauptRolle(user?.roles)
  const h = hilfeFuer(ansicht.schluessel, global, rolle)

  useEffect(() => setOffen(false), [pfad])
  useEffect(() => {
    if (!offen) return
    void ladeHilfeGlobal().then(setGlobal)
    void setPreference(HILFE_GESEHEN_PREF, { erledigt: true })
    window.dispatchEvent(new CustomEvent('bsv-hilfe-gesehen'))
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && setOffen(false)
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [offen, setPreference])

  return (
    <>
      <button type="button" className="bsv-hilfe__knopf" onClick={() => setOffen(true)} aria-haspopup="dialog" aria-expanded={offen}>
        <span aria-hidden="true">?</span> Hilfe
      </button>

      {offen &&
        createPortal(
          <div className="bsv-hilfe__schleier" onClick={() => setOffen(false)}>
            <aside className="bsv-hilfe__panel" role="dialog" aria-modal="true" aria-labelledby="bsv-hilfe-titel" onClick={(e) => e.stopPropagation()}>
              <header className="bsv-hilfe__kopf">
                <p className="bsv-hilfe__ueber">Hilfe</p>
                <h2 id="bsv-hilfe-titel">{h.titel}</h2>
                <button type="button" className="bsv-hilfe__zu" onClick={() => setOffen(false)} aria-label="Hilfe schließen">
                  ×
                </button>
              </header>
              <p className="bsv-hilfe__kurz">{h.kurz}</p>

              {h.wozu && (
                <section className="bsv-hilfe__wozu">
                  <h3>Wozu brauche ich das?</h3>
                  <p>{h.wozu.text}</p>
                  {h.wozu.beispiele && h.wozu.beispiele.length > 0 && (
                    <>
                      <p className="bsv-hilfe__wozu-titel">Beispiele aus dem Verein:</p>
                      <ul>
                        {h.wozu.beispiele.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              )}
              {EINSTIEGE[h.schluessel]?.ablauf ? (
                <Ablauf schritte={EINSTIEGE[h.schluessel]!.ablauf!} aktiv={EINSTIEGE[h.schluessel]!.aktiv} titel={EINSTIEGE[h.schluessel]!.ablaufTitel} />
              ) : ['forms', 'menue', 'form-submissions'].includes(h.schluessel) ? (
                <Zusammenhang aktiv={h.schluessel} />
              ) : null}

              {h.rollenHinweis && (
                <p className="bsv-hilfe__rolle">
                  <strong>Für dich als {ROLLEN_PROFIL[rolle].label}:</strong> {h.rollenHinweis}
                </p>
              )}

              {h.anleitungen.length > 0 && (
                <section className="bsv-hilfe__gruppe">
                  <h3>So geht&apos;s – Schritt für Schritt</h3>
                  {h.anleitungen.map((a, i) => (
                    <AnleitungBox key={a.id} a={a} offen={i === 0} />
                  ))}
                </section>
              )}

              <Abschnitt titel="Was kann ich hier machen?" punkte={h.tun} />
              <Abschnitt titel="Was passiert dann auf der Website?" punkte={h.wirkung} />
              <Abschnitt titel="Gut zu wissen" punkte={h.tipps} />

              {(h.felder.length > 0 || h.faq.length > 0) && (
                <section className="bsv-hilfe__gruppe">
                  <FelderBox felder={h.felder} />
                  {h.faq.length > 0 && <h3>Häufige Fragen</h3>}
                  <FaqBox faq={h.faq} />
                </section>
              )}

              <section className="bsv-hilfe__gruppe">
                <details className="bsv-hilfe__anleitung">
                  <summary>
                    <span className="bsv-hilfe__anleitung-icon" aria-hidden="true">
                      ▸
                    </span>
                    Begriffe einfach erklärt
                  </summary>
                  <dl className="bsv-hilfe__felder">
                    {GLOSSAR.map((g) => (
                      <div key={g.name}>
                        <dt>{g.name}</dt>
                        <dd>{g.text}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </section>

              {ansicht.art === 'liste' && <Abschnitt titel="So funktioniert die Liste" punkte={HILFE_LISTE} />}
              {ansicht.art === 'bearbeiten' && <Abschnitt titel="Beim Bearbeiten" punkte={HILFE_BEARBEITEN} />}

              <Feedback bereich={ansicht.schluessel} />

              <div className="bsv-hilfe__aktionen">
                <a className="bsv-hilfe__btn" href="/admin/hilfe">
                  📖 Hilfe-Center
                </a>
                <button type="button" className="bsv-hilfe__btn" onClick={tourStarten}>
                  🧭 Tour starten
                </button>
                <FrageAnAdmin bereich={ansicht.schluessel} bereichTitel={h.titel} />
              </div>

              <p className="bsv-hilfe__fuss">
                {global?.ansprechperson
                  ? `Bei Fragen hilft dir ${global.ansprechperson}.`
                  : 'Nicht weitergekommen? Frag einen Admin des Vereins – lieber einmal zu viel als einmal zu wenig.'}
              </p>
            </aside>
          </div>,
          document.body,
        )}
    </>
  )
}
