/**
 * Was ist was? Kurze Erklärungen zu allen Programmen und Paketen, auf denen die Website läuft
 * (Seite „Sicherheit“ → Reiter „Updates“). Jedes Paket aus package.json → dependencies braucht hier
 * einen Eintrag – das prüft tests/int/updates.int.spec.ts.
 */

export type ProgrammGruppe = 'System' | 'Grundgerüst' | 'Verwaltung' | 'Darstellung' | 'Funktionen' | 'Werkzeuge'

export type Programm = { gruppe: ProgrammGruppe; name: string; text: string }

/** Reihenfolge und Überschriften der Gruppen in der Übersicht */
export const GRUPPEN: { key: ProgrammGruppe; titel: string; text: string }[] = [
  { key: 'System', titel: 'System', text: 'Die Programme, auf denen alles läuft – auf dem Server installiert, nicht Teil der Website selbst.' },
  { key: 'Grundgerüst', titel: 'Grundgerüst der Website', text: 'Ohne diese Pakete läuft nichts. Updates hier immer mit allen Tests.' },
  { key: 'Verwaltung', titel: 'Verwaltung (Payload)', text: 'Die Verwaltung, in der News, Termine, Seiten und Mitgliederdaten gepflegt werden, und ihre Erweiterungen.' },
  { key: 'Darstellung', titel: 'Aussehen & Bedienung', text: 'Schriften, Symbole und Bausteine für Knöpfe, Auswahllisten und Formulare.' },
  { key: 'Funktionen', titel: 'Einzelne Funktionen', text: 'Pakete für bestimmte Aufgaben der Website.' },
  { key: 'Werkzeuge', titel: 'Werkzeuge für Entwicklung und Betrieb', text: 'Helfen beim Starten, Bauen und Testen – Besucher kommen damit nicht in Berührung.' },
]

/** System-Programme (Schlüssel wie in updates.ts) */
export const SYSTEM: Record<string, Programm> = {
  node: { gruppe: 'System', name: 'Node.js', text: 'Die Laufzeitumgebung: führt die Website aus, so wie Windows ein Programm ausführt. Bekommt regelmäßig Sicherheitsupdates; jede Hauptversion (z. B. 24) wird etwa drei Jahre lang gepflegt.' },
  postgres: { gruppe: 'System', name: 'PostgreSQL', text: 'Die Datenbank: speichert alle Inhalte und Daten – News, Termine, Teams, Benutzer, Anträge.' },
  server: { gruppe: 'System', name: 'Ubuntu (Betriebssystem des Servers)', text: 'Das Betriebssystem des Live-Servers. Sicherheitsupdates installiert es nachts von selbst; manchmal ist danach ein Neustart nötig.' },
}

