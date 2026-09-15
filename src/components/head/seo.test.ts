import { describe, expect, it, vi } from 'vitest'

import { resolveHeadSeoMeta } from '@/components/head/seo'

import { SITE } from '@/lib/site'

import { useTranslations } from '@/i18n/translate'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/segments-by-locale', () => import('@test/helpers/second-locale').then((m) => m.translatedSegments))

const params = {
  title: 'Page title',
  absoluteTitle: false,
  currentLocale: 'it',
  canonicalPath: '/',
  ogImage: undefined,
}

describe('resolveHeadSeoMeta', () => {
  it('builds an absolute canonical with the trailing slash normalized away', () => {
    const meta = resolveHeadSeoMeta({ ...params, canonicalPath: '/chi-siamo/' })
    expect(meta.canonical).toBe('https://example.com/chi-siamo')
  })

  it('keeps the root canonical as the bare origin', () => {
    const meta = resolveHeadSeoMeta({ ...params, canonicalPath: '/' })
    expect(meta.canonical).toBe('https://example.com')
  })

  it('falls back to the default locale when none is set (prerendered pages)', () => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: undefined, canonicalPath: '/privacy' })
    expect(meta.canonical).toBe('https://example.com/privacy')
    expect(meta.currentTag).toBe('it-IT')
  })

  it('emits one alternate per configured locale, agreeing with the canonical', () => {
    const meta = resolveHeadSeoMeta({ ...params, canonicalPath: '/privacy' })
    expect(meta.localeAlternates).toEqual([
      { tag: 'it-IT', href: 'https://example.com/privacy' },
      { tag: 'en', href: 'https://example.com/en/privacy' },
    ])
    expect(meta.defaultHref).toBe('https://example.com/privacy')
  })

  it('resolves the og image against the site origin, defaulting to SITE.defaultOgImage', () => {
    const fallback = resolveHeadSeoMeta(params)
    expect(fallback.socialImage.url).toBe('https://example.com/og-default.png')

    const custom = resolveHeadSeoMeta({ ...params, ogImage: '/covers/home.png' })
    expect(custom.socialImage.url).toBe('https://example.com/covers/home.png')
  })
})

describe("resolveHeadSeoMeta() da una pagina nell'altra lingua", () => {
  it('fa concordare canonical, alternate e x-default sul segmento tradotto', () => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: 'en', canonicalPath: '/en/contact' })
    expect(meta.canonical).toBe('https://example.com/en/contact')
    expect(meta.currentTag).toBe('en')
    expect(meta.localeAlternates).toEqual([
      { tag: 'it-IT', href: 'https://example.com/contatti' },
      { tag: 'en', href: 'https://example.com/en/contact' },
    ])
    expect(meta.defaultHref).toBe('https://example.com/contatti')
  })

  it('dà alla home il prefisso come canonical e la radice come x-default', () => {
    const meta = resolveHeadSeoMeta({ ...params, currentLocale: 'en', canonicalPath: '/en' })
    expect(meta.canonical).toBe('https://example.com/en')
    expect(meta.localeAlternates).toEqual([
      { tag: 'it-IT', href: 'https://example.com' },
      { tag: 'en', href: 'https://example.com/en' },
    ])
    expect(meta.defaultHref).toBe('https://example.com')
  })
})

describe('resolveHeadSeoMeta().documentTitle', () => {
  it('aggiunge il nome del sito al titolo di una pagina interna', () => {
    const meta = resolveHeadSeoMeta(params)
    expect(meta.documentTitle).toBe(`Page title | ${SITE.name}`)
  })

  it('separa con | anche un titolo che contiene già un trattino, come quello di 404', () => {
    const meta = resolveHeadSeoMeta({ ...params, title: '404 — Page not found' })
    expect(meta.documentTitle).toBe(`404 — Page not found | ${SITE.name}`)
  })

  it('lascia nudo il titolo della home, che è già il nome del sito', () => {
    const meta = resolveHeadSeoMeta({ ...params, title: SITE.name })
    expect(meta.documentTitle).toBe(SITE.name)
  })

  it('lascia nudo il titolo quando la pagina passa absoluteTitle', () => {
    const meta = resolveHeadSeoMeta({ ...params, absoluteTitle: true })
    expect(meta.documentTitle).toBe('Page title')
  })
})

describe('resolveHeadSeoMeta().socialImage', () => {
  it("porta misure e alt dell'immagine di default", () => {
    expect(resolveHeadSeoMeta(params).socialImage).toEqual({
      url: 'https://example.com/og-default.png',
      ...SITE.defaultOgImageSize,
      alt: useTranslations('it')('seo.defaultOgImageAlt'),
    })
  })

  it('con un ogImage di pagina porta solo il suo URL', () => {
    expect(resolveHeadSeoMeta({ ...params, ogImage: '/covers/home.png' }).socialImage).toEqual({
      url: 'https://example.com/covers/home.png',
    })
  })
})
