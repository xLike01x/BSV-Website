import type { CollectionBeforeValidateHook } from 'payload'

/** Erzeugt den URL-Slug aus dem Titel, falls keiner angegeben ist (z. B. beim Import). */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const slugFromTitle: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && typeof data.title === 'string') data.slug = slugify(data.title)
  return data
}
