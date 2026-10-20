import { renderToFragment } from '@test/container'
import { translatedSlugPaths, twoLocaleManifest } from '@test/helpers/second-locale'
import { describe, expect, it, vi } from 'vitest'

import { localeTag } from '@/lib/site'

import type { PageLocales } from '@/i18n/locales'

import LanguageSwitcher from './language-switcher.astro'

vi.mock('astro:config/client', () => import('@test/helpers/second-locale').then((m) => m.twoLocaleConfig))
vi.mock('@/i18n/segments-by-locale', () => import('@test/helpers/second-locale').then((m) => m.translatedSegments))

function render(url: string, props: { locales?: PageLocales; prefetch?: boolean } = {}) {
  return renderToFragment(LanguageSwitcher, { request: new Request(url), props }, twoLocaleManifest)
}

describe('language-switcher.astro', () => {
  it("da una pagina italiana marca la lingua corrente e porta all'inglese sul segmento tradotto", async () => {
    const document = await render('https://example.com/contatti')

    expect(document.querySelector('[aria-current="true"]')?.textContent?.trim()).toBe('Italiano')
    const link = document.querySelector('nav a')
    expect(link?.textContent?.trim()).toBe('English')
    expect(link?.getAttribute('href')).toBe('/en/contact')
    expect(link?.getAttribute('hreflang')).toBe(localeTag('en'))
    expect(link?.getAttribute('lang')).toBe(localeTag('en'))
  })

  it("da una pagina inglese marca l'inglese e porta alla pagina italiana", async () => {
    const document = await render('https://example.com/en/contact')

    expect(document.querySelector('[aria-current="true"]')?.textContent?.trim()).toBe('English')
    const link = document.querySelector('nav a')
    expect(link?.getAttribute('href')).toBe('/contatti')
    expect(link?.getAttribute('hreflang')).toBe(localeTag('it'))
  })

  it('non rende niente su una pagina che esiste in una lingua sola', async () => {
    const document = await render('https://example.com/privacy', { locales: ['it'] })

    expect(document.body.innerHTML.trim()).toBe('')
  })

  it.each([
    ['https://example.com/prodotto/cintura-ipsc', '/en/product/ipsc-belt'],
    ['https://example.com/en/product/ipsc-belt', '/prodotto/cintura-ipsc'],
  ])('da %s, con la mappa della pagina, porta a %s', async (url, href) => {
    const document = await render(url, { locales: translatedSlugPaths })

    expect(document.querySelector('nav a')?.getAttribute('href')).toBe(href)
  })

  it('non rende niente con una mappa che porta solo la lingua corrente', async () => {
    const document = await render('https://example.com/prodotto/cintura-ipsc', {
      locales: { it: '/prodotto/cintura-ipsc' },
    })

    expect(document.body.innerHTML.trim()).toBe('')
  })

  it('senza la prop lascia il link al prefetch del sito', async () => {
    const document = await render('https://example.com/contatti')

    expect(document.querySelector('nav a')?.hasAttribute('data-astro-prefetch')).toBe(false)
  })

  it('con prefetch={false} toglie dal prefetch il link alle altre lingue', async () => {
    const document = await render('https://example.com/contatti', { prefetch: false })

    expect(document.querySelector('nav a')?.getAttribute('data-astro-prefetch')).toBe('false')
  })
})
