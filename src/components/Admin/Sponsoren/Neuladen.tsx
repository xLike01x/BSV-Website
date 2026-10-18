'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

/** Liste einmal neu laden, damit der eben übernommene Hauptsponsor sofort erscheint */
export default function Neuladen({ name }: { name: string }) {
  const router = useRouter()
  useEffect(() => {
    router.refresh()
  }, [router])
  return <p style={{ margin: '0 0 16px', padding: '12px 16px', borderRadius: 14, background: '#e8f6ee', color: '#0f3d24', fontWeight: 600 }}>✓ „{name}“ wurde aus den Vereinsdaten als Hauptsponsor übernommen.</p>
}
