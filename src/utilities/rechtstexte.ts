import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/**
 * Überarbeitete Rechtstexte (Impressum, Datenschutz) – Stand 22.10.2026, zur Prüfung durch den Vorstand.
 * Werden beim Start einmalig in die Seiten „impressum“ und „datenschutz“ übernommen, aber NUR solange dort noch der
 * alte Text steht (Erkennung über typische Sätze). Was jemand schon selbst geändert hat, bleibt unangetastet.
 * Die vorherige Fassung bleibt unter „Versionen“ der Seite erhalten.
 * Vorlagen mit Erklärungen: Projekt-Dokumente „Impressum-Vorlage“ und „Datenschutzerklärung-Vorlage“.
 */

const PRUEFHINWEIS =
  'ENTWURF zur Prüfung durch den Vorstand (Stand 22.10.2026). Angaben in [eckigen Klammern] bitte ausfüllen bzw. prüfen. Danach diesen Hinweis löschen und „Veröffentlichen“.'

export const IMPRESSUM = `**Angaben gemäß § 5 DDG**

Büdericher Spielverein 1919 e.V.
Am Weißen Stein 2f
46487 Wesel

**Vertreten durch den Vorstand nach § 26 BGB**
[Vorname Nachname] (1. Vorsitzende)
[Vorname Nachname] ([2. Vorsitzende/r])
[ggf. weitere vertretungsberechtigte Vorstandsmitglieder laut Satzung]

**Kontakt**
E-Mail: 1.vorsitzender@buedericher-spielverein.de
Telefon: [Telefonnummer – oder diese Zeile streichen, wenn es keine gibt]
Kontaktformular: www.buedericher-spielverein.de/kontakt

**Vereinsregister**
Registergericht: Amtsgericht [Duisburg]
Registernummer: VR [Nummer]

[Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE… – nur falls vorhanden, sonst streichen]

**Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV**
[Vorname Nachname]
Am Weißen Stein 2f, 46487 Wesel

**Sportanlage**
Kutscher-Remy-Sportpark, Schützenstraße 25a, 46487 Wesel

**Haftung für Inhalte und Links**
Wir erstellen die Inhalte dieser Website mit Sorgfalt, können für Vollständigkeit und Aktualität aber keine Gewähr übernehmen. Für Inhalte verlinkter fremder Websites sind deren Betreiber verantwortlich. Erfahren wir von rechtswidrigen Inhalten oder Links, entfernen wir sie umgehend.

**Urheberrecht**
Texte, Fotos und Grafiken auf dieser Website sind urheberrechtlich geschützt. Eine Verwendung außerhalb der gesetzlichen Grenzen ist nur mit unserer Zustimmung erlaubt. Die Logos unserer Sponsoren gehören den jeweiligen Unternehmen. Solltest du auf eine Urheberrechtsverletzung aufmerksam werden, gib uns bitte Bescheid.

**Konzept, Design und Umsetzung der Website**
Thomas Wilms [optional]`

