import { getAbsoluteLocaleUrl } from 'astro:i18n'

import { DEFAULT_LOCALE, localeTag, SITE } from '@/lib/site'

import { pageLocales } from '@/i18n/locales'
import { localeAgnosticPath } from '@/i18n/path'
import { translatePath } from '@/i18n/route-segments'
import { useTranslations } from '@/i18n/translate'

interface LocaleAlternate {
  tag: string
  href: string
}

export interface SocialImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

interface HeadSeoMeta {
  documentTitle: string
  canonical: string
  socialImage: SocialImage
  currentTag: string
  localeAlternates: LocaleAlternate[]
  defaultHref?: string
}

interface HeadSeoParams {
  title: string
  absoluteTitle: boolean
  currentLocale: string | undefined
  canonicalPath: string
  ogImage: string | undefined
  locales: readonly string[] | undefined
}

// I motori di ricerca ignorano un insieme di hreflang che non concorda col canonical:
// entrambi rilocalizzano lo stesso percorso di base.
function resolveLocaleAlternates(canonicalPath: string, codes: readonly string[]): LocaleAlternate[] {
  return codes.map((code) => ({
    tag: localeTag(code),
    href: getAbsoluteLocaleUrl(code, translatePath(canonicalPath, code)),
  }))
}

function resolveSocialImage(ogImage: string | undefined, locale: string): SocialImage {
  if (ogImage !== undefined) return { url: new URL(ogImage, SITE.url).href }
  return {
    url: new URL(SITE.defaultOgImage, SITE.url).href,
    ...SITE.defaultOgImageSize,
    alt: useTranslations(locale)('seo.defaultOgImageAlt'),
  }
}

export function resolveHeadSeoMeta({
  title,
  absoluteTitle,
  currentLocale,
  canonicalPath,
  ogImage,
  locales,
}: HeadSeoParams): HeadSeoMeta {
  const locale = currentLocale ?? DEFAULT_LOCALE
  const canonical = localeAgnosticPath(canonicalPath, locale)
  const available = pageLocales(locales)

  return {
    documentTitle: absoluteTitle || title === SITE.name ? title : `${title} | ${SITE.name}`,
    canonical: getAbsoluteLocaleUrl(locale, translatePath(canonical, locale)),
    socialImage: resolveSocialImage(ogImage, locale),
    currentTag: localeTag(locale),
    localeAlternates: resolveLocaleAlternates(canonical, available),
    ...(available.includes(DEFAULT_LOCALE)
      ? { defaultHref: getAbsoluteLocaleUrl(DEFAULT_LOCALE, translatePath(canonical, DEFAULT_LOCALE)) }
      : {}),
  }
}
