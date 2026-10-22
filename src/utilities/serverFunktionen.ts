import type { PayloadRequest, ServerFunction } from 'payload'
import { docAccessOperation, docAccessOperationGlobal, Forbidden } from 'payload'
import { buildFormStateHandler } from '@payloadcms/ui/utilities/buildFormState'
import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'

import { nurLeser } from '@/access/roles'

/**
 * Eigene Hüllen um zwei Serverfunktionen der Verwaltung (in src/app/(payload)/layout.tsx eingehängt).
 * Payload prüft dort nur, ob jemand die Verwaltung öffnen darf – nicht, ob er den Eintrag bearbeiten darf.
 */

type Ziel = { collection: string; id: number | string } | { global: string }

/** Darf die Person diesen Eintrag veröffentlichen? (gleiche Prüfung wie Payloads „Geplant“-Liste) */
async function darfVeroeffentlichen(req: PayloadRequest, ziel: Ziel): Promise<boolean> {
  try {
    if ('global' in ziel) {
      const globalConfig = req.payload.config.globals.find((g) => g.slug === ziel.global)
      if (!globalConfig) return false
      return Boolean((await docAccessOperationGlobal({ data: { _status: 'published' }, globalConfig, req })).update)
    }
    const config = (req.payload.collections as Record<string, { config: unknown } | undefined>)[ziel.collection]?.config
    if (!config) return false
    return Boolean((await docAccessOperation({ id: ziel.id, collection: { config } as never, data: { _status: 'published' }, req })).update)
  } catch {
    return false
  }
}

type FormStateArgs = Parameters<typeof buildFormStateHandler>[0]
type ScheduleArgs = Parameters<typeof schedulePublishHandler>[0] & {
  doc?: { relationTo?: string; value?: number | string } | null
  global?: string | null
  deleteID?: number | string | null
}

export const serverFunktionen: Record<string, ServerFunction> = {
  // Nur ansehen: Formularzustand ja, aber keine Bearbeitungssperre anlegen (würde andere blockieren)
  'form-state': ((args: FormStateArgs) =>
    buildFormStateHandler(nurLeser(args.req.user) ? ({ ...args, returnLockStatus: false, updateLastEdited: false } as FormStateArgs) : args)) as ServerFunction,

  // Geplantes Veröffentlichen: einplanen und abbrechen nur mit Recht zum Veröffentlichen – auch für den Auftrag,
  // der abgebrochen wird (sonst könnte jede Person mit Verwaltungszugang fremde Planungen per ID löschen)
  'schedule-publish': (async (args: ScheduleArgs) => {
    const { req } = args
    const ziele: Ziel[] = []
    if (args.doc?.relationTo && args.doc.value != null) ziele.push({ collection: args.doc.relationTo, id: args.doc.value })
    if (args.global) ziele.push({ global: args.global })
    if (args.deleteID != null) {
      const job = (await req.payload
        .findByID({ collection: 'payload-jobs', id: args.deleteID, depth: 0, overrideAccess: true })
        .catch(() => null)) as { taskSlug?: string; input?: { doc?: { relationTo?: string; value?: number | string }; global?: string } } | null
      if (!job || job.taskSlug !== 'schedulePublish') throw new Forbidden(req.t)
      if (job.input?.doc?.relationTo && job.input.doc.value != null) ziele.push({ collection: job.input.doc.relationTo, id: job.input.doc.value })
      else if (job.input?.global) ziele.push({ global: job.input.global })
      else throw new Forbidden(req.t)
    }
    if (!ziele.length) throw new Forbidden(req.t)
    for (const z of ziele) if (!(await darfVeroeffentlichen(req, z))) throw new Forbidden(req.t)
    return schedulePublishHandler(args)
  }) as ServerFunction,
}
