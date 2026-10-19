/** Für geschützte Dateien (Ausweise, Fotos, Mitglieder-Dokumente): nicht im Browser-/Proxy-Cache ablegen */
export const privateDatei = ({ headers }: { headers: Headers }) => {
  headers.set('Cache-Control', 'private, no-store')
  return headers
}
