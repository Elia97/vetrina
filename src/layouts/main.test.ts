import { renderToFragment } from '@test/container'
import { twoLocaleManifest } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import { useTranslations } from '@/i18n/translate'

import MainLayout from './main.astro'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))

async function languageLinks(props: { languagePrefetch?: boolean } = {}) {
  const document = await renderToFragment(
    MainLayout,
    { request: new Request('https://example.com/contatti'), props: { title: 'Contact', ...props } },
    twoLocaleManifest,
  )
  return [...document.querySelectorAll(`nav[aria-label="${useTranslations()('a11y.languageNav')}"] a`)]
}

describe('main.astro con due lingue', () => {
  it('senza languagePrefetch lascia al prefetch del sito i link dei due selettori', async () => {
    const links = await languageLinks()

    expect(links).toHaveLength(2)
    expect(links.map((link) => link.hasAttribute('data-astro-prefetch'))).toEqual([false, false])
  })

  it('con languagePrefetch={false} toglie dal prefetch i link dei due selettori, header e nav mobile', async () => {
    const links = await languageLinks({ languagePrefetch: false })

    expect(links.map((link) => link.getAttribute('data-astro-prefetch'))).toEqual(['false', 'false'])
  })
})
