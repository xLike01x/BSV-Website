'use client'
import { useAuth } from '@payloadcms/ui'
import React, { useState } from 'react'

import type { Anleitung, Faq, Feld } from './extras'
import './hilfe.scss'

/** Kurzes Bildschirmvideo; eingebaute Videos haben ein Vorschaubild mit gleichem Namen (.jpg) */
export function HilfeVideo({ src, className }: { src: string; className?: string }) {
  const poster = src.startsWith('/hilfe/') ? src.replace(/\.(mp4|webm)$/, '.jpg') : undefined
  return (
    <video className={className} src={src} poster={poster} controls muted playsInline preload="none">
      Dein Browser kann das Video nicht abspielen.
    </video>
  )
}

/** Nummerierte Schritt-für-Schritt-Anleitung, aufklappbar, optional mit Video */
export function AnleitungBox({ a, offen = false }: { a: Anleitung; offen?: boolean }) {
  return (
    <details className="bsv-hilfe__anleitung" open={offen}>
      <summary>
        <span className="bsv-hilfe__anleitung-icon" aria-hidden="true">
          ▸
        </span>
        {a.titel}
        {a.video && <span className="bsv-hilfe__badge">Video</span>}
      </summary>
      {a.video && (
        <HilfeVideo src={a.video} className="bsv-hilfe__video" />
      )}
      <ol>
        {a.schritte.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </details>
  )
}

export function FelderBox({ felder }: { felder: Feld[] }) {
  if (!felder.length) return null
  return (
    <details className="bsv-hilfe__anleitung">
      <summary>
        <span className="bsv-hilfe__anleitung-icon" aria-hidden="true">
          ▸
        </span>
        Was bedeuten die Felder?
      </summary>
      <dl className="bsv-hilfe__felder">
        {felder.map((f) => (
          <div key={f.name}>
            <dt>{f.name}</dt>
            <dd>{f.text}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

export function FaqBox({ faq }: { faq: Faq[] }) {
  if (!faq.length) return null
  return (
    <div className="bsv-hilfe__faq">
      {faq.map((f) => (
        <details key={f.frage} className="bsv-hilfe__anleitung">
          <summary>
            <span className="bsv-hilfe__anleitung-icon" aria-hidden="true">
              ▸
            </span>
            {f.frage}
          </summary>
          <p>{f.antwort}</p>
        </details>
      ))}
    </div>
  )
}

/** „Hat dir das geholfen?“ – speichert eine Rückmeldung für die Admins */
export function Feedback({ bereich }: { bereich: string }) {
  const [status, setStatus] = useState<'frage' | 'kommentar' | 'danke'>('frage')
  const [hilfreich, setHilfreich] = useState<boolean | null>(null)
  const [kommentar, setKommentar] = useState('')

  const senden = async (h: boolean, text = '') => {
    await fetch('/api/hilfe-feedback', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bereich, hilfreich: h, kommentar: text || undefined }),
    }).catch(() => null)
  }

  if (status === 'danke') return <p className="bsv-hilfe__feedback">Danke für deine Rückmeldung! 💚</p>
  if (status === 'kommentar')
    return (
      <form
        className="bsv-hilfe__feedback bsv-hilfe__feedback--form"
        onSubmit={async (e) => {
          e.preventDefault()
          await senden(hilfreich ?? false, kommentar)
          setStatus('danke')
        }}
      >
        <label htmlFor="bsv-hilfe-kommentar">Was hat gefehlt oder war unklar? (optional)</label>
        <textarea id="bsv-hilfe-kommentar" rows={3} value={kommentar} onChange={(e) => setKommentar(e.target.value)} maxLength={1000} />
        <button type="submit" className="bsv-hilfe__btn bsv-hilfe__btn--primaer">
          Absenden
        </button>
      </form>
    )
  return (
    <div className="bsv-hilfe__feedback">
      <span>Hat dir das geholfen?</span>
      <button
        type="button"
        className="bsv-hilfe__daumen"
        aria-label="Ja, hilfreich"
        onClick={async () => {
          setHilfreich(true)
          await senden(true)
          setStatus('danke')
        }}
      >
        👍
      </button>
      <button
        type="button"
        className="bsv-hilfe__daumen"
        aria-label="Nein, nicht hilfreich"
        onClick={() => {
          setHilfreich(false)
          setStatus('kommentar')
        }}
      >
        👎
      </button>
    </div>
  )
}

/** „Frage an den Admin“ – landet bei den Kontaktanfragen */
export function FrageAnAdmin({ bereich, bereichTitel }: { bereich: string; bereichTitel: string }) {
  const { user } = useAuth<{ name?: string; email: string }>()
  const [offen, setOffen] = useState(false)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'bereit' | 'sendet' | 'ok' | 'fehler'>('bereit')

  if (!offen)
    return (
      <button type="button" className="bsv-hilfe__btn" onClick={() => setOffen(true)}>
        ✉️ Frage an den Admin
      </button>
    )
  if (status === 'ok')
    return <p className="bsv-hilfe__ok">Deine Frage ist angekommen. Ein Admin meldet sich bei dir (an {user?.email}).</p>

  return (
    <form
      className="bsv-hilfe__frage"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!text.trim() || !user) return
        setStatus('sendet')
        const res = await fetch('/api/kontaktanfragen', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.name || user.email,
            email: user.email,
            an: 'Admin (Frage aus der Verwaltung)',
            betreff: `Frage aus der Verwaltung: ${bereichTitel}`,
            nachricht: `${text.trim()}\n\n— gesendet aus dem Bereich „${bereichTitel}“ (${bereich})`,
            datenschutz: true,
            website: '',
          }),
        }).catch(() => null)
        setStatus(res?.ok ? 'ok' : 'fehler')
      }}
    >
      <label htmlFor="bsv-hilfe-frage">Deine Frage</label>
      <textarea
        id="bsv-hilfe-frage"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Beschreib kurz, wobei du nicht weiterkommst."
        maxLength={4000}
        required
      />
      <p className="bsv-hilfe__klein">Die Antwort kommt an {user?.email}.</p>
      {status === 'fehler' && <p className="bsv-hilfe__fehler">Das hat nicht geklappt. Bitte später nochmal versuchen.</p>}
      <div className="bsv-hilfe__reihe">
        <button type="submit" className="bsv-hilfe__btn bsv-hilfe__btn--primaer" disabled={status === 'sendet'}>
          {status === 'sendet' ? 'Wird gesendet …' : 'Frage senden'}
        </button>
        <button type="button" className="bsv-hilfe__btn" onClick={() => setOffen(false)}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}

/** Startet die geführte Tour (die Tour-Komponente hört auf dieses Ereignis) */
export function tourStarten() {
  if (window.location.pathname.replace(/\/$/, '') === '/admin') {
    window.dispatchEvent(new CustomEvent('bsv-tour-start'))
  } else {
    window.location.href = '/admin?tour=1'
  }
}
