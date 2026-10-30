/**
 * Spielt die Startinhalte ein: Bilder, Teams & Kurse, News, Vereinsdaten und Seiten.
 * Aufruf:  pnpm seed:bsv
 * Mehrfaches Ausführen ist unschädlich – Vorhandenes wird aktualisiert, nicht doppelt angelegt.
 */
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import { slugify } from '@/hooks/slugFromTitle'
import { ANGEBOTE, DSGVO, NEWS_BILD, NEWS_KATEGORIE, NEWS_TITEL, VORSTAND } from './daten'
import { ausText, doc, h, p, ul } from './lexical'

type WpEintrag = { type: 'page' | 'post'; title: string; date: string; slug: string; text: string }

const ROOT = process.cwd()
const BILDER = path.join(ROOT, 'seed', 'bilder')
const WP: WpEintrag[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed', 'wordpress-inhalte.json'), 'utf8'))
const wp = (titel?: string) => (titel ? WP.find((w) => w.title === titel) : undefined)

/** Zeiten, Adressen und Begrüßungsfloskeln stehen jetzt in eigenen Feldern – aus dem Fließtext entfernen */
const bereinige = (text: string) =>
  text
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => z && !/^\d{1,2}[.:]\d{2}\s*[-–]/.test(z) && !/\b\d{5}\s+[A-ZÄÖÜ]/.test(z) && !/^Willkommen (auf|beim|bei)/i.test(z) && !/^(SV Büderich|Kindertrainerzertifikat|an:)$/i.test(z) && !/senden Sie uns|Zertifikat|Bei Fragen|E-Mail|^Lizenz/i.test(z))
    .join('\n')

const ALT: Record<string, string> = {
  'f-jugend': 'F-Jugend des BSV Arm in Arm vor dem Tor',
  'hero-maedchen': 'Mädchenmannschaft des BSV',
  hallenstadtmeister: '2. Mannschaft mit dem Pokal der Hallen-Stadtmeisterschaft',
  'tanzmaeuse-1': 'Tanzmäuse beim Auftritt im Freien',
  'tanzmaeuse-2': 'Kindertanzgruppe beim Auftritt',
  'zumba-gruppe': 'Zumba-Gruppe im Sportheim',
  'zumba-kurs': 'Zumba-Kurs in der Halle',
  'step-burn': 'Step-and-Burn-Kurs in der Halle',
  pilates: 'Pilates-Kurs',
  'pilates-herren': 'Pilates für Herren',
  bodyfit: 'Bodyfit-Kurs',
  'nordic-walking': 'Nordic-Walking-Gruppe am Rhein',
  spinning: 'Spinning-Kurs',
  yoga: 'Yoga-Kurs',
  seniorenturnen: 'Seniorengruppe mit Schaumstoffrollen',
  'kids-gruppe': 'Kindergruppe in der Halle',
  kinderturnen: 'Kinderturnen',
  kindertanz: 'Kindertanzgruppe',
  bewegungsolympiade: 'Kinder bei der Bewegungsolympiade',
  'jhv-2026': 'Verabschiedung von Mia Angenendt bei der JHV 2026',
  'flyer-picknick': 'Plakat Picknick unter den Platanen',
  'flyer-eroeffnung': 'Plakat zum Eröffnungsspiel BSV gegen Schalke 04 am 10.10.2026',
  'flyer-kindergarde': 'Plakat Kindergardetanz',
  veltins: 'Aktionsmotiv VELTINS – Dein Heimspiel',
  'flyer-damen': 'Plakat: Wir suchen dich – Damenfußball',
  'flyer-soccercamp': 'Plakat Soccer-Camp 2026',
}

async function bild(payload: Payload, name: string): Promise<number> {
  const filename = `${name}.jpg`
  const vorhanden = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
  if (vorhanden.docs[0]) return vorhanden.docs[0].id
  const m = await payload.create({
    collection: 'media',
    data: { alt: ALT[name] ?? '' },
    filePath: path.join(BILDER, filename),
  })
  return m.id
}

