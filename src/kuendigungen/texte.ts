/** Status, Beschriftungen und Standardtexte der Antwort-Mails zu Kündigungen (auch im Browser genutzt) */
export type KuendigungStatus =
  'neu' | 'rueckfrage' | 'bestaetigt' | 'erledigt' | 'abgelehnt' | 'zurueckgezogen'
export type KuendigungEntscheidung = 'bestaetigt' | 'rueckfrage' | 'abgelehnt' | 'erledigt'

export const STATUS_LABEL: Record<KuendigungStatus, string> = {
  neu: 'Eingegangen',
  rueckfrage: 'Rückfrage',
  bestaetigt: 'Bestätigt',
  erledigt: 'Im DFBnet ausgetragen',
  abgelehnt: 'Abgelehnt',
  zurueckgezogen: 'Zurückgezogen',
}

/** So sieht das Mitglied den Stand im Mitgliederbereich */
export const STATUS_MITGLIED: Record<KuendigungStatus, { text: string; farbe: string }> = {
  neu: { text: 'Eingegangen – wird geprüft', farbe: 'var(--bsv-muted)' },
  rueckfrage: { text: 'Rückfrage – bitte E-Mails prüfen', farbe: '#e8590c' },
  bestaetigt: { text: '✓ Bestätigt', farbe: 'var(--bsv-green)' },
  erledigt: { text: '✓ Bestätigt', farbe: 'var(--bsv-green)' },
  abgelehnt: { text: 'Nicht angenommen – siehe E-Mail', farbe: '#b91c1c' },
  zurueckgezogen: { text: 'Zurückgezogen', farbe: 'var(--bsv-muted)' },
}

/** Diese Kündigungen „zählen“ noch (eine weitere für dieselbe Person ist dann nicht möglich) */
export const OFFEN_ODER_GUELTIG: KuendigungStatus[] = [
  'neu',
  'rueckfrage',
  'bestaetigt',
  'erledigt',
]

export type MailVorlage = { betreff: string; text: string }
export const STANDARD_VORLAGEN: Record<
  'kuendigungBestaetigt' | 'kuendigungRueckfrage' | 'kuendigungAbgelehnt',
  MailVorlage
> = {
  kuendigungBestaetigt: {
    betreff: 'Bestätigung deiner Kündigung beim BSV 1919',
    text: 'Hallo {vorname},\n\nwir bestätigen die Kündigung der Mitgliedschaft von {namen}. Sie endet laut Satzung zum {wirksamZum}. Bis dahin bleibt alles wie gewohnt; danach werden keine Beiträge mehr eingezogen.\n\nSchade, dass du gehst – du bist jederzeit wieder willkommen!\n\nSportliche Grüße\n{meinName}\nBSV 1919 e.V.',
  },
  kuendigungRueckfrage: {
    betreff: 'Rückfrage zu deiner Kündigung',
    text: 'Hallo {vorname},\n\nvielen Dank für deine Kündigung. Bevor wir sie bestätigen können, haben wir noch eine Frage:\n\n[HIER DEINE FRAGE]\n\nAntworte einfach auf diese E-Mail.\n\nSportliche Grüße\n{meinName}\nBSV 1919 e.V.',
  },
  kuendigungAbgelehnt: {
    betreff: 'Deine Kündigung beim BSV 1919',
    text: 'Hallo {vorname},\n\nleider können wir deine Kündigung so nicht annehmen:\n\n[GRUND]\n\nBitte lade im Mitgliederbereich (Mein BSV → Mitgliedschaft kündigen) ein neues, unterschriebenes Kündigungsschreiben hoch oder antworte auf diese E-Mail.\n\nSportliche Grüße\n{meinName}\nBSV 1919 e.V.',
  },
}

export const VORLAGE_ZU: Record<
  'bestaetigt' | 'rueckfrage' | 'abgelehnt',
  keyof typeof STANDARD_VORLAGEN
> = {
  bestaetigt: 'kuendigungBestaetigt',
  rueckfrage: 'kuendigungRueckfrage',
  abgelehnt: 'kuendigungAbgelehnt',
}

export const PLATZHALTER_KUENDIGUNG = '{vorname} {namen} {wirksamZum} {meinName}'

/** Platzhalter ersetzen */
export const ausfuellen = (t: string, w: Record<string, string>) =>
  t.replace(/\{(vorname|namen|wirksamZum|meinName)\}/g, (_m, k: string) => w[k] ?? '')
