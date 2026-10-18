import type { Payload } from 'payload'
import React from 'react'

import { hauptsponsorUmziehen } from '@/utilities/hauptsponsorUmziehen'
import Neuladen from './Neuladen'

/** Über der Sponsoren-Liste: alten Hauptsponsor aus „Vereinsdaten“ übernehmen, falls noch nicht geschehen */
export default async function HauptsponsorUebernahme({ payload }: { payload: Payload }) {
  const name = await hauptsponsorUmziehen(payload).catch((e) => {
    payload.logger.warn({ err: e }, 'Hauptsponsor-Übernahme fehlgeschlagen')
    return null
  })
  return name ? <Neuladen name={name} /> : null
}
