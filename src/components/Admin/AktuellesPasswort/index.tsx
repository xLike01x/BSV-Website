'use client'
import { useAuth, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import React from 'react'

import { PasswortHinweis } from '@/bsv/components/PasswortHinweis'

/**
 * Beim Setzen eines Passworts in der Verwaltung: Regeln live anzeigen (für jedes Konto) und – nur beim EIGENEN
 * Passwort – „Aktuelles Passwort“ abfragen.
 */
export default function AktuellesPasswort({ path }: { path: string }) {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const neu = useFormFields(([f]) => f.password?.value) as string | undefined
  const name = useFormFields(([f]) => f.name?.value) as string | undefined
  const email = useFormFields(([f]) => f.email?.value) as string | undefined
  const { value, setValue } = useField<string>({ path })
  if (!user || !neu) return null
  const eigenes = id != null && String(id) === String(user.id)
  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <PasswortHinweis passwort={neu} kontext={{ name, email }} />
      {eigenes && (
        <div className="field-type text" style={{ marginTop: 'var(--base)' }}>
          <label className="field-label" htmlFor="aktuellesPasswort">
            Aktuelles Passwort <span className="required">*</span>
          </label>
          <input id="aktuellesPasswort" type="password" autoComplete="current-password" value={value ?? ''} onChange={(e) => setValue(e.target.value)} />
          <div className="field-description">Zur Sicherheit: Wer ein neues Passwort festlegt, bestätigt das mit dem bisherigen.</div>
        </div>
      )}
    </div>
  )
}
