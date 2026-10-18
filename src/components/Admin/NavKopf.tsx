import React from 'react'

/** Kopf der Seitenleiste: Wappen + „BSV · Verwaltung“ */
export default function NavKopf() {
  return (
    <a className="bsv-nav-kopf" href="/admin">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bsv-logo.png" alt="" width={30} height={32} />
      <span>BSV · Verwaltung</span>
    </a>
  )
}
