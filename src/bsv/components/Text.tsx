import React from 'react'

/** Ersetzt Platzhalter wie {teams} und wandelt Zeilenumbrüche in <br> um. */
export const ersetze = (text: string | null | undefined, werte: Record<string, string>) =>
  (text ?? '').replace(/\{(\w+)\}/g, (m, k: string) => werte[k] ?? m)

export function T({ text, werte, fallback = '' }: { text?: string | null; werte: Record<string, string>; fallback?: string }) {
  const zeilen = ersetze(text || fallback, werte).split('\n')
  return (
    <>
      {zeilen.map((z, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {z}
        </React.Fragment>
      ))}
    </>
  )
}
