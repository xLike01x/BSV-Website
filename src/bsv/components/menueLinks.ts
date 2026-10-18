import type { NavItem } from './NavClient'

export type MenueEintrag = {
  label?: string | null
  ziel?: 'seite' | 'adresse' | 'aufklapp' | null
  seite?: number | { slug?: string | null } | null
  adresse?: string | null
  neuerTab?: boolean | null
  aufklapp?: string | null
}

/** Einen Eintrag aus „Menü & Fußzeile“ in einen Link umwandeln (oder null, wenn unvollständig) */
export function zuLink(e: MenueEintrag): NavItem | null {
  if (!e.label) return null
  if (e.ziel === 'adresse') {
    const href = (e.adresse ?? '').trim()
    if (!href) return null
    return { label: e.label, href, external: /^https?:\/\//.test(href) || Boolean(e.neuerTab) }
  }
  if (e.ziel === 'aufklapp') return null
  const slug = typeof e.seite === 'object' ? e.seite?.slug : null
  return slug ? { label: e.label, href: `/${slug}` } : null
}

export const zuLinks = (eintraege: MenueEintrag[] | null | undefined): NavItem[] =>
  (eintraege ?? []).map(zuLink).filter((l): l is NavItem => Boolean(l))
