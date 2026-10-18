/** Erlaubt nur interne Pfade („/…“), https://, http:// und mailto: – keine „javascript:“-Links o. Ä. */
export const sichereAdresse = (wert: unknown): true | string => {
  const v = String(wert ?? '').trim()
  if (!v) return true
  if (v.startsWith('//') || /[\u0000-\u001f\\]/.test(v)) return 'Bitte mit „/“ oder „https://“ beginnen.'
  return /^(\/|https?:\/\/|mailto:|tel:|#)/i.test(v) ? true : 'Bitte mit „/“ oder „https://“ beginnen.'
}
