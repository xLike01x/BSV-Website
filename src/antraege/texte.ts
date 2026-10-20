/** Standardtexte der Antwort-Mails (auch im Browser genutzt, falls die Vorlagen noch nie gespeichert wurden) */
export type Entscheidung = 'aufgenommen' | 'rueckfrage' | 'abgelehnt'

export const STANDARD_VORLAGEN: Record<Entscheidung, { betreff: string; text: string }> = {
  aufgenommen: {
    betreff: 'Willkommen beim BSV 1919!',
    text: 'Hallo {vorname},\n\nvielen Dank für deinen Mitgliedsantrag. Wir freuen uns sehr, dich als Mitglied ({mitgliedsart}) im Büdericher Spielverein 1919 e.V. begrüßen zu dürfen!\n\nDer Beitrag wird wie im Antrag vereinbart per SEPA-Lastschrift eingezogen.\n\nBei Fragen antworte einfach auf diese E-Mail.\n\nSportliche Grüße\n{meinName}\nBSV 1919 e.V.',
  },
  rueckfrage: {
    betreff: 'Rückfrage zu deinem Mitgliedsantrag',
    text: 'Hallo {vorname},\n\nvielen Dank für deinen Mitgliedsantrag beim BSV 1919. Bevor wir ihn bearbeiten können, haben wir noch eine Frage:\n\n[HIER DEINE FRAGE]\n\nAntworte einfach auf diese E-Mail.\n\nSportliche Grüße\n{meinName}\nBSV 1919 e.V.',
  },
  abgelehnt: {
    betreff: 'Dein Mitgliedsantrag beim BSV 1919',
    text: 'Hallo {vorname},\n\nvielen Dank für dein Interesse am BSV 1919. Leider können wir deinen Mitgliedsantrag nicht annehmen:\n\n[GRUND]\n\nDeine Angaben (auch die Bankdaten) werden nach Ablauf der Aufbewahrungsfrist gelöscht. Bei Fragen antworte einfach auf diese E-Mail.\n\nSportliche Grüße\n{meinName}\nBSV 1919 e.V.',
  },
}

export const ENTSCHEIDUNG_LABEL: Record<Entscheidung, string> = { aufgenommen: 'Aufgenommen', rueckfrage: 'Rückfrage', abgelehnt: 'Abgelehnt' }

export const MITGLIEDSART_LABEL: Record<string, string> = { jugend: 'Jugendliche (0–17)', aktiv: 'Erwachsene aktiv', familie: 'Familie', passiv: 'Erwachsene passiv' }

/** Platzhalter ersetzen */
export const ausfuellen = (t: string, w: Record<string, string>) => t.replace(/\{(vorname|nachname|mitgliedsart|meinName)\}/g, (_m, k: string) => w[k] ?? '')

/** Noch nicht ausgefüllte Stellen wie „[GRUND]“ */
export const offeneStellen = (t: string) => t.match(/\[[A-ZÄÖÜ ]{3,}\]/g) ?? []
