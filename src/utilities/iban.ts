/** IBAN-Prüfziffer (ohne Node-Abhängigkeiten – auch im Browser nutzbar) */
export const isValidIBAN = (input: string): boolean => {
  const iban = input.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  let rest = 0
  for (let i = 0; i < numeric.length; i += 7) {
    rest = Number(String(rest) + numeric.slice(i, i + 7)) % 97
  }
  return rest === 1
}
