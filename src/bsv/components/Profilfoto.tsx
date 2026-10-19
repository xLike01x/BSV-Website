'use client'

import { useRouter } from 'next/navigation'
import React, { useRef, useState } from 'react'

/** Eigenes Profilfoto hochladen, ändern oder entfernen */
export function Profilfoto({ name, foto, fotoId }: { name: string; foto: string | null; fotoId: number | null }) {
  const router = useRouter()
  const eingabe = useRef<HTMLInputElement>(null)
  const [laedt, setLaedt] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [vorschau, setVorschau] = useState<string | null>(null)

  async function hochladen(datei: File) {
    setFehler(null)
    if (!/^image\/(jpeg|png|webp)$/.test(datei.type)) return setFehler('Bitte ein Foto als JPG, PNG oder WebP wählen.')
    if (datei.size > 15 * 1024 * 1024) return setFehler('Das Foto ist zu groß (höchstens 15 MB).')
    setVorschau((alt) => {
      if (alt) URL.revokeObjectURL(alt)
      return URL.createObjectURL(datei)
    })
    setLaedt(true)
    const fd = new FormData()
    fd.append('file', datei)
    fd.append('_payload', JSON.stringify({}))
    const res = await fetch('/api/profilbilder', { method: 'POST', body: fd, credentials: 'same-origin' }).catch(() => null)
    setLaedt(false)
    if (!res?.ok) {
      setVorschau(null)
      return setFehler('Das Hochladen hat nicht geklappt. Bitte versuche es erneut.')
    }
    router.refresh()
  }

  async function entfernen() {
    if (!fotoId) return
    setLaedt(true)
    const res = await fetch(`/api/profilbilder/${fotoId}`, { method: 'DELETE', credentials: 'same-origin' }).catch(() => null)
    setLaedt(false)
    if (!res?.ok) return setFehler('Das Entfernen hat nicht geklappt. Bitte erneut versuchen.')
    setVorschau(null)
    router.refresh()
  }

  const bild = vorschau ?? foto
  return (
    <div>
      <div className="profilfoto">
        {bild ? <img src={bild} alt="Dein Profilfoto" className="avatar avatar--gross" /> : <span className="avatar avatar--gross">{name.slice(0, 1).toUpperCase()}</span>}
        <div className="profilfoto-knoepfe">
          <button type="button" className="btn btn-primary" disabled={laedt} onClick={() => eingabe.current?.click()}>
            {laedt ? 'Bitte warten …' : foto ? 'Foto ändern' : 'Foto hochladen'}
          </button>
          {foto && (
            <button type="button" className="btn" disabled={laedt} onClick={entfernen} style={{ background: 'var(--bsv-soft)' }}>
              Entfernen
            </button>
          )}
        </div>
        <input
          ref={eingabe}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const d = e.target.files?.[0]
            if (d) hochladen(d)
            e.target.value = ''
          }}
        />
      </div>
      {fehler && (
        <p className="form-error" role="alert" style={{ marginTop: 12 }}>
          {fehler}
        </p>
      )}
      <p className="muted" style={{ fontSize: 14, margin: '14px 0 0', lineHeight: 1.5 }}>
        Freiwillig. Sehen können es nur du, die Verwaltung und die Trainer deiner Kurse – nie öffentlich. Du kannst es jederzeit entfernen.
      </p>
    </div>
  )
}
