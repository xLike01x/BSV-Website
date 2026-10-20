import { timingSafeEqual } from 'crypto'
import type { PayloadRequest } from 'payload'
import { hasRole } from '@/access/roles'
import { getPayload } from 'payload'
import { getSafeRedirect } from 'payload/shared'

import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'

export type PreviewSearchParams = {
  path: string
  previewSecret: string
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  // Zeitkonstanter Vergleich; ohne gesetztes PREVIEW_SECRET nie freigeben
  const soll = Buffer.from(process.env.PREVIEW_SECRET ?? '')
  const ist = Buffer.from(previewSecret ?? '')
  if (!soll.length || soll.length !== ist.length || !timingSafeEqual(soll, ist)) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (!path) {
    return new Response('Insufficient search params', { status: 404 })
  }

  const safePath = getSafeRedirect({ fallbackTo: '', redirectTo: path })

  if (!safePath) {
    return new Response('This endpoint can only be used for relative previews', { status: 400 })
  }

  let user

  try {
    const authResult = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    })
    user = authResult.user
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview')
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  const draft = await draftMode()

  if (!user) {
    draft.disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  // Vorschau nur für Personen, die Inhalte bearbeiten (nicht für Mitglieder)
  if (!hasRole(user as never, 'admin', 'redaktion', 'uebungsleitung', 'teamredaktion')) {
    draft.disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  draft.enable()

  redirect(safePath)
}
