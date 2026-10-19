import { getAbsoluteLocaleUrl } from 'astro:i18n'

import { isNoindexPath } from '@/lib/seo/crawl-policy'
import { DEFAULT_LOCALE, localeTag, SITE } from '@/lib/site'

import { type PageLocales, pageLocales } from '@/i18n/locales'
import { alternatePath, localeAgnosticPath } from '@/i18n/path'
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
  noindex: boolean
  socialImage: SocialImage
  currentTag: string
  localeAlternates: LocaleAlternate[]
  hreflangAlternates: LocaleAlternate[]
  defaultHref?: string
}

interface HeadSeoParams {
  title: string
  absoluteTitle: boolean
  currentLocale: string | undefined
  pathname: string
  canonicalPath: string
  ogImage: string | undefined
  locales: PageLocales | undefined
}

function resolveLocaleAlternates(
  canonicalPath: string,
  locale: string,
  locales: PageLocales | undefined,
): LocaleAlternate[] {
  return pageLocales(locales).map((code) => ({
    tag: localeTag(code),
    href: getAbsoluteLocaleUrl(code, translatePath(alternatePath(code, canonicalPath, locale, locales), code)),
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
  pathname,
  canonicalPath,
  ogImage,
  locales,
}: HeadSeoParams): HeadSeoMeta {
  const locale = currentLocale ?? DEFAULT_LOCALE
  const canonical = localeAgnosticPath(canonicalPath, locale)
  const localeAlternates = resolveLocaleAlternates(canonicalPath, locale, locales)
  const noindex = isNoindexPath(pathname)
  const hreflangAlternates = noindex ? [] : localeAlternates.filter((alt) => !isNoindexPath(alt.href))
  const defaultAlternate = hreflangAlternates.find((alt) => alt.tag === localeTag(DEFAULT_LOCALE))

  return {
    documentTitle: absoluteTitle || title === SITE.name ? title : `${title} | ${SITE.name}`,
    canonical: getAbsoluteLocaleUrl(locale, translatePath(canonical, locale)),
    noindex,
    socialImage: resolveSocialImage(ogImage, locale),
    currentTag: localeTag(locale),
    localeAlternates,
    hreflangAlternates,
    ...(defaultAlternate ? { defaultHref: defaultAlternate.href } : {}),
  }
}
