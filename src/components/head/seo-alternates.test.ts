import { withOnlyListedPaths } from '@test/helpers/crawl-policy'
import { translatedSlugPaths } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import { resolveHeadSeoMeta } from '@/components/head/seo'

import { NOINDEX_PATHS } from '@/lib/seo/crawl-policy'
import { localeTag } from '@/lib/site'

import { localeSwitchHref } from '@/i18n/path'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/segments-by-locale', () => import('@test/helpers/second-locale').then((m) => m.translatedSegments))

const params = {
  title: 'Page title',
  absoluteTitle: false,
  currentLocale: 'it',
  pathname: '/',
  canonicalPath: '/',
  ogImage: undefined,
  locales: undefined,
}

describe("resolveHeadSeoMeta() da una pagina nell'altra lingua", () => {
  it('fa concordare canonical, alternate e x-default sul segmento tradotto', () => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: 'en', canonicalPath: '/en/contact' })
    expect(meta.canonical).toBe('https://example.com/en/contact')
    expect(meta.currentTag).toBe(localeTag('en'))
    expect(meta.localeAlternates).toEqual([
      { tag: localeTag('it'), href: 'https://example.com/contatti' },
      { tag: localeTag('en'), href: 'https://example.com/en/contact' },
    ])
    expect(meta.defaultHref).toBe('https://example.com/contatti')
  })

  it('dà alla home il prefisso come canonical e la radice come x-default', () => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: 'en', canonicalPath: '/en' })
    expect(meta.canonical).toBe('https://example.com/en')
    expect(meta.localeAlternates).toEqual([
      { tag: localeTag('it'), href: 'https://example.com' },
      { tag: localeTag('en'), href: 'https://example.com/en' },
    ])
    expect(meta.defaultHref).toBe('https://example.com')
  })
})

describe('resolveHeadSeoMeta() con le lingue dichiarate dalla pagina', () => {
  it("emette gli alternate delle sole lingue della pagina, e x-default se c'è la lingua di default", () => {
    const meta = resolveHeadSeoMeta({ ...params, canonicalPath: '/privacy', locales: ['it'] })
    expect(meta.localeAlternates).toEqual([{ tag: localeTag('it'), href: 'https://example.com/privacy' }])
    expect(meta.defaultHref).toBe('https://example.com/privacy')
  })

  it('non emette x-default quando la pagina non esiste nella lingua di default', () => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: 'en', canonicalPath: '/en/news', locales: ['en'] })
    expect(meta.localeAlternates).toEqual([{ tag: localeTag('en'), href: 'https://example.com/en/news' }])
    expect(meta).not.toHaveProperty('defaultHref')
  })

  it.each([
    ['/contatti', 'it', undefined],
    ['/en/contact', 'en', undefined],
    ['/en', 'en', undefined],
    ['/prodotto/cintura-ipsc', 'it', translatedSlugPaths],
    ['/en/product/ipsc-belt', 'en', translatedSlugPaths],
  ])("da %s (%s) il selettore porta dove punta l'alternate di ogni lingua", (pathname, current, locales) => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: current, canonicalPath: pathname, locales })
    for (const code of ['it', 'en']) {
      const alternate = meta.localeAlternates.find((alt) => alt.tag === localeTag(code))
      expect(new URL(alternate?.href ?? '').pathname).toBe(localeSwitchHref(code, pathname, current, locales))
    }
  })
})

