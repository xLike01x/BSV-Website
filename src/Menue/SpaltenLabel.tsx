'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/** Zeigt die Spaltenüberschrift statt „Spalte 01“ */
export default function SpaltenLabel() {
  const { data, rowNumber } = useRowLabel<{ titel?: string }>()
  return <span>{data?.titel || `Spalte ${(rowNumber ?? 0) + 1}`}</span>
}
