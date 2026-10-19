import { getPathByLocale } from 'astro:i18n'

import { DEFAULT_LOCALE } from '@/lib/site'

import { localizedHref } from '@/i18n/href'
import { declaredPath, type PageLocales } from '@/i18n/locales'
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

// I motori di ricerca ignorano un insieme di hreflang che non concorda col canonical: nella lingua
// corrente vale il percorso della pagina, anche quando la mappa della pagina ne porta un altro.
export function alternatePath(
  targetLocale: string,
  pathname: string,
  currentLocale: string | undefined,
  declared?: PageLocales,
): string {
  const locale = currentLocale ?? DEFAULT_LOCALE
  const path = targetLocale === locale ? undefined : declaredPath(declared, targetLocale)
  return path === undefined ? localeAgnosticPath(pathname, locale) : localeAgnosticPath(path, targetLocale)
}

export function localeSwitchHref(
  targetLocale: string,
  pathname: string,
  currentLocale: string | undefined,
  declared?: PageLocales,
): string {
  return localizedHref(targetLocale, alternatePath(targetLocale, pathname, currentLocale, declared))
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
