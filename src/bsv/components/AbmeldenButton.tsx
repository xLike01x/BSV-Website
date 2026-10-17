'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export function AbmeldenButton() {
  const router = useRouter()
  const [laedt, setLaedt] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={laedt}
      onClick={async () => {
        setLaedt(true)
        await fetch('/api/users/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => null)
        router.push('/')
        router.refresh()
      }}
    >
      {laedt ? 'Abmelden …' : 'Abmelden'}
    </button>
  )
}
