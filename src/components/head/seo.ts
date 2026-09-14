import { i18n } from 'astro:config/client'
import { getAbsoluteLocaleUrl } from 'astro:i18n'

import { localeTag, SITE } from '@/lib/site'

import { localeAgnosticPath } from '@/i18n/path'
import { translatePath } from '@/i18n/route-segments'

interface LocaleAlternate {
  tag: string
  href: string
}

interface HeadSeoMeta {
  canonical: string
  ogImageUrl: string
  currentTag: string
  localeAlternates: LocaleAlternate[]
  defaultHref: string
}

interface HeadSeoParams {
  currentLocale: string | undefined
  canonicalPath: string
  ogImage: string | undefined
}

// Le API i18n di Astro e Astro.currentLocale parlano codici di lingua (codes[0] per
// le voci oggetto); gli URL portano percorsi.
function configuredLocaleCodes(): string[] {
  /* v8 ignore next -- le voci locale a oggetto ({ path, codes }) sono una funzione di Astro che la lingua singola di questo template non produce mai */
  return (i18n?.locales ?? []).map((l) => (typeof l === 'string' ? l : (l.codes[0] ?? l.path)))
}

// I motori di ricerca ignorano un insieme di hreflang che non concorda col canonical:
// entrambi rilocalizzano lo stesso percorso di base.
function resolveLocaleAlternates(canonicalPath: string): LocaleAlternate[] {
  return configuredLocaleCodes().map((code) => ({
    tag: localeTag(code),
    href: getAbsoluteLocaleUrl(code, translatePath(canonicalPath, code)),
  }))
}

export function resolveHeadSeoMeta({ currentLocale, canonicalPath, ogImage }: HeadSeoParams): HeadSeoMeta {
  /* v8 ignore next -- astro:config/client lo inietta Astro a ogni render; il ripiego protegge un modulo che non può mancare */
  const defaultLocale = i18n?.defaultLocale ?? 'it'
  const locale = currentLocale ?? defaultLocale
  const canonical = localeAgnosticPath(canonicalPath, locale)

  return {
    canonical: getAbsoluteLocaleUrl(locale, translatePath(canonical, locale)),
    // OG image ALWAYS absolute: social crawlers don't resolve relative paths.
    ogImageUrl: new URL(ogImage ?? SITE.defaultOgImage, SITE.url).href,
    currentTag: localeTag(locale),
    localeAlternates: resolveLocaleAlternates(canonical),
    defaultHref: getAbsoluteLocaleUrl(defaultLocale, translatePath(canonical, defaultLocale)),
  }
}
