import { renderToFragment } from '@test/container'
import { twoLocaleManifest } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOCALE } from '@/lib/site'

import { useTranslations } from '@/i18n/translate'

import NotFound from '@/pages/404.astro'
import ServerError from '@/pages/500.astro'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))

describe.each([
  ['404', NotFound],
  ['500', ServerError],
])('la pagina %s con due lingue configurate', (status, page) => {
  it('non rende il selettore di lingua, né link o alternate verso le altre lingue', async () => {
    const request = new Request(`https://example.com/${status}`)
    const document = await renderToFragment(page, { request }, twoLocaleManifest)
    const languageNav = useTranslations(DEFAULT_LOCALE)('a11y.languageNav')

    expect(document.querySelector(`nav[aria-label="${languageNav}"]`)).toBeNull()
    expect(document.querySelector('a[href^="/en"]')).toBeNull()
    expect(document.querySelector('link[rel="alternate"][hreflang="en"]')).toBeNull()
    expect(document.querySelector('meta[property="og:locale:alternate"]')).toBeNull()
  })
})