export const DATENSCHUTZ = `Wir freuen uns über dein Interesse an unserem Verein. Hier erklären wir, welche personenbezogenen Daten wir auf dieser Website verarbeiten, wozu und wie lange – und welche Rechte du hast.

### 1. Verantwortlicher

Büdericher Spielverein 1919 e.V.
Am Weißen Stein 2f, 46487 Wesel
Vertreten durch den Vorstand nach § 26 BGB: [Namen wie im Impressum]
E-Mail für Datenschutzfragen: [datenschutz@buedericher-spielverein.de]
[Datenschutzbeauftragte/r: Name, Kontakt – nur falls benannt. Pflicht, wenn mindestens 20 Personen ständig mit personenbezogenen Daten arbeiten (§ 38 BDSG); Trainer-Konten können mitzählen – vom Vorstand prüfen lassen.]

### 2. Hosting und Server-Protokolle

Die Website läuft auf einem Server der [netcup GmbH bzw. Hetzner Online GmbH – Anschrift laut Vertrag] in Deutschland. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO).

Bei jedem Aufruf verarbeitet der Webserver technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, übertragene Datenmenge und Browserkennung. Sie werden in Server-Protokollen gespeichert und nach 14 Tagen automatisch gelöscht. Zum Schutz vor Missbrauch (z. B. massenhafte Anmeldeversuche oder Formular-Spam) zählen wir Anfragen je IP-Adresse außerdem kurzzeitig im Arbeitsspeicher; diese Zähler werden nicht gespeichert und verfallen nach 10 Minuten.

Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb).

### 3. Cookies und lokaler Speicher

Die öffentliche Website setzt keine Cookies und bindet keine Analyse- oder Werbedienste ein. Schriften werden von unserem eigenen Server geladen, nicht von Google.

Wenn du dich anmeldest, setzen wir ein technisch notwendiges Anmelde-Cookie (höchstens 8 Stunden gültig, nur über HTTPS, nicht für fremde Seiten). Außerdem speichert dein Browser im lokalen Speicher (localStorage) deine Entscheidung „Immer laden“ für FuPa bzw. FUSSBALL.DE (siehe Nr. 10) und – nur in der Verwaltung – den Zeitpunkt deiner letzten Aktivität für die automatische Abmeldung. Diese Angaben verlassen deinen Browser nicht.

Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich), Art. 6 Abs. 1 lit. b DSGVO; für „Immer laden“ deine Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).

### 4. Besucherstatistik ohne Cookies

Wir zählen Seitenaufrufe mit einer eigenen, datensparsamen Statistik – ohne Cookies und ohne Speicherung der IP-Adresse. Aus IP-Adresse und Browserkennung wird zusammen mit einem täglich wechselnden Zufallswert, der nie gespeichert wird, eine Kennung gebildet. Sie ist nur am selben Tag gleich und lässt keinen Rückschluss auf dich zu. Gespeichert werden: Tag, aufgerufene Seite, grobe Herkunft (z. B. „Google“ oder „Instagram“, nie die vollständige Adresse), Gerätetyp (Handy, Tablet, Computer) und auf der Suchseite der Suchbegriff. Ist in deinem Browser „Do Not Track“ oder „Global Privacy Control“ eingeschaltet, zählen wir dich nicht.

Speicherdauer: 14 Monate, Suchbegriffe 3 Monate. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Interesse an der Verbesserung unseres Angebots).

### 5. Kontaktformular, Probetraining und eigene Formulare

**Kontakt:** Name, E-Mail-Adresse, Betreff und Nachricht, um deine Anfrage zu beantworten. Die Nachricht erhalten die für das gewählte Anliegen zuständigen Personen im Verein.

**Probetraining:** Name und E-Mail-Adresse, Name und Alter der teilnehmenden Person, Wunschtermin, gewähltes Angebot und Nachricht. Die Anfrage erhalten die Verwaltung und die Trainer/innen des gewählten Angebots.

**Weitere Formulare** (z. B. Anmeldungen zu Veranstaltungen): die im jeweiligen Formular abgefragten Angaben, nur für den dort genannten Zweck.

Speicherdauer: erledigte Kontakt- und Probetraining-Anfragen 6 Monate, Formular-Eingänge 12 Monate, nie erledigte Anfragen höchstens 12 Monate. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Anbahnung der Mitgliedschaft bzw. Teilnahme) oder lit. f (Beantwortung deiner Anfrage).

### 6. Mitgliedsantrag

Für die Aufnahme verarbeiten wir Vor- und Nachname, Geburtsdatum, Anschrift, E-Mail, Telefon (freiwillig), Mitgliedsart und Beitrag, gewünschte Angebote, bei Familienmitgliedschaft die Angaben der Familienmitglieder, Kontoinhaber/in und IBAN für das SEPA-Lastschriftmandat sowie deine Angaben zu Satzung und Foto-Einwilligung. Die IBAN wird verschlüsselt gespeichert. Zugriff haben Vorstand und Kasse.

Nach der Bearbeitung übernehmen wir die Daten in unsere Mitgliederverwaltung [DFBnet Verein]. Den Antrag auf der Website löschen wir 3 Monate nach Aufnahme bzw. Ablehnung.

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Mitgliedschaft) [und § … der Satzung]. Die Foto-Einwilligung ist freiwillig und jederzeit widerrufbar (Art. 6 Abs. 1 lit. a DSGVO).

### 7. Benutzerkonto, Mitgliederbereich und digitaler Ausweis

**Registrierung:** Name, E-Mail-Adresse, Passwort (nur als verschlüsselter Prüfwert, nie im Klartext) und freiwillig die Teams/Kurse, zu denen du gehörst. Wir senden einen Bestätigungslink; die Verwaltung schaltet dein Konto frei.

**Im Konto gespeichert:** Rollen und zugeordnete Teams, Zeitpunkt der letzten Anmeldung, die Einstellung zu E-Mail-Benachrichtigungen und ein freiwilliges Profilfoto. Profilfotos sind nicht öffentlich; sie sehen nur du, die Verwaltung und die Trainer/innen deiner Teams. Fotos von Vorstandsmitgliedern erscheinen nur mit deren Einverständnis auf der Vereinsseite.

**Zwei-Faktor-Anmeldung:** Für Konten mit Zugang zur Verwaltung ist sie Pflicht, für Mitglieder freiwillig. Gespeichert werden das Geheimnis für die Authenticator-App (verschlüsselt) und Prüfwerte der Wiederherstellungscodes.

**Digitaler Ausweis:** Der QR-Code zeigt beim Scannen nur Vorname, ersten Buchstaben des Nachnamens, Mitgliedsnummer und ob die Mitgliedschaft gültig ist.

Speicherdauer: bis du dein Konto löschen lässt bzw. die Mitgliedschaft endet. Nicht bestätigte Registrierungen werden nach 7 Tagen, nicht freigegebene nach 60 Tagen gelöscht, Ausweisdaten 12 Monate nach dem Austritt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.

### 8. Spielerpass-Anträge

Für einen Spielerpass verarbeiten wir die Angaben der Spielerin bzw. des Spielers (Name, Geburtsdatum, Staatsangehörigkeit, Anschrift), bei Minderjährigen der Erziehungsberechtigten, sowie Kopie von Ausweis, Reisepass oder Geburtsurkunde, Passfoto und ggf. Meldebescheinigung, Abmeldung des bisherigen Vereins und den unterschriebenen Antrag. Fotos werden beim Hochladen von Standort- und Kameradaten befreit. Zugriff haben die Passverwaltung, der Vorstand und die Trainer/innen des Teams.

Die Angaben werden zur Erteilung der Spielberechtigung an den [Westdeutschen Fußballverband e.V. / Fußballverband Niederrhein e.V.] über das DFBnet übermittelt.

Speicherdauer: Ausweiskopie, Passfoto und Erklärungen 30 Tage nach Abschluss; der unterschriebene Antrag 24 Monate; nie abgeschlossene Anträge 6 Monate. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Teilnahme am Spielbetrieb) und lit. c (Vorgaben des Verbands [bitte prüfen]).

### 9. E-Mail-Versand

Bestätigungs- und Benachrichtigungs-E-Mails (z. B. Registrierung, Passwort zurücksetzen, Freischaltung, Zwei-Faktor-Hinweise) versenden wir über das Postfach des Vereins bei [Mail-Anbieter, Anschrift – laut Vertrag eintragen]. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.

### 10. Inhalte anderer Anbieter – erst nach deinem Klick

- **FuPa** ([Betreiber und Anschrift laut Impressum von fupa.net]) und **FUSSBALL.DE** ([Betreiber und Anschrift laut Impressum von fussball.de]): Spielpläne und Tabellen laden erst, wenn du „Einmal laden“ oder „Immer laden“ anklickst. Dabei werden deine IP-Adresse und Browserdaten an den Anbieter übertragen; der Anbieter kann eigene Cookies setzen. „Immer laden“ speichert dein Browser lokal und kannst du jederzeit über „nicht mehr automatisch laden“ zurücknehmen.
- **OpenStreetMap** (OpenStreetMap Foundation, Großbritannien [Anschrift laut osmfoundation.org prüfen]): Karten laden erst nach deinem Klick; dabei wird deine IP-Adresse übertragen. Für Großbritannien liegt ein Angemessenheitsbeschluss der EU-Kommission vor.
- **Links** zu Google Maps, Apple Karten, Instagram, Facebook oder Shops sind einfache Links – erst wenn du sie anklickst, verlässt du unsere Website.

Rechtsgrundlage: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), jederzeit für die Zukunft widerrufbar.

### 11. Fotos auf der Website

Fotos, auf denen Personen erkennbar sind, veröffentlichen wir nur mit Einwilligung – bei Kindern unter 16 Jahren mit Einwilligung der Eltern. Fotos werden beim Hochladen von Standort- und Kameradaten befreit. Du kannst deine Einwilligung jederzeit widerrufen (E-Mail an [Adresse]); wir entfernen das Foto dann. Es ist danach sofort nicht mehr über die Website abrufbar; dein Browser kann es höchstens noch 10 Minuten aus seinem eigenen Zwischenspeicher anzeigen.

Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.

### 12. Ansprechpersonen auf der Website

Auf der Vereinsseite nennen wir Vorstand und Ansprechpersonen mit Funktion und dienstlichen Kontaktdaten des Vereins, damit Mitglieder und Interessierte sie erreichen. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO bzw. die Einwilligung der Personen [bei privaten Telefonnummern oder Fotos].

### 13. Löschung, Papierkorb und Datensicherung

Gelöschte Einträge liegen zunächst 30 Tage in einem Papierkorb und werden danach – bei persönlichen Daten nach weiteren 30 Tagen – endgültig gelöscht. Der Server erstellt täglich verschlüsselte Datensicherungen, die bis zu 12 Monate aufbewahrt werden [und eine verschlüsselte Kopie bei einem Speicheranbieter in Deutschland: Anbieter, Anschrift – sobald eingerichtet, mit AV-Vertrag]. Wird eine Sicherung eingespielt, werden abgelaufene Fristen sofort erneut angewendet.

### 14. Pflicht zur Angabe und keine automatisierten Entscheidungen

Für Mitgliedschaft, Spielerpass und Benutzerkonto brauchen wir die als Pflicht gekennzeichneten Angaben; ohne sie können wir den Antrag nicht bearbeiten. Alle übrigen Angaben sind freiwillig. Wir treffen keine automatisierten Entscheidungen und erstellen keine Profile.

### 15. Deine Rechte

Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine Einwilligung kannst du jederzeit für die Zukunft widerrufen. Schreib uns dazu an [E-Mail].

Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zuständig für uns ist:
Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf, www.ldi.nrw.de

Stand: [Datum]`

