// Le rotte prendono il nome dai file nella lingua di default (src/pages/contatti.astro →
// /contatti); una lingua secondaria rinomina solo il segmento pubblico: `en: { contatti: 'contact' }`.
const SEGMENTS_BY_LOCALE: Record<string, Record<string, string>> = {}

/* v8 ignore next 2 -- morto finché SEGMENTS_BY_LOCALE arriva vuoto; si sveglia alla seconda lingua, e applySegmentMap copre già la mappatura a cui delega */
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
  /* v8 ignore start -- lo stesso: morto finché la mappa è vuota, vivo alla lingua #2 */
  const segments = SEGMENTS_BY_LOCALE[locale]
  if (!segments) return pathname
  return applySegmentMap(pathname, segments)
  /* v8 ignore stop */
}

export function canonicalizePath(pathname: string, locale: string): string {
  /* v8 ignore start -- lo stesso: morto finché la mappa è vuota, vivo alla lingua #2 */
  const canonical = CANONICAL_BY_LOCALE[locale]
  if (!canonical) return pathname
  return applySegmentMap(pathname, canonical)
  /* v8 ignore stop */
}
