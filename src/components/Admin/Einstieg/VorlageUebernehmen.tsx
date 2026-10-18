'use client'
import { useDocumentInfo, useForm } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

/**
 * Unsichtbares Feld: Übernimmt die im Einstiegs-Kasten gewählte Vorlage in „Neu erstellen“.
 * Es wird nichts gespeichert, bis man selbst auf „Speichern“ klickt.
 */
export default function VorlageUebernehmen() {
  const { id, collectionSlug } = useDocumentInfo()
  const { dispatchFields, setModified } = useForm()
  const erledigt = useRef(false)

  useEffect(() => {
    if (erledigt.current || id) return
    erledigt.current = true
    let roh: string | null = null
    try {
      roh = sessionStorage.getItem('bsv-vorlage')
      sessionStorage.removeItem('bsv-vorlage')
    } catch {
      return
    }
    if (!roh) return
    const { slug, daten } = JSON.parse(roh) as { slug: string; daten: Record<string, unknown> }
    if (slug !== collectionSlug) return
    // Kurz warten, bis das Formular bereit ist
    window.setTimeout(() => {
      for (const [path, value] of Object.entries(daten)) dispatchFields({ type: 'UPDATE', path, value, valid: true } as never)
      setModified(true)
    }, 50)
  }, [id, collectionSlug, dispatchFields, setModified])

  return null
}