// --- Mini-Markdown → Lexical (Überschriften ###, Listen -, **fett**, Zeilenumbruch innerhalb eines Absatzes) ---
type Node = Record<string, unknown>
const basis = { direction: 'ltr', format: '', indent: 0, version: 1 }
const textKnoten = (zeile: string): Node[] =>
  zeile
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((teil) => {
      const fett = /^\*\*[^*]+\*\*$/.test(teil)
      return { type: 'text', text: fett ? teil.slice(2, -2) : teil, format: fett ? 1 : 0, detail: 0, mode: 'normal', style: '', version: 1 }
    })
const mitUmbruechen = (zeilen: string[]): Node[] =>
  zeilen.flatMap((z, i) => [...(i ? [{ type: 'linebreak', version: 1 }] : []), ...textKnoten(z)])

export function alsRichtext(md: string, hinweis = true) {
  const kinder: Node[] = []
  // Kein „quote“: der Editor der Text-Spalten kennt diesen Knotentyp nicht („parseEditorState: type quote not found“)
  if (hinweis) kinder.push({ type: 'paragraph', children: textKnoten(`**${PRUEFHINWEIS.replace(/\*\*/g, '')}**`), textFormat: 1, ...basis })
  for (const block of md.split(/\n\s*\n/)) {
    const zeilen = block.split('\n').map((z) => z.trimEnd()).filter((z) => z.trim())
    if (!zeilen.length) continue
    const erste = zeilen[0]!
    if (/^#{2,3} /.test(erste)) {
      kinder.push({ type: 'heading', tag: erste.startsWith('### ') ? 'h3' : 'h2', children: textKnoten(erste.replace(/^#+ /, '')), ...basis })
      if (zeilen.length > 1) kinder.push({ type: 'paragraph', children: mitUmbruechen(zeilen.slice(1)), textFormat: 0, ...basis })
    } else if (zeilen.every((z) => z.startsWith('- '))) {
      kinder.push({
        type: 'list',
        listType: 'bullet',
        tag: 'ul',
        start: 1,
        children: zeilen.map((z, i) => ({ type: 'listitem', value: i + 1, children: textKnoten(z.slice(2)), ...basis })),
        ...basis,
      })
    } else {
      kinder.push({ type: 'paragraph', children: mitUmbruechen(zeilen), textFormat: 0, ...basis })
    }
  }
  return { root: { type: 'root', children: kinder, ...basis } }
}

/** Ganzer Text einer Seite (für die Erkennung des alten Stands) */
const seitenText = (layout: unknown): string => JSON.stringify(layout ?? '')

const ALT: Record<string, RegExp> = {
  impressum: /§ 5 TMG|§ 55 Abs\. 2 RStV|Impressumgenerator/,
  datenschutz: /ENTWURF – vor dem Livegang vom Vorstand prüfen/,
}

const EINMALIG_BIS = new Date('2026-12-31T23:59:59Z').getTime()
const PRUEF_KENNUNG = 'ENTWURF zur Prüfung durch den Vorstand (Stand 22.10.2026)'

/** Hatte die Seite (jetzt oder in einer früheren Version) schon einmal die Prüf-Fassung? */
async function hatteSchonPruefFassung(payload: Payload, id: number): Promise<boolean> {
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: { n: number }[] }> } }).drizzle
  const muster = `%${PRUEF_KENNUNG}%`
  const r = await db.execute(sql`
    select (
      (select count(*) from pages_blocks_content_columns c join pages_blocks_content b on c._parent_id = b.id where b._parent_id = ${id} and c.rich_text::text like ${muster})
      + (select count(*) from _pages_v_blocks_content_columns c join _pages_v_blocks_content b on c._parent_id = b.id join _pages_v v on b._parent_id = v.id where v.parent_id = ${id} and c.rich_text::text like ${muster})
    )::int as n`)
  return Number(r.rows[0]?.n ?? 0) > 0
}

