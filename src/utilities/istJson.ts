/**
 * Nur echtes JSON (Medientyp am Anfang des Content-Type). „text/plain; x=application/json“ dürfte ein Browser ohne
 * Rückfrage von fremden Seiten schicken – das wäre ein Einfallstor für CSRF.
 */
export const istJson = (req: { headers: Headers }) =>
  String(req.headers.get('content-type') ?? '')
    .toLowerCase()
    .split(';')[0]!
    .trim() === 'application/json'
