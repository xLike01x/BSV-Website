/**
 * IP-Adresse des Besuchers – nur für Ratenbegrenzung und die tageweise Besucherzählung, nie gespeichert.
 *
 * Live steht vor der Website ein Webserver (Caddy oder nginx), der X-Real-IP selbst setzt und einen vom
 * Besucher mitgeschickten Wert überschreibt; die Website selbst lauscht nur auf 127.0.0.1 (siehe deploy/).
 * X-Forwarded-For wird absichtlich NICHT ausgewertet: Je nach Webserver-Einstellung hängt er den Wert des
 * Besuchers nur an, dann ließe sich jede Begrenzung mit einer erfundenen Adresse umgehen.
 * Fehlt X-Real-IP (lokale Entwicklung), teilen sich alle Anfragen den Schlüssel „unbekannt“.
 */
export const clientIp = (h: Headers | null | undefined): string => {
  const ip = h?.get('x-real-ip')?.trim()
  return ip && ip.length <= 64 && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : 'unbekannt'
}
