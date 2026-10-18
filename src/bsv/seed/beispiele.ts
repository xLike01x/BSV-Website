/**
 * Beispiel-News: je eine kurze Team-News für jedes Team und jeden Kurs.
 * Zeigt, wie Team-News auf den Teamseiten aussehen.
 *
 *   pnpm seed:beispiele            anlegen bzw. aktualisieren
 *   pnpm seed:beispiele --loeschen alle Beispiel-News wieder entfernen
 *
 * Erkennbar am Kürzel „beispiel-“ in der Adresse (Slug).
 */
import { getPayload } from 'payload'

import config from '@payload-config'
import { doc, p } from './lexical'

const BEISPIELE: Record<string, [string, string, string]> = {
  // slug: [Titel, Absatz 1, Absatz 2]
  'buddy-s-fussballzwerge': ['Fußballzwerge erobern den Kunstrasen', 'Zum ersten Mal haben unsere Jüngsten auf dem neuen Kunstrasen trainiert – mit Hütchen-Parcours, Tor-Wettschießen und ganz viel Gelächter.', 'Neue Zwerge ab 3 Jahren sind jederzeit willkommen. Einfach mit Turnschuhen und Trinkflasche vorbeikommen!'],
  'g-jugend-bambini': ['Bambini beim Hallenturnier in Xanten', 'Sechs Spiele, unzählige Tore und am Ende strahlende Gesichter: Unsere Bambini haben sich beim Turnier in Xanten richtig gut geschlagen.', 'Danke an alle Eltern fürs Fahren und Anfeuern!'],
  'f1-jugend': ['F1 feiert drei Siege am Spieltag', 'Beim Spielfest auf eigener Anlage hat die F1 alle drei Partien gewonnen. Besonders das Zusammenspiel klappt inzwischen richtig gut.', 'Nächste Woche geht es auswärts weiter – Treffpunkt ist wie immer am Sportpark.'],
  'f2-jugend': ['Neue Trikots für die F2', 'Dank einer Spende aus der Elternschaft läuft die F2 ab sofort in nagelneuen Trikots auf. Die Kinder waren kaum zu bremsen.', 'Wir sagen herzlich Danke – das Mannschaftsfoto folgt!'],
  'e-jugend': ['E-Jugend übt Fair Play mit Schiri-Workshop', 'Einen Nachmittag lang durften unsere E-Junioren selbst pfeifen. So wurde schnell klar, wie schwer der Job an der Pfeife ist.', 'Seitdem wird auf dem Platz deutlich weniger diskutiert.'],
  'd1-jugend': ['D1 startet mit Auswärtssieg in die Saison', 'Mit einem verdienten 3:1 in Borth ist die D1 in die neue Saison gestartet. Die Vorbereitung hat sich gelohnt.', 'Das erste Heimspiel steigt am kommenden Samstag – Zuschauer sind herzlich eingeladen.'],
  'd2-jugend': ['D2 sucht noch Verstärkung', 'Für die D2 suchen wir noch zwei bis drei Spielerinnen und Spieler der Jahrgänge 2013 und 2014.', 'Probetraining ist jederzeit möglich – einfach über die Teamseite anfragen.'],
  'd3-jugend': ['D3 beim Fußballcamp dabei', 'Fast die komplette D3 war beim Sommercamp dabei und hat drei Tage lang Technik, Taktik und Teamgeist trainiert.', 'Das nehmen wir mit in die Saison!'],
  'c1-jugend': ['C1 mit starkem Pokalauftritt', 'Erst im Elfmeterschießen musste sich die C1 im Kreispokal geschlagen geben – nach einer kämpferisch starken Leistung.', 'Die Jungs haben gezeigt, dass mit ihnen in dieser Saison zu rechnen ist.'],
  'b1-jugend': ['B1 trainiert jetzt dreimal pro Woche', 'Ab sofort trainiert die B1 dienstags, donnerstags und freitags. Der Kunstrasen macht es möglich, auch bei schlechtem Wetter.', 'Ziel ist der Aufstieg – die Stimmung im Team ist entsprechend gut.'],
  'u13-maedchen': ['U13-Mädchen verteidigen den Titel', 'Nach dem Kreispokalsieg im Frühjahr zeigt die U13 auch in der Liga, was sie kann: drei Spiele, drei Siege.', 'Mädchen, die mitspielen möchten, sind jederzeit herzlich willkommen!'],
  '1-mannschaft': ['Erste empfängt Bezirksligist im Pokal', 'Nach dem Einzug ins Kreispokal-Finale wartet auf die Erste das nächste Highlight: Zu Gast ist ein Bezirksligist aus dem Kreis.', 'Anpfiff ist am Sonntag um 15 Uhr im Kutscher-Remy-Sportpark. Für Würstchen und Getränke ist gesorgt.'],
  '2-mannschaft': ['Zweite bleibt ungeschlagen', 'Auch im fünften Spiel in Folge hat die Zweite nicht verloren. Trainer Marcel Driesen lobt vor allem die Defensivarbeit.', 'Weiter so, Jungs!'],
  'alte-herren': ['Alte Herren laden zum Grillabend', 'Nach dem letzten Training vor der Winterpause laden die Alten Herren zum gemütlichen Grillabend am Sportheim ein.', 'Ehemalige und Interessierte sind herzlich willkommen – mitspielen kann jeder, der Spaß am Kicken hat.'],
  'fussball-damen': ['Damen-SG feiert ersten Heimsieg', 'Die Spielgemeinschaft mit dem SV Menzelen hat ihren ersten Heimsieg eingefahren – vor toller Kulisse.', 'Wer Lust hat mitzuspielen, meldet sich gern zum Probetraining.'],
  'nappy-dancers': ['Neue Gruppe bei den Nappy Dancers', 'Wegen der großen Nachfrage gibt es bei den Nappy Dancers ab sofort eine zweite Gruppe.', 'Eltern mit Kindern von 1,5 bis 3,5 Jahren können gern zum Schnuppern vorbeikommen.'],
  tanzmaeuse: ['Tanzmäuse proben für den Weihnachtsauftritt', 'Die Tanzmäuse üben fleißig für ihren Auftritt beim Weihnachtsmarkt. Verraten wird nur so viel: Es wird glitzern!', 'Wir freuen uns auf viele Zuschauerinnen und Zuschauer.'],
  'diamond-kids': ['Diamond Kids mit neuer Choreografie', 'Zu einem aktuellen Hit haben die Diamond Kids eine komplett neue Choreografie einstudiert.', 'Die Premiere gibt es beim nächsten Vereinsfest zu sehen.'],
  kindergardetanz: ['Kindergarde startet mit zwölf Tänzerinnen', 'Die neue Kindergarde ist erfolgreich gestartet: Zwölf Mädchen zwischen 11 und 15 Jahren trainieren jetzt regelmäßig.', 'Kostüme sind bestellt – der erste Auftritt ist in Planung.'],
  'zumba-kids': ['Zumba® Kids tanzen beim Polderfest', 'Mit Musik, Energie und viel Spaß haben die Zumba® Kids das Publikum beim Polderfest mitgerissen.', 'Danke an Bea für die tolle Vorbereitung!'],
  'eltern-kind-turnen': ['Bewegungslandschaft im Herbst-Look', 'Beim Eltern-Kind-Turnen gab es eine Bewegungslandschaft rund um das Thema Herbst – mit Kletterbaum und Blätter-Rutsche.', 'Neue Familien sind herzlich willkommen.'],
  'turnen-fuer-kindergartenkinder': ['Kinderturnen: Abzeichen-Tag', 'Beim Abzeichen-Tag haben alle Kinder ihr Bewegungsabzeichen geschafft – mit Purzelbaum, Balancieren und Weitsprung.', 'Die Urkunden gibt es in der nächsten Stunde.'],
  'turnen-fuer-grundschulkinder': ['Grundschulturnen mit neuen Geräten', 'Dank der Kooperation mit der Polderdorfschule turnen die Grundschulkinder jetzt auch an Ringen und Minitrampolin.', 'Die Begeisterung ist riesig!'],
  mitmachzirkus: ['Manege frei beim Mitmachzirkus', 'Jonglieren, Diabolo und Akrobatik: Der Mitmachzirkus hat bei der Bewegungsolympiade eine kleine Show gezeigt.', 'Neue Artistinnen und Artisten zwischen 8 und 12 Jahren sind willkommen.'],
  'step-burn': ['Step & Burn mit Sonderstunde', 'Am Monatsende gibt es eine extralange Step-&-Burn-Stunde mit neuen Kombinationen und Partner-Workout.', 'Bitte Handtuch und genug zu trinken mitbringen!'],
  'zumba-fitness': ['Zumba®-Party im Sportheim', 'Statt normaler Stunde gab es eine Zumba®-Party mit Lichteffekten und Gästen aus den Nachbarvereinen.', 'Eine Wiederholung ist schon in Planung.'],
  spinning: ['Spinning: Neue Bikes sind da', 'Der Kurs fährt ab sofort auf modernisierten Rädern. Die Sitzposition lässt sich jetzt noch besser einstellen.', 'Probestunden sind nach Absprache möglich.'],
  bodyfit: ['Bodyfit mit Fokus auf Rücken', 'In den nächsten Wochen dreht sich bei Bodyfit alles um einen starken Rücken – ideal für alle, die viel sitzen.', 'Einsteigerinnen und Einsteiger sind herzlich willkommen.'],
  frauenfitness: ['Frauenfitness: Gemeinsam ins neue Jahr', 'Die Frauenfitness-Gruppe startet nach den Ferien mit einem gemeinsamen Frühstück in die neue Trainingszeit.', 'Wer reinschnuppern möchte, ist herzlich eingeladen.'],
  'pilates-fuer-damen': ['Pilates: Dritter Kurs ausgebucht', 'Auch der dritte Pilates-Kurs für Damen ist inzwischen voll. Wir arbeiten an einem weiteren Termin.', 'Interessierte können sich schon jetzt vormerken lassen.'],
  'pilates-fuer-herren': ['Pilates für Herren sucht Mitstreiter', 'Die Herren-Pilatesgruppe freut sich über Verstärkung. Vorkenntnisse sind nicht nötig – nur eine Matte.', 'Die Übungen stärken Rücken und Rumpf und beugen Verletzungen vor.'],
  yoga: ['Yoga im Freien', 'Bei bestem Wetter fand die letzte Yogastunde im Freien unter den Platanen statt.', 'Ein schöner Abschluss vor dem Wechsel zurück in die Halle.'],
  rehasport: ['Rehasport: Neue Verordnungen möglich', 'Für unseren zertifizierten Rehasport sind wieder Plätze frei. Mitmachen kann, wer eine ärztliche Verordnung hat.', 'Bei Fragen hilft die Übungsleitung gern weiter.'],
  seniorenturnen: ['Seniorenturnen feiert Geburtstage', 'Gleich drei runde Geburtstage gab es im Seniorenturnen zu feiern – natürlich nach der Gymnastik mit Kaffee und Kuchen.', 'Herzlichen Glückwunsch!'],
  'asiatische-bewegungsformen': ['Qi Gong für Einsteiger', 'Im neuen Block startet eine Einsteigerreihe mit Qi Gong und Tai Chi – ruhig, fließend und gut für Körper und Geist.', 'Bequeme Kleidung genügt.'],
  'nordic-walking': ['Nordic Walking: Neue Route am Rhein', 'Die Gruppe hat eine neue Route über den Rheindamm entdeckt – mit traumhaftem Blick bei Sonnenuntergang.', 'Stöcke können für die erste Runde ausgeliehen werden.'],
  walking: ['Walking-Gruppe organisiert Platanenfest', 'Die Walking-Gruppe hat erneut das Platanenfest auf die Beine gestellt – mit Picknick, Musik und vielen Gästen.', 'Mitlaufen kann jeder, jeden Dienstag um 9 Uhr.'],
}

