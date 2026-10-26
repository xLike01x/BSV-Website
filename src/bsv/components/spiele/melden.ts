'use client'

export type Tageswerte = { elfmeterSchuesse: number; elfmeterTore: number; hochhaltenSpiele: number; hochhaltenRekord: number; neuerRekord?: boolean }

/** Ergebnis einer Runde an den Tagesrekord melden (ohne Namen) und die Anzeige oben aktualisieren */
export async function melden(spiel: 'elfmeter' | 'hochhalten', wert: number): Promise<Tageswerte | null> {
  try {
    const r = await fetch('/api/spielstatistik/melden', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spiel, wert }) })
    if (!r.ok) return null
    const d = (await r.json()) as Tageswerte
    window.dispatchEvent(new CustomEvent('bsv-spielstatistik', { detail: d }))
    return d
  } catch {
    return null
  }
}
