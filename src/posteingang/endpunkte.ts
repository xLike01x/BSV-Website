import type { CollectionSlug, Endpoint, PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'

/** Eintrag für den Notizen-Verlauf (Name wird mitgespeichert, damit ihn alle Bearbeitenden lesen können) */
export type VerlaufEintrag = { text: string; von?: number | null; vonName?: string | null; am: string; art?: 'notiz' | 'status' }

const nameVon = (u: unknown) => {
  const x = u as { name?: string | null; email?: string } | null
  return x?.name || x?.email?.split('@')[0] || 'Unbekannt'
}

/** Vorhandene Einträge unverändert übernehmen (ohne IDs der Datenbank-Zeilen) */
const bisher = (v: unknown): VerlaufEintrag[] =>
  (Array.isArray(v) ? v : []).map((e: Record<string, unknown>) => ({
    text: String(e.text ?? ''),
    von: e.von && typeof e.von === 'object' ? (e.von as { id: number }).id : ((e.von as number | null) ?? null),
    vonName: (e.vonName as string | null) ?? null,
    am: String(e.am ?? new Date().toISOString()),
    art: e.art === 'status' ? 'status' : 'notiz',
  }))

export const neuerEintrag = (req: PayloadRequest, text: string, art: 'notiz' | 'status' = 'notiz'): VerlaufEintrag => ({
  text,
  von: (req.user?.id as number) ?? null,
  vonName: nameVon(req.user),
  am: new Date().toISOString(),
  art,
})

/**
 * Ändert einen Posteingang-Eintrag im Namen der angemeldeten Person.
 * Die Rechte prüft Payload selbst (overrideAccess: false) – wer den Eintrag nicht bearbeiten darf, bekommt einen Fehler.
 * Nur dieser Weg darf Verlauf und Zuständigkeit schreiben (req.context.bsvPosteingang).
 */
/**
 * Änderungen am selben Eintrag nacheinander ausführen: Der Verlauf wird gelesen und komplett neu geschrieben –
 * ohne Reihenfolge würden gleichzeitige Notizen sich gegenseitig überschreiben. Die Website läuft als eine Instanz
 * (deploy/bsv.service), daher reicht eine Warteschlange im Prozess.
 */
const schlangen = new Map<string, Promise<unknown>>()
function nacheinander<T>(schluessel: string, fn: () => Promise<T>): Promise<T> {
  const vorher = schlangen.get(schluessel) ?? Promise.resolve()
  const jetzt = vorher.catch(() => undefined).then(fn)
  const ende = jetzt.catch(() => undefined)
  schlangen.set(schluessel, ende)
  void ende.then(() => {
    if (schlangen.get(schluessel) === ende) schlangen.delete(schluessel)
  })
  return jetzt
}

export function posteingangAendern(req: PayloadRequest, slug: CollectionSlug, id: number, daten: (doc: Record<string, unknown>) => Record<string, unknown>, notiz?: { text: string; art?: 'notiz' | 'status' }) {
  return nacheinander(`${slug}:${id}`, () => aendern(req, slug, id, daten, notiz))
}

async function aendern(req: PayloadRequest, slug: CollectionSlug, id: number, daten: (doc: Record<string, unknown>) => Record<string, unknown>, notiz?: { text: string; art?: 'notiz' | 'status' }) {
  // Lesen mit den Rechten der Person: fremde oder nicht sichtbare Einträge → Fehler „nicht gefunden“
  const doc = (await req.payload.findByID({ collection: slug, id, depth: 0, overrideAccess: false, user: req.user, req })) as unknown as Record<string, unknown>
  const data = daten(doc)
  if (notiz) data.verlauf = [...bisher(doc.verlauf), neuerEintrag(req, notiz.text, notiz.art)].slice(-200)
  req.context.bsvPosteingang = true
  try {
    return (await req.payload.update({ collection: slug, id, data: data as never, overrideAccess: false, user: req.user, req, depth: 0 })) as unknown as Record<string, unknown>
  } finally {
    req.context.bsvPosteingang = false
  }
}

/** Einheitliche Fehlerantwort ohne interne Details */
export function fehlerAntwort(e: unknown) {
  const status = (e as { status?: number })?.status
  if (status === 403 || status === 404) return Response.json({ fehler: 'Diesen Eintrag darfst du nicht bearbeiten.' }, { status: 403 })
  if (status === 400) return Response.json({ fehler: (e as Error).message || 'Eingabe ungültig.' }, { status: 400 })
  return Response.json({ fehler: 'Das hat nicht geklappt. Bitte Seite neu laden und noch einmal versuchen.' }, { status: 500 })
}

/**
 * Nur JSON annehmen: Formulare fremder Websites können kein application/json senden, ohne dass der Browser vorher
 * nachfragt (CORS) – zusätzlicher Schutz neben SameSite-Cookies und der Herkunftsprüfung von Payload.
 */
export async function jsonVon<T>(req: PayloadRequest): Promise<T | null> {
  if (!String(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return null
  return ((await req.json?.().catch(() => ({}))) ?? {}) as T
}

export const nurJson = () => Response.json({ fehler: 'Ungültige Anfrage.' }, { status: 415 })

export const idAus = (req: PayloadRequest) => {
  const id = Number(req.routeParams?.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** Endpunkte, die jeder Posteingang-Bereich bekommt */
export function posteingangEndpunkte(slug: CollectionSlug): Endpoint[] {
  return [
    {
      // Notiz hinzufügen
      path: '/:id/notiz',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
        const id = idAus(req)
        if (!id) return Response.json({ fehler: 'Eintrag nicht gefunden.' }, { status: 404 })
        const body = await jsonVon<{ text?: unknown }>(req)
        if (!body) return nurJson()
        const text = typeof body.text === 'string' ? body.text.trim() : ''
        if (!text) return Response.json({ fehler: 'Bitte einen Text eingeben.' }, { status: 400 })
        if (text.length > 2000) return Response.json({ fehler: 'Die Notiz ist zu lang (höchstens 2.000 Zeichen).' }, { status: 400 })
        try {
          const doc = await posteingangAendern(req, slug, id, () => ({}), { text })
          return Response.json({ ok: true, verlauf: doc.verlauf ?? [] })
        } catch (e) {
          return fehlerAntwort(e)
        }
      },
    },
    {
      // „Ich kümmere mich“ bzw. „Abgeben“
      path: '/:id/zustaendig',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ fehler: 'Bitte anmelden.' }, { status: 401 })
        const id = idAus(req)
        if (!id) return Response.json({ fehler: 'Eintrag nicht gefunden.' }, { status: 404 })
        const body = await jsonVon<{ uebernehmen?: unknown }>(req)
        if (!body) return nurJson()
        const uebernehmen = body.uebernehmen === true
        try {
          const doc = await posteingangAendern(
            req,
            slug,
            id,
            (doc) => {
              // Abgeben nur, wer selbst zuständig ist (oder Admin) – übernehmen darf jede/r, das steht dann im Verlauf
              const jetzt = doc.zustaendig && typeof doc.zustaendig === 'object' ? (doc.zustaendig as { id: number }).id : doc.zustaendig
              if (!uebernehmen && jetzt !== req.user!.id && !hasRole(req.user as never, 'admin'))
                throw Object.assign(new Error('Abgeben kann nur, wer gerade zuständig ist.'), { status: 400 })
              return { zustaendig: uebernehmen ? req.user!.id : null }
            },
            { text: uebernehmen ? 'kümmert sich jetzt darum' : 'hat den Eintrag abgegeben', art: 'status' },
          )
          return Response.json({ ok: true, zustaendig: doc.zustaendig ?? null, zustaendigName: doc.zustaendigName ?? null })
        } catch (e) {
          return fehlerAntwort(e)
        }
      },
    },
  ]
}
