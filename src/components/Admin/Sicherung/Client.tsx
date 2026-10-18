'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import type { SicherungInfo } from '@/sicherung/kern'

const mb = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const wann = (iso: string) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function SicherungClient({ sicherungen }: { sicherungen: SicherungInfo[] }) {
  const router = useRouter()
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null)
  const letzte = sicherungen[0]
  const tage = letzte ? Math.floor((Date.now() - new Date(letzte.erstellt).getTime()) / 86400000) : null

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
        <p className="bsv-sicherung__klein">Die Dateien liegen auf dem Server im Projektordner unter <code>backups</code>.</p>
      </section>

      <section className="bsv-sicherung__box">
        <h2>Gut zu wissen</h2>
        <ul>
          <li>
            <strong>Zweiter Ort:</strong> Eine Sicherung auf demselben PC hilft nicht, wenn die Festplatte kaputtgeht. Lade sie herunter und speichere sie zusätzlich auf einem USB-Stick oder in einer Cloud.
          </li>
          <li>
            <strong>Persönliche Daten:</strong> Die Datei enthält Mitgliedsanträge und Konten. Nicht per E-Mail verschicken, nicht öffentlich ablegen.
          </li>
          <li>
            <strong>IBANs:</strong> sind verschlüsselt und lassen sich nur mit dem <code>ENCRYPTION_KEY</code> aus der Datei <code>.env</code> lesen. Der Schlüssel ist absichtlich nicht in der Sicherung – bewahre ihn getrennt auf (z. B. im Passwortmanager des Vorstands).
          </li>
          <li>
            <strong>Wie oft?</strong> Mindestens einmal pro Woche und vor größeren Änderungen. Nach 7 Tagen erinnert das Dashboard.
          </li>
        </ul>
      </section>

      <section className="bsv-sicherung__box">
        <h2>Sicherung wieder einspielen</h2>
        <p>Das ersetzt alle aktuellen Inhalte durch den Stand der Sicherung. Vorher wird automatisch der jetzige Stand gesichert.</p>
        <ol>
          <li>Die Sicherungsdatei in den Ordner <code>backups</code> im Projektordner legen (falls sie nicht schon dort ist).</li>
          <li>Das Server-Fenster schließen.</li>
          <li>
            Im Projektordner eine PowerShell öffnen und eingeben: <code>pnpm sicherung:einspielen bsv-sicherung_…tar.gz</code> (ohne Dateiname wird die neueste genommen).
          </li>
          <li>„JA“ eintippen und warten, bis „Fertig“ erscheint.</li>
          <li>Die Website wie gewohnt mit <code>BSV-Website-Update.bat</code> starten.</li>
        </ol>
      </section>
    </div>
  )
}