/** Wandelt „quote“-Knoten (von der ersten Fassung dieser Übernahme) in Absätze um – ohne sonst etwas am Text zu ändern */
const ohneZitate = (wert: unknown): { wert: unknown; geaendert: boolean } => {
  if (Array.isArray(wert)) {
    let geaendert = false
    const neu = wert.map((w) => {
      const r = ohneZitate(w)
      geaendert ||= r.geaendert
      return r.wert
    })
    return { wert: neu, geaendert }
  }
  if (wert && typeof wert === 'object') {
    let geaendert = false
    const neu: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(wert)) {
      const r = ohneZitate(v)
      geaendert ||= r.geaendert
      neu[k] = r.wert
    }
    if (neu.type === 'quote') {
      neu.type = 'paragraph'
      neu.textFormat = 0
      geaendert = true
    }
    return { wert: neu, geaendert }
  }
  return { wert, geaendert: false }
}

async function zitateReparieren(payload: Payload, slug: string, seite: { id: number; layout?: unknown; _status?: string }) {
  const { wert, geaendert } = ohneZitate(seite.layout)
  if (!geaendert) return
  await payload.update({
    collection: 'pages',
    id: seite.id,
    data: { layout: wert, _status: seite._status ?? 'published' } as never,
    overrideAccess: true,
    context: { rechtstexte: true, disableRevalidate: true },
  })
  payload.logger.info(`Rechtstexte: Seite „${slug}“ repariert (Hinweis-Block ist jetzt im Editor bearbeitbar)`)
}

