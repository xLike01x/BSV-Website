'use client'
import { useAuth, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import React from 'react'

/** „Aktuelles Passwort“ – nur sichtbar, wenn jemand gerade das EIGENE Passwort ändert */
export default function AktuellesPasswort({ path }: { path: string }) {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const neu = useFormFields(([f]) => f.password?.value) as string | undefined
  const { value, setValue } = useField<string>({ path })
  if (!user || id == null || String(id) !== String(user.id) || !neu) return null
  return (
    <div className="field-type text" style={{ marginBottom: 'var(--base)' }}>
      <label className="field-label" htmlFor="aktuellesPasswort">
        Aktuelles Passwort <span className="required">*</span>
      </label>
      <input id="aktuellesPasswort" type="password" autoComplete="current-password" value={value ?? ''} onChange={(e) => setValue(e.target.value)} />
      <div className="field-description">Zur Sicherheit: Wer ein neues Passwort festlegt, bestätigt das mit dem bisherigen.</div>
    </div>
  )
}
