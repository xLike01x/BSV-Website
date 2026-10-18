'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/** Zeigt in der Liste den Menütext statt „Eintrag 01“ */
export default function MenueRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <span>{data?.label || `Eintrag ${(rowNumber ?? 0) + 1}`}</span>
}
