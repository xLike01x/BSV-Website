import type { Metadata } from 'next'
import React from 'react'

import { getAngebote } from '@/bsv/data'
import { AuthSeite } from '@/bsv/components/AuthSeite'
import { RegistrierenForm } from '@/bsv/components/RegistrierenForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Registrieren', robots: { index: false } }

export default async function RegistrierenSeite() {
  const angebote = (await getAngebote()).map((a) => ({ id: a.id, title: a.title, bereich: a.bereich }))
  return (
    <AuthSeite titel="Konto erstellen." text="Für Mitglieder: Kursausfälle, Termine und Downloads an einem Ort." breite={560}>
      <RegistrierenForm angebote={angebote} />
    </AuthSeite>
  )
}
