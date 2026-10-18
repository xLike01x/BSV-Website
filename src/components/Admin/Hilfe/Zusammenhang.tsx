import React from 'react'

/** Bereiche, in deren Hilfe der Ablauf „Formular → Seite → Menü → Eingänge“ erscheint */
export const ZUSAMMENHANG = ['forms', 'pages', 'menue', 'form-submissions']

const SCHRITTE: { key: string; nr: string; titel: string; text: string; href?: string; wo: string }[] = [
  { key: 'forms', nr: '1', titel: 'Formular bauen', text: 'Felder festlegen: Name, E-Mail, Anzahl …', href: '/admin/collections/forms', wo: 'Eigene Formulare → Formulare' },
  { key: 'pages', nr: '2', titel: 'Auf eine Seite setzen', text: 'Seite anlegen, Baustein „Formular“ einfügen, veröffentlichen.', href: '/admin/collections/pages', wo: 'Inhalte → Seiten' },
  { key: 'menue', nr: '3', titel: 'Im Menü verlinken', text: 'Damit Besucher die Seite finden.', href: '/admin/globals/menue', wo: 'Inhalte → Menü & Fußzeile' },
  { key: 'website', nr: '4', titel: 'Besucher füllen aus', text: 'Auf der Website, ohne Anmeldung.', wo: 'Website' },
  { key: 'form-submissions', nr: '5', titel: 'Antworten lesen', text: 'Alle Eingänge gesammelt an einem Ort.', href: '/admin/collections/form-submissions', wo: 'Eigene Formulare → Formular-Eingänge' },
]

/** Ablauf als Grafik: so wird aus einem Formular etwas auf der Website */
export function Zusammenhang({ aktiv }: { aktiv?: string }) {
  return (
    <section className="bsv-zusammenhang" aria-label="So hängt alles zusammen">
      <h3>So hängt alles zusammen</h3>
      <ol>
        {SCHRITTE.map((s) => {
          const inhalt = (
            <>
              <span className="bsv-zusammenhang__nr" aria-hidden="true">
                {s.nr}
              </span>
              <span>
                <strong>{s.titel}</strong>
                <small>{s.text}</small>
                <em>{s.wo}</em>
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
      {aktiv && SCHRITTE.some((s) => s.key === aktiv) && <p className="bsv-zusammenhang__hier">Du bist gerade bei Schritt {SCHRITTE.find((s) => s.key === aktiv)!.nr}.</p>}
    </section>
  )
}

const WEGE: { ich: string; wo: string; href: string; symbol: string }[] = [
  { ich: 'etwas Neues aus dem Verein erzählen', wo: 'News', href: '/admin/collections/posts/create', symbol: '📰' },
  { ich: 'einen Termin ankündigen', wo: 'Termine', href: '/admin/collections/termine/create', symbol: '📅' },
  { ich: 'ein ausgefallenes Training melden', wo: 'Trainingsausfälle', href: '/admin/collections/ausfaelle/create', symbol: '⛔' },
  { ich: 'Trainingszeiten oder Ansprechpartner ändern', wo: 'Teams & Kurse', href: '/admin/collections/angebote', symbol: '⚽' },
  { ich: 'eine eigene Infoseite machen (z. B. Sommerfest)', wo: 'Seiten', href: '/admin/collections/pages/create', symbol: '📄' },
  { ich: 'von Besuchern etwas abfragen (Anmeldung, Bestellung)', wo: 'Formulare', href: '/admin/collections/forms', symbol: '📝' },
  { ich: 'Texte auf der Startseite ändern', wo: 'Website-Texte', href: '/admin/globals/texte', symbol: '✏️' },
  { ich: 'das Menü oder die Fußzeile ändern', wo: 'Menü & Fußzeile', href: '/admin/globals/menue', symbol: '🧭' },
  { ich: 'Vorstand, Beiträge oder Mitgliederzahl ändern', wo: 'Vereinsdaten', href: '/admin/globals/verein', symbol: '🏟️' },
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
