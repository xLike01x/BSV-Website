import type { Metadata } from 'next'
import React from 'react'

import { AuthSeite } from '@/bsv/components/AuthSeite'
import { PasswortNeuForm } from '@/bsv/components/PasswortNeuForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Neues Passwort', robots: { index: false }, referrer: 'no-referrer' }

export default function PasswortNeuSeite() {
  return (
    <AuthSeite titel="Neues Passwort." text="Lege ein neues Passwort für dein Konto fest.">
      <PasswortNeuForm />
    </AuthSeite>
  )
}
