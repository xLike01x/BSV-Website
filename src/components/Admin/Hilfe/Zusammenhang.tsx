import React from 'react'


export type Schritt = { key: string; titel: string; text: string; href?: string; wo?: string }

const FORMULAR_SCHRITTE: Schritt[] = [
  { key: 'forms', titel: 'Formular bauen', text: 'Felder festlegen: Name, E-Mail, Anzahl …', href: '/admin/collections/forms', wo: 'Website-Aufbau → Formulare' },
  { key: 'pages', titel: 'Auf eine Seite setzen', text: 'Seite anlegen, Baustein „Formular“ einfügen, veröffentlichen.', href: '/admin/collections/pages', wo: 'Website-Aufbau → Seiten' },
  { key: 'menue', titel: 'Im Menü verlinken', text: 'Damit Besucher die Seite finden.', href: '/admin/globals/menue', wo: 'Website-Aufbau → Menü & Fußzeile' },
  { key: 'website', titel: 'Besucher füllen aus', text: 'Auf der Website, ohne Anmeldung.', wo: 'Website' },
  { key: 'form-submissions', titel: 'Antworten lesen', text: 'Alle Eingänge gesammelt an einem Ort.', href: '/admin/collections/form-submissions', wo: 'Posteingang → Formular-Eingänge' },
]

/** Ablauf als nummerierte Grafik – für jeden Bereich wiederverwendbar */
export function Ablauf({ schritte, aktiv, titel = 'So hängt alles zusammen' }: { schritte: Schritt[]; aktiv?: string; titel?: string }) {
  const nr = schritte.findIndex((s) => s.key === aktiv)
  return (
    <section className="bsv-zusammenhang" aria-label={titel}>
      <h3>{titel}</h3>
      <ol>
        {schritte.map((s, i) => {
          const inhalt = (
            <>
              <span className="bsv-zusammenhang__nr" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong>{s.titel}</strong>
                <small>{s.text}</small>
                {s.wo && <em>{s.wo}</em>}
              </span>
            </>
          )
          return (
            <li key={s.key} className={aktiv === s.key ? 'is-aktiv' : ''} aria-current={aktiv === s.key ? 'step' : undefined}>
              {s.href ? <a href={s.href}>{inhalt}</a> : <div>{inhalt}</div>}
            </li>
          )
        })}
      </ol>
      {nr >= 0 && <p className="bsv-zusammenhang__hier">Du bist gerade bei Schritt {nr + 1}.</p>}
    </section>
  )
}

/** Ablauf für eigene Formulare: Formular → Seite → Menü → Eingänge */
export function Zusammenhang({ aktiv }: { aktiv?: string }) {
  return <Ablauf schritte={FORMULAR_SCHRITTE} aktiv={aktiv} />
}

const WEGE: { ich: string; wo: string; href: string; symbol: string }[] = [
  { ich: 'etwas Neues aus dem Verein erzählen', wo: 'News', href: '/admin/collections/posts/create', symbol: '📰' },
  { ich: 'einen Termin ankündigen', wo: 'Termine', href: '/admin/collections/termine/create', symbol: '📅' },
  { ich: 'ein ausgefallenes Training melden', wo: 'Trainingsausfälle', href: '/admin/collections/ausfaelle/create', symbol: '⛔' },
  { ich: 'Trainingszeiten oder Ansprechpartner ändern', wo: 'Teams & Kurse', href: '/admin/collections/angebote', symbol: '⚽' },
  { ich: 'eine eigene Infoseite machen (z. B. Sommerfest)', wo: 'Seiten', href: '/admin/collections/pages/create', symbol: '📄' },
  { ich: 'von Besuchern etwas abfragen (Anmeldung, Bestellung)', wo: 'Formulare', href: '/admin/collections/forms', symbol: '📝' },
  { ich: 'Texte auf der Startseite ändern', wo: 'Texte & Bilder', href: '/admin/globals/texte', symbol: '✏️' },
  { ich: 'das Menü oder die Fußzeile ändern', wo: 'Menü & Fußzeile', href: '/admin/globals/menue', symbol: '🧭' },
  { ich: 'Vorstand, Beiträge oder Mitgliederzahl ändern', wo: 'Vereinsdaten', href: '/admin/globals/verein', symbol: '🏟️' },
  { ich: 'Bilder der Startseite oder die grüne Aktions-Box ändern', wo: 'Texte & Bilder', href: '/admin/globals/texte', symbol: '🖼️' },
  { ich: 'Bilder hochladen', wo: 'Mediathek', href: '/admin/collections/media/create', symbol: '🖼️' },
]

/** „Ich möchte …“ – Wegweiser zum richtigen Bereich. `erlaubt` filtert auf Bereiche, die die Person sieht. */
export function Wegweiser({ erlaubt }: { erlaubt?: string[] }) {
  const wege = erlaubt ? WEGE.filter((w) => erlaubt.some((e) => w.href.includes(`/${e}`))) : WEGE
  if (!wege.length) return null
  return (
    <ul className="bsv-wegweiser">
      {wege.map((w) => (
        <li key={w.ich}>
          <a href={w.href}>
            <span aria-hidden="true">{w.symbol}</span>
            <span>
              Ich möchte <strong>{w.ich}</strong>
              <small>→ {w.wo}</small>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
