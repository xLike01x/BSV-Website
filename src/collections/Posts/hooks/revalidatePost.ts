import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/news/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidatePath('/')
      revalidatePath('/news')
      revalidateTag('posts-sitemap', 'max')
    }

    // War veröffentlicht und ist es nicht mehr – oder die Adresse (Slug) hat sich geändert: alte Seite und Listen neu aufbauen
    const zurueckgezogen = previousDoc?._status === 'published' && doc._status !== 'published'
    const umbenannt = previousDoc?._status === 'published' && previousDoc.slug && previousDoc.slug !== doc.slug
    if (zurueckgezogen || umbenannt) {
      const oldPath = `/news/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidatePath('/')
      revalidatePath('/news')
      revalidateTag('posts-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/news/${doc?.slug}`

    revalidatePath(path)
    revalidatePath('/')
    revalidatePath('/news')
    revalidateTag('posts-sitemap', 'max')
  }

  return doc
}