/** Website-Pakete (Name wie in package.json) */
export const PAKETE: Record<string, Programm> = {
  next: { gruppe: 'Grundgerüst', name: 'Next.js', text: 'Das Gerüst der Website: baut die Seiten, liefert sie an Besucher aus und verbindet Website und Verwaltung.' },
  react: { gruppe: 'Grundgerüst', name: 'React', text: 'Baukasten für alle Bildschirm-Elemente – von der Startseite bis zur Verwaltung. Wird zusammen mit React DOM aktualisiert.' },
  'react-dom': { gruppe: 'Grundgerüst', name: 'React DOM', text: 'Bringt die React-Bausteine in den Browser. Immer in derselben Version wie React.' },
  payload: { gruppe: 'Grundgerüst', name: 'Payload', text: 'Das Herz der Verwaltung (Content-Management-System): Datenmodell, Anmeldung, Rechte, Speichern und Abrufen aller Inhalte.' },
  '@payloadcms/db-postgres': { gruppe: 'Grundgerüst', name: 'Payload – PostgreSQL-Anbindung', text: 'Verbindet Payload mit der Datenbank und führt die Datenbank-Änderungen (Migrationen) aus.' },
  '@payloadcms/next': { gruppe: 'Verwaltung', name: 'Payload – Next.js-Anbindung', text: 'Bettet die Verwaltung (/admin) und die Schnittstellen (/api) in die Website ein.' },
  '@payloadcms/ui': { gruppe: 'Verwaltung', name: 'Payload – Oberfläche', text: 'Die Bedienoberfläche der Verwaltung: Listen, Formulare, Knöpfe, Seitenleiste.' },
  '@payloadcms/translations': { gruppe: 'Verwaltung', name: 'Payload – Übersetzungen', text: 'Deutsche Texte für die Verwaltung.' },
  '@payloadcms/richtext-lexical': { gruppe: 'Verwaltung', name: 'Payload – Texteditor', text: 'Der Editor für News und Seiten: Überschriften, fett, Listen, Links, Bilder.' },
  '@payloadcms/email-nodemailer': { gruppe: 'Verwaltung', name: 'Payload – E-Mail-Versand', text: 'Verschickt alle Mails: Passwort vergessen, Bestätigungen, Benachrichtigungen, Monatsbericht.' },
  '@payloadcms/plugin-form-builder': { gruppe: 'Verwaltung', name: 'Payload – Formulare', text: 'Eigene Formulare in der Verwaltung zusammenklicken (z. B. Anmeldung zum Sommerfest) und Eingänge sammeln.' },
  '@payloadcms/plugin-nested-docs': { gruppe: 'Verwaltung', name: 'Payload – Seiten-Hierarchie', text: 'Ordnet Seiten unter- und übereinander (z. B. Abteilungen → Fußball) und baut daraus die Adressen.' },
  '@payloadcms/plugin-redirects': { gruppe: 'Verwaltung', name: 'Payload – Weiterleitungen', text: 'Leitet alte Adressen auf neue Seiten weiter, damit Links und Suchmaschinen-Einträge nicht ins Leere führen.' },
  '@payloadcms/plugin-search': { gruppe: 'Verwaltung', name: 'Payload – Suche', text: 'Hält einen Suchindex der News aktuell (für die Suche auf der Website).' },
  '@payloadcms/plugin-seo': { gruppe: 'Verwaltung', name: 'Payload – Suchmaschinen (SEO)', text: 'Felder für Titel, Beschreibung und Vorschaubild, wie Google und soziale Netzwerke eine Seite anzeigen.' },
  '@payloadcms/live-preview-react': { gruppe: 'Verwaltung', name: 'Payload – Live-Vorschau', text: 'Zeigt beim Bearbeiten sofort, wie die Seite auf der Website aussehen wird.' },
  '@payloadcms/admin-bar': { gruppe: 'Verwaltung', name: 'Payload – Leiste auf der Website', text: 'Schmale Leiste oben auf der Website für Angemeldete mit Verwaltungsrechten: „Bearbeiten“, „Vorschau beenden“.' },
  geist: { gruppe: 'Darstellung', name: 'Geist (Schrift)', text: 'Die Hauptschrift der Website – lokal eingebunden, ohne Google Fonts (Datenschutz).' },
  '@fontsource/caveat': { gruppe: 'Darstellung', name: 'Caveat (Schrift)', text: 'Die Handschrift-Schrift für Akzente auf der Website – ebenfalls lokal eingebunden.' },
  'lucide-react': { gruppe: 'Darstellung', name: 'Lucide (Symbole)', text: 'Kleine Symbole wie Häkchen, Pfeile und Lupe.' },
  '@radix-ui/react-checkbox': { gruppe: 'Darstellung', name: 'Radix – Ankreuzfeld', text: 'Barrierearmes Ankreuzfeld für Formulare auf der Website.' },
  '@radix-ui/react-label': { gruppe: 'Darstellung', name: 'Radix – Beschriftung', text: 'Verknüpft Beschriftungen mit Eingabefeldern (wichtig für Bildschirmleser).' },
  '@radix-ui/react-select': { gruppe: 'Darstellung', name: 'Radix – Auswahlliste', text: 'Barrierearme Auswahlliste (Aufklappmenü) für Formulare.' },
  '@radix-ui/react-slot': { gruppe: 'Darstellung', name: 'Radix – Slot', text: 'Technischer Baustein, damit Knöpfe auch als Links funktionieren.' },
  'class-variance-authority': { gruppe: 'Darstellung', name: 'class-variance-authority', text: 'Hilft, Knöpfe in verschiedenen Varianten (grün, umrandet, klein …) einheitlich zu gestalten.' },
  clsx: { gruppe: 'Darstellung', name: 'clsx', text: 'Kleiner Helfer, der Gestaltungsklassen zusammensetzt.' },
  'tailwind-merge': { gruppe: 'Darstellung', name: 'tailwind-merge', text: 'Löst Widersprüche zwischen Gestaltungsklassen auf (z. B. zwei Abstände für dasselbe Element).' },
  'react-hook-form': { gruppe: 'Funktionen', name: 'React Hook Form', text: 'Steuert die Formulare auf der Website: Eingaben prüfen, Fehler anzeigen, absenden.' },
  'driver.js': { gruppe: 'Funktionen', name: 'driver.js', text: 'Die geführte Tour durch die Verwaltung („Tour starten“ auf der Übersicht).' },
  sharp: { gruppe: 'Funktionen', name: 'sharp (Bildbearbeitung)', text: 'Verkleinert hochgeladene Bilder auf passende Größen und entfernt dabei Kamera-Daten (z. B. GPS-Ort).' },
  qrcode: { gruppe: 'Funktionen', name: 'qrcode', text: 'Erzeugt QR-Codes: für den digitalen Mitgliedsausweis und zum Einrichten der Zwei-Faktor-Anmeldung.' },
  tar: { gruppe: 'Funktionen', name: 'tar', text: 'Packt die Datensicherung (Datenbank und hochgeladene Dateien) in eine Datei und wieder aus.' },
  'prism-react-renderer': { gruppe: 'Funktionen', name: 'Prism (Code-Darstellung)', text: 'Färbt Programmcode in Code-Blöcken farbig ein – wird auf der Vereinsseite kaum gebraucht.' },
  'next-sitemap': { gruppe: 'Funktionen', name: 'next-sitemap', text: 'Erstellt die Sitemap: eine Liste aller Seiten, damit Suchmaschinen die Website vollständig finden.' },
  semver: { gruppe: 'Werkzeuge', name: 'semver', text: 'Vergleicht Versionsnummern – für diese Übersicht (z. B. ob ein Update zu den anderen Paketen passt).' },
  graphql: { gruppe: 'Werkzeuge', name: 'GraphQL', text: 'Von Payload verlangt. Die GraphQL-Schnittstelle selbst ist auf dieser Website abgeschaltet.' },
  'cross-env': { gruppe: 'Werkzeuge', name: 'cross-env', text: 'Sorgt dafür, dass die Startbefehle (pnpm dev, pnpm build …) unter Windows und Linux gleich funktionieren.' },
  dotenv: { gruppe: 'Werkzeuge', name: 'dotenv', text: 'Liest die Einstellungen aus der .env-Datei für die automatischen Tests.' },
}
