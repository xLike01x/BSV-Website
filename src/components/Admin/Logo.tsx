import React from 'react'

/** Logo auf der Anmeldeseite der Verwaltung */
export default function Logo() {
  return (
    <span className="bsv-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bsv-logo.png" alt="" width={56} height={60} />
      <span>
        <strong>BSV · Verwaltung</strong>
        <small>Büdericher Spielverein 1919 e.V.</small>
      </span>
    </span>
  )
}