const loeschen = process.argv.includes('--loeschen')

async function main() {
  const payload = await getPayload({ config })
  const alt = await payload.find({ collection: 'posts', where: { slug: { like: 'beispiel-' } }, limit: 500, depth: 0, pagination: false })
  if (loeschen) {
    for (const d of alt.docs) await payload.delete({ collection: 'posts', id: d.id, context: { disableRevalidate: true } })
    payload.logger.info(`${alt.docs.length} Beispiel-News gelöscht.`)
    process.exit(0)
  }

  const angebote = await payload.find({ collection: 'angebote', limit: 200, depth: 0, pagination: false })
  let i = 0
  for (const a of angebote.docs) {
    const b = BEISPIELE[a.slug]
    if (!b) {
      payload.logger.warn(`Kein Beispieltext für ${a.title}`)
      continue
    }
    const slug = `beispiel-${a.slug}`
    const vorhanden = alt.docs.find((d) => d.slug === slug)
    const datum = new Date(Date.now() - (i++ % 30) * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000)
    const data = {
      title: b[0],
      slug,
      team: a.id,
      aufStartseite: false,
      heroImage: (typeof a.bild === 'object' ? a.bild?.id : a.bild) ?? undefined,
      content: doc([p(b[1]), p(b[2])]),
      publishedAt: datum.toISOString(),
      _status: 'published' as const,
      meta: { title: b[0], description: b[1] },
    }
    if (vorhanden) await payload.update({ collection: 'posts', id: vorhanden.id, data: data as never, context: { disableRevalidate: true } })
    else await payload.create({ collection: 'posts', data: data as never, context: { disableRevalidate: true } })
  }
  payload.logger.info(`${i} Beispiel-News angelegt bzw. aktualisiert.`)
  process.exit(0)
}

try {
  await main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
