import type { LinkItem, SitemapItem } from '@astrojs/sitemap'

// [HARD] astro.config.mjs carica questo modulo prima che Vite risolva l'alias `@/`: qui e nei
// moduli che importa si importa solo per percorso relativo.
import { canonicalizePath, translatePath } from '../../i18n/route-segments'
import { crawlPathname } from './crawl-policy'

interface SitemapLocales {
  defaultLocale: string
  locales: Readonly<Record<string, string>>
}

export function sitemapAlternates({ defaultLocale, locales }: SitemapLocales) {
  // @astrojs/sitemap chiama `filter` su tutte le pagine prima di `serialize`: quando `link` gira,
  // `kept` ha già ogni voce della sitemap.
  const kept = new Map<string, string>()

  function canonicalOf(pathname: string): string {
    const locale = Object.keys(locales).find(
      (code) => code !== defaultLocale && (pathname === `/${code}` || pathname.startsWith(`/${code}/`)),
    )
    if (locale === undefined) return canonicalizePath(pathname, defaultLocale)
    return canonicalizePath(pathname.slice(locale.length + 1) || '/', locale)
  }

  function versionPath(canonical: string, locale: string): string {
    const translated = translatePath(canonical, locale)
    if (locale === defaultLocale) return translated
    return translated === '/' ? `/${locale}` : `/${locale}${translated}`
  }

  return {
    keep:
      (predicate: (url: string) => boolean) =>
      (url: string): boolean => {
        if (!predicate(url)) return false
        kept.set(crawlPathname(url), url)
        return true
      },
    link: ({ links: _fromPlugin, ...item }: SitemapItem): SitemapItem => {
      const canonical = canonicalOf(crawlPathname(item.url))
      const links: LinkItem[] = Object.entries(locales).flatMap(([locale, lang]) => {
        const url = kept.get(versionPath(canonical, locale))
        return url === undefined ? [] : [{ url, lang }]
      })
      return links.length > 1 ? { ...item, links } : item
    },
  }
}
