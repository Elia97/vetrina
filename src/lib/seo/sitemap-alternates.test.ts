import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import sitemap from '@astrojs/sitemap'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { sitemapAlternates } from '@/lib/seo/sitemap-alternates'
import { DEFAULT_LOCALE } from '@/lib/site'

vi.mock('@/i18n/segments-by-locale', () => import('@test/helpers/second-locale').then((m) => m.translatedSegments))

const SITE_URL = 'https://example.com'
const LOCALES = { [DEFAULT_LOCALE]: 'it-IT', en: 'en-GB' }
const PAGES = ['', 'en', 'contatti', 'en/contact', 'termini', 'en/termini', 'privacy']
const url = (pathname: string) => new URL(pathname, `${SITE_URL}/`).href

function linksOf(pathnames: readonly string[], keep: (url: string) => boolean = () => true) {
  const alternates = sitemapAlternates({ defaultLocale: DEFAULT_LOCALE, locales: LOCALES })
  const filter = alternates.keep(keep)
  const kept = pathnames.map(url).filter(filter)
  return (pathname: string) => {
    expect(kept).toContain(url(pathname))
    return alternates.link({ url: url(pathname) }).links
  }
}

describe('sitemapAlternates()', () => {
  it('collega le versioni di una pagina con il segmento tradotto, come la head', () => {
    const links = linksOf(PAGES)
    const expected = [
      { url: url('contatti'), lang: 'it-IT' },
      { url: url('en/contact'), lang: 'en-GB' },
    ]

    expect(links('contatti')).toEqual(expected)
    expect(links('en/contact')).toEqual(expected)
  })

  it('collega anche le versioni con lo stesso percorso e la home', () => {
    const links = linksOf(PAGES)

    expect(links('en/termini')).toEqual([
      { url: url('termini'), lang: 'it-IT' },
      { url: url('en/termini'), lang: 'en-GB' },
    ])
    expect(links('')).toEqual([
      { url: url(''), lang: 'it-IT' },
      { url: url('en'), lang: 'en-GB' },
    ])
  })

  it('non porta link su una pagina in una lingua sola', () => {
    expect(linksOf(PAGES)('privacy')).toBeUndefined()
  })

  it('lascia fuori dagli alternate una versione che il filtro scarta', () => {
    const links = linksOf(PAGES, (page) => page !== url('en/contact'))

    expect(links('contatti')).toBeUndefined()
  })

  it('keep tiene solo quello che tiene il predicato', () => {
    const filter = sitemapAlternates({ defaultLocale: DEFAULT_LOCALE, locales: LOCALES }).keep((page) =>
      page.endsWith('/contatti'),
    )

    expect([url('contatti'), url('en/contact')].filter(filter)).toEqual([url('contatti')])
  })
})

describe('sitemapAlternates() dentro @astrojs/sitemap', () => {
  let root = ''

  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true })
    root = ''
  })

  type Hook = (payload: Record<string, unknown>) => unknown

  async function writeSitemap(keep: (url: string) => boolean): Promise<string> {
    const alternates = sitemapAlternates({ defaultLocale: DEFAULT_LOCALE, locales: LOCALES })
    const hooks = sitemap({
      filter: alternates.keep(keep),
      serialize: alternates.link,
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES },
    }).hooks as unknown as Record<string, Hook>
    root = mkdtempSync(join(tmpdir(), 'sitemap-'))
    await hooks['astro:routes:resolved']?.({ routes: [] })
    await hooks['astro:config:done']?.({
      config: { site: SITE_URL, base: '/', trailingSlash: 'never', build: { format: 'directory' } },
    })
    await hooks['astro:build:done']?.({
      dir: pathToFileURL(`${root}/`),
      pages: PAGES.map((pathname) => ({ pathname })),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    })
    return readFileSync(join(root, 'sitemap-0.xml'), 'utf8')
  }

  const entry = (xml: string, pathname: string) =>
    new RegExp(`<url><loc>${url(pathname)}</loc>(.*?)</url>`).exec(xml)?.[1]

  it("scrive nella voce di /contatti l'alternate di /en/contact", async () => {
    const xml = await writeSitemap(() => true)

    expect(entry(xml, 'contatti')).toContain(`hreflang="en-GB" href="${url('en/contact')}"`)
    expect(entry(xml, 'en/contact')).toContain(`hreflang="it-IT" href="${url('contatti')}"`)
  })

  it('non scrive fra gli alternate una pagina che il filtro scarta', async () => {
    const xml = await writeSitemap((page) => page !== url('en/contact'))

    expect(entry(xml, 'contatti')).not.toContain('xhtml:link')
    expect(xml).not.toContain(url('en/contact'))
  })
})
