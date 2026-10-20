import { api, B, pruefe } from './lib.mjs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 Sicherheitstest'

/** F-12: Besucherstatistik nimmt nur echte Adressen an und lässt sich nicht fluten */
export default async function statistik(d) {
  const [{ max }] = await d.q('select coalesce(max(id),0) max from statistik')
  const ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}`
  const k = { 'User-Agent': UA, 'X-Real-IP': ip }
  const neu = async () => d.q('select pfad, quelle, suchbegriff, art from statistik where id > $1 order by id', [max])
  try {
    await api(null, 'POST', '/api/besuch', { t: 'aufruf', p: '/gibt-es-nicht-sicherheitstest' }, k)
    await api(null, 'POST', '/api/besuch', { t: 'aufruf', p: '//evil.example/login-bsv' }, k)
    await api(null, 'POST', '/api/besuch', { t: 'aufruf', p: '/\\evil.example' }, k)
    await api(null, 'POST', '/api/besuch', { t: 'aufruf', p: '/ausweis/abc.def' }, k)
    pruefe('Erfundene, fremde und Ausweis-Adressen werden nicht gespeichert', (await neu()).length === 0, await neu())
    await api(null, 'POST', '/api/besuch', { t: 'aufruf', p: '/verein', u: '<script>alert(1)</script>' }, k)
    const z = await neu()
    pruefe('Echte Seite wird gezählt', z.length === 1 && z[0].pfad === '/verein', z)
    pruefe('Herkunft enthält keinen beliebigen Text', z.length === 1 && !/[<>]/.test(z[0].quelle ?? ''), z)
    const groß = await fetch(B + '/api/besuch', { method: 'POST', headers: { ...k, 'Content-Type': 'application/json' }, body: JSON.stringify({ t: 'aufruf', p: '/verein', x: 'a'.repeat(3000) }) })
    pruefe('Übergroße Anfrage wird verworfen', groß.status === 204 && (await neu()).length === 1)
    for (let i = 0; i < 32; i++) await fetch(B + '/suche?q=sicherheitstest' + i, { headers: k })
    await new Promise((r) => setTimeout(r, 1500))
    const suchen = (await neu()).filter((x) => x.art === 'suche').length
    pruefe(`Suche: höchstens 30 Einträge je Adresse in 10 Minuten (${suchen})`, suchen <= 30 && suchen > 0, suchen)
  } finally {
    await d.q('delete from statistik where id > $1', [max])
  }
}
