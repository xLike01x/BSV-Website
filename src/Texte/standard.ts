import type { Field } from 'payload'

/** Standardtexte aus der Konfiguration – greifen, solange in der Verwaltung nichts eingetragen ist */
export const standardTexte = (felder: Field[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const f of felder) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs) {
        const inner = standardTexte(tab.fields)
        if ('name' in tab && tab.name) out[tab.name] = inner
        else Object.assign(out, inner)
      }
    } else if (f.type === 'row' || f.type === 'collapsible') Object.assign(out, standardTexte(f.fields))
    else if (f.type === 'group' && 'name' in f && f.name) out[f.name] = standardTexte(f.fields)
    else if ('name' in f && 'defaultValue' in f && typeof f.defaultValue === 'string') out[f.name] = f.defaultValue
  }
  return out
}

/** Gespeicherte Werte über die Standardtexte legen (leere Felder behalten den Standard) */
export const zusammenfuehren = (basis: Record<string, unknown>, werte: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...basis }
  for (const [k, v] of Object.entries(werte ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = zusammenfuehren((basis[k] as Record<string, unknown>) ?? {}, v as Record<string, unknown>)
    else if (v !== null && v !== undefined && v !== '') out[k] = v
  }
  return out
}
