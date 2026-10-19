import QRCode from 'qrcode'

import type { Ausweis } from '@/bsv/components/AusweisKarte'
import { payload } from '@/bsv/data'
import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

import { istGueltig, MITGLIEDSART } from './Mitgliedschaften'
import { ausweisToken } from './token'

const datum = (d?: string | null) => (d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null)
const titel = (a: unknown) => (a && typeof a === 'object' ? (a as { title?: string }).title : undefined)

/** Ausweise für das angemeldete Konto – immer frisch aus den Mitgliedsdaten und den Kursen */
export async function ausweiseFuer(user: User): Promise<Ausweis[]> {
  const p = await payload()
  const r = await p.find({ collection: 'mitgliedschaften', where: { email: { equals: user.email.toLowerCase() } }, sort: 'eintritt', limit: 20, depth: 1, user, overrideAccess: false }).catch(() => ({ docs: [] }))
  const kontoKurse = (user.angebote ?? []).map(titel).filter(Boolean) as string[]
  const kontoName = (user.name ?? '').trim().toLowerCase()
  // Kontoinhaber/in zuerst, dann nach Eintritt
  const docs = [...r.docs].sort((a, b) => Number(`${b.vorname} ${b.nachname}`.trim().toLowerCase() === kontoName) - Number(`${a.vorname} ${a.nachname}`.trim().toLowerCase() === kontoName))
  return Promise.all(
    docs.map(async (m, i) => {
      const name = `${m.vorname} ${m.nachname}`.trim()
      let kurse = (m.angebote ?? []).map(titel).filter(Boolean) as string[]
      // Für die Person, der das Konto gehört: auch die im Konto eingetragenen Kurse
      if (!kurse.length && (name.toLowerCase() === kontoName || (docs.length === 1 && i === 0))) kurse = kontoKurse
      const qr = await QRCode.toDataURL(`${getServerSideURL()}/ausweis/${ausweisToken(m.id)}`, { margin: 1, width: 220, color: { dark: '#1D1D1F', light: '#FFFFFF' } })
      return { id: m.id, name, nummer: m.mitgliedsnummer ?? null, seit: datum(m.eintritt), art: MITGLIEDSART[m.art] ?? m.art, kurse, gueltig: istGueltig(m), qr }
    }),
  )
}
