import { getPathByLocale } from 'astro:i18n'

import { DEFAULT_LOCALE } from '@/lib/site'

import { canonicalizePath } from '@/i18n/route-segments'

function localePrefix(currentLocale: string, defaultLocale: string): string {
  return currentLocale === defaultLocale ? '' : `/${getPathByLocale(currentLocale)}`
}

function hasLocalePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function stripLocalePrefix(pathname: string, prefix: string): string {
  return prefix && hasLocalePrefix(pathname, prefix) ? pathname.slice(prefix.length) : pathname
}

function normalizeTrailingSlash(path: string): string {
  if (path.length <= 1) return path || '/'
  return path.replace(/\/+$/, '') || '/'
}

export function localeAgnosticPath(pathname: string, currentLocale: string | undefined): string {
  const locale = currentLocale ?? DEFAULT_LOCALE
  const prefix = localePrefix(locale, DEFAULT_LOCALE)
  const unprefixed = stripLocalePrefix(pathname, prefix)
  const canonical = canonicalizePath(unprefixed, locale)
  return normalizeTrailingSlash(canonical)
}

export function ariaCurrent(
  href: string,
  pathname: string,
  currentLocale: string | undefined,
): 'page' | 'true' | undefined {
  const path = localeAgnosticPath(pathname, currentLocale)
  if (path === href) return 'page'
  if (href !== '/' && path.startsWith(`${href}/`)) return 'true'
  return undefined
}
