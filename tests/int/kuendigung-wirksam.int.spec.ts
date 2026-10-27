import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { kuendigungenWirksam } from '@/kuendigungen/endpunkte'
import { istGueltig } from '@/mitgliedschaften/Mitgliedschaften'
import { berlinDatum, tagAlsIso } from '@/utilities/berlinDatum'

let payload: Payload
const NAME = 'IntTest-Kuendigung-Wirksam'
const tagVerschoben = (tage: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + tage)
  return berlinDatum(d)
}

describe('Kündigung: tägliche Aufgabe macht bestätigte Kündigungen nach dem Quartalsende wirksam', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })
  afterAll(async () => {
    await payload.delete({
      collection: 'kuendigungen',
      where: { namen: { contains: NAME } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'mitgliedschaften',
      where: { nachname: { equals: NAME } },
      overrideAccess: true,
    })
  })

  it('vorbei → Mitgliedschaft beendet; noch nicht vorbei, offen oder zurückgezogen → unverändert', async () => {
    const neu = (vorname: string) =>
      payload.create({
        collection: 'mitgliedschaften',
        data: { vorname, nachname: NAME, email: 'int@bsv.test', art: 'aktiv' } as never,
        overrideAccess: true,
      })
    const [gestern, morgen, offen] = await Promise.all([
      neu('Gestern'),
      neu('Morgen'),
      neu('Offen'),
    ])
    const k = (m: { id: number }, wirksam: string, status: string) =>
      payload.create({
        collection: 'kuendigungen',
        data: {
          status,
          namen: `${NAME} ${m.id}`,
          mitgliedschaften: [m.id],
          eingangAm: new Date().toISOString(),
          wirksamZum: tagAlsIso(wirksam),
          email: 'int@bsv.test',
        } as never,
        overrideAccess: true,
      })
    const kGestern = await k(gestern, tagVerschoben(-1), 'bestaetigt')
    const kMorgen = await k(morgen, tagVerschoben(1), 'bestaetigt')
    await k(offen, tagVerschoben(-1), 'neu')

    const n = await kuendigungenWirksam(payload)
    expect(n).toBeGreaterThanOrEqual(1)

    const mG = await payload.findByID({
      collection: 'mitgliedschaften',
      id: gestern.id,
      overrideAccess: true,
    })
    expect(mG.aktiv).toBe(false)
    expect(berlinDatum(String(mG.austritt))).toBe(tagVerschoben(-1))
    expect(istGueltig(mG)).toBe(false)
    const kG = await payload.findByID({
      collection: 'kuendigungen',
      id: kGestern.id,
      overrideAccess: true,
    })
    expect(kG.wirksamGeworden).toBe(true)

    const mM = await payload.findByID({
      collection: 'mitgliedschaften',
      id: morgen.id,
      overrideAccess: true,
    })
    expect(mM.aktiv).not.toBe(false)
    const kM = await payload.findByID({
      collection: 'kuendigungen',
      id: kMorgen.id,
      overrideAccess: true,
    })
    expect(kM.wirksamGeworden).not.toBe(true)

    const mO = await payload.findByID({
      collection: 'mitgliedschaften',
      id: offen.id,
      overrideAccess: true,
    })
    expect(mO.aktiv).not.toBe(false)
    expect(mO.austritt ?? null).toBeNull()

    // Zweiter Lauf: nichts mehr zu tun (keine doppelten Verlaufseinträge)
    const vorher = (kG.verlauf ?? []).length
    await kuendigungenWirksam(payload)
    const kG2 = await payload.findByID({
      collection: 'kuendigungen',
      id: kGestern.id,
      overrideAccess: true,
    })
    expect((kG2.verlauf ?? []).length).toBe(vorher)
  })

  it('Ausweis: am Austrittstag noch gültig, am Tag danach nicht mehr', () => {
    expect(istGueltig({ aktiv: true, austritt: tagAlsIso(berlinDatum(new Date())) })).toBe(true)
    expect(istGueltig({ aktiv: true, austritt: tagAlsIso(tagVerschoben(-1)) })).toBe(false)
    expect(istGueltig({ aktiv: true, austritt: null })).toBe(true)
    expect(istGueltig({ aktiv: false, austritt: null })).toBe(false)
  })
})
