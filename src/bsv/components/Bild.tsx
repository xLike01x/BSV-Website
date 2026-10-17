import React from 'react'

import { bildSrcSet, bildUrl, fokus, istMedia } from '@/bsv/lib'

type Props = {
  media: unknown
  sizes?: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  size?: 'small' | 'medium' | 'large' | 'xlarge'
}

/**
 * Bild aus der Payload-Mediathek mit responsiven Größen und Fokuspunkt.
 * Die Größen erzeugt Payload beim Hochladen (sharp), deshalb reicht ein <img>.
 */
export function Bild({ media, sizes = '100vw', alt, className, style, priority, size = 'large' }: Props) {
  if (!istMedia(media)) return null
  return (
    <img
      src={bildUrl(media, size)}
      srcSet={bildSrcSet(media)}
      sizes={sizes}
      alt={alt ?? media.alt ?? ''}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      style={{ objectPosition: fokus(media), ...style }}
    />
  )
}
