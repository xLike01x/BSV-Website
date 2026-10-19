import type { Metadata } from 'next'
import React from 'react'

import { AuthSeite } from '@/bsv/components/AuthSeite'
import { EmailBestaetigen } from '@/bsv/components/EmailBestaetigen'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'E-Mail bestätigen', robots: { index: false }, referrer: 'no-referrer' }

export default function BestaetigenSeite() {
  return (
    <AuthSeite titel="E-Mail bestätigen.">
      <EmailBestaetigen />
    </AuthSeite>
  )
}