export async function rechtstexteUebernehmen(payload: Payload) {
  for (const [slug, md] of [
    ['impressum', IMPRESSUM],
    ['datenschutz', DATENSCHUTZ],
  ] as const) {
    const seite = (await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as
      | { id: number; layout?: unknown; _status?: string }
      | undefined
    if (!seite) continue
    const alterText = ALT[slug]!.test(seitenText(seite.layout))
    // Datenschutz: auf Wunsch von Thomas (22.10.2026) einmalig auch ohne den alten Entwurfs-Satz ersetzen – aber nur,
    // wenn die Seite die Prüf-Fassung noch nie hatte (sonst würden spätere Änderungen des Vorstands überschrieben)
    const einmalig = slug === 'datenschutz' && Date.now() < EINMALIG_BIS && !(await hatteSchonPruefFassung(payload, seite.id))
    if (!alterText && !einmalig) {
      await zitateReparieren(payload, slug, seite)
      continue
    }
    await payload.update({
      collection: 'pages',
      id: seite.id,
      data: { layout: [{ blockType: 'content', columns: [{ size: 'full', richText: alsRichtext(md) }] }], _status: 'published' } as never,
      overrideAccess: true,
      // Läuft beim Start – oft mitten im ersten Seitenaufruf, wo Next.js kein „revalidatePath“ erlaubt (sonst bricht die
      // Übernahme ab). Die Seite wird ohnehin bei jedem Aufruf frisch gebaut bzw. beim nächsten Speichern neu aufgebaut.
      context: { rechtstexte: true, disableRevalidate: true },
    })
    payload.logger.info(`Rechtstexte: Seite „${slug}“ auf die überarbeitete Fassung (zur Prüfung) umgestellt`)
  }
}
