'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import type { SicherungInfo } from '@/sicherung/kern'
import type { UpdateStand } from '@/wartung/updates'
import type { Laufzeit, Speicher } from '@/wartung/pruefen'

export type WartungDaten = {
  getestetAm: string | null
  getestetVon: string | null
  laufzeiten: Laufzeit[]
  speicher: Speicher | null
  code: string | null
  schluesselwechsel: boolean
  updates: { sicherheit: number; updates: number; geprueftAm: UpdateStand['geprueftAm']; unvollstaendig: boolean }
}
const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

const mb = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const wann = (iso: string) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function SicherungClient({ sicherungen, wartung }: { sicherungen: SicherungInfo[]; wartung: WartungDaten }) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null)
  const letzte = sicherungen[0]
  const tage = letzte ? Math.floor((Date.now() - new Date(letzte.erstellt).getTime()) / 86400000) : null

  const [getestet, setGetestet] = useState({ am: wartung.getestetAm, von: wartung.getestetVon })
  const [testLaeuft, setTestLaeuft] = useState(false)
  const getestetTage = getestet.am ? Math.floor((Date.now() - new Date(getestet.am).getTime()) / 86400000) : null
  const testVermerken = async () => {
    setTestLaeuft(true)
    try {
      const r = await fetch('/api/globals/wartung/wiederherstellung-getestet', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setGetestet({ am: d.am, von: d.von })
      else setMeldung({ ok: false, text: d.fehler ?? 'Konnte nicht gespeichert werden.' })
    } catch {
      setMeldung({ ok: false, text: 'Keine Verbindung. Bitte noch einmal versuchen.' })
    }
    setTestLaeuft(false)
  }

  const erstellen = async () => {
    setLaeuft(true)
    setMeldung(null)
    try {
      const r = await fetch('/api/sicherung', { method: 'POST', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.fehler)
      setMeldung({ ok: true, text: `Sicherung erstellt (${mb(d.groesse)}). Lade sie herunter und bewahre sie an einem zweiten Ort auf, z. B. auf einem USB-Stick.` })
      router.refresh()
    } catch (e) {
      setMeldung({ ok: false, text: (e as Error).message || 'Die Sicherung ist fehlgeschlagen.' })
    }
    setLaeuft(false)
  }

  return (
    <div className="bsv-sicherung">
      <header>
        <h1>Datensicherung</h1>
        <p>Sichert alle Inhalte – News, Teams, Termine, Konten, Anträge, Einstellungen – und alle hochgeladenen Bilder und Dateien in einer einzigen Datei.</p>
      </header>

      <section className={`bsv-sicherung__status${tage === null || tage > 7 ? ' is-warn' : ''}`}>
        <div>
          <strong>{letzte ? `Letzte Sicherung: ${wann(letzte.erstellt)}` : 'Noch keine Sicherung vorhanden'}</strong>
          <span>{tage === null ? 'Bitte jetzt die erste Sicherung erstellen.' : tage > 7 ? `Das ist ${tage} Tage her – Zeit für eine neue.` : 'Alles gut.'}</span>
        </div>
        <button type="button" onClick={erstellen} disabled={laeuft}>
          {laeuft ? 'Wird gesichert … (kann eine Minute dauern)' : '💾 Sicherung jetzt erstellen'}
        </button>
      </section>
      {meldung && <p className={meldung.ok ? 'bsv-sicherung__ok' : 'bsv-sicherung__fehler'}>{meldung.text}</p>}

      <section className="bsv-sicherung__box">
        <h2>Vorhandene Sicherungen</h2>
        {sicherungen.length === 0 ? (
          <p>Noch keine.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Erstellt</th>
                <th>Größe</th>
                <th>Datei</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sicherungen.map((s) => (
                <tr key={s.datei}>
                  <td>{wann(s.erstellt)}</td>
                  <td>{mb(s.groesse)}</td>
                  <td>
                    <code>{s.datei}</code>
                  </td>
                  <td>
                    <a href={`/api/sicherung/datei/${s.datei}`} download>
                      ⬇️ Herunterladen
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="bsv-sicherung__klein">
          Die Dateien liegen auf dem Server im Ordner <code>backups</code> der Website.
        </p>
      </section>

      <section className="bsv-sicherung__box">
        <h2>Gut zu wissen</h2>
        <ul>
          <li>
            <strong>Zweiter Ort:</strong> Eine Sicherung nur auf dem Server hilft nicht, wenn der Server ausfällt. Deshalb spiegelt der Server sie jeden Morgen zusätzlich auf einen externen Speicher (wird beim Einrichten des Servers aktiviert). Einzelne Sicherungen kannst du außerdem herunterladen und sicher aufbewahren.
          </li>
          <li>
            <strong>Verschlüsselt:</strong> Die Datei (Endung <code>.tar.gz.enc</code>) ist komplett verschlüsselt und lässt sich nur mit dem <code>ENCRYPTION_KEY</code> aus der Datei <code>.env</code> öffnen. Der Schlüssel ist absichtlich nicht in der Sicherung – bewahre ihn getrennt auf (z. B. im Passwortmanager des Vorstands). Ohne ihn ist jede Sicherung wertlos.
          </li>
          <li>
            <strong>Persönliche Daten:</strong> Trotz Verschlüsselung nicht per E-Mail verschicken und nicht öffentlich ablegen. Ältere, unverschlüsselte Sicherungen verschlüsselt der Befehl <code>pnpm sicherung:alte-verschluesseln</code>.
          </li>
          <li>
            <strong>Wie oft?</strong> Automatisch jeden Tag (es bleiben die letzten 14 sowie je eine pro Woche und Monat). Vor größeren Änderungen zusätzlich „Sicherung jetzt erstellen“. Ist die letzte Sicherung älter als 7 Tage, erinnert das Dashboard.
          </li>
        </ul>
      </section>

      <section className="bsv-sicherung__box" id="wartung">
        <h2>Wartung</h2>
        <div className={`bsv-sicherung__test${getestetTage === null || getestetTage > 365 ? ' is-warn' : ''}`}>
          <div>
            <strong>🧪 Wiederherstellung getestet: {getestet.am ? `${datum(getestet.am)}${getestet.von ? ` (${getestet.von})` : ''}` : 'noch nie'}</strong>
            <span>
              Einmal im Jahr ausprobieren, ob sich eine Sicherung wirklich einspielen lässt – auf einem Testrechner, nicht auf der Live-Website: neueste Sicherung herunterladen, dort einspielen,
              kurz durchklicken, danach die Testdaten wieder entfernen. Dann hier bestätigen.
            </span>
          </div>
          <button type="button" onClick={testVermerken} disabled={testLaeuft}>
            {testLaeuft ? 'Wird gespeichert …' : '✓ Heute erfolgreich getestet'}
          </button>
        </div>
        <table className="bsv-sicherung__technik">
          <tbody>
            {wartung.laufzeiten.map((l) => (
              <tr key={l.name} className={l.tage !== null && l.tage <= 180 ? 'is-warn' : undefined}>
                <th>{l.name}</th>
                <td>{l.version}</td>
                <td>
                  {l.ende
                    ? l.tage !== null && l.tage < 0
                      ? `⚠️ keine Sicherheits-Updates mehr seit ${datum(l.ende)}`
                      : `Sicherheits-Updates bis ${datum(l.ende)}${l.tage !== null && l.tage <= 180 ? ' – Wechsel einplanen' : ''}`
                    : 'Ende der Updates unbekannt – bitte nachschlagen'}
                </td>
              </tr>
            ))}
            {wartung.speicher && (
              <tr className={wartung.speicher.prozent >= 80 ? 'is-warn' : undefined}>
                <th>Speicherplatz</th>
                <td>{wartung.speicher.prozent} % belegt</td>
                <td>
                  noch {wartung.speicher.freiGB.toFixed(1)} GB von {wartung.speicher.gesamtGB.toFixed(0)} GB frei{wartung.speicher.prozent >= 80 ? ' – aufräumen oder mehr Speicher buchen' : ''}
                </td>
              </tr>
            )}
            <tr>
              <th>Installierte Version</th>
              <td>{wartung.code ? datum(wartung.code) : 'unbekannt'}</td>
              <td>Spätestens alle 3 Monate aktualisieren (Update-Tag). Sicherheitsmeldungen prüfen die Website und GitHub täglich.</td>
            </tr>
            <tr className={wartung.updates.sicherheit || wartung.updates.unvollstaendig ? 'is-warn' : undefined}>
              <th>Updates</th>
              <td>{wartung.updates.sicherheit ? `⚠️ ${wartung.updates.sicherheit} Sicherheitsupdate${wartung.updates.sicherheit === 1 ? '' : 's'}` : wartung.updates.unvollstaendig ? 'Prüfung unvollständig' : wartung.updates.updates ? `${wartung.updates.updates} verfügbar` : wartung.updates.geprueftAm ? 'alles aktuell' : 'noch nicht geprüft'}</td>
              <td>
                Node.js, PostgreSQL, Website-Pakete und Server an einem Ort: <a href="/admin/updates">Sicherheit → Updates ansehen ›</a>
                {wartung.updates.geprueftAm && ` Zuletzt geprüft: ${wann(wartung.updates.geprueftAm)}.`}
              </td>
            </tr>
            <tr className={wartung.schluesselwechsel ? 'is-warn' : undefined}>
              <th>Schlüssel</th>
              <td>{wartung.schluesselwechsel ? 'Wechsel läuft' : 'in Ordnung'}</td>
              <td>
                {wartung.schluesselwechsel
                  ? 'ENCRYPTION_KEY_ALT steht noch in der .env. Wenn alles umgestellt ist: Zeile löschen und neu starten.'
                  : 'Muss der ENCRYPTION_KEY gewechselt werden (z. B. weil er bekannt geworden ist): nie einfach austauschen – Anleitung in deploy/README.md, „Schlüssel wechseln“.'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="bsv-sicherung__box">
        <h2>Sicherung wieder einspielen</h2>
        <p>Das ersetzt alle aktuellen Inhalte durch den Stand der Sicherung. Vorher wird automatisch der jetzige Stand gesichert. Abgelaufene Fristen (Datenschutz, Papierkorb) werden danach sofort wieder angewendet.</p>
        <EinspielenServer />
      </section>
    </div>
  )
}

/** Anleitung für den Live-Server (Linux): per SSH anmelden, Dienst anhalten, als Nutzer bsv einspielen, starten */
function EinspielenServer() {
  const ordner = '/srv/bsv'
  return (
    <>
      <ol>
        <li>Per SSH am Server anmelden (wie beim Einrichten).</li>
        <li>
          Liegt die Datei noch nicht auf dem Server: hochladen mit <code>scp bsv-sicherung_….tar.gz.enc nutzer@server:/tmp/</code>, dann auf dem Server{' '}
          <code>
            sudo mv /tmp/bsv-sicherung_*.tar.gz.enc {ordner}/backups/ && sudo chown bsv:bsv {ordner}/backups/*
          </code>
          .
        </li>
        <li>
          Website anhalten: <code>sudo systemctl stop bsv</code>
        </li>
        <li>
          Einspielen:{' '}
          <code>
            sudo -u bsv -H bash -c &apos;cd {ordner} && NODE_ENV=production pnpm sicherung:einspielen bsv-sicherung_….tar.gz.enc&apos;
          </code>{' '}
          – „JA“ eintippen und warten, bis „Fertig“ erscheint.
        </li>
        <li>
          Website starten: <code>sudo systemctl start bsv</code> – nach etwa einer Minute ist sie wieder erreichbar.
        </li>
      </ol>
      <p className="bsv-sicherung__klein">Ganze Anleitung inklusive Zurück auf eine ältere Website-Version: deploy/README.md, „Zurück auf eine Sicherung“.</p>
    </>
  )
}
