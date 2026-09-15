import { SEGMENTS_BY_LOCALE } from '@/i18n/segments-by-locale'

const CANONICAL_BY_LOCALE: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(SEGMENTS_BY_LOCALE).map(([locale, segments]) => [
    locale,
    Object.fromEntries(Object.entries(segments).map(([canonical, localized]) => [localized, canonical])),
  ]),
)

export function applySegmentMap(pathname: string, map: Record<string, string>): string {
  const parts = pathname.split('/')
  const first = parts[1]
  if (!first) return pathname
  parts[1] = map[first] ?? first
  return parts.join('/')
}

export function translatePath(pathname: string, locale: string): string {
  const segments = SEGMENTS_BY_LOCALE[locale]
  if (!segments) return pathname
  return applySegmentMap(pathname, segments)
}

export function canonicalizePath(pathname: string, locale: string): string {
  const canonical = CANONICAL_BY_LOCALE[locale]
  if (!canonical) return pathname
  return applySegmentMap(pathname, canonical)
}
