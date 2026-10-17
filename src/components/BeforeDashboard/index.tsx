import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

/** Begrüßung im Dashboard der Verwaltung */
const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Willkommen in der BSV-Verwaltung</h4>
      </Banner>
      <ul className={`${baseClass}__instructions`}>
        <li>
          <strong>News</strong> unter „Inhalte → News“ schreiben – Bild hochladen, Text eingeben, veröffentlichen.
        </li>
        <li>
          <strong>Teams &amp; Kurse</strong> unter „Sport“ pflegen. Neue Angebote erscheinen automatisch im Menü, im Angebotsfinder und im Anmeldeformular.
        </li>
        <li>
          <strong>Trainingsausfälle</strong> unter „Sport → Trainingsausfälle“ melden – sie erscheinen sofort auf der Kursseite und im Mitgliederbereich.
        </li>
        <li>
          <strong>Anfragen</strong> (Mitgliedsanträge, Probetrainings, Kontakt) findest du unter „Verwaltung“ und „Sport“.
        </li>
        <li>
          <a href="/" target="_blank" rel="noopener">
            Website ansehen ↗
          </a>
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