describe('resolveHeadSeoMeta() con i percorsi dichiarati dalla pagina', () => {
  it('porta alternate e x-default sugli indirizzi della mappa, e il canonical resta quello della pagina', () => {
    const meta = resolveHeadSeoMeta({
      ...params,
      currentLocale: 'en',
      canonicalPath: '/en/product/ipsc-belt',
      locales: translatedSlugPaths,
    })
    expect(meta.canonical).toBe('https://example.com/en/product/ipsc-belt')
    expect(meta.localeAlternates).toEqual([
      { tag: localeTag('it'), href: 'https://example.com/prodotto/cintura-ipsc' },
      { tag: localeTag('en'), href: 'https://example.com/en/product/ipsc-belt' },
    ])
    expect(meta.defaultHref).toBe('https://example.com/prodotto/cintura-ipsc')
  })

  it('non offre una lingua che manca dalla mappa, e senza la lingua di default non emette x-default', () => {
    const meta = resolveHeadSeoMeta({
      ...params,
      currentLocale: 'en',
      canonicalPath: '/en/product/ipsc-belt',
      locales: { en: '/product/ipsc-belt' },
    })
    expect(meta.localeAlternates).toEqual([{ tag: localeTag('en'), href: 'https://example.com/en/product/ipsc-belt' }])
    expect(meta).not.toHaveProperty('defaultHref')
  })

  it('nella lingua corrente punta al canonical anche se la mappa porta un altro percorso', () => {
    const meta = resolveHeadSeoMeta({
      ...params,
      canonicalPath: '/prodotto/cintura-ipsc',
      locales: { ...translatedSlugPaths, it: '/prodotto/cintura' },
    })
    expect(meta.canonical).toBe('https://example.com/prodotto/cintura-ipsc')
    expect(meta.localeAlternates).toContainEqual({ tag: localeTag('it'), href: meta.canonical })
  })
})

function fromPage(pathname: string, currentLocale: string) {
  return resolveHeadSeoMeta({ ...params, currentLocale, pathname, canonicalPath: pathname })
}

describe('resolveHeadSeoMeta() con una traduzione in NOINDEX_PATHS', () => {
  withOnlyListedPaths(NOINDEX_PATHS, '/en/privacy')

  it('dà noindex alla pagina della lista e non alla sua traduzione', () => {
    expect(fromPage('/en/privacy', 'en').noindex).toBe(true)
    expect(fromPage('/privacy', 'it').noindex).toBe(false)
  })

  it('la toglie dagli hreflang della traduzione, non dai suoi og:locale:alternate', () => {
    const meta = fromPage('/privacy', 'it')
    expect(meta.hreflangAlternates).toEqual([{ tag: localeTag('it'), href: 'https://example.com/privacy' }])
    expect(meta.defaultHref).toBe('https://example.com/privacy')
    expect(meta.localeAlternates.map((alt) => alt.tag)).toEqual([localeTag('it'), localeTag('en')])
  })

  it('non le fa emettere né hreflang né x-default', () => {
    const meta = fromPage('/en/privacy', 'en')
    expect(meta.hreflangAlternates).toEqual([])
    expect(meta).not.toHaveProperty('defaultHref')
  })
})

describe('resolveHeadSeoMeta() con un indirizzo della mappa in NOINDEX_PATHS', () => {
  withOnlyListedPaths(NOINDEX_PATHS, '/en/product/ipsc-belt')

  it('lo toglie dagli hreflang della traduzione, non dai suoi og:locale:alternate', () => {
    const meta = resolveHeadSeoMeta({
      ...params,
      pathname: '/prodotto/cintura-ipsc',
      canonicalPath: '/prodotto/cintura-ipsc',
      locales: translatedSlugPaths,
    })
    expect(meta.hreflangAlternates).toEqual([
      { tag: localeTag('it'), href: 'https://example.com/prodotto/cintura-ipsc' },
    ])
    expect(meta.localeAlternates.map((alt) => alt.tag)).toEqual([localeTag('it'), localeTag('en')])
  })
})

describe('resolveHeadSeoMeta() con la pagina della lingua di default in NOINDEX_PATHS', () => {
  withOnlyListedPaths(NOINDEX_PATHS, '/privacy')

  it('la traduzione annuncia solo sé stessa, senza x-default', () => {
    const meta = fromPage('/en/privacy', 'en')
    expect(meta.hreflangAlternates).toEqual([{ tag: localeTag('en'), href: 'https://example.com/en/privacy' }])
    expect(meta).not.toHaveProperty('defaultHref')
  })
})
