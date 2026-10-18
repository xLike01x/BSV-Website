/** Fertige Formular-Vorlagen – ein Klick legt das Formular an, danach kann man alles anpassen. */

type Feld = Record<string, unknown> & { blockType: string; name: string; label: string }

const text = (name: string, label: string, required = true, width = 100): Feld => ({ blockType: 'text', name, label, required, width })
const email = (): Feld => ({ blockType: 'email', name: 'email', label: 'E-Mail', required: true, width: 50 })
const zahl = (name: string, label: string, width = 50): Feld => ({ blockType: 'number', name, label, required: true, width })
const auswahl = (name: string, label: string, optionen: string[], width = 50): Feld => ({
  blockType: 'select',
  name,
  label,
  required: true,
  width,
  options: optionen.map((o) => ({ label: o, value: o.toLowerCase().replace(/[^a-z0-9]+/g, '-') })),
})
const bemerkung = (): Feld => ({ blockType: 'textarea', name: 'bemerkung', label: 'Bemerkung (optional)', required: false, width: 100 })
const einwilligung = (): Feld => ({
  blockType: 'checkbox',
  name: 'einwilligung',
  label: 'Ich bin einverstanden, dass meine Angaben für diesen Zweck gespeichert werden.',
  required: true,
  width: 100,
})

/** Danke-Nachricht im Format des Text-Editors */
const nachricht = (t: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [{ type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 }] }],
  },
})

export type Vorlage = { key: string; symbol: string; titel: string; text: string; daten: Record<string, unknown> }

export const VORLAGEN: Vorlage[] = [
  {
    key: 'anmeldung',
    symbol: '🎉',
    titel: 'Anmeldung zu einer Veranstaltung',
    text: 'Name, E-Mail, Anzahl Personen – z. B. Sommerfest oder Weihnachtsfeier.',
    daten: {
      title: 'Anmeldung Veranstaltung',
      submitButtonLabel: 'Anmelden',
      confirmationType: 'message',
      confirmationMessage: nachricht('Danke für deine Anmeldung! Wir freuen uns auf dich.'),
      fields: [text('name', 'Name'), email(), zahl('personen', 'Anzahl Personen'), bemerkung(), einwilligung()],
    },
  },
  {
    key: 'helfer',
    symbol: '🙋',
    titel: 'Helferliste',
    text: 'Wer hilft wann? Mit Auswahl der Schicht – z. B. fürs Turnier.',
    daten: {
      title: 'Helfer gesucht',
      submitButtonLabel: 'Ich helfe mit',
      confirmationType: 'message',
      confirmationMessage: nachricht('Vielen Dank fürs Mithelfen! Wir melden uns mit allen Details.'),
      fields: [text('name', 'Name', true, 50), text('telefon', 'Telefon (optional)', false, 50), email(), auswahl('schicht', 'Schicht', ['Aufbau', 'Vormittag', 'Nachmittag', 'Abbau']), bemerkung(), einwilligung()],
    },
  },
  {
    key: 'bestellung',
    symbol: '👕',
    titel: 'Sammelbestellung',
    text: 'Name, Größe und Anzahl – z. B. Trainingsanzüge oder Vereinsshirts.',
    daten: {
      title: 'Sammelbestellung',
      submitButtonLabel: 'Bestellen',
      confirmationType: 'message',
      confirmationMessage: nachricht('Danke, deine Bestellung ist angekommen. Wir melden uns, sobald die Ware da ist.'),
      fields: [
        text('name', 'Name'),
        email(),
        auswahl('groesse', 'Größe', ['116', '128', '140', '152', '164', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
        zahl('anzahl', 'Anzahl'),
        bemerkung(),
        einwilligung(),
      ],
    },
  },
  {
    key: 'leer',
    symbol: '➕',
    titel: 'Leeres Formular',
    text: 'Alles selbst zusammenstellen.',
    daten: {
      title: 'Neues Formular',
      submitButtonLabel: 'Absenden',
      confirmationType: 'message',
      confirmationMessage: nachricht('Vielen Dank! Deine Angaben sind angekommen.'),
      fields: [text('name', 'Name'), email(), einwilligung()],
    },
  },
]