async function upsert<T extends 'angebote' | 'posts' | 'pages' | 'categories'>(
  payload: Payload,
  collection: T,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const r = await payload.find({ collection, where: where as never, limit: 1, depth: 0 })
  if (r.docs[0]) return payload.update({ collection, id: r.docs[0].id, data: data as never, depth: 0, context: { disableRevalidate: true } })
  return payload.create({ collection, data: data as never, depth: 0, context: { disableRevalidate: true } })
}

async function main() {
  const payload = await getPayload({ config })
  const log = (s: string) => payload.logger.info(s)

  log('Bilder …')
  const B: Record<string, number> = {}
  for (const f of fs.readdirSync(BILDER).filter((f) => f.endsWith('.jpg'))) {
    const name = f.replace(/\.jpg$/, '')
    B[name] = await bild(payload, name)
  }

  log('Teams & Kurse …')
  let reihenfolge = 10
  for (const a of ANGEBOTE) {
    const quelle = wp(a.wp)
    await upsert(payload, 'angebote', { title: { equals: a.title } }, {
      title: a.title,
      slug: slugify(a.title),
      bereich: a.bereich,
      untergruppe: a.untergruppe,
      kategorie: a.kategorie,
      alterText: a.alterText,
      alterVon: a.alterVon,
      alterBis: a.alterBis,
      kurzbeschreibung: a.kurz,
      beschreibung: quelle && bereinige(quelle.text).length > 40 ? ausText(bereinige(quelle.text)) : null,
      bild: a.bild ? B[a.bild] : undefined,
      zeiten: a.zeiten ?? [],
      team: a.team ?? [],
      spielklasse: a.spielklasse,
      reihenfolge: (reihenfolge += 10),
      aktiv: true,
    })
  }

  log('Kategorien und News …')
  const kat: Record<string, number> = {}
  for (const k of ['Verein', 'Fußball', 'Kids']) {
    const c = await upsert(payload, 'categories', { title: { equals: k } }, { title: k, slug: slugify(k) })
    kat[k] = c.id
  }
  for (const n of WP.filter((w) => w.type === 'post')) {
    const titel = NEWS_TITEL[n.title] ?? n.title
    const slug = slugify(titel).slice(0, 80)
    const text = n.text.trim() || titel
    await upsert(payload, 'posts', { slug: { equals: slug } }, {
      title: titel,
      slug,
      heroImage: NEWS_BILD[n.title] ? B[NEWS_BILD[n.title]!] : undefined,
      content: ausText(text, { titel }),
      categories: [kat[NEWS_KATEGORIE[n.title] ?? 'Verein']],
      publishedAt: new Date(n.date).toISOString(),
      _status: 'published',
      meta: { title: titel, image: NEWS_BILD[n.title] ? B[NEWS_BILD[n.title]!] : undefined },
    })
  }

  log('Vereinsdaten …')
  await payload.updateGlobal({
    slug: 'verein',
    context: { disableRevalidate: true },
    data: {
      vorstand: VORSTAND.map(([name, rolle]) => ({ name, rolle })),
      dsgvo: DSGVO.map(([frage, antwort]) => ({ frage, antwort })),
    },
  })

  log('Texte & Bilder …')
  await payload.updateGlobal({
    slug: 'texte',
    context: { disableRevalidate: true },
    data: {
      bilderUebernommen: true,
      heroBilder: [B['tanzmaeuse-1'], B['step-burn'], B['seniorenturnen'], B['hero-maedchen']].filter(Boolean) as number[],
      heroTag1: 'Tanzmäuse · 3–6 Jahre',
      heroTag2: 'Mädchenfußball',
      bildFussball: B['f-jugend'],
      bildKids: B['kids-gruppe'],
      bildFitness: B['step-burn'],
      breitensport: { bild1: B['zumba-gruppe'], bild2: B['kids-gruppe'], bild3: B['seniorenturnen'] },
      verein: { titelbild: B['zumba-gruppe'] },
      aktion: {
        aktiv: true,
        kicker: 'Kunstrasen 2026',
        titel: 'Eröffnet – mit Schalke 04.',
        text: 'Am 10. Oktober 2026 trat das BSV-Allstar-Team zum Eröffnungsspiel gegen die Traditionsmannschaft von Schalke 04 an. Jetzt wird im Kutscher-Remy-Sportpark ganzjährig gespielt.',
        linkText: 'Mehr zum Projekt',
        linkUrl: '/kunstrasen',
        bild: B['flyer-eroeffnung'],
      },
    } as never,
  })

  log('Seiten …')
  const impressum = (wp('Impressum')?.text ?? '').split('\nDatenschutz\n')[0] ?? ''
  const seiten = [
    {
      title: 'Kunstrasen 2026',
      slug: 'kunstrasen',
      content: doc([
        p('Seit Herbst 2026 hat der BSV einen neuen Kunstrasenplatz im Kutscher-Remy-Sportpark. Damit können alle Teams ganzjährig und bei jedem Wetter trainieren und spielen.'),
        h('Das Eröffnungsspiel'),
        p('Am 10. Oktober 2026 trat das BSV-Allstar-Team zum Eröffnungsspiel gegen die Traditionsmannschaft von Schalke 04 an.'),
        h('Was der neue Platz bringt'),
        ul(['Training auch im Winter und bei Regen', 'Mehr Platz für unsere 142 Kinder in der Fußballjugend', 'Weniger Spielausfälle für alle Teams']),
        h('Unterstützen'),
        p('Einnahmen aus dem Parzellenverkauf fließen unter anderem in ein Kassenhäuschen, neue Trainerbänke und möglichst ein Kleinspielfeld. Du möchtest den BSV als Sponsor unterstützen? Schreib uns über das Kontaktformular.'),
      ]),
    },
    { title: 'Impressum', slug: 'impressum', content: ausText(impressum) },
    {
      title: 'Datenschutz',
      slug: 'datenschutz',
      content: doc([
        p('ENTWURF – vor dem Livegang vom Vorstand prüfen und ergänzen lassen.'),
        h('Verantwortlicher'),
        p('Büdericher Spielverein 1919 e.V., Am Weißen Stein 2f, 46487 Wesel. Vertreten durch den Vorstand.'),
        h('Hosting'),
        p('Die Website wird auf Servern der Hetzner Online GmbH in Deutschland betrieben. Mit Hetzner besteht ein Vertrag zur Auftragsverarbeitung.'),
        h('Keine Tracking-Dienste'),
        p('Wir setzen keine Analyse- oder Werbe-Tracker ein. Schriftarten werden von unserem eigenen Server geladen, nicht von Google. Karten und Videos externer Anbieter werden erst nach deinem Klick geladen.'),
        h('Formulare'),
        p('Wenn du ein Formular (Mitgliedsantrag, Probetraining, Kontakt) absendest, speichern wir deine Angaben zur Bearbeitung deiner Anfrage. Bankdaten werden verschlüsselt gespeichert.'),
        h('Cookies'),
        p('Wir verwenden nur technisch notwendige Cookies für die Anmeldung im Mitgliederbereich.'),
        h('Deine Rechte'),
        p('Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei der Aufsichtsbehörde.'),
      ]),
    },
  ]
  for (const s of seiten) {
    await upsert(payload, 'pages', { slug: { equals: s.slug } }, {
      title: s.title,
      slug: s.slug,
      hero: { type: 'none' },
      layout: [{ blockType: 'content', columns: [{ size: 'full', richText: s.content }] }],
      meta: { title: s.title },
      _status: 'published',
    })
  }

  log('Fertig.')
  process.exit(0)
}

// Top-Level-await: `payload run` beendet den Prozess, sobald der Import fertig ist
try {
  await main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
