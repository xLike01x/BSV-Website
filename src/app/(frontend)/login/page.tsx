import type { Metadata } from 'next'
import React from 'react'

import { AuthSeite } from '@/bsv/components/AuthSeite'
import { LoginForm } from '@/bsv/components/LoginForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Anmelden', robots: { index: false } }

export default function LoginSeite() {
  return (
    <AuthSeite titel="Hallo im BSV." text="Melde dich an für Mitgliederbereich, Kursausfälle und Verwaltung.">
      <LoginForm />
    </AuthSeite>
  )
}
