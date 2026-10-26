import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { Elfmeter } from '@/bsv/components/spiele/Elfmeter'
import { Hochhalten } from '@/bsv/components/spiele/Hochhalten'
import { Memory } from '@/bsv/components/spiele/Memory'
import { Tagesrekord } from '@/bsv/components/spiele/Tagesrekord'
import { Rangliste } from '@/bsv/components/spiele/Rangliste'
import type { RanglistenSpiel } from '@/bsv/components/spiele/RanglisteEintragen'
import { animationAn, getAnimationen } from '@/bsv/data'
import { seite } from '@/bsv/seo'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = seite('Spielecke', 'Kleine Spiele für die BSV Kids: Elfmeterschießen, Ball hochhalten und Memory.')

/** Spielecke für die BSV Kids – Spiele einzeln abschaltbar unter Website-Aufbau → Animationen. Es wird nichts gespeichert. */
export default async function Spielecke() {
  const a = await getAnimationen()
  const elfmeter = animationAn(a, 'elfmeter')
  const hochhalten = animationAn(a, 'hochhalten')
  const memory = animationAn(a, 'memory')
  const eins = elfmeter || hochhalten || memory
  const rangliste = animationAn(a, 'rangliste')
  const ranglistenSpiele: RanglistenSpiel[] = [...(hochhalten ? (['hochhalten'] as const) : []), ...(memory ? (['memory'] as const) : []), ...(elfmeter ? (['elfmeterSerie'] as const) : [])]
  return (
    <>
      <section className="center sec-warm" style={{ padding: '100px 22px 56px' }}>
        <p className="kicker in1" style={{ color: 'var(--bsv-coral-dark)' }}>
          BSV Kids
        </p>
        <h1 className="t-page in2">Spielecke</h1>
        <p className="lead in3" style={{ margin: '22px auto 0', maxWidth: 600 }}>
          Für alle, die zwischen zwei Trainings noch Lust auf Fußball haben. Viel Spaß – und danach ab auf den Platz! ⚽
        </p>
      </section>
      <section className="sec-warm" style={{ padding: '0 22px 110px' }}>
        {eins && <Tagesrekord elfmeter={elfmeter} hochhalten={hochhalten} memory={memory} />}
        {eins ? (
          <div className="spielecke">
            {elfmeter && <Elfmeter rangliste={rangliste} />}
            {hochhalten && <Hochhalten rangliste={rangliste} />}
            {memory && <Memory rangliste={rangliste} />}
            {rangliste && ranglistenSpiele.length > 0 && <Rangliste spiele={ranglistenSpiele} />}
          </div>
        ) : (
          <p className="center muted" style={{ margin: 0 }}>
            Die Spielecke macht gerade Pause. <Link href="/breitensport#kids">Zu den BSV Kids ›</Link>
          </p>
        )}
        <p className="center muted" style={{ margin: '28px auto 0', maxWidth: 560, fontSize: 14 }}>
          Für den Tagesrekord zählt die Website nur Zahlen. In die Rangliste kommt nur, wer sich mit einem Spitznamen einträgt – bitte nicht den echten Namen. Gespeichert werden Spitzname, Ergebnis und Datum; nach 30 Tagen wird alles gelöscht, außer den 10 besten aller Zeiten. Ein Eintrag soll weg? Schreib uns über das Kontaktformular.
        </p>
      </section>
    </>
  )
}
