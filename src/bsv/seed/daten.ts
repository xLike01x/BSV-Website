/**
 * Startinhalte für die neue Website, zusammengestellt aus der bisherigen
 * WordPress-Seite und dem Bericht der JHV 2026. Alles ist danach in der
 * Verwaltung frei änderbar.
 */
export type AngebotSeed = {
  title: string
  bereich: 'fussball' | 'kids' | 'erwachsene'
  untergruppe?: 'junioren' | 'juniorinnen' | 'senioren' | 'seniorinnen'
  kategorie: string
  alterText: string
  alterVon: number
  alterBis: number
  kurz: string
  bild?: string
  wp?: string
  zeiten?: { tag?: string; von?: string; bis?: string; ort?: string; hinweis?: string }[]
  team?: { name: string; rolle: string }[]
  spielklasse?: string
}

const SP = 'Kutscher-Remy-Sportpark'
const HALLE = 'Sporthalle Petristraße'

export const ANGEBOTE: AngebotSeed[] = [
  // Fußball – Junioren
  { title: 'Buddy’s Fußballzwerge', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: 'ab 3 Jahren', alterVon: 3, alterBis: 5, kurz: 'Mit viel Spiel und Spaß an den Ball gewöhnen – bevor es mit etwa 5 Jahren zu den Bambini geht.', bild: 'f-jugend', wp: "Buddy's Fußballzwerge", zeiten: [{ ort: SP, hinweis: '1× wöchentlich auf dem Rasenplatz' }] },
  { title: 'G-Jugend – Bambini', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: 'unter 7 Jahre (U7)', alterVon: 4, alterBis: 6, kurz: 'Die ersten richtigen Spiele – mit Freude am Ball und am Team.', bild: 'f-jugend', wp: 'G-Jugend - unsere Bambini' },
  { title: 'F1-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '7–8 Jahre (U8 & U9)', alterVon: 7, alterBis: 8, kurz: 'Technik, Spaß und erste Turniere.', bild: 'f-jugend', wp: 'F1-Jugend' },
  { title: 'F2-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '7–8 Jahre (U8 & U9)', alterVon: 7, alterBis: 8, kurz: 'Technik, Spaß und erste Turniere.', bild: 'f-jugend', wp: 'F2-Jugend' },
  { title: 'E-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '9–10 Jahre (U10 & U11) · JSG', alterVon: 9, alterBis: 10, kurz: 'Im Kleinfeld zusammenspielen lernen.', bild: 'f-jugend', wp: 'E-Jugend' },
  { title: 'D1-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '11–12 Jahre (U12 & U13) · JSG', alterVon: 11, alterBis: 12, kurz: 'Der Schritt aufs große Feld.', bild: 'f-jugend', wp: 'D1-Jugend' },
  { title: 'D2-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '11–12 Jahre (U12 & U13) · JSG', alterVon: 11, alterBis: 12, kurz: 'Der Schritt aufs große Feld.', bild: 'f-jugend', wp: 'D2-Jugend' },
  { title: 'D3-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '11–12 Jahre (U12 & U13) · JSG', alterVon: 11, alterBis: 12, kurz: 'Der Schritt aufs große Feld.', bild: 'f-jugend', wp: 'D3-Jugend' },
  { title: 'C1-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '13–14 Jahre (U14 & U15) · JSG', alterVon: 13, alterBis: 14, kurz: 'Taktik, Teamgeist und Ligaspiele.', bild: 'f-jugend', wp: 'C1-Jugend' },
  { title: 'B1-Jugend', bereich: 'fussball', untergruppe: 'junioren', kategorie: 'Fußball', alterText: '15–16 Jahre (U16 & U17) · JSG', alterVon: 15, alterBis: 16, kurz: 'Der letzte Schritt vor den Senioren.', bild: 'f-jugend', wp: 'B1-Jugend' },
  // Juniorinnen
  { title: 'U13-Mädchen', bereich: 'fussball', untergruppe: 'juniorinnen', kategorie: 'Fußball', alterText: 'bis 12 Jahre (U13)', alterVon: 10, alterBis: 12, kurz: 'Mädchenfußball beim BSV – die U13 holte 2026 den Moerser Kreispokal.', bild: 'hero-maedchen', wp: 'U13-Mädchen' },
  // Senioren
  { title: '1. Mannschaft', bereich: 'fussball', untergruppe: 'senioren', kategorie: 'Fußball', alterText: 'Erwachsene (Senioren)', alterVon: 18, alterBis: 40, kurz: 'Erstmals in der Vereinsgeschichte im Kreispokal-Finale.', bild: 'hallenstadtmeister', wp: '1. Mannschaft' },
  { title: '2. Mannschaft', bereich: 'fussball', untergruppe: 'senioren', kategorie: 'Fußball', alterText: 'Erwachsene (Senioren)', alterVon: 18, alterBis: 45, kurz: 'Unter Trainer Marcel Driesen direkt Hallen-Stadtmeister geworden.', bild: 'hallenstadtmeister', wp: '2. Mannschaft', zeiten: [{ von: '19:00', bis: '20:30', ort: SP }], team: [{ name: 'Marcel Driesen', rolle: 'Trainer' }] },
  { title: 'Alte Herren', bereich: 'fussball', untergruppe: 'senioren', kategorie: 'Fußball', alterText: 'ab 32 Jahren (Ü32)', alterVon: 32, alterBis: 99, kurz: 'Kicken mit Erfahrung – und danach zusammensitzen.', bild: 'hallenstadtmeister', wp: 'Alten Herren' },
  // Seniorinnen
  { title: 'Fußball Damen', bereich: 'fussball', untergruppe: 'seniorinnen', kategorie: 'Fußball', alterText: 'Erwachsene · SG mit SV Menzelen', alterVon: 16, alterBis: 45, kurz: 'Der Damenfußball ist zurück in Büderich – in Spielgemeinschaft mit dem SV Menzelen.', bild: 'flyer-damen', wp: 'Fußball Damen', zeiten: [{ ort: SP, hinweis: 'zweimal pro Woche' }] },

  // BSV Kids
  { title: 'Nappy Dancers®', bereich: 'kids', kategorie: 'Tanzen', alterText: '1,5–3 J.', alterVon: 1, alterBis: 3, kurz: 'Kleinkindertanzen mit Mama, Papa, Oma oder Opa.', bild: 'kindertanz', wp: 'Nappy Dancers® - Kleinkinder Tanzen 1,5 - 3 Jahre' },
  { title: 'Tanzmäuse', bereich: 'kids', kategorie: 'Tanzen', alterText: '3–6 J.', alterVon: 3, alterBis: 6, kurz: 'Rhythmisch und spielerisch zur Musik: Aufwärmspiel, bekannte Tänze und ein kleines Abschlussspiel.', bild: 'tanzmaeuse-1', wp: 'Tanzen für Kindergartenkinder', zeiten: [{ tag: 'Freitag', von: '15:00', bis: '16:00', ort: HALLE }], team: [{ name: 'Anke Maas', rolle: 'Trainerin' }] },
  { title: 'Diamond Kids', bereich: 'kids', kategorie: 'Tanzen', alterText: '6–11 J.', alterVon: 6, alterBis: 11, kurz: 'Tanzen für Grundschulkinder.', bild: 'kindertanz', wp: 'Tanzen 6-11 Jahre' },
  { title: 'Kindergardetanz', bereich: 'kids', kategorie: 'Tanzen', alterText: '11–15 J.', alterVon: 11, alterBis: 15, kurz: 'Neu seit 2026: Gardetanz für Kinder von 11 bis 15 Jahren.', bild: 'flyer-kindergarde' },
  { title: 'Zumba® Kids', bereich: 'kids', kategorie: 'Tanzen', alterText: '8–12 J.', alterVon: 8, alterBis: 12, kurz: 'Tanzen und Auspowern zu lateinamerikanischen Rhythmen.', bild: 'tanzmaeuse-2', wp: 'Zumba® Kids', team: [{ name: 'Bea Giesen', rolle: 'Trainerin' }] },
  { title: 'Eltern-Kind-Turnen', bereich: 'kids', kategorie: 'Turnen', alterText: '1–3 J. mit Eltern', alterVon: 1, alterBis: 3, kurz: 'Klettern, rutschen, balancieren – gemeinsam mit Mama oder Papa.', bild: 'kinderturnen', wp: 'Eltern-Kind-Turnen' },
  { title: 'Turnen für Kindergartenkinder', bereich: 'kids', kategorie: 'Turnen', alterText: '3–6 J.', alterVon: 3, alterBis: 6, kurz: 'Bewegungslandschaften, Spiele und erste Turnübungen.', bild: 'kids-gruppe', wp: 'Turnen für Kindergartenkinder' },
  { title: 'Turnen für Grundschulkinder', bereich: 'kids', kategorie: 'Turnen', alterText: '6–10 J.', alterVon: 6, alterBis: 10, kurz: 'Turnen in Kooperation mit der Polderdorfschule.', bild: 'kids-gruppe', wp: 'Turnen für Grundschulkinder' },
  { title: 'Mitmachzirkus', bereich: 'kids', kategorie: 'Zirkus', alterText: '8–12 J.', alterVon: 8, alterBis: 12, kurz: 'Jonglieren, Akrobatik und Balance – Manege frei!', bild: 'bewegungsolympiade', wp: 'Mitmachzirkus für Kinder von 8 – 14 Jahren' },

  // Erwachsene & Senioren
  { title: 'Step & Burn', bereich: 'erwachsene', kategorie: 'Fitness', alterText: 'Frauen ab 16 Jahren', alterVon: 16, alterBis: 70, kurz: 'Ausdauer und Koordination: 60 Minuten Step und 30 Minuten abwechslungsreiches Workout.', bild: 'step-burn', wp: 'Step & Burn' },
  { title: 'Zumba® Fitness', bereich: 'erwachsene', kategorie: 'Fitness', alterText: 'ab 12 Jahren', alterVon: 12, alterBis: 99, kurz: 'Party-Workout zu lateinamerikanischen Rhythmen.', bild: 'zumba-gruppe', wp: 'Zumba® Fitness' },
  { title: 'Spinning', bereich: 'erwachsene', kategorie: 'Fitness', alterText: 'ab 14 Jahren', alterVon: 14, alterBis: 99, kurz: 'Indoor-Cycling mit Musik – jeder fährt in seinem Tempo.', bild: 'spinning', wp: 'Spinning' },
  { title: 'Bodyfit', bereich: 'erwachsene', kategorie: 'Fitness', alterText: 'ab 16 Jahren', alterVon: 16, alterBis: 99, kurz: 'Ganzkörpertraining für Kraft, Ausdauer und Beweglichkeit.', bild: 'bodyfit', wp: 'Bodyfit - Ganzkörpertraining' },
  { title: 'Frauenfitness', bereich: 'erwachsene', kategorie: 'Fitness', alterText: 'Frauen 18–99', alterVon: 18, alterBis: 99, kurz: 'Fit bleiben in netter Runde.', bild: 'zumba-kurs', wp: 'Frauenfitness' },
  { title: 'Pilates für Damen', bereich: 'erwachsene', kategorie: 'Gesundheit', alterText: 'drei Kurse', alterVon: 18, alterBis: 99, kurz: 'Kräftigung der Körpermitte, je ca. 60 Minuten.', bild: 'pilates', wp: 'Pilates für Damen' },
  { title: 'Pilates für Herren', bereich: 'erwachsene', kategorie: 'Gesundheit', alterText: '18–99 Jahre', alterVon: 18, alterBis: 99, kurz: 'Pilates speziell für Männer.', bild: 'pilates-herren', wp: 'Pilates für Herren' },
  { title: 'Yoga', bereich: 'erwachsene', kategorie: 'Gesundheit', alterText: 'ab 12 Jahren', alterVon: 12, alterBis: 99, kurz: 'Atmung, Kraft und Entspannung.', bild: 'yoga', wp: 'Yoga' },
  { title: 'Rehasport', bereich: 'erwachsene', kategorie: 'Gesundheit', alterText: 'mit Verordnung', alterVon: 18, alterBis: 99, kurz: 'Zertifizierter Rehasport mit ärztlicher Verordnung.', bild: 'seniorenturnen', wp: 'Rehasport' },
  { title: 'Seniorenturnen', bereich: 'erwachsene', kategorie: 'Gesundheit', alterText: 'ab 55 Jahren', alterVon: 55, alterBis: 99, kurz: 'Wirbelsäulengymnastik und Beweglichkeit in geselliger Runde.', bild: 'seniorenturnen', wp: 'Seniorenturnen' },
  { title: 'Asiatische Bewegungsformen', bereich: 'erwachsene', kategorie: 'Kampfkunst', alterText: 'Qi Gong, Tai Chi', alterVon: 18, alterBis: 99, kurz: 'Ruhige, fließende Bewegungen für Körper und Geist.', bild: 'yoga', wp: 'Asiatische Bewegungsformen' },
  { title: 'Nordic Walking', bereich: 'erwachsene', kategorie: 'Ausdauer', alterText: 'über den Rheindamm', alterVon: 30, alterBis: 99, kurz: 'Gemeinsam mit Stöcken über den Rheindamm.', bild: 'nordic-walking', wp: 'Nordic Walking' },
  { title: 'Walking', bereich: 'erwachsene', kategorie: 'Ausdauer', alterText: '18–99 Jahre', alterVon: 18, alterBis: 99, kurz: 'Rund 6 Kilometer – nur so schnell, dass man sich noch unterhalten kann.', bild: 'nordic-walking', wp: 'Walking', zeiten: [{ tag: 'Dienstag', von: '09:00', ort: 'Treffpunkt Wacht am Rhein' }] },
]

export const NEWS_BILD: Record<string, string> = {
  'Sommercamp 2026 beim BSV': 'flyer-soccercamp',
  'Picknick unter den Platanen 2026': 'flyer-picknick',
  'Voller Erfolg bei der Bewegungsolympiade': 'bewegungsolympiade',
  'Großes Eröffnungsspiel des neuen Kunstrasenplatzes': 'flyer-eroeffnung',
  'Kindergardetanz von 11-15 Jahren': 'flyer-kindergarde',
  'BSV unter den TOP 6: VELTINS-Dein Heimspiel': 'veltins',
  'JHV 2026 beim BSV - Mia Angenendet verabschiedet': 'jhv-2026',
}

export const NEWS_KATEGORIE: Record<string, string> = {
  'Sommercamp 2026 beim BSV': 'Fußball',
  'Großes Eröffnungsspiel des neuen Kunstrasenplatzes': 'Fußball',
  'Voller Erfolg bei der Bewegungsolympiade': 'Kids',
  'Kindergardetanz von 11-15 Jahren': 'Kids',
}

/** Bereinigte Titel (Tippfehler der alten Seite korrigiert) */
export const NEWS_TITEL: Record<string, string> = {
  'JHV 2026 beim BSV - Mia Angenendet verabschiedet': 'JHV 2026: Mia Angenendt nach 56 Jahren verabschiedet',
  'Kindergardetanz von 11-15 Jahren': 'Neu: Kindergardetanz für 11 bis 15 Jahre',
  'BSV unter den TOP 6: VELTINS-Dein Heimspiel': 'BSV unter den TOP 6: VELTINS – Dein Heimspiel',
  'Einladung zur JHV am 20.03.2026 um 19.19 Uhr im Sportheim Schützenstraße': 'Einladung zur JHV am 20.03.2026 um 19:19 Uhr',
}

export const VORSTAND: [string, string][] = [
  ['Bea Giesen', '1. Vorsitzende'],
  ['Steffen Angenendt', 'Geschäftsführer'],
  ['Nina Steinert', '2. Kassiererin'],
  ['Cindy Nagels', 'Schriftführerin'],
  ['Michael van Husen', 'Öffentlichkeitsarbeit'],
  ['Charly Freckmann', 'Abteilungsleitung Breitensport'],
  ['Rocco Steinert', 'Fußball Senioren'],
  ['Christoph Stutz', 'Jugendgeschäftsführer'],
  ['Andre van Endern', 'Jugendobmann'],
  ['Angelika Ploch', 'Jugendkassiererin'],
  ['Judith Grunden', 'Mädchenkoordinatorin'],
]

export const DSGVO: [string, string][] = [
  ['Wer ist verantwortlich?', 'Verantwortlich für die Verarbeitung deiner Daten ist der Büdericher Spielverein 1919 e.V., Am Weißen Stein 2f, 46487 Wesel, vertreten durch den Vorstand nach § 26 BGB.'],
  ['Welche Daten speichern wir?', 'Für die Mitgliedschaft: Name, Anschrift, Geburtsdatum, E-Mail, gewählte Teams und Kurse sowie die Bankverbindung für den Beitragseinzug. Die IBAN wird verschlüsselt gespeichert. Bei Probetraining- und Kontaktanfragen nur die Angaben aus dem Formular.'],
  ['Wofür nutzen wir die Daten?', 'Zur Mitgliederverwaltung, zum Beitragseinzug, zur Organisation des Trainings- und Spielbetriebs und für Meldungen an Verbände (z. B. Spielerpässe im Fußball). Eine Weitergabe an sonstige Dritte erfolgt nicht.'],
  ['Fotos auf der Website', 'Fotos von Mitgliedern – insbesondere von Kindern – veröffentlichen wir nur mit Einwilligung. Die Einwilligung ist freiwillig und kann jederzeit widerrufen werden.'],
  ['Deine Rechte', 'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem kannst du dich bei der Aufsichtsbehörde (LDI NRW) beschweren.'],
]
