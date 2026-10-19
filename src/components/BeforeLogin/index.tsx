import React from 'react'

const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>BSV-Verwaltung</b>
        {' – Anmeldung für Redaktion, Trainer, Kasse und Vorstand. Mitglieder melden sich unter '}
        <a href="/login">buedericher-spielverein.de/login</a>
        {' an.'}
      </p>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>© {new Date().getFullYear()} <a href="mailto:kontakt.thomas.wilms@gmail.com" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>Thomas Wilms</a> · Konzept, Design und Umsetzung</p>
    </div>
  )
}

export default BeforeLogin
