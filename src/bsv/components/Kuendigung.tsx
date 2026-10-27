'use client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export type KuendbareMitgliedschaft = { id: number; name: string; nummer: string | null }
export type MeineKuendigung = {
  id: number
  namen: string
  status: string
  statusText: string
  statusFarbe: string
  eingang: string
  wirksam: string
  zurueckziehbar: boolean
}

const MAX = 10 * 1024 * 1024
const KOPF = { 'x-bsv-kuendigung': '1' }

/**
 * Mein BSV → Mitgliedschaft kündigen: auswählen, Schreiben öffnen (drucken/PDF), unterschrieben hochladen.
 * Wirksam zum Ende des Quartals, in dem es hochgeladen wird – das Datum rechnet der Server aus.
 */
export function Kuendigung({
  kuendbar,
  kuendigungen,
  wirksamJetzt,
  schlussJetzt,
}: {
  kuendbar: KuendbareMitgliedschaft[]
  kuendigungen: MeineKuendigung[]
  wirksamJetzt: string
  schlussJetzt: string
}) {
  const router = useRouter()
  const [auswahl, setAuswahl] = useState(kuendbar.length === 1 ? String(kuendbar[0]!.id) : '')
  const [datei, setDatei] = useState<File | null>(null)
  const [grund, setGrund] = useState('')
  const [unterschrieben, setUnterschrieben] = useState(false)
  const [status, setStatus] = useState<'' | 'sendet' | { ok: string } | { fehler: string }>('')
  const [offen, setOffen] = useState(false)

  const ids = auswahl === 'alle' ? kuendbar.map((m) => m.id) : auswahl ? [Number(auswahl)] : []
  const formularLink = ids.length ? `/mitglieder/kuendigung?m=${ids.join(',')}` : null

  const dateiWaehlen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setStatus('')
    if (f && f.size > MAX) {
      setDatei(null)
      e.target.value = ''
      return setStatus({
        fehler: 'Die Datei ist zu groß (höchstens 10 MB). Tipp: ein Foto mit dem Handy reicht.',
      })
    }
    setDatei(f)
  }

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ids.length || !datei || !unterschrieben) return
    setStatus('sendet')
    const fd = new FormData()
    fd.append('file', datei)
    fd.append('_payload', JSON.stringify({ mitgliedschaften: ids, grund, unterschrieben: true }))
    try {
      const r = await fetch('/api/kuendigungen/einreichen', {
        method: 'POST',
        credentials: 'include',
        headers: KOPF,
        body: fd,
      })
      const d = (await r.json().catch(() => ({}))) as { fehler?: string; wirksamZum?: string }
      if (!r.ok || !d.wirksamZum)
        return setStatus({
          fehler: d.fehler ?? 'Das hat nicht geklappt – bitte noch einmal versuchen.',
        })
      const [y, m, t] = d.wirksamZum.split('-')
      setStatus({ ok: `${t}.${m}.${y}` })
      setDatei(null)
      setGrund('')
      setUnterschrieben(false)
      setAuswahl('')
      setOffen(false)
      router.refresh()
    } catch {
      setStatus({ fehler: 'Keine Verbindung – bitte noch einmal versuchen.' })
    }
  }

  const zurueckziehen = async (id: number) => {
    if (
      !window.confirm(
        'Kündigung wirklich zurückziehen? Die Mitgliedschaft läuft dann normal weiter.',
      )
    )
      return
    const r = await fetch(`/api/kuendigungen/${id}/zurueckziehen`, {
      method: 'POST',
      credentials: 'include',
      headers: KOPF,
    }).catch(() => null)
    if (!r?.ok) {
      const d = (await r?.json().catch(() => ({}))) as { fehler?: string } | undefined
      window.alert(d?.fehler ?? 'Das hat nicht geklappt.')
      return
    }
    router.refresh()
  }

  return (
    <div
      id="kuendigen"
      style={{ background: '#fff', borderRadius: 28, padding: 32, gridColumn: '1 / -1' }}
    >
      <h2 className="t-3" style={{ fontSize: 26, marginBottom: 8 }}>
        Mitgliedschaft kündigen
      </h2>

      {kuendigungen.length > 0 && (
        <ul className="kuendigung-liste">
          {kuendigungen.map((k) => (
            <li key={k.id}>
              <div>
                <strong>{k.namen}</strong>
                <span className="muted">
                  Eingegangen am {k.eingang} · wirksam zum <strong>{k.wirksam}</strong>
                </span>
              </div>
              <span className="kuendigung-status" style={{ color: k.statusFarbe }}>
                {k.statusText}
              </span>
              {k.zurueckziehbar && (
                <button
                  type="button"
                  className="btn btn-ghost kuendigung-zurueck"
                  onClick={() => void zurueckziehen(k.id)}
                >
                  Zurückziehen
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {status && typeof status === 'object' && 'ok' in status && (
        <p className="zusage-ok" role="status" style={{ margin: '0 0 16px' }}>
          ✓ Deine Kündigung ist eingegangen – wirksam zum <strong>{status.ok}</strong>. Du bekommst
          eine Bestätigung per E-Mail, sobald die Kasse sie geprüft hat.
        </p>
      )}

      {kuendbar.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
          {kuendigungen.length
            ? 'Für alle Mitgliedschaften in deinem Konto liegt schon eine Kündigung vor.'
            : 'Mit deinem Konto ist keine laufende Mitgliedschaft verknüpft. Kündigen kannst du dann formlos bei der Kasse (Kontaktformular).'}
        </p>
      ) : !offen ? (
        <>
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.5 }}>
            Laut Satzung wirkt eine Kündigung zum Ende des Quartals, in dem sie bei uns eingeht –
            jetzt also zum <strong>{wirksamJetzt}</strong>.
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => setOffen(true)}>
            Kündigung vorbereiten
          </button>
        </>
      ) : (
        <form onSubmit={absenden} className="kuendigung-form" method="post">
          <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
            So geht’s: 1. auswählen · 2. Schreiben öffnen, ausdrucken und unterschreiben · 3. Foto
            oder PDF davon hier hochladen. Laut Satzung wirkt die Kündigung zum Ende des Quartals,
            in dem sie hochgeladen wird.
          </p>

          <label className="field">
            1. Was möchtest du kündigen?
            <select value={auswahl} onChange={(e) => setAuswahl(e.target.value)} required>
              <option value="">Bitte auswählen …</option>
              {kuendbar.map((m) => (
                <option key={m.id} value={m.id}>
                  Mitgliedschaft von {m.name}
                  {m.nummer ? ` (Nr. ${m.nummer})` : ''}
                </option>
              ))}
              {kuendbar.length > 1 && (
                <option value="alle">
                  Alle {kuendbar.length} Mitgliedschaften (ganze Familie)
                </option>
              )}
            </select>
          </label>

          {ids.length > 0 && (
            <p className="kuendigung-frist" role="status">
              Wirksam zum <strong>{wirksamJetzt}</strong>, wenn du das unterschriebene Schreiben bis
              einschließlich <strong>{schlussJetzt}</strong> hochlädst. Danach gilt das nächste
              Quartalsende.
            </p>
          )}

          <div className="field">
            2. Kündigungsschreiben
            {formularLink ? (
              <a
                href={formularLink}
                target="_blank"
                rel="noopener"
                className="btn btn-ghost"
                style={{ alignSelf: 'flex-start' }}
              >
                📄 Kündigungsschreiben öffnen (drucken oder als PDF speichern)
              </a>
            ) : (
              <span className="muted" style={{ fontSize: 15 }}>
                Erst oben auswählen – dann ist das Schreiben schon ausgefüllt.
              </span>
            )}
          </div>

          <label className="field">
            3. Unterschriebenes Schreiben hochladen (Foto oder PDF, höchstens 10 MB)
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={dateiWaehlen}
              required
              disabled={!ids.length}
            />
          </label>

          <label className="field">
            Möchtest du uns sagen, warum? (freiwillig)
            <textarea
              value={grund}
              onChange={(e) => setGrund(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="z. B. Umzug, keine Zeit mehr …"
            />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={unterschrieben}
              onChange={(e) => setUnterschrieben(e.target.checked)}
              required
            />
            <span>
              Das Schreiben ist unterschrieben (bei Kindern von den Erziehungsberechtigten). Mir ist
              klar, dass die Kündigung verbindlich ist.
            </span>
          </label>

          {status && typeof status === 'object' && 'fehler' in status && (
            <p className="form-error" role="alert">
              {status.fehler}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'sendet' || !ids.length || !datei || !unterschrieben}
            >
              {status === 'sendet' ? 'Wird gesendet …' : 'Kündigung verbindlich absenden'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOffen(false)}
              disabled={status === 'sendet'}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
