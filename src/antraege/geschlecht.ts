/** Geschlecht wie in der Beitrittserklärung (für das DFBnet) – genderneutral mit „divers“ */
export const GESCHLECHT_OPTIONEN = [
  { label: 'männlich', value: 'm' },
  { label: 'weiblich', value: 'w' },
  { label: 'divers', value: 'd' },
]
export const GESCHLECHTER = GESCHLECHT_OPTIONEN.map((o) => o.value)
export const GESCHLECHT_LABEL: Record<string, string> = Object.fromEntries(GESCHLECHT_OPTIONEN.map((o) => [o.value, o.label]))
